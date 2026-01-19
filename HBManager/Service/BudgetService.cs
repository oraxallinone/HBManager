using AdminTemp.Models;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace AdminTemp.Service
{
    public class BudgetService
    {
        private readonly string _connString;

        public BudgetService()
        {
            _connString = ConfigurationManager.ConnectionStrings["ConnectionString"].ConnectionString;
        }

        public int InsertBudget(Budget model)
        {
            using (var conn = new SqlConnection(_connString))
            using (var cmd = new SqlCommand("sp_InsertBudget", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Year", model.Year);
                cmd.Parameters.AddWithValue("@Month", model.Month);
                cmd.Parameters.AddWithValue("@SpendDate", (object)model.SpendDate ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@Amount", model.Amount);
                cmd.Parameters.AddWithValue("@Details", (object)model.Details ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@G1", (object)model.G1 ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@G2", (object)model.G2 ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@G3", (object)model.G3 ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@G4", (object)model.G4 ?? DBNull.Value);

                conn.Open();
                var obj = cmd.ExecuteScalar();
                return obj != null ? Convert.ToInt32(obj) : 0;
            }
        }

        public int UpdateBudgetById(Budget model)
        {
            using (var conn = new SqlConnection(_connString))
            using (var cmd = new SqlCommand("sp_UpdateBudgetById", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Id", model.Id);
                cmd.Parameters.AddWithValue("@Year", model.Year);
                cmd.Parameters.AddWithValue("@Month", model.Month);
                cmd.Parameters.AddWithValue("@SpendDate", (object)model.SpendDate ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@Amount", model.Amount);
                cmd.Parameters.AddWithValue("@Details", (object)model.Details ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@G1", (object)model.G1 ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@G2", (object)model.G2 ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@G3", (object)model.G3 ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@G4", (object)model.G4 ?? DBNull.Value);

                conn.Open();
                var obj = cmd.ExecuteScalar();
                return obj != null ? Convert.ToInt32(obj) : 0;
            }
        }

        public List<Budget> GetBudgetByFromToDate(int year, int month)
        {
            var list = new List<Budget>();
            using (var conn = new SqlConnection(_connString))
            using (var cmd = new SqlCommand("sp_GetBudgetByFromToDate", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Year", year);
                cmd.Parameters.AddWithValue("@Month", month);

                conn.Open();
                using (var rdr = cmd.ExecuteReader())
                {
                    while (rdr.Read())
                    {
                        list.Add(Map(rdr));
                    }
                }
            }
            return list;
        }

        public List<Budget> GetBudgetByFromToDateWithGroup(int year, int month, int g1, int g2, int g3, int g4)
        {
            var list = new List<Budget>();
            using (var conn = new SqlConnection(_connString))
            using (var cmd = new SqlCommand("sp_GetBudgetByFromToDateWithGroup", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Year", year);
                cmd.Parameters.AddWithValue("@Month", month);
                cmd.Parameters.AddWithValue("@g1", g1);
                cmd.Parameters.AddWithValue("@g2", g2);
                cmd.Parameters.AddWithValue("@g3", g3);
                cmd.Parameters.AddWithValue("@g4", g4);

                conn.Open();
                using (var rdr = cmd.ExecuteReader())
                {
                    while (rdr.Read())
                    {
                        list.Add(Map(rdr));
                    }
                }
            }
            return list;
        }

        public Budget GetBudgetById(int id)
        {
            using (var conn = new SqlConnection(_connString))
            using (var cmd = new SqlCommand("sp_GetBudgetById", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Id", id);

                conn.Open();
                using (var rdr = cmd.ExecuteReader())
                {
                    if (rdr.Read())
                    {
                        return Map(rdr);
                    }
                }
            }
            return null;
        }

        public int DeleteBudgetById(int id)
        {
            using (var conn = new SqlConnection(_connString))
            using (var cmd = new SqlCommand("sp_DeleteBudgetById", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Id", id);

                conn.Open();
                var obj = cmd.ExecuteScalar();
                return obj != null ? Convert.ToInt32(obj) : 0;
            }
        }

        private Budget Map(IDataRecord r)
        {
            return new Budget
            {
                Id = Convert.ToInt32(r["Id"]),
                Year = Convert.ToInt32(r["Year"]),
                Month = Convert.ToInt32(r["Month"]),
                SpendDate = r["SpendDate"] == DBNull.Value ? (DateTime?)null : Convert.ToDateTime(r["SpendDate"]),
                Amount = Convert.ToDecimal(r["Amount"]),
                Details = r["Details"] == DBNull.Value ? null : r["Details"].ToString(),
                G1 = r["G1"] == DBNull.Value ? (int?)null : Convert.ToInt32(r["G1"]),
                G2 = r["G2"] == DBNull.Value ? (int?)null : Convert.ToInt32(r["G2"]),
                G3 = r["G3"] == DBNull.Value ? (int?)null : Convert.ToInt32(r["G3"]),
                G4 = r["G4"] == DBNull.Value ? (int?)null : Convert.ToInt32(r["G4"]),
                CreatedTime = Convert.ToDateTime(r["CreatedTime"])
            };
        }

        public Group4Result GetAll4Group()
        {
            var result = new Group4Result
            {
                G1Groups = new List<GroupMaster2>(),
                G2Groups = new List<GroupMaster2>(),
                G3Groups = new List<GroupMaster2>(),
                G4Groups = new List<GroupMaster2>()
            };

            using (var conn = new SqlConnection(_connString))
            using (var cmd = new SqlCommand("sp_GetAll4Group", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                conn.Open();

                using (var reader = cmd.ExecuteReader())
                {
                    // Read G1 results
                    while (reader.Read())
                    {
                        result.G1Groups.Add(MapGroupMaster(reader));
                    }

                    // Move to next result set (G2)
                    if (reader.NextResult())
                    {
                        while (reader.Read())
                        {
                            result.G2Groups.Add(MapGroupMaster(reader));
                        }
                    }

                    // Move to next result set (G3)
                    if (reader.NextResult())
                    {
                        while (reader.Read())
                        {
                            result.G3Groups.Add(MapGroupMaster(reader));
                        }
                    }

                    // Move to next result set (G4)
                    if (reader.NextResult())
                    {
                        while (reader.Read())
                        {
                            result.G4Groups.Add(MapGroupMaster(reader));
                        }
                    }
                }
            }

            return result;
        }

        private GroupMaster2 MapGroupMaster(IDataRecord r)
        {
            return new GroupMaster2
            {
                GroupId = Convert.ToInt32(r["GroupId"]),
                GroupName = r["GroupName"] == DBNull.Value ? null : r["GroupName"].ToString(),
                GroupType = r["GroupType"] == DBNull.Value ? null : r["GroupType"].ToString(),
                IsActive = r["IsActive"] == DBNull.Value ? false : Convert.ToBoolean(r["IsActive"]),
                IsFixedAmt = r["IsFixedAmt"] == DBNull.Value ? false : Convert.ToBoolean(r["IsFixedAmt"]),
                Amt = r["Amt"] == DBNull.Value ? (decimal?)null : Convert.ToDecimal(r["Amt"])
            };
        }

        public int UpdateBudgetGroupsByIds(List<int> budgetIds, int? g1, int? g2, int? g3, int? g4)
        {
            if (budgetIds == null || budgetIds.Count == 0)
            {
                return 0;
            }

            // Convert list of IDs to comma-separated string
            string ids = string.Join(",", budgetIds);

            using (var conn = new SqlConnection(_connString))
            using (var cmd = new SqlCommand("sp_UpdateBudgetGroupsByIds", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@BudgetIds", ids);
                cmd.Parameters.AddWithValue("@G1", (object)g1 ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@G2", (object)g2 ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@G3", (object)g3 ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@G4", (object)g4 ?? DBNull.Value);

                conn.Open();
                var obj = cmd.ExecuteScalar();
                return obj != null ? Convert.ToInt32(obj) : 0;
            }
        }

        public List<GroupMaster2> GetGroupMasterUncutService()
        {
            var list = new List<GroupMaster2>();
            using (var conn = new SqlConnection(_connString))
            using (var cmd = new SqlCommand("sp_GetGroupMasterUncut", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                conn.Open();
                using (var rdr = cmd.ExecuteReader())
                {
                    while (rdr.Read())
                    {
                        list.Add(new GroupMaster2
                        {
                            GroupId = Convert.ToInt32(rdr["GroupId"]),
                            GroupName = rdr["GroupName"] == DBNull.Value ? null : rdr["GroupName"].ToString()
                        });
                    }
                }
            }
            return list;
        }
    }
}