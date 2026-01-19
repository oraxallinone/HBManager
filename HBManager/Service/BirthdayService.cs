using AdminTemp.Models;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace AdminTemp.Service
{
    public class BirthdayService
    {
        private readonly string _connString;

        public BirthdayService()
        {
            _connString = ConfigurationManager.ConnectionStrings["ConnectionString"].ConnectionString;
        }

        public int AddBirthday(string name, DateTime dob, bool isActive = true)
        {
            using (var con = new SqlConnection(_connString))
            using (var cmd = new SqlCommand("sp_birthdayTracker", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Name", name);
                cmd.Parameters.AddWithValue("@DateOfBirth", dob.Date);
                cmd.Parameters.AddWithValue("@IsActive", isActive);

                con.Open();
                var res = cmd.ExecuteScalar();
                int newId;
                if (res != null && int.TryParse(res.ToString(), out newId)) return newId;
                return 0;
            }
        }

        public List<BirthdayModel> GetAllBirthdays()
        {
            var list = new List<BirthdayModel>();
            using (var con = new SqlConnection(_connString))
            using (var cmd = new SqlCommand("sp_getAllBirthdays", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                con.Open();
                using (var rdr = cmd.ExecuteReader())
                {
                    while (rdr.Read())
                    {
                        list.Add(new BirthdayModel
                        {
                            Id = rdr.GetInt32(rdr.GetOrdinal("Id")),
                            Name = rdr.GetString(rdr.GetOrdinal("Name")),
                            DateOfBirth = rdr.GetDateTime(rdr.GetOrdinal("DateOfBirth")),
                            IsActive = rdr.GetBoolean(rdr.GetOrdinal("IsActive"))
                        });
                    }
                }
            }
            return list;
        }

        public List<BirthdayModel> GetBirthdaysByMonth(int year, int month)
        {
            var list = new List<BirthdayModel>();
            using (var con = new SqlConnection(_connString))
            using (var cmd = new SqlCommand("sp_getBirthdaysByMonth", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Year", year);
                cmd.Parameters.AddWithValue("@Month", month);
                con.Open();
                using (var rdr = cmd.ExecuteReader())
                {
                    while (rdr.Read())
                    {
                        list.Add(new BirthdayModel
                        {
                            Id = rdr.GetInt32(rdr.GetOrdinal("Id")),
                            Name = rdr.GetString(rdr.GetOrdinal("Name")),
                            DateOfBirth = rdr.GetDateTime(rdr.GetOrdinal("DateOfBirth")),
                            IsActive = rdr.GetBoolean(rdr.GetOrdinal("IsActive"))
                        });
                    }
                }
            }
            return list;
        }

        public bool UpdateBirthday(int id, string name, DateTime dob, bool isActive)
        {
            using (var con = new SqlConnection(_connString))
            using (var cmd = new SqlCommand("UPDATE dbo.tblBirthday SET Name = @Name, DateOfBirth = @DateOfBirth, IsActive = @IsActive WHERE Id = @Id", con))
            {
                cmd.Parameters.AddWithValue("@Id", id);
                cmd.Parameters.AddWithValue("@Name", name);
                cmd.Parameters.AddWithValue("@DateOfBirth", dob.Date);
                cmd.Parameters.AddWithValue("@IsActive", isActive);
                con.Open();
                return cmd.ExecuteNonQuery() > 0;
            }
        }

        public bool DeleteBirthday(int id)
        {
            using (var con = new SqlConnection(_connString))
            using (var cmd = new SqlCommand("DELETE FROM dbo.tblBirthday WHERE Id = @Id", con))
            {
                cmd.Parameters.AddWithValue("@Id", id);
                con.Open();
                return cmd.ExecuteNonQuery() > 0;
            }
        }
    }
}