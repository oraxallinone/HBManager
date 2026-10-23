using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Globalization;
using System.Linq;
using System.Text;

namespace HBManager.Service
{
    public class BudgetImportService
    {
        private static readonly string[] CsvHeaders =
        {
            "BankName",
            "Year",
            "Month",
            "TransactionType",
            "Amount",
            "TransactionDate",
            "Details",
            "IsTransfer"
        };

        public BudgetImportResult ImportCsv(string csvData)
        {
            if (string.IsNullOrWhiteSpace(csvData))
            {
                throw new FormatException("Paste CSV data to import.");
            }

            if (csvData.Length > 3 * 1024 * 1024)
            {
                throw new FormatException("The CSV input exceeds the 3 MB limit.");
            }

            var parsedRows = ParseCsv(csvData);
            if (parsedRows.Count < 2)
            {
                throw new FormatException("The CSV must contain a header row and at least one transaction.");
            }

            var headers = parsedRows[0].Select(value => value.Trim().TrimStart('\uFEFF')).ToArray();
            if (headers.Length != CsvHeaders.Length ||
                !headers.SequenceEqual(CsvHeaders, StringComparer.OrdinalIgnoreCase))
            {
                throw new FormatException("Use this CSV header, in order: " + string.Join(",", CsvHeaders) + ".");
            }

            var transactions = new DataTable();
            transactions.Columns.Add("BankName", typeof(string));
            transactions.Columns.Add("Year", typeof(int));
            transactions.Columns.Add("Month", typeof(int));
            transactions.Columns.Add("TransactionType", typeof(string));
            transactions.Columns.Add("Amount", typeof(decimal));
            transactions.Columns.Add("TransactionDate", typeof(DateTime));
            transactions.Columns.Add("Details", typeof(string));
            transactions.Columns.Add("IsTransfer", typeof(bool));

            foreach (var row in parsedRows.Skip(1))
            {
                if (row.All(string.IsNullOrWhiteSpace))
                {
                    continue;
                }

                if (row.Length != CsvHeaders.Length)
                {
                    throw new FormatException("Each transaction must contain exactly 8 CSV fields.");
                }

                var bankName = row[0].Trim();
                var transactionType = row[3].Trim();
                if (bankName.Length == 0 || bankName.Length > 150)
                {
                    throw new FormatException("BankName is required and cannot exceed 150 characters.");
                }

                if (transactionType.Length == 0 || transactionType.Length > 20)
                {
                    throw new FormatException("TransactionType is required and cannot exceed 20 characters.");
                }

                int year;
                int month;
                decimal amount;
                DateTime transactionDate;
                if (!int.TryParse(row[1], NumberStyles.Integer, CultureInfo.InvariantCulture, out year) ||
                    year < 1 ||
                    !int.TryParse(row[2], NumberStyles.Integer, CultureInfo.InvariantCulture, out month) ||
                    month < 1 || month > 12 ||
                    !decimal.TryParse(row[4], NumberStyles.Number, CultureInfo.InvariantCulture, out amount) ||
                    !DateTime.TryParse(row[5], CultureInfo.InvariantCulture, DateTimeStyles.AllowWhiteSpaces, out transactionDate))
                {
                    throw new FormatException("Year, Month, Amount, or TransactionDate is invalid in a CSV row.");
                }

                object isTransfer = DBNull.Value;
                var transferValue = row[7].Trim();
                if (transferValue.Length > 0)
                {
                    bool parsedTransfer;
                    if (bool.TryParse(transferValue, out parsedTransfer))
                    {
                        isTransfer = parsedTransfer;
                    }
                    else if (transferValue == "1" || transferValue == "0")
                    {
                        isTransfer = transferValue == "1";
                    }
                    else
                    {
                        throw new FormatException("IsTransfer must be true, false, 1, 0, or blank.");
                    }
                }

                transactions.Rows.Add(
                    bankName,
                    year,
                    month,
                    transactionType,
                    amount,
                    transactionDate,
                    row[6].Length == 0 ? (object)DBNull.Value : row[6],
                    isTransfer);

                if (transactions.Rows.Count > 10000)
                {
                    throw new FormatException("The CSV cannot contain more than 10,000 transactions.");
                }
            }

            if (transactions.Rows.Count == 0)
            {
                throw new FormatException("The CSV contains no transaction rows.");
            }

            var inserted = InsertTransactions(transactions);
            return new BudgetImportResult
            {
                Inserted = inserted,
                Duplicates = transactions.Rows.Count - inserted
            };
        }

