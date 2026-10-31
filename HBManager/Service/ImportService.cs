using HBManager.Models;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Diagnostics;
using System.IO;
using System.Web.Hosting;

namespace HBManager.Service
{
    public class ImportService : IImportService
    {
        private static readonly object LogFileLock = new object();
        private readonly string _connectionString;
        private readonly string _logDirectoryPath;
        private readonly string _logFilePath;

        public ImportService()
        {
            _connectionString = ConfigurationManager.ConnectionStrings["ConnectionString"].ConnectionString;
            _logDirectoryPath = HostingEnvironment.MapPath("~/App_Data/ErrorLogs")
                ?? Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "App_Data", "ErrorLogs");
            _logFilePath = Path.Combine(_logDirectoryPath, "ErrorLogs.txt");
        }

        public bool ExecuteImport(object importPayload, out string errorMessage)
        {
            errorMessage = string.Empty;

            try
            {
                var sqlScript = importPayload as string ?? importPayload?.ToString() ?? string.Empty;
                var result = ImportInitiate(sqlScript);

                var successProperty = result?.GetType().GetProperty("success");
                var success = successProperty != null && successProperty.GetValue(result) is bool boolValue && boolValue;

                if (!success)
                {
                    var messageProperty = result?.GetType().GetProperty("message");
                    errorMessage = messageProperty != null ? messageProperty.GetValue(result)?.ToString() ?? string.Empty : "Import failed.";
                    return false;
                }

                return true;
            }
            catch (Exception ex)
            {
                errorMessage = ex.Message;
                LogErrorDetails(ex, "ImportController", "ExecuteImport");
                return false;
            }
        }

        public void LogErrorDetails(Exception exception, string controllerName, string actionName)
        {
            try
            {
                AppendErrorLog(exception, controllerName, actionName);
            }
            catch
            {
            }
        }

        public void WriteTestErrorLog()
        {
            var exception = new InvalidOperationException("Test exception generated from the Import Error Logs page.");
            AppendErrorLog(exception, "ImportController", "TestException");
        }

        public void LogClientError(string controllerName, string actionName, string message, string details)
        {
            var safeMessage = LimitLogField(message, 1000);
            var safeDetails = LimitLogField(details, 4000);
            var exceptionMessage = "Client-side error: " + safeMessage;
            if (!string.IsNullOrEmpty(safeDetails))
            {
                exceptionMessage += Environment.NewLine + "Details: " + safeDetails;
            }

            try
            {
                throw new InvalidOperationException(exceptionMessage);
            }
            catch (InvalidOperationException exception)
            {
                AppendErrorLog(
                    exception,
                    LimitLogField(controllerName, 100),
                    LimitLogField(actionName, 100));
            }
        }

        private void AppendErrorLog(Exception exception, string controllerName, string actionName)
        {
            lock (LogFileLock)
            {
                Directory.CreateDirectory(_logDirectoryPath);

                var stackTrace = new StackTrace(exception, true);
                var stackFrame = stackTrace.FrameCount > 0 ? stackTrace.GetFrame(0) : null;

                var fileName = stackFrame?.GetFileName() ?? "N/A";
                var lineNumber = stackFrame?.GetFileLineNumber() ?? 0;
                var methodName = stackFrame?.GetMethod()?.Name ?? "N/A";

                using (var writer = new StreamWriter(_logFilePath, true))
                {
                    writer.WriteLine(new string('=', 80));
                    writer.WriteLine($"Timestamp   : {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC");
                    writer.WriteLine($"Controller  : {controllerName}");
                    writer.WriteLine($"Action      : {actionName}");
                    writer.WriteLine($"Source File : {fileName}");
                    writer.WriteLine($"Method      : {methodName}");
                    writer.WriteLine($"Line Number : {lineNumber}");
                    writer.WriteLine($"Error Type  : {exception.GetType().FullName}");
                    writer.WriteLine($"Message     : {exception.Message}");
                    writer.WriteLine("Stack Trace :");
                    writer.WriteLine(exception.StackTrace);
                    writer.WriteLine(new string('=', 80));
                    writer.WriteLine();
                }
            }
        }

        private static string LimitLogField(string value, int maxLength)
        {
            if (string.IsNullOrEmpty(value))
            {
                return string.Empty;
            }

            var normalized = value.Replace("\r", " ").Replace("\n", " ");
            return normalized.Length <= maxLength ? normalized : normalized.Substring(0, maxLength);
        }

        public string ReadAllErrorLogs()
        {
            lock (LogFileLock)
            {
                if (!File.Exists(_logFilePath))
                {
                    return "No error logs found.";
                }

                return File.ReadAllText(_logFilePath);
            }
        }

