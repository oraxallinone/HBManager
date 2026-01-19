using AdminTemp.Models;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace AdminTemp.Service
{
    public class DashboardService
    {
        private readonly string _connString;

        public DashboardService()
        {
            _connString = ConfigurationManager.ConnectionStrings["ConnectionString"].ConnectionString;
        }

        public Models.DashboardHeadingModel GetCurrentMonthSalaryDetails(int year, int month)
        {
            var result = new Models.DashboardHeadingModel
            {
                ThisMonthSalary = 0m,
                ThisMonthSpending = 0m,
                RemainingBalance = 0m,
                PercentSpending = "0%"
            };

            using (var con = new SqlConnection(_connString))
            using (var cmd = new SqlCommand("SP_DashboardHeading", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Year", year);
                cmd.Parameters.AddWithValue("@Month", month);

                con.Open();

                using (var rdr = cmd.ExecuteReader())
                {
                    if (rdr.Read())
                    {
                        // Safe parsing
                        result.ThisMonthSalary = rdr["thisMonthSalary"] != DBNull.Value ? Convert.ToDecimal(rdr["thisMonthSalary"]) : 0m;
                        result.ThisMonthSpending = rdr["thisMonthSpending"] != DBNull.Value ? Convert.ToDecimal(rdr["thisMonthSpending"]) : 0m;
                        result.RemainingBalance = rdr["remainingBalance"] != DBNull.Value ? Convert.ToDecimal(rdr["remainingBalance"]) : 0m;
                        result.PercentSpending = rdr["%spending"] != DBNull.Value ? rdr["%spending"].ToString() : "0%";
                    }
                }
            }

            return result;
        }
    }
}