using AdminTemp.Models;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace AdminTemp.Service
{
    public class GraphService
    {
        private readonly string _connString;

        public GraphService()
        {
            _connString = ConfigurationManager.ConnectionStrings["ConnectionString"].ConnectionString;
        }

        public List<BarGraphData> GetBarGraphByGroupService(int? g1, int? g2, int? g3, int? g4)
        {
            var list = new List<BarGraphData>();

            using (var conn = new SqlConnection(_connString))
            using (var cmd = new SqlCommand("sp_bargraphByGroup", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@G1", (object)g1 ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@G2", (object)g2 ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@G3", (object)g3 ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@G4", (object)g4 ?? DBNull.Value);

                conn.Open();
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        list.Add(new BarGraphData
                        {
                            MonthDetails = reader["MonthDetails"] == DBNull.Value ? string.Empty : reader["MonthDetails"].ToString(),
                            Amount = reader["Amount"] == DBNull.Value ? (decimal?)null : Convert.ToDecimal(reader["Amount"])
                        });
                    }
                }
            }

            return list;
        }
    }
}