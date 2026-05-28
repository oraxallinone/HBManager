using System;
using System.Configuration;
using System.Data.SqlClient;
using System.Web.Mvc;
using HBManager.Models;

namespace HBManager.Controllers
{
    public class ImportController : Controller
    {
        public ActionResult ExecuteQuery()
        {
            return View(new QueryViewModel());
        }

        // POST: /Budget/ExecuteQuery
        // This runs when the user clicks the "Execute" button
        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult ExecuteQuery(QueryViewModel model)
        {
            // If the text area is empty, send them back
            if (!ModelState.IsValid)
            {
                return View(model);
            }

            // Get the connection string from web.config
            string connectionString = ConfigurationManager.ConnectionStrings["ConnectionString"].ConnectionString;

            try
            {
                using (SqlConnection con = new SqlConnection(connectionString))
                {
                    using (SqlCommand cmd = new SqlCommand(model.SqlQuery, con))
                    {
                        con.Open();

                        // ExecuteNonQuery returns the number of rows affected
                        int rowsAffected = cmd.ExecuteNonQuery();

                        model.IsSuccess = true;
                        model.Message = $"Success! {rowsAffected} row(s) inserted/updated.";
                    }
                }
            }
            catch (Exception ex)
            {
                model.IsSuccess = false;
                // In production, log the error rather than showing it directly to the user
                model.Message = "Database Error: " + ex.Message;
            }

            // Return the view with the message populated
            return View(model);
        }
    }
}