        private static int InsertTransactions(DataTable transactions)
        {
            using (var connection = SqlConnectionFactory.CreateConnection())
            {
                connection.Open();
                using (var transaction = connection.BeginTransaction())
                {
                    using (var createCommand = new SqlCommand(@"
                        CREATE TABLE #Staging (
                            RowNumber INT IDENTITY(1,1) NOT NULL,
                            BankName VARCHAR(150) NOT NULL,
                            Year INT NOT NULL,
                            Month INT NOT NULL,
                            TransactionType VARCHAR(20) NOT NULL,
                            Amount DECIMAL(18,2) NOT NULL,
                            TransactionDate DATETIME NOT NULL,
                            Details NVARCHAR(MAX) NULL,
                            IsTransfer BIT NULL
                        );", connection, transaction))
                    {
                        createCommand.ExecuteNonQuery();
                    }

                    using (var bulkCopy = new SqlBulkCopy(connection, SqlBulkCopyOptions.Default, transaction))
                    {
                        bulkCopy.DestinationTableName = "#Staging";
                        foreach (var columnName in CsvHeaders)
                        {
                            bulkCopy.ColumnMappings.Add(columnName, columnName);
                        }

                        bulkCopy.WriteToServer(transactions);
                    }

                    const string insertSql = @"
                        ;WITH RankedRows AS (
                            SELECT RowNumber,
                                   ROW_NUMBER() OVER (
                                       PARTITION BY TransactionType, Amount, TransactionDate, ISNULL(Details, N'')
                                       ORDER BY RowNumber
                                   ) AS DuplicateNumber
                            FROM #Staging
                        )
                        DELETE FROM RankedRows WHERE DuplicateNumber > 1;

                        DELETE S
                        FROM #Staging AS S
                        WHERE EXISTS (
                            SELECT 1
                            FROM dbo.BudgetInitiate AS B
                            WHERE B.TransactionType = S.TransactionType
                              AND B.Amount = S.Amount
                              AND B.TransactionDate = S.TransactionDate
                              AND ISNULL(B.Details, N'') = ISNULL(S.Details, N'')
                        );

                        INSERT INTO dbo.BudgetInitiate
                            (BankName, Year, Month, TransactionType, Amount, TransactionDate, Details, IsTransfer)
                        SELECT BankName, Year, Month, TransactionType, Amount, TransactionDate, Details, IsTransfer
                        FROM #Staging;

                        SELECT @@ROWCOUNT;";

                    int inserted;
                    using (var insertCommand = new SqlCommand(insertSql, connection, transaction))
                    {
                        inserted = Convert.ToInt32(insertCommand.ExecuteScalar(), CultureInfo.InvariantCulture);
                    }

                    transaction.Commit();
                    return inserted;
                }
            }
        }

        private static List<string[]> ParseCsv(string csvData)
        {
            var rows = new List<string[]>();
            var row = new List<string>();
            var field = new StringBuilder();
            var insideQuotes = false;
            var quoteClosed = false;

            for (var index = 0; index < csvData.Length; index++)
            {
                var current = csvData[index];
                if (insideQuotes)
                {
                    if (current == '"' && index + 1 < csvData.Length && csvData[index + 1] == '"')
                    {
                        field.Append('"');
                        index++;
                    }
                    else if (current == '"')
                    {
                        insideQuotes = false;
                        quoteClosed = true;
                    }
                    else
                    {
                        field.Append(current);
                    }

                    continue;
                }

                if (quoteClosed && current != ',' && current != '\r' && current != '\n' && !char.IsWhiteSpace(current))
                {
                    throw new FormatException("Unexpected text after a quoted CSV field.");
                }

                if (current == '"' && field.Length == 0 && !quoteClosed)
                {
                    insideQuotes = true;
                }
                else if (current == ',')
                {
                    row.Add(field.ToString());
                    field.Clear();
                    quoteClosed = false;
                }
                else if (current == '\r' || current == '\n')
                {
                    row.Add(field.ToString());
                    rows.Add(row.ToArray());
                    row.Clear();
                    field.Clear();
                    quoteClosed = false;
                    if (current == '\r' && index + 1 < csvData.Length && csvData[index + 1] == '\n')
                    {
                        index++;
                    }
                }
                else if (!quoteClosed)
                {
                    field.Append(current);
                }
            }

            if (insideQuotes)
            {
                throw new FormatException("A quoted CSV field is not closed.");
            }

            if (field.Length > 0 || row.Count > 0 || quoteClosed)
            {
                row.Add(field.ToString());
                rows.Add(row.ToArray());
            }

            return rows;
        }
    }

    public class BudgetImportResult
    {
        public int Inserted { get; set; }
        public int Duplicates { get; set; }
    }
}
