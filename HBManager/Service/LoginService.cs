using System;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace AdminTemp.Service
{
    public class LoginResult
    {
        public string FullName { get; set; }
        public int UserType { get; set; }
    }

    public class LoginService
    {
        private readonly string _connectionString;

        public LoginService()
        {
            _connectionString = ConfigurationManager.ConnectionStrings["ConnectionString"].ConnectionString;
        }

        public LoginResult CheckLogin(string userName, string userPassword)
        {
            using (var conn = new SqlConnection(_connectionString))
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
