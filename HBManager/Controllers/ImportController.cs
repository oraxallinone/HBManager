using HBManager.Models;
using HBManager.Service;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.IO;
using System.Web.Mvc;

namespace YourProjectNamespace.Controllers
{
    public class ImportController : Controller
    {

        [HttpGet]
        public ActionResult ImportInitiate()
        {
            return View();
        }

        // GET: /Import/GetBudgetData
        // Fetches all records to populate the jQuery grid
        [HttpGet]
        public JsonResult GetBudgetData(int year, int month, string bankName = null)
        {
            var rows = new List<Dictionary<string, object>>();

                using (SqlConnection con = SqlConnectionFactory.CreateConnection())
                {
                using (SqlCommand cmd = new SqlCommand("dbo.GetBudgetInitiateBySalaryMonth", con))
                        {
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("@Year", year);
                    cmd.Parameters.AddWithValue("@Month", month);
                    cmd.Parameters.Add("@BankName", SqlDbType.VarChar, 150).Value = bankName ?? string.Empty;
                    con.Open();
                        using (SqlDataReader reader = cmd.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                var row = new Dictionary<string, object>();
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    row[reader.GetName(i)] = reader.GetValue(i);
                                }
                                rows.Add(row);
                            }
                        }
                    }
                }
                return Json(rows, JsonRequestBehavior.AllowGet);
            }

        [HttpGet]
        public JsonResult GetBankNames(int year, int month)
        {
            var bankNames = new List<string>();
            const string query = @"
                SELECT DISTINCT bi.[BankName]
                                FROM [dbo].[BudgetInitiate] bi
                                INNER JOIN [dbo].[SalaryMaster] sm
                                        ON sm.YearName = @Year
                                        AND sm.MonthName = @Month
                                WHERE bi.TransactionDate >= CAST(sm.FromData AS DATE)
                                    AND bi.TransactionDate < DATEADD(DAY, 1, CAST(sm.ToDate AS DATE))
                                    AND NULLIF(LTRIM(RTRIM(bi.[BankName])), '') IS NOT NULL
                                ORDER BY bi.[BankName]";

            using (SqlConnection con = SqlConnectionFactory.CreateConnection())
            using (SqlCommand cmd = new SqlCommand(query, con))
            {
                cmd.Parameters.AddWithValue("@Year", year);
                cmd.Parameters.AddWithValue("@Month", month);
                con.Open();

                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        bankNames.Add(reader.GetString(0).Trim());
                    }
                }
            }

            return Json(bankNames, JsonRequestBehavior.AllowGet);
        }


        [HttpPost]
        [HBManager.Security.ValidateAntiForgeryTokenAttribute]
        public JsonResult MoveData(List<RowStatusItem> items)
        {
            if (items == null || items.Count == 0)
            {
                return Json(new { success = false, message = "No row assignments were selected to move." });
            }

            try
            {
                using (SqlConnection con = SqlConnectionFactory.CreateConnection())
                {
                    con.Open();

                    // We set up the command pointing to the stored procedure outside the loop
                    using (SqlCommand cmd = new SqlCommand("dbo.usp_moveInitiateToBudget", con))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;

                        // Define parameters once
                        cmd.Parameters.Add("@Id", SqlDbType.Int);
                        cmd.Parameters.Add("@Status", SqlDbType.VarChar, 10);

                        foreach (var item in items)
                        {
                            // Update parameter values for the current item
                            cmd.Parameters["@Id"].Value = item.Id;
                            cmd.Parameters["@Status"].Value = item.Status;

                            // Execute the procedure
                            cmd.ExecuteNonQuery();
                        }
                    }
                }

                //using (SqlConnection con = SqlConnectionFactory.CreateConnection())
                //{
                //    con.Open();
                //    using (SqlTransaction trans = con.BeginTransaction())
                //    {
                //        // Query 1: Updates staging status
                //        string updateQuery = @"
                //    UPDATE [dbo].[BudgetInitiate]
                //    SET [IsTransfer] = @IsTransfer
                //    WHERE [Id] = @Id";

                //        // Query 2: Migrates 'trans' rows into the main Budget destination table
                //        string migrateQuery = @"
                //    INSERT INTO [dbo].[Budget] 
                //    ([Year], [Month], [SpendDate], [Amount], [Details], [G1], [G2], [G3], [G4], [CreatedTime], [IsVerified],[BankName], [ReferenceId])
                //    SELECT 
                //        [Year], 
                //        [Month], 
                //        [TransactionDate] AS [SpendDate], 
                //        [Amount], 
                //        [Details], 
                //        NULL AS [G1], 
                //        NULL AS [G2], 
                //        NULL AS [G3], 
                //        NULL AS [G4], 
                //        GETDATE() AS [CreatedTime], 
                //        0 AS [IsVerified],
                //        [BankName],
                //        [Id]
                //    FROM [dbo].[BudgetInitiate]
                //    WHERE [Id] = @Id";

                //        foreach (var item in items)
                //        {
                //            // Execute Query 1: Update Status
                //            using (SqlCommand cmd = new SqlCommand(updateQuery, con, trans))
                //            {
                //                cmd.Parameters.AddWithValue("@Id", item.Id);

                //                if (item.Status == "trans")
                //                {
                //                    cmd.Parameters.AddWithValue("@IsTransfer", 1);
                //                }
                //                else // "skip"
                //                {
                //                    cmd.Parameters.AddWithValue("@IsTransfer", DBNull.Value);
                //                }

                //                cmd.ExecuteNonQuery();
                //            }

                //            // Execute Query 2: Cross-Table Insert (Only if selected state is 'trans')
                //            if (item.Status == "trans")
                //            {
                //                using (SqlCommand migrateCmd = new SqlCommand(migrateQuery, con, trans))
                //                {
                //                    migrateCmd.Parameters.AddWithValue("@Id", item.Id);
                //                    migrateCmd.ExecuteNonQuery();
                //                }
                //            }
                //        }
                //        trans.Commit();
                //    }
                //}
                return Json(new { success = true, message = "Successfully updated statuses and transferred records to the Budget database!" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Error handling data transfer migration: " + ex.Message });
            }
        }

        [HttpPost]
        [HBManager.Security.ValidateAntiForgeryTokenAttribute]
        public JsonResult RevertTransfer(int id)
        {
            if (id <= 0)
            {
                return Json(new { success = false, message = "Invalid record id for revert." });
            }

            try
            {
                using (SqlConnection con = SqlConnectionFactory.CreateConnection())
                {
                    con.Open();
                    string revertQuery = @" UPDATE [dbo].[BudgetInitiate] SET [IsTransfer] = NULL WHERE [Id] = @Id";

                    using (SqlCommand cmd = new SqlCommand(revertQuery, con))
                    {
                        cmd.Parameters.AddWithValue("@Id", id);
                        cmd.ExecuteNonQuery();
                    }
                }

                return Json(new { success = true, message = "Record reverted successfully." });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Error reverting record: " + ex.Message });
            }
        }

        [HttpPost]
        [HBManager.Security.ValidateAntiForgeryTokenAttribute]
        public JsonResult UpdateDetails(int id, string details)
        {
            if (id <= 0)
            {
                return Json(new { success = false, message = "Invalid record id." });
            }

            try
            {
                using (SqlConnection con = SqlConnectionFactory.CreateConnection())
                using (SqlCommand cmd = new SqlCommand(@"
                    UPDATE [dbo].[BudgetInitiate]
                    SET [Details] = @Details
                    WHERE [Id] = @Id", con))
                {
                    cmd.Parameters.Add("@Details", SqlDbType.NVarChar, -1).Value = (object)(details ?? string.Empty);
                    cmd.Parameters.Add("@Id", SqlDbType.Int).Value = id;
                    con.Open();

                    if (cmd.ExecuteNonQuery() == 0)
                    {
                        return Json(new { success = false, message = "Record was not found." });
                    }
                }

                return Json(new { success = true, message = "Details updated successfully." });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Error updating details: " + ex.Message });
            }
        }

        [HttpPost]
        [HBManager.Security.ValidateAntiForgeryTokenAttribute]
        public JsonResult ImportCsv()
        {
            try
            {
                if (Request.ContentLength > 3 * 1024 * 1024)
                {
                    return Json(new { success = false, message = "The CSV input exceeds the 3 MB limit." });
                }

                string csvData;
                using (var reader = new StreamReader(Request.InputStream, Request.ContentEncoding, true))
                {
                    csvData = reader.ReadToEnd();
                }

                var result = new BudgetImportService().ImportCsv(csvData);
                return Json(new
                {
                    success = true,
                    inserted = result.Inserted,
                    duplicates = result.Duplicates,
                    errors = 0,
                    message = $"Process complete. Inserted: {result.Inserted} row(s). Duplicates skipped: {result.Duplicates} row(s)."
                });
            }
            catch (FormatException ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
            catch (SqlException ex)
            {
                return Json(new { success = false, message = "Database import failed: " + ex.Message });
            }
        }

        [HttpPost]
        [HBManager.Security.ValidateAntiForgeryTokenAttribute]
        public JsonResult DeleteBudgetInitiate(int id)
        {
            try
            {
                using (SqlConnection con = SqlConnectionFactory.CreateConnection())
                {
                    con.Open();

                    // Check if already transferred
                    string checkQuery = "SELECT IsTransfer FROM BudgetInitiate WHERE Id=@Id";

                    using (SqlCommand cmd = new SqlCommand(checkQuery, con))
                    {
                        cmd.Parameters.AddWithValue("@Id", id);

                        object result = cmd.ExecuteScalar();

                        if (result != DBNull.Value && Convert.ToBoolean(result))
                        {
                            return Json(new
                            {
                                success = false,
                                message = "Can't be deleted as it has already been transferred."
                            });
                        }
                    }

                    // Delete
                    string deleteQuery = "DELETE FROM BudgetInitiate WHERE Id=@Id";

                    using (SqlCommand cmd = new SqlCommand(deleteQuery, con))
                    {
                        cmd.Parameters.AddWithValue("@Id", id);
                        cmd.ExecuteNonQuery();
                    }

                    return Json(new
                    {
                        success = true
                    });
                }
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }


    }

}