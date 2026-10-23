using HBManager.Models;
using HBManager.Service;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace HBManager.Controllers
{
    public class CalendarController : Controller
    {
        [HttpGet]
        public ActionResult Index()
        {
            return View();
        }

        #region --------------------- calendar ---------------------------
        [HttpGet]
        public ActionResult GetDataForCalendar(CalendarBudgetModelIn data)
        {
            IEnumerable<CalendarDateViewModel> calendarDates = Enumerable.Empty<CalendarDateViewModel>();
            IEnumerable<CalendarDataViewModel> calendarData = Enumerable.Empty<CalendarDataViewModel>();
            using (SqlConnection con = SqlConnectionFactory.CreateConnection())
            {
                using (SqlCommand cmd = new SqlCommand("sp_getExpensiveByCalender", con))
                {
                    cmd.CommandType = CommandType.StoredProcedure;

                    cmd.Parameters.AddWithValue("@month", data.forMonth);
                    cmd.Parameters.AddWithValue("@year", data.forYear);
                    cmd.Parameters.AddWithValue("@g1", (data.g1 == 0) ? null : data.g1);
                    cmd.Parameters.AddWithValue("@g2", (data.g2 == 0) ? null : data.g2);
                    cmd.Parameters.AddWithValue("@g3", (data.g3 == 0) ? null : data.g3);
                    cmd.Parameters.AddWithValue("@g4", (data.g4 == 0) ? null : data.g4);

                    SqlDataAdapter da = new SqlDataAdapter(cmd);
                    DataSet ds = new DataSet();

                    if (con.State == ConnectionState.Closed) { con.Open(); }
                    da.Fill(ds);
                    con.Close();

                    if (ds != null && ds.Tables.Count > 0 && ds.Tables[0].Rows.Count > 0)
                    {
                        calendarDates = ConvertDataTableToCalendarDate(ds.Tables[0]);
                    }

                    if (ds != null && ds.Tables.Count > 1 && ds.Tables[1].Rows.Count > 0)
                    {
                        calendarData = ConvertDataTableToListCalendar(ds.Tables[1]);
                    }
                }
            }
            var result = new { calendarData, calendarDate = calendarDates };
            return Json(result, JsonRequestBehavior.AllowGet);
        }
        private IEnumerable<CalendarDateViewModel> ConvertDataTableToCalendarDate(DataTable dataTable)
        {
            return dataTable.AsEnumerable().Select(row => new CalendarDateViewModel
            {
                fromDate = row["FromData"].ToString(),
                toDate = row["ToDate"].ToString()
            }).ToList();
        }

        private IEnumerable<CalendarDataViewModel> ConvertDataTableToListCalendar(DataTable dataTable)
        {
            return dataTable.AsEnumerable().Select(row => new CalendarDataViewModel
            {
                spending = Convert.ToDecimal(row["spending"]),
                date = Convert.ToDateTime(row["date"]).ToString("yyyy-MM-dd")
            }).ToList();
        }
        #endregion -------------------------------------------------------
    }
}