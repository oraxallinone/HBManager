using HBManager.Models;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace HBManager.Service
{
    public class GroupMappingService
    {
        private readonly string _connString;

        public GroupMappingService()
        {
            _connString = ConfigurationManager.ConnectionStrings["ConnectionString"].ConnectionString;
        }

        public List<GroupMappingConfiguration> GetAll()
        {
            var list = new List<GroupMappingConfiguration>();
            using (var conn = new SqlConnection(_connString))
            using (var cmd = new SqlCommand("sp_GetGroupMappingConfigurations", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                conn.Open();
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        list.Add(ReadMapping(reader));
                    }
                }
            }
            return list;
        }

        public int Save(GroupMappingConfiguration model)
        {
            using (var conn = new SqlConnection(_connString))
            using (var cmd = new SqlCommand(model.Id > 0 ? "sp_UpdateGroupMappingConfiguration" : "sp_InsertGroupMappingConfiguration", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                if (model.Id > 0) cmd.Parameters.AddWithValue("@Id", model.Id);
                AddValues(cmd, model);
                conn.Open();
                try
                {
                    return Convert.ToInt32(cmd.ExecuteScalar());
                }
                catch (SqlException ex) when (ex.Number == 2601 || ex.Number == 2627)
                {
                    return -1;
                }
            }
        }

        public int Delete(int id)
        {
            using (var conn = new SqlConnection(_connString))
            using (var cmd = new SqlCommand("sp_DeleteGroupMappingConfiguration", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Id", id);
                conn.Open();
                return Convert.ToInt32(cmd.ExecuteScalar());
            }
        }

        private static void AddValues(SqlCommand cmd, GroupMappingConfiguration model)
        {
            cmd.Parameters.AddWithValue("@MappingGroup", model.MappingGroup);
            cmd.Parameters.AddWithValue("@G1Id", model.G1Id);
            cmd.Parameters.AddWithValue("@G2Id", model.G2Id);
            cmd.Parameters.AddWithValue("@G3Id", model.G3Id);
            cmd.Parameters.AddWithValue("@G4Id", model.G4Id);
        }

        private static GroupMappingConfiguration ReadMapping(SqlDataReader reader)
        {
            return new GroupMappingConfiguration
            {
                Id = Convert.ToInt32(reader["Id"]),
                MappingGroup = reader["MappingGroup"].ToString(),
                G1Id = Convert.ToInt32(reader["G1Id"]),
                G2Id = Convert.ToInt32(reader["G2Id"]),
                G3Id = Convert.ToInt32(reader["G3Id"]),
                G4Id = Convert.ToInt32(reader["G4Id"]),
                G1Name = reader["G1Name"].ToString(),
                G2Name = reader["G2Name"].ToString(),
                G3Name = reader["G3Name"].ToString(),
                G4Name = reader["G4Name"].ToString()
            };
        }
    }
}
