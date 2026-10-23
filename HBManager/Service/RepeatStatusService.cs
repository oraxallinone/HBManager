using HBManager.Models;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace HBManager.Service
{
    public class RepeatStatusService
    {
        private readonly string _connString = ConfigurationManager.ConnectionStrings["ConnectionString"].ConnectionString;

        public RepeatStatusResult GetRepeatStatus()
        {
            var result = new RepeatStatusResult { Columns = new List<string>(), Rows = new List<RepeatStatusRow>() };
            using (var conn = new SqlConnection(_connString))
            using (var cmd = new SqlCommand("sp_GetRepeatStatus", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                conn.Open();
                using (var reader = cmd.ExecuteReader())
                {
                    for (var index = 8; index < reader.FieldCount; index++)
                        result.Columns.Add(reader.GetName(index));

                    while (reader.Read())
                    {
                        var row = new RepeatStatusRow
                        {
                            G1Id = ReadNullableInt(reader, "G1_Id"), G1Name = ReadString(reader, "G1_Name"),
                            G2Id = ReadNullableInt(reader, "G2_Id"), G2Name = ReadString(reader, "G2_Name"),
                            G3Id = ReadNullableInt(reader, "G3_Id"), G3Name = ReadString(reader, "G3_Name"),
                            G4Id = ReadNullableInt(reader, "G4_Id"), G4Name = ReadString(reader, "G4_Name"),
                            Amounts = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase),
                            CompletedColumns = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
                        };
                        for (var index = 8; index < reader.FieldCount; index++)
                            row.Amounts[reader.GetName(index)] = reader[index] == DBNull.Value ? 0 : Convert.ToDecimal(reader[index]);
                        result.Rows.Add(row);
                    }

                    if (reader.NextResult())
                    {
                        while (reader.Read())
                        {
                            foreach (var row in result.Rows)
                            {
                                if (NullableEquals(row.G1Id, ReadNullableInt(reader, "G1")) &&
                                    NullableEquals(row.G2Id, ReadNullableInt(reader, "G2")) &&
                                    NullableEquals(row.G3Id, ReadNullableInt(reader, "G3")) &&
                                    NullableEquals(row.G4Id, ReadNullableInt(reader, "G4")))
                                {
                                    row.CompletedColumns.Add(Convert.ToString(reader["YearMonth"]));
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            return result;
        }

        private static string ReadString(IDataRecord reader, string name)
        {
            return reader[name] == DBNull.Value ? string.Empty : Convert.ToString(reader[name]);
        }

        private static int? ReadNullableInt(IDataRecord reader, string name)
        {
            return reader[name] == DBNull.Value ? (int?)null : Convert.ToInt32(reader[name]);
        }

        public void SetRepeatStatus(int year, int month, int? g1, int? g2, int? g3, int? g4, bool completed)
        {
            using (var conn = new SqlConnection(_connString))
            using (var cmd = new SqlCommand("sp_SetRepeatStatus", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Year", year);
                cmd.Parameters.AddWithValue("@Month", month);
                cmd.Parameters.AddWithValue("@G1", (object)g1 ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@G2", (object)g2 ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@G3", (object)g3 ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@G4", (object)g4 ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@Completed", completed);
                conn.Open();
                cmd.ExecuteNonQuery();
            }
        }

        private static bool NullableEquals(int? left, int? right)
        {
            return left.GetValueOrDefault() == right.GetValueOrDefault() && left.HasValue == right.HasValue;
        }
    }
}