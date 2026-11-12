using HBManager.Models;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace HBManager.Service
{
    public class BudgetUpdateService : IBudgetUpdateService
    {
        private readonly string _connectionString;

        public BudgetUpdateService()
        {
            var connectionString = ConfigurationManager.ConnectionStrings["ConnectionString"];
            if (connectionString == null || string.IsNullOrWhiteSpace(connectionString.ConnectionString))
            {
                throw new ConfigurationErrorsException("The ConnectionString connection string is not configured.");
            }

            _connectionString = connectionString.ConnectionString;
        }

        public BudgetUpdateMonthModel GetMonth(int year, int month)
        {
            var result = new BudgetUpdateMonthModel
            {
                Entries = new System.Collections.Generic.List<BudgetUpdateEntryModel>()
            };

            using (var connection = new SqlConnection(_connectionString))
            {
                connection.Open();
                int monthId;
                using (var command = new SqlCommand(
                    "SELECT Id, MonthBeginning FROM dbo.BudgetUpdateMonth WHERE [Year] = @Year AND [Month] = @Month",
                    connection))
                {
                    AddPeriodParameters(command, year, month);
                    using (var reader = command.ExecuteReader())
                    {
                        if (!reader.Read())
                        {
                            return result;
                        }
                        monthId = reader.GetInt32(0);
                        result.MonthBeginning = reader.GetDecimal(1);
                    }
                }

                using (var command = new SqlCommand(
                    @"SELECT Id, EntryDateTime, ICIValue, KOTValue, SBIValue, SURValue, CAHValue, BBBValue
                      FROM dbo.BudgetUpdateEntry
                      WHERE MonthId = @MonthId
                      ORDER BY EntryDateTime DESC, Id DESC",
                    connection))
                {
                    command.Parameters.Add("@MonthId", SqlDbType.Int).Value = monthId;
                    using (var reader = command.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            result.Entries.Add(new BudgetUpdateEntryModel
                            {
                                Id = reader.GetInt32(0),
                                EntryDateTime = reader.GetDateTime(1),
                                Values = new[]
                                {
                                    reader.GetDecimal(2),
                                    reader.GetDecimal(3),
                                    reader.GetDecimal(4),
                                    reader.GetDecimal(5),
                                    reader.GetDecimal(6),
                                    reader.GetDecimal(7)
                                }
                            });
                        }
                    }
                }
            }

            return result;
        }

        public int SaveEntry(int? id, DateTime entryDateTime, decimal monthBeginning, decimal[] values)
        {
            int year = entryDateTime.Year;
            int month = entryDateTime.Month;
            int entryId;

            using (var connection = new SqlConnection(_connectionString))
            {
                connection.Open();
                using (var transaction = connection.BeginTransaction())
                {
                    var monthId = GetOrCreateMonth(connection, transaction, year, month, monthBeginning);
                    if (id.HasValue)
                    {
                        using (var command = new SqlCommand(
                            @"UPDATE dbo.BudgetUpdateEntry
                              SET MonthId = @MonthId, EntryDateTime = @EntryDateTime,
                                  ICIValue = @ICIValue, KOTValue = @KOTValue,
                                  SBIValue = @SBIValue, SURValue = @SURValue,
                                  CAHValue = @CAHValue, BBBValue = @BBBValue,
                                  ModifiedAt = SYSUTCDATETIME()
                              WHERE Id = @Id",
                            connection,
                            transaction))
                        {
                            AddEntryParameters(command, monthId, entryDateTime, values);
                            command.Parameters.Add("@Id", SqlDbType.Int).Value = id.Value;
                            if (command.ExecuteNonQuery() != 1)
                            {
                                throw new KeyNotFoundException("The bank entry no longer exists.");
                            }
                        }

                        entryId = id.Value;
                    }
                    else
                    {
                        using (var command = new SqlCommand(
                            @"INSERT INTO dbo.BudgetUpdateEntry
                                  (MonthId, EntryDateTime, ICIValue, KOTValue, SBIValue, SURValue, CAHValue, BBBValue)
                              OUTPUT INSERTED.Id
                              VALUES
                                  (@MonthId, @EntryDateTime, @ICIValue, @KOTValue, @SBIValue, @SURValue, @CAHValue, @BBBValue)",
                            connection,
                            transaction))
                        {
                            AddEntryParameters(command, monthId, entryDateTime, values);
                            entryId = (int)command.ExecuteScalar();
                        }
                    }

                    transaction.Commit();
                }
            }

            return entryId;
        }

        public void SaveMonthBeginning(int year, int month, decimal monthBeginning)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                connection.Open();
                using (var transaction = connection.BeginTransaction())
                {
                    UpsertMonthBeginning(connection, transaction, year, month, monthBeginning);
                    transaction.Commit();
                }
            }
        }

        public bool DeleteEntry(int id)
        {
            using (var connection = new SqlConnection(_connectionString))
            using (var command = new SqlCommand("DELETE FROM dbo.BudgetUpdateEntry WHERE Id = @Id", connection))
            {
                command.Parameters.Add("@Id", SqlDbType.Int).Value = id;
                connection.Open();
                return command.ExecuteNonQuery() == 1;
            }
        }

        private static int GetOrCreateMonth(
            SqlConnection connection,
            SqlTransaction transaction,
            int year,
            int month,
            decimal defaultMonthBeginning)
        {
            using (var command = new SqlCommand(
                @"SELECT Id
                  FROM dbo.BudgetUpdateMonth WITH (UPDLOCK, HOLDLOCK)
                  WHERE [Year] = @Year AND [Month] = @Month",
                connection,
                transaction))
            {
                AddPeriodParameters(command, year, month);
                var existingId = command.ExecuteScalar();
                if (existingId != null)
                {
                    return Convert.ToInt32(existingId);
                }
            }

            using (var command = new SqlCommand(
                @"INSERT INTO dbo.BudgetUpdateMonth ([Year], [Month], MonthBeginning)
                  OUTPUT INSERTED.Id
                  VALUES (@Year, @Month, @MonthBeginning)",
                connection,
                transaction))
            {
                AddPeriodParameters(command, year, month);
                AddMoneyParameter(command, "@MonthBeginning", defaultMonthBeginning);
                return (int)command.ExecuteScalar();
            }
        }

        private static int UpsertMonthBeginning(
            SqlConnection connection,
            SqlTransaction transaction,
            int year,
            int month,
            decimal monthBeginning)
        {
            int monthId;
            using (var command = new SqlCommand(
                @"SELECT Id
                  FROM dbo.BudgetUpdateMonth WITH (UPDLOCK, HOLDLOCK)
                  WHERE [Year] = @Year AND [Month] = @Month",
                connection,
                transaction))
            {
                AddPeriodParameters(command, year, month);
                var existingId = command.ExecuteScalar();
                if (existingId != null)
                {
                    monthId = Convert.ToInt32(existingId);
                    using (var updateCommand = new SqlCommand(
                        @"UPDATE dbo.BudgetUpdateMonth
                          SET MonthBeginning = @MonthBeginning, ModifiedAt = SYSUTCDATETIME()
                          WHERE Id = @Id",
                        connection,
                        transaction))
                    {
                        AddMoneyParameter(updateCommand, "@MonthBeginning", monthBeginning);
                        updateCommand.Parameters.Add("@Id", SqlDbType.Int).Value = monthId;
                        updateCommand.ExecuteNonQuery();
                    }

                    return monthId;
                }
            }

            using (var command = new SqlCommand(
                @"INSERT INTO dbo.BudgetUpdateMonth ([Year], [Month], MonthBeginning)
                  OUTPUT INSERTED.Id
                  VALUES (@Year, @Month, @MonthBeginning)",
                connection,
                transaction))
            {
                AddPeriodParameters(command, year, month);
                AddMoneyParameter(command, "@MonthBeginning", monthBeginning);
                return (int)command.ExecuteScalar();
            }
        }

        private static void AddPeriodParameters(SqlCommand command, int year, int month)
        {
            command.Parameters.Add("@Year", SqlDbType.SmallInt).Value = year;
            command.Parameters.Add("@Month", SqlDbType.TinyInt).Value = month;
        }

        private static void AddEntryParameters(SqlCommand command, int monthId, DateTime entryDateTime, decimal[] values)
        {
            command.Parameters.Add("@MonthId", SqlDbType.Int).Value = monthId;
            command.Parameters.Add("@EntryDateTime", SqlDbType.DateTime2).Value = entryDateTime;
            AddMoneyParameter(command, "@ICIValue", values[0]);
            AddMoneyParameter(command, "@KOTValue", values[1]);
            AddMoneyParameter(command, "@SBIValue", values[2]);
            AddMoneyParameter(command, "@SURValue", values[3]);
            AddMoneyParameter(command, "@CAHValue", values[4]);
            AddMoneyParameter(command, "@BBBValue", values[5]);
        }

        private static void AddMoneyParameter(SqlCommand command, string name, decimal value)
        {
            var parameter = command.Parameters.Add(name, SqlDbType.Decimal);
            parameter.Precision = 18;
            parameter.Scale = 2;
            parameter.Value = value;
        }
    }
}
