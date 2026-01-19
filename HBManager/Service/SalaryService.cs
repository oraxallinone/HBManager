using AdminTemp.Models;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace AdminTemp.Service
{
    public class SalaryService
    {
        private readonly string _connString;

        public SalaryService()
        {
            _connString = ConfigurationManager.ConnectionStrings["ConnectionString"].ConnectionString;
        }

        public int InsertSalaryMaster(SalaryMaster model)
        {
            using (var conn = new SqlConnection(_connString))
            using (var cmd = new SqlCommand("sp_InsertSalaryMaster", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@MonthName", (object)model.MonthName ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@YearName", (object)model.YearName ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@SalaryAmount", (object)model.SalaryAmount ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@Need50", (object)model.Need50 ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@Save20", (object)model.Save20 ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@Want30", (object)model.Want30 ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@FromData", (object)model.FromData ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@ToDate", (object)model.ToDate ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@OrderRowAll", (object)model.OrderRowAll ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@OrderRowYear", (object)model.OrderRowYear ?? DBNull.Value);

                conn.Open();
                var obj = cmd.ExecuteScalar();
                return obj != null ? Convert.ToInt32(obj) : 0;
            }
        }

        public int UpdateSalaryMasterById(SalaryMaster model)
        {
            using (var conn = new SqlConnection(_connString))
            using (var cmd = new SqlCommand("sp_UpdateSalaryMasterById", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Id", model.Id);
                cmd.Parameters.AddWithValue("@MonthName", (object)model.MonthName ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@YearName", (object)model.YearName ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@SalaryAmount", (object)model.SalaryAmount ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@Need50", (object)model.Need50 ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@Save20", (object)model.Save20 ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@Want30", (object)model.Want30 ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@FromData", (object)model.FromData ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@ToDate", (object)model.ToDate ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@OrderRowAll", (object)model.OrderRowAll ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@OrderRowYear", (object)model.OrderRowYear ?? DBNull.Value);

                conn.Open();
                var obj = cmd.ExecuteScalar();
                return obj != null ? Convert.ToInt32(obj) : 0;
            }
        }

        public List<SalaryMaster> GetAllSalaryMaster()
        {
            var list = new List<SalaryMaster>();
            using (var conn = new SqlConnection(_connString))
            using (var cmd = new SqlCommand("sp_GetAllSalaryMaster", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
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

        public SalaryMaster GetSalaryMasterById(int id)
        {
            using (var conn = new SqlConnection(_connString))
            using (var cmd = new SqlCommand("sp_GetSalaryById", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Id", id);
                conn.Open();
                using (var rdr = cmd.ExecuteReader())
                {
                    if (rdr.Read())
                        return Map(rdr);
                }
            }
            return null;
        }

        public int DeleteSalaryMasterById(int id)
        {
            using (var conn = new SqlConnection(_connString))
            using (var cmd = new SqlCommand("sp_DeleteSalaryById", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Id", id);
                conn.Open();
                var obj = cmd.ExecuteScalar(); 
                return obj != null ? Convert.ToInt32(obj) : 0;
            }
        }

        private SalaryMaster Map(IDataRecord r)
        {
            return new SalaryMaster
            {
                Id = Convert.ToInt32(r["Id"]),
                MonthName = r["MonthName"] == DBNull.Value ? null : r["MonthName"].ToString(),
                YearName = r["YearName"] == DBNull.Value ? null : r["YearName"].ToString(),
                SalaryAmount = r["SalaryAmount"] == DBNull.Value ? (decimal?)null : Convert.ToDecimal(r["SalaryAmount"]),
                Need50 = r["Need50"] == DBNull.Value ? (decimal?)null : Convert.ToDecimal(r["Need50"]),
                Save20 = r["Save20"] == DBNull.Value ? (decimal?)null : Convert.ToDecimal(r["Save20"]),
                Want30 = r["Want30"] == DBNull.Value ? (decimal?)null : Convert.ToDecimal(r["Want30"]),
                FromData = r["FromData"] == DBNull.Value ? (DateTime?)null : Convert.ToDateTime(r["FromData"]),
                ToDate = r["ToDate"] == DBNull.Value ? (DateTime?)null : Convert.ToDateTime(r["ToDate"]),
                OrderRowAll = r["OrderRowAll"] == DBNull.Value ? (int?)null : Convert.ToInt32(r["OrderRowAll"]),
                OrderRowYear = r["OrderRowYear"] == DBNull.Value ? (int?)null : Convert.ToInt32(r["OrderRowYear"]),
                SalaryTillNow = r["SalaryTillNow"] == DBNull.Value ? (decimal?)null : Convert.ToDecimal(r["SalaryTillNow"]),
            };
        }

        public List<SalaryMaster> GetSalaryByMonthYearService(int monthName, int yearName)
        {
            var list = new List<SalaryMaster>();
            using (var conn = new SqlConnection(_connString))
            using (var cmd = new SqlCommand("sp_GetSalaryByMonthyear", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@MonthName", (object)monthName ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@YearName", (object)yearName ?? DBNull.Value);

                conn.Open();
                using (var rdr = cmd.ExecuteReader())
                {
                    while (rdr.Read())
                    {
                        list.Add(Map(rdr)); // existing Map(IDataRecord) in this class
                    }
                }
            }
            return list;
        }

    }
}