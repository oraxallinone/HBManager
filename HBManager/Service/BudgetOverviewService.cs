using AdminTemp.Models;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace AdminTemp.Service
{
    public class BudgetOverviewService
    {
        private readonly string _connString;

        public BudgetOverviewService()
        {
            _connString = ConfigurationManager.ConnectionStrings["ConnectionString"].ConnectionString;
        }

        public List<GroupBudgetOverviewModel> GetSumAsGroupService(int year, int month)
        {
            var list = new List<GroupBudgetOverviewModel>();
            using (var conn = new SqlConnection(_connString))
            using (var cmd = new SqlCommand("sp_GetSumAsGroup", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Year", year);
                cmd.Parameters.AddWithValue("@Month", month);

                conn.Open();
                using (var rdr = cmd.ExecuteReader())
                {
                    while (rdr.Read())
                    {
                        list.Add(new GroupBudgetOverviewModel
                        {
                            GroupType = rdr["GroupType"]?.ToString(),
                            GroupId = rdr["GroupId"] == DBNull.Value ? 0 : Convert.ToInt32(rdr["GroupId"]),
                            GroupName = rdr["GroupName"]?.ToString(),
                            SumAmount = rdr["SumAmount"] == DBNull.Value ? 0 : Convert.ToDecimal(rdr["SumAmount"]),
                            FixedAmount = rdr["FixedAmount"] == DBNull.Value ? 0 : Convert.ToDecimal(rdr["FixedAmount"])
                        });
                    }
                }
            }
            return list;
        }
    }
}