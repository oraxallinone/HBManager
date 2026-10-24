using HBManager.Models;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace HBManager.Service
{
    public class UpdateDateTimeService : IUpdateDateTimeService
    {
        private readonly string _connString;

        public UpdateDateTimeService()
        {
            _connString = ConfigurationManager.ConnectionStrings["ConnectionString"].ConnectionString;
        }

        public List<UpdateDateTimeViewModel> GetBudgetDataByMonthYear(int month, int year)
        {
            var list = new List<UpdateDateTimeViewModel>();
            using (var connection = new SqlConnection(_connString))
            {
                const string query = "SELECT Id, Year, Month, SpendDate, Amount, Details, G1, G2, G3, G4, BankName FROM [dbo].[Budget] WHERE [Month] = @Month AND [Year] = @Year ORDER BY SpendDate ASC";
                using (var command = new SqlCommand(query, connection))
                {
                    command.Parameters.AddWithValue("@Month", month);
                    command.Parameters.AddWithValue("@Year", year);
                    connection.Open();
                    using (var reader = command.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            list.Add(new UpdateDateTimeViewModel
                            {
                                Id = Convert.ToInt32(reader["Id"]),
                                Year = Convert.ToInt32(reader["Year"]),
                                Month = Convert.ToInt32(reader["Month"]),
                                SpendDate = reader["SpendDate"] == DBNull.Value ? (DateTime?)null : Convert.ToDateTime(reader["SpendDate"]),
                                Amount = Convert.ToDecimal(reader["Amount"]),
                                Details = reader["Details"].ToString(),
                                G1 = reader["G1"].ToString(),
                                G2 = reader["G2"].ToString(),
                                G3 = reader["G3"].ToString(),
                                G4 = reader["G4"].ToString(),
                                BankName = reader["BankName"].ToString()
                            });
                        }
                    }
                }
            }
            return list;
        }

        public bool UpdateBudgetDate(int id, DateTime spendDate)
        {
            using (var connection = new SqlConnection(_connString))
            using (var command = new SqlCommand("UPDATE [dbo].[Budget] SET [SpendDate] = @SpendDate WHERE [Id] = @Id", connection))
            {
                command.Parameters.AddWithValue("@Id", id);
                command.Parameters.AddWithValue("@SpendDate", spendDate);
                connection.Open();
                return command.ExecuteNonQuery() > 0;
            }
        }
    }
}
