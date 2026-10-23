using HBManager.Models;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace HBManager.Service
{
    public class UpdateDatetimeService
    {
        private readonly string _connString;

        public UpdateDatetimeService()
        {
            _connString = ConfigurationManager.ConnectionStrings["ConnectionString"].ConnectionString;
        }

        public List<UpdateDatetimeViewModel> GetBudgetDataByMonthYear(int month, int year)
        {
            var list = new List<UpdateDatetimeViewModel>();
            using (var con = new SqlConnection(_connString))
            {
                string query = "SELECT Id, Year, Month, SpendDate, Amount, Details, G1, G2, G3, G4, BankName FROM [dbo].[Budget] WHERE [Month] = @Month AND [Year] = @Year ORDER BY SpendDate ASC";
                using (var cmd = new SqlCommand(query, con))
                {
                    cmd.Parameters.AddWithValue("@Month", month);
                    cmd.Parameters.AddWithValue("@Year", year);
                    con.Open();
                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            list.Add(new UpdateDatetimeViewModel
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
            using (var con = new SqlConnection(_connString))
            {
                string query = "UPDATE [dbo].[Budget] SET [SpendDate] = @SpendDate WHERE [Id] = @Id";
                using (var cmd = new SqlCommand(query, con))
                {
                    cmd.Parameters.AddWithValue("@Id", id);
                    cmd.Parameters.AddWithValue("@SpendDate", spendDate);
                    con.Open();
                    int rowsAffected = cmd.ExecuteNonQuery();
                    return rowsAffected > 0;
                }
            }
        }
    }
}