using HBManager.Models;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Globalization;
using System.Linq;

namespace HBManager.Service
{
    public class BudgetService
    {
        private readonly string _connString;

        public BudgetService()
        {
            _connString = ConfigurationManager.ConnectionStrings["ConnectionString"].ConnectionString;
        }

        // Budget Verification Data
        public BudgetVerificationSummaryModel GetBudgetVerificationData(int year, int month)
        {
            var result = new BudgetVerificationSummaryModel();
            var inList = new List<BudgetVerificationInModel>();
            var outList = new List<BudgetVerificationOutModel>();
            var nowList = new List<BudgetVerificationNowModel>();

            using (var conn = new SqlConnection(_connString))
            {
                conn.Open();
                // M IN
                using (var cmd = new SqlCommand("sp_GetMonthInData", conn))
                {
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("@Year", year);
                    cmd.Parameters.AddWithValue("@Month", month);
                    using (var rdr = cmd.ExecuteReader())
                    {
                        while (rdr.Read())
                        {
                            inList.Add(new BudgetVerificationInModel
                            {
                                IdIn = rdr["IdIn"] != DBNull.Value ? Convert.ToInt32(rdr["IdIn"]) : 0,
                                DateIn = rdr["DateIn"] != DBNull.Value ? Convert.ToDateTime(rdr["DateIn"]) : (DateTime?)null,
                                AmountIn = rdr["AmountIn"] != DBNull.Value ? Convert.ToDecimal(rdr["AmountIn"]) : 0,
                                DetailsIn = rdr["DetailsIn"] != DBNull.Value ? rdr["DetailsIn"].ToString() : string.Empty,
                                YearIn = rdr["YearIn"] != DBNull.Value ? Convert.ToInt32(rdr["YearIn"]) : 0,
                                MonthIn = rdr["MonthIn"] != DBNull.Value ? Convert.ToInt32(rdr["MonthIn"]) : 0
                            });
                        }
                    }
                }

                // M Out
                using (var cmd = new SqlCommand("sp_budget_verification_MOut", conn))
                {
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("@Year", year);
                    cmd.Parameters.AddWithValue("@Month", month);
                    using (var rdr = cmd.ExecuteReader())
                    {
                        while (rdr.Read())
                        {
                            outList.Add(new BudgetVerificationOutModel
                            {
                                AmountOut = rdr["AmountOut"] != DBNull.Value ? Convert.ToDecimal(rdr["AmountOut"]) : 0
                            });
                        }
                    }
                }

                // M Now
                using (var cmd = new SqlCommand("sp_GetMonthNowData", conn))
                {
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("@Year", year);
                    cmd.Parameters.AddWithValue("@Month", month);
                    using (var rdr = cmd.ExecuteReader())
                    {
                        while (rdr.Read())
                        {
                            nowList.Add(new BudgetVerificationNowModel
                            {
                                IdNow = rdr["IdNow"] != DBNull.Value ? Convert.ToInt32(rdr["IdNow"]) : 0,
                                AmountNow = rdr["AmountNow"] != DBNull.Value ? Convert.ToDecimal(rdr["AmountNow"]) : 0,
                                DetailsNow = rdr["DetailsNow"] != DBNull.Value ? rdr["DetailsNow"].ToString() : string.Empty,
                                DateNow = rdr["DateNow"] != DBNull.Value ? Convert.ToDateTime(rdr["DateNow"]) : DateTime.MinValue,
                                YearNow = rdr["YearNow"] != DBNull.Value ? Convert.ToInt32(rdr["YearNow"]) : 0,
                                MonthNow = rdr["MonthNow"] != DBNull.Value ? Convert.ToInt32(rdr["MonthNow"]) : 0
                            });
                        }
                    }
                }
            }

            result.InList = inList;
            result.OutList = outList;
            result.NowList = nowList;
            result.TotalIn = inList.Sum(x => x.AmountIn);
            result.TotalOut = outList.Sum(x => x.AmountOut);
            result.TotalNow = nowList.Sum(x => x.AmountNow);
            return result;
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

        public List<Budget> GetBudgetByFromToDateWithGroup(int year, int month, int g1, int g2, int g3, int g4, bool isAll, string searchText)
        {
            var list = new List<Budget>();
            using (var conn = new SqlConnection(_connString))
            using (var cmd = new SqlCommand("sp_GetBudgetByFromToDateWithGroup1", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Year", year);
                cmd.Parameters.AddWithValue("@Month", month);
                cmd.Parameters.AddWithValue("@g1", g1);
                cmd.Parameters.AddWithValue("@g2", g2);
                cmd.Parameters.AddWithValue("@g3", g3);
                cmd.Parameters.AddWithValue("@g4", g4);
                cmd.Parameters.AddWithValue("@isAll", isAll);
                cmd.Parameters.AddWithValue("@searchText", searchText);

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

        public List<WasteTracker> GetWasteTrackerByBudgetMonth(int year, int month)
        {
            var list = new List<WasteTracker>();
            using (var conn = new SqlConnection(_connString))
            using (var cmd = new SqlCommand("sp_GetWasteTrackerByBudgetMonth", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Year", year);
                cmd.Parameters.AddWithValue("@Month", month);
                conn.Open();
                using (var rdr = cmd.ExecuteReader())
                {
                    while (rdr.Read())
                    {
                        list.Add(new WasteTracker
                        {
                            Id = Convert.ToInt32(rdr["Id"]),
                            ReferenceID = Convert.ToInt32(rdr["ReferenceID"]),
                            WasteAmount = Convert.ToDecimal(rdr["WasteAmount"]),
                            ReasonForWaste = rdr["ReasonForWaste"].ToString(),
                            SpendDate = rdr["SpendDate"] == DBNull.Value ? (DateTime?)null : Convert.ToDateTime(rdr["SpendDate"]),
                            BudgetAmount = Convert.ToDecimal(rdr["BudgetAmount"]),
                            Details = rdr["Details"] == DBNull.Value ? null : rdr["Details"].ToString()
                        });
                    }
                }
            }
            return list;
        }

        public int InsertWasteTracker(WasteTracker model)
        {
            return ExecuteWasteTrackerCommand("sp_InsertWasteTracker", model, false);
        }

        public int UpdateWasteTracker(WasteTracker model)
        {
            return ExecuteWasteTrackerCommand("sp_UpdateWasteTracker", model, true);
        }

        public int DeleteWasteTracker(int id)
        {
            using (var conn = new SqlConnection(_connString))
            using (var cmd = new SqlCommand("sp_DeleteWasteTracker", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Id", id);
                conn.Open();
                return Convert.ToInt32(cmd.ExecuteScalar());
            }
        }

        private int ExecuteWasteTrackerCommand(string procedureName, WasteTracker model, bool includeId)
        {
            using (var conn = new SqlConnection(_connString))
            using (var cmd = new SqlCommand(procedureName, conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                if (includeId) cmd.Parameters.AddWithValue("@Id", model.Id);
                if (!includeId) cmd.Parameters.AddWithValue("@ReferenceID", model.ReferenceID);
                cmd.Parameters.AddWithValue("@WasteAmount", model.WasteAmount);
                cmd.Parameters.AddWithValue("@ReasonForWaste", (object)model.ReasonForWaste ?? DBNull.Value);
                conn.Open();
                return Convert.ToInt32(cmd.ExecuteScalar());
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
                SpendDateText = r["SpendDate"] == DBNull.Value ? null : Convert.ToDateTime(r["SpendDate"]).ToString("yyyy-MM-dd HH:mm:ss.fff", CultureInfo.InvariantCulture),
                Amount = Convert.ToDecimal(r["Amount"]),
                Details = r["Details"] == DBNull.Value ? null : r["Details"].ToString(),
                BankName = r["BankName"] == DBNull.Value ? null : r["BankName"].ToString(),
                G1 = r["G1"] == DBNull.Value ? (int?)null : Convert.ToInt32(r["G1"]),
                G2 = r["G2"] == DBNull.Value ? (int?)null : Convert.ToInt32(r["G2"]),
                G3 = r["G3"] == DBNull.Value ? (int?)null : Convert.ToInt32(r["G3"]),
                G4 = r["G4"] == DBNull.Value ? (int?)null : Convert.ToInt32(r["G4"]),
                CreatedTime = Convert.ToDateTime(r["CreatedTime"]),
                //IsVerified = r["IsVerified"] == DBNull.Value ? (bool?)null : Convert.ToBoolean(r["IsVerified"])
                IsVerified = r["IsVerified"] == DBNull.Value ? null : (bool?)r["IsVerified"]
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

        // Budget verification - insert / update for M IN and M Now
        public int InsertBudgetVerificationIn(BudgetVerificationInModel model)
        {
            using (var conn = new SqlConnection(_connString))
            using (var cmd = new SqlCommand("sp_InsertBudgetVerificationIn", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Year", model.YearIn);
                cmd.Parameters.AddWithValue("@Month", model.MonthIn);
                cmd.Parameters.AddWithValue("@DateIn", (object)model.DateIn ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@AmountIn", model.AmountIn);
                cmd.Parameters.AddWithValue("@DetailsIn", (object)model.DetailsIn ?? DBNull.Value);

                conn.Open();
                var obj = cmd.ExecuteScalar();
                return obj != null ? Convert.ToInt32(obj) : 0;
            }
        }

        public int UpdateBudgetVerificationIn(BudgetVerificationInModel model)
        {
            using (var conn = new SqlConnection(_connString))
            using (var cmd = new SqlCommand("sp_UpdateBudgetVerificationIn", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@IdIn", model.IdIn);
                cmd.Parameters.AddWithValue("@Year", model.YearIn);
                cmd.Parameters.AddWithValue("@Month", model.MonthIn);
                cmd.Parameters.AddWithValue("@DateIn", (object)model.DateIn ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@AmountIn", model.AmountIn);
                cmd.Parameters.AddWithValue("@DetailsIn", (object)model.DetailsIn ?? DBNull.Value);

                conn.Open();
                var obj = cmd.ExecuteScalar();
                return obj != null ? Convert.ToInt32(obj) : 0;
            }
        }

        public int InsertBudgetVerificationNow(BudgetVerificationNowModel model)
        {
            using (var conn = new SqlConnection(_connString))
            using (var cmd = new SqlCommand("sp_InsertBudgetVerificationNow", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Year", model.YearNow);
                cmd.Parameters.AddWithValue("@Month", model.MonthNow);
                cmd.Parameters.AddWithValue("@DateNow", (object)model.DateNow ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@AmountNow", model.AmountNow);
                cmd.Parameters.AddWithValue("@DetailsNow", (object)model.DetailsNow ?? DBNull.Value);

                conn.Open();
                var obj = cmd.ExecuteScalar();
                return obj != null ? Convert.ToInt32(obj) : 0;
            }
        }

        public int UpdateBudgetVerificationNow(BudgetVerificationNowModel model)
        {
            using (var conn = new SqlConnection(_connString))
            using (var cmd = new SqlCommand("sp_UpdateBudgetVerificationNow", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@IdNow", model.IdNow);
                cmd.Parameters.AddWithValue("@Year", model.YearNow);
                cmd.Parameters.AddWithValue("@Month", model.MonthNow);
                cmd.Parameters.AddWithValue("@DateNow", (object)model.DateNow ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@AmountNow", model.AmountNow);
                cmd.Parameters.AddWithValue("@DetailsNow", (object)model.DetailsNow ?? DBNull.Value);

                conn.Open();
                var obj = cmd.ExecuteScalar();
                return obj != null ? Convert.ToInt32(obj) : 0;
            }
        }

        public int DeleteBudgetVerificationIn(int idIn)
        {
            using (var conn = new SqlConnection(_connString))
            using (var cmd = new SqlCommand("sp_DeleteTblMonthInById", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@IdIn", idIn);
                conn.Open();
                return cmd.ExecuteNonQuery();
            }
        }

        public int DeleteBudgetVerificationNow(int idNow)
        {
            using (var conn = new SqlConnection(_connString))
            using (var cmd = new SqlCommand("sp_DeleteMonthNowById", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@IdNow", idNow);
                conn.Open();
                return cmd.ExecuteNonQuery();
            }
        }

        public bool UpdateText(int id, string details)
        {
            using (var conn = new SqlConnection(_connString))
            using (var cmd = new SqlCommand("usp_updateText", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Id", id);
                cmd.Parameters.AddWithValue("@Details", details ?? "");
                conn.Open();
                using (var rdr = cmd.ExecuteReader())
                {
                    if (rdr.Read() && rdr["Success"] != DBNull.Value)
                    {
                        return Convert.ToInt32(rdr["Success"]) == 1;
                    }
                }
            }
            return false;
        }

        public int UpdateBudgetVerificationById(Budget model)
        {
            using (var conn = new SqlConnection(_connString))
            using (var cmd = new SqlCommand("sp_UpdateBudgetVerificationById", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Id", model.Id);
                cmd.Parameters.AddWithValue("@IsVerified", (object)model.IsVerified ?? DBNull.Value);

                conn.Open();
                var obj = cmd.ExecuteScalar();
                return obj != null ? Convert.ToInt32(obj) : 0;
            }
        }
    }
}