        public void ClearAllErrorLogs()
        {
            lock (LogFileLock)
            {
                Directory.CreateDirectory(_logDirectoryPath);
                using (new StreamWriter(_logFilePath, false))
                {
                }
            }
        }

        public List<Dictionary<string, object>> GetBudgetData(int year, int month, string bankName)
        {
            var rows = new List<Dictionary<string, object>>();
            using (var connection = new SqlConnection(_connectionString))
            using (var command = new SqlCommand("dbo.GetBudgetInitiateBySalaryMonth", connection))
            {
                command.CommandType = CommandType.StoredProcedure;
                command.Parameters.AddWithValue("@Year", year);
                command.Parameters.AddWithValue("@Month", month);
                command.Parameters.Add("@BankName", SqlDbType.VarChar, 150).Value = bankName ?? string.Empty;
                connection.Open();
                using (var reader = command.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        var row = new Dictionary<string, object>();
                        for (var index = 0; index < reader.FieldCount; index++)
                            row[reader.GetName(index)] = reader.GetValue(index);
                        rows.Add(row);
                    }
                }
            }
            return rows;
        }

        public List<string> GetBankNames(int year, int month)
        {
            var bankNames = new List<string>();
            const string query = @"
                SELECT DISTINCT bi.[BankName]
                FROM [dbo].[BudgetInitiate] bi
                INNER JOIN [dbo].[SalaryMaster] sm
                    ON sm.YearName = @Year AND sm.MonthName = @Month
                WHERE bi.TransactionDate >= CAST(sm.FromData AS DATE)
                    AND bi.TransactionDate < DATEADD(DAY, 1, CAST(sm.ToDate AS DATE))
                    AND NULLIF(LTRIM(RTRIM(bi.[BankName])), '') IS NOT NULL
                ORDER BY bi.[BankName]";

            using (var connection = new SqlConnection(_connectionString))
            using (var command = new SqlCommand(query, connection))
            {
                command.Parameters.AddWithValue("@Year", year);
                command.Parameters.AddWithValue("@Month", month);
                connection.Open();
                using (var reader = command.ExecuteReader())
                    while (reader.Read())
                        bankNames.Add(reader.GetString(0).Trim());
            }
            return bankNames;
        }

        public object MoveData(List<RowStatusItem> items)
        {
            if (items == null || items.Count == 0)
                return new { success = false, message = "No row assignments were selected to move." };

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    connection.Open();
                    using (var command = new SqlCommand("dbo.usp_moveInitiateToBudget", connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;
                        command.Parameters.Add("@Id", SqlDbType.Int);
                        command.Parameters.Add("@Status", SqlDbType.VarChar, 10);
                        foreach (var item in items)
                        {
                            command.Parameters["@Id"].Value = item.Id;
                            command.Parameters["@Status"].Value = item.Status;
                            command.ExecuteNonQuery();
                        }
                    }
                }
                return new { success = true, message = "Successfully updated statuses and transferred records to the Budget database!" };
            }
            catch (Exception ex)
            {
                LogErrorDetails(ex, "ImportController", "MoveData");
                return new { success = false, message = "Error handling data transfer migration: " + ex.Message };
            }
        }

        public object RevertTransfer(int id)
        {
            if (id <= 0)
                return new { success = false, message = "Invalid record id for revert." };

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("UPDATE [dbo].[BudgetInitiate] SET [IsTransfer] = NULL WHERE [Id] = @Id", connection))
                {
                    command.Parameters.AddWithValue("@Id", id);
                    connection.Open();
                    command.ExecuteNonQuery();
                }
                return new { success = true, message = "Record reverted successfully." };
            }
            catch (Exception ex)
            {
                LogErrorDetails(ex, "ImportController", "RevertTransfer");
                return new { success = false, message = "Error reverting record: " + ex.Message };
            }
        }

        public object UpdateDetails(int id, string details)
        {
            if (id <= 0)
                return new { success = false, message = "Invalid record id." };

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand(@"UPDATE [dbo].[BudgetInitiate] SET [Details] = @Details WHERE [Id] = @Id", connection))
                {
                    command.Parameters.Add("@Details", SqlDbType.NVarChar, -1).Value = (object)(details ?? string.Empty);
                    command.Parameters.Add("@Id", SqlDbType.Int).Value = id;
                    connection.Open();
                    if (command.ExecuteNonQuery() == 0)
                        return new { success = false, message = "Record was not found." };
                }
                return new { success = true, message = "Details updated successfully." };
            }
            catch (Exception ex)
            {
                LogErrorDetails(ex, "ImportController", "UpdateDetails");
                return new { success = false, message = "Error updating details: " + ex.Message };
            }
        }

        public object ImportInitiate(string sqlScript)
        {
            if (string.IsNullOrWhiteSpace(sqlScript))
                return new { success = false, message = "The input script cannot be empty." };

            var cleanScript = sqlScript.Trim();
            if (cleanScript.ToUpper().Contains("VALUES"))
            {
                var valuesIndex = cleanScript.ToUpper().IndexOf("VALUES");
                cleanScript = cleanScript.Substring(valuesIndex + 6).Trim();
            }
            cleanScript = cleanScript.TrimEnd(';', ' ', '\r', '\n');
            if (cleanScript.EndsWith(","))
                cleanScript = cleanScript.Substring(0, cleanScript.Length - 1).Trim();

            var masterSqlQuery = $@"
        BEGIN TRANSACTION;
        BEGIN TRY
            DECLARE @StagingTable TABLE (
                [BankName] VARCHAR(150), [Year] INT, [Month] INT, [TransactionType] VARCHAR(20),
                [Amount] DECIMAL(18,2), [TransactionDate] DATETIME, [Details] NVARCHAR(MAX), [IsTransfer] BIT
            );
            INSERT INTO @StagingTable VALUES {cleanScript};
            DECLARE @TotalPasted INT = (SELECT COUNT(*) FROM @StagingTable);
            DELETE S FROM @StagingTable S
            WHERE EXISTS (
                SELECT 1 FROM [dbo].[BudgetInitiate] B
                WHERE B.[TransactionType] = S.[TransactionType]
                  AND B.[Amount] = S.[Amount]
                  AND B.[TransactionDate] = S.[TransactionDate]
                  AND ISNULL(B.[Details], '') = ISNULL(S.[Details], '')
            );
            DECLARE @Inserted INT = 0;
            INSERT INTO [dbo].[BudgetInitiate]
                ([BankName], [Year], [Month], [TransactionType], [Amount], [TransactionDate], [Details], [IsTransfer])
            SELECT [BankName], [Year], [Month], [TransactionType], [Amount], [TransactionDate], [Details], [IsTransfer]
            FROM @StagingTable;
            SET @Inserted = @@ROWCOUNT;
            COMMIT TRANSACTION;
            SELECT @Inserted AS InsertedRows, (@TotalPasted - @Inserted) AS DuplicateRows, 0 AS ErrorRows;
        END TRY
        BEGIN CATCH
            IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
            SELECT 0 AS InsertedRows, 0 AS DuplicateRows, 1 AS ErrorRows;
        END CATCH";

            try
            {
                var insertedCount = 0;
                var duplicateCount = 0;
                var errorCount = 0;
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand(masterSqlQuery, connection))
                {
                    connection.Open();
                    using (var reader = command.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            insertedCount = Convert.ToInt32(reader["InsertedRows"]);
                            duplicateCount = Convert.ToInt32(reader["DuplicateRows"]);
                            errorCount = Convert.ToInt32(reader["ErrorRows"]);
                        }
                    }
                }

                if (errorCount > 0)
                    return new { success = false, message = "Database Error: SQL execution failed. Please verify the structural layout of your value data blocks." };
                return new
                {
                    success = true,
                    inserted = insertedCount,
                    duplicates = duplicateCount,
                    errors = errorCount,
                    message = $"Process complete. Inserted: {insertedCount} row(s). Duplicates skipped: {duplicateCount} row(s)."
                };
            }
            catch (Exception ex)
            {
                LogErrorDetails(ex, "ImportController", "ImportInitiate");
                return new { success = false, message = "Execution Failure: " + ex.Message };
            }
        }

        public object DeleteBudgetInitiate(int id)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    connection.Open();
                    using (var command = new SqlCommand("SELECT IsTransfer FROM BudgetInitiate WHERE Id=@Id", connection))
                    {
                        command.Parameters.AddWithValue("@Id", id);
                        var result = command.ExecuteScalar();
                        if (result != DBNull.Value && Convert.ToBoolean(result))
                            return new { success = false, message = "Can't be deleted as it has already been transferred." };
                    }
                    using (var command = new SqlCommand("DELETE FROM BudgetInitiate WHERE Id=@Id", connection))
                    {
                        command.Parameters.AddWithValue("@Id", id);
                        command.ExecuteNonQuery();
                    }
                    return new { success = true };
                }
            }
            catch (Exception ex)
            {
                LogErrorDetails(ex, "ImportController", "DeleteBudgetInitiate");
                return new { success = false, message = ex.Message };
            }
        }
    }
}
