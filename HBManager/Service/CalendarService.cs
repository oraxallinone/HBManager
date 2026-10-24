using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Configuration;
using HBManager.Models;

namespace HBManager.Service
{
    public class CalendarService : ICalendarService
    {
        public object GetDataForCalender(CalenderBudgetModelIn data)
        {
            IEnumerable<CalenderDateViewModel> calendarDates = Enumerable.Empty<CalenderDateViewModel>();
            IEnumerable<CalenderDataViewModel> calendarData = Enumerable.Empty<CalenderDataViewModel>();
            var connectionString = ConfigurationManager.ConnectionStrings["ConnectionString"].ToString();

            using (var connection = new SqlConnection(connectionString))
            using (var command = new SqlCommand("sp_getExpensiveByCalender", connection))
            {
                command.CommandType = CommandType.StoredProcedure;
                command.Parameters.AddWithValue("@month", data.forMonth);
                command.Parameters.AddWithValue("@year", data.forYear);
                command.Parameters.AddWithValue("@g1", data.g1 == 0 ? null : (object)data.g1);
                command.Parameters.AddWithValue("@g2", data.g2 == 0 ? null : (object)data.g2);
                command.Parameters.AddWithValue("@g3", data.g3 == 0 ? null : (object)data.g3);
                command.Parameters.AddWithValue("@g4", data.g4 == 0 ? null : (object)data.g4);

                var adapter = new SqlDataAdapter(command);
                var dataSet = new DataSet();
                if (connection.State == ConnectionState.Closed)
                    connection.Open();
                adapter.Fill(dataSet);
                connection.Close();

                if (dataSet.Tables.Count > 0 && dataSet.Tables[0].Rows.Count > 0)
                    calendarDates = ConvertDataTableToCalendarDates(dataSet.Tables[0]);
                if (dataSet.Tables.Count > 1 && dataSet.Tables[1].Rows.Count > 0)
                    calendarData = ConvertDataTableToCalendarData(dataSet.Tables[1]);
            }

            return new { calenderData = calendarData, calenderDate = calendarDates };
        }

        private static IEnumerable<CalenderDateViewModel> ConvertDataTableToCalendarDates(DataTable dataTable)
        {
            return dataTable.AsEnumerable().Select(row => new CalenderDateViewModel
            {
                fromDate = row["FromData"].ToString(),
                toDate = row["ToDate"].ToString()
            }).ToList();
        }

        private static IEnumerable<CalenderDataViewModel> ConvertDataTableToCalendarData(DataTable dataTable)
        {
            return dataTable.AsEnumerable().Select(row => new CalenderDataViewModel
            {
                spending = Convert.ToDecimal(row["spending"]),
                date = Convert.ToDateTime(row["date"]).ToString("yyyy-MM-dd")
            }).ToList();
        }
    }
}
