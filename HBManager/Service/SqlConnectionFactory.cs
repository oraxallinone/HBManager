using System.Configuration;
using System.Data.SqlClient;

namespace HBManager.Service
{
    public static class SqlConnectionFactory
    {
        private static readonly string ConnectionString = LoadConnectionString();

        public static SqlConnection CreateConnection()
        {
            return new SqlConnection(ConnectionString);
        }

        private static string LoadConnectionString()
        {
            var settings = ConfigurationManager.ConnectionStrings["ConnectionString"];
            if (settings == null || string.IsNullOrWhiteSpace(settings.ConnectionString))
            {
                throw new ConfigurationErrorsException("The ConnectionString connection string is not configured.");
            }

            return settings.ConnectionString;
        }
    }
}
