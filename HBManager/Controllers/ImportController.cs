using HBManager.Models;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Web.Mvc;

namespace YourProjectNamespace.Controllers
{
    public class ImportController : Controller
    {
        private readonly string connectionString = ConfigurationManager.ConnectionStrings["ConnectionString"].ConnectionString;

        [HttpGet]
        public ActionResult ImportInitiate()
        {
            return View();
        }

        // GET: /Import/GetBudgetData
        // Fetches all records to populate the jQuery grid
        [HttpGet]
        public JsonResult GetBudgetData(int year, int month)
        {
            var rows = new List<Dictionary<string, object>>();
            // CASE statement handles converting BIT/NULL into "Transfered", "Skiped", or blank string if unassigned
            string query = @"
                SELECT TOP 350 
                    Id, BankName, Year, Month, TransactionType, Amount, 
                    LOWER(FORMAT(TransactionDate, 'yyyy-MM-dd hh:mm tt')) AS TransactionDate, 
                    Details,
                    CASE 
                        WHEN IsTransfer = 1 THEN 'Transfered'
                        WHEN IsTransfer = 0 THEN 'Skiped'
                        ELSE ''
                    END AS IsTransferStatus
                FROM [dbo].[BudgetInitiate] 
                      WHERE [Year] = @Year
                      AND [Month] = @Month
                ORDER BY [TransactionDate], Id DESC";

                using (SqlConnection con = new SqlConnection(connectionString))
                {
                using (SqlCommand cmd = new SqlCommand(query, con))
                        {
                    cmd.Parameters.AddWithValue("@Year", year);
                    cmd.Parameters.AddWithValue("@Month", month);
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


        [HttpPost]
        public JsonResult MoveData(List<RowStatusItem> items)
        {
            if (items == null || items.Count == 0)
            {
                return Json(new { success = false, message = "No row assignments were selected to move." });
            }

            try
            {
                using (SqlConnection con = new SqlConnection(connectionString))
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

                //using (SqlConnection con = new SqlConnection(connectionString))
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
        public JsonResult RevertTransfer(int id)
        {
            if (id <= 0)
            {
                return Json(new { success = false, message = "Invalid record id for revert." });
            }

            try
            {
                using (SqlConnection con = new SqlConnection(connectionString))
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

        // Action to pull latest 50 records for the dynamic grid
        [HttpPost]
        [ValidateAntiForgeryToken]
        public JsonResult ImportInitiate(string sqlScript)
        {
            if (string.IsNullOrWhiteSpace(sqlScript))
            {
                return Json(new { success = false, message = "The input script cannot be empty." });
            }

            // 1. Clean up and extract only the raw data tuples
            string cleanScript = sqlScript.Trim();

            // If the user pasted the "INSERT INTO...VALUES" wrapper, strip it off
            if (cleanScript.ToUpper().Contains("VALUES"))
            {
                int valuesIndex = cleanScript.ToUpper().IndexOf("VALUES");
                // Jump past the word "VALUES"
                cleanScript = cleanScript.Substring(valuesIndex + 6).Trim();
            }

            // Remove any trailing semicolons or rogue spaces at the absolute end of the string
            cleanScript = cleanScript.TrimEnd(';', ' ', '\r', '\n');

            // Fix the specific syntax bug: if the string ends with a trailing comma after the last tuple ), 
            // remove it so SQL Server doesn't expect another row.
            if (cleanScript.EndsWith(","))
            {
                cleanScript = cleanScript.Substring(0, cleanScript.Length - 1).Trim();
            }

            // 2. Build the final executable SQL command safely
            string masterSqlQuery = $@"
        BEGIN TRANSACTION;
        BEGIN TRY
            -- Setup Staging Table structure
            DECLARE @StagingTable TABLE (
                [BankName] VARCHAR(150),
                [Year] INT,
                [Month] INT,
                [TransactionType] VARCHAR(20),
                [Amount] DECIMAL(18,2),
                [TransactionDate] DATETIME,
                [Details] NVARCHAR(MAX),
                [IsTransfer] BIT
            );

            -- Populate staging from the cleaned incoming values block
            INSERT INTO @StagingTable VALUES {cleanScript};

            DECLARE @TotalPasted INT = (SELECT COUNT(*) FROM @StagingTable);

            -- Filter out rows matching duplicate constraints
            DELETE S FROM @StagingTable S
            WHERE EXISTS (
                SELECT 1 FROM [dbo].[BudgetInitiate] B
                WHERE B.[TransactionType] = S.[TransactionType]
                  AND B.[Amount] = S.[Amount]
                  AND B.[TransactionDate] = S.[TransactionDate]
                  AND ISNULL(B.[Details], '') = ISNULL(S.[Details], '')
            );

            DECLARE @Inserted INT = 0;
            
            -- Insert valid unique rows
            INSERT INTO [dbo].[BudgetInitiate] 
            ([BankName], [Year], [Month], [TransactionType], [Amount], [TransactionDate], [Details], [IsTransfer])
            SELECT [BankName], [Year], [Month], [TransactionType], [Amount], [TransactionDate], [Details], [IsTransfer]
            FROM @StagingTable;

            SET @Inserted = @@ROWCOUNT;

            COMMIT TRANSACTION;

            -- Send back accurate analytical counts
            SELECT 
                @Inserted AS InsertedRows, 
                (@TotalPasted - @Inserted) AS DuplicateRows,
                0 AS ErrorRows;
        END TRY
        BEGIN CATCH
            IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
            
            SELECT 
                0 AS InsertedRows, 
                0 AS DuplicateRows,
                1 AS ErrorRows;
        END CATCH";

            try
            {
                int insertedCount = 0;
                int duplicateCount = 0;
                int errorCount = 0;

                using (SqlConnection con = new SqlConnection(connectionString))
                {
                    using (SqlCommand cmd = new SqlCommand(masterSqlQuery, con))
                    {
                        con.Open();
                        using (SqlDataReader rdr = cmd.ExecuteReader())
                        {
                            if (rdr.Read())
                            {
                                insertedCount = Convert.ToInt32(rdr["InsertedRows"]);
                                duplicateCount = Convert.ToInt32(rdr["DuplicateRows"]);
                                errorCount = Convert.ToInt32(rdr["ErrorRows"]);
                            }
                        }
                    }
                }

                if (errorCount > 0)
                {
                    return Json(new { success = false, message = "Database Error: SQL execution failed. Please verify the structural layout of your value data blocks." });
                }

                return Json(new
                {
                    success = true,
                    inserted = insertedCount,
                    duplicates = duplicateCount,
                    errors = errorCount,
                    message = $"Process complete. Inserted: {insertedCount} row(s). Duplicates skipped: {duplicateCount} row(s)."
                });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Execution Failure: " + ex.Message });
            }
        }



        [HttpPost]
        public JsonResult DeleteBudgetInitiate(int id)
        {
            try
            {
                using (SqlConnection con = new SqlConnection(connectionString))
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