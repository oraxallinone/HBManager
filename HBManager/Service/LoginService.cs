using System;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace HBManager.Service
{
    public class LoginResult
    {
        public string FullName { get; set; }
        public int UserType { get; set; }
    }

    public class LoginService
    {

        public LoginService()
        {
        }

        public LoginResult CheckLogin(string userName, string userPassword)
        {
            using (var conn = SqlConnectionFactory.CreateConnection())
            using (var cmd = new SqlCommand("sp_login", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@UserName", userName);
                cmd.Parameters.AddWithValue("@UserPassword", userPassword);
                conn.Open();
                using (var reader = cmd.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        return new LoginResult
                        {
                            FullName = reader["FullName"].ToString(),
                            UserType = Convert.ToInt32(reader["UserType"])
                        };
                    }
                }
            }
            return null;
        }
    }
}
