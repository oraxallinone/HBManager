using AdminTemp.Models;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace AdminTemp.Service
{
    public class GroupService
    {
        private readonly string _connString;

        public GroupService()
        {
            _connString = ConfigurationManager.ConnectionStrings["ConnectionString"].ConnectionString;
        }

        public List<GroupMaster> GetGroupMasterByGroupname(string groupType)
        {
            var list = new List<GroupMaster>();
            using (var conn = new SqlConnection(_connString))
            using (var cmd = new SqlCommand("sp_GetGroupMasterByGroupname", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@GroupType", groupType);
                conn.Open();
                using (var rdr = cmd.ExecuteReader())
                {
                    while (rdr.Read())
                    {
                        var item = new GroupMaster
                        {
                            Id = Convert.ToInt32(rdr["Id"]),
                            GroupName = rdr["GroupName"].ToString(),
                            GroupType = rdr["GroupType"].ToString(),
                            IsActive = Convert.ToBoolean(rdr["IsActive"]),
                            IsFixedAmt = Convert.ToBoolean(rdr["IsFixedAmt"]),
                            Amt = rdr["Amt"] != DBNull.Value ? Convert.ToDecimal(rdr["Amt"]) : 0
                        };
                        list.Add(item);
                    }
                }
            }
            return list;
        }

        public int InsertGroupMaster(GroupMaster model)
        {
            using (var conn = new SqlConnection(_connString))
            using (var cmd = new SqlCommand("sp_InsertGroupMaster", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@GroupName", model.GroupName);
                cmd.Parameters.AddWithValue("@GroupType", model.GroupType ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@IsActive", model.IsActive);
                cmd.Parameters.AddWithValue("@IsFixedAmt", model.IsFixedAmt);
                cmd.Parameters.AddWithValue("@Amt", model.Amt);
                conn.Open();
                var obj = cmd.ExecuteScalar();
                return obj != null ? Convert.ToInt32(obj) : 0;
            }
        }

        public int UpdateGroupMasterByID(GroupMaster model)
        {
            using (var conn = new SqlConnection(_connString))
            using (var cmd = new SqlCommand("sp_UpdateGroupMasterByID", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Id", model.Id);
                cmd.Parameters.AddWithValue("@GroupName", model.GroupName);
                cmd.Parameters.AddWithValue("@GroupType", model.GroupType ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@IsActive", model.IsActive);
                cmd.Parameters.AddWithValue("@IsFixedAmt", model.IsFixedAmt);
                cmd.Parameters.AddWithValue("@Amt", model.Amt);
                conn.Open();
                var obj = cmd.ExecuteScalar();
                return obj != null ? Convert.ToInt32(obj) : 0;
            }
        }

        public int DeleteGroupMasterByID(int id)
        {
            using (var conn = new SqlConnection(_connString))
            using (var cmd = new SqlCommand("sp_DeleteGroupMasterByID", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Id", id);
                conn.Open();
                var obj = cmd.ExecuteScalar();
                return obj != null ? Convert.ToInt32(obj) : 0;
            }
        }

        public GroupMaster GetGroupMasterById(int id)
        {
            GroupMaster item = null;

            using (var conn = new SqlConnection(_connString))
            using (var cmd = new SqlCommand("sp_GetGroupMasterByID", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Id", id);

                conn.Open();
                using (var rdr = cmd.ExecuteReader())
                {
                    if (rdr.Read())
                    {
                        item = new GroupMaster
                        {
                            Id = Convert.ToInt32(rdr["Id"]),
                            GroupName = rdr["GroupName"].ToString(),
                            GroupType = rdr["GroupType"].ToString(),
                            IsActive = Convert.ToBoolean(rdr["IsActive"]),
                            IsFixedAmt = Convert.ToBoolean(rdr["IsFixedAmt"]),
                            Amt = rdr["Amt"] != DBNull.Value ? Convert.ToDecimal(rdr["Amt"]) : 0
                        };
                    }
                }
            }

            return item;
        }

    }
}