using HBManager.Models;
using HBManager.Service;
using System;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace HBManager.Controllers
{
    [HBManager.Filters.ValidateAntiForgeryTokenHeader]
    public class CalendarController : Controller
    {
        private readonly ICalendarService _calendarService;

        public CalendarController(ICalendarService calendarService)
        {
            _calendarService = calendarService ?? throw new ArgumentNullException(nameof(calendarService));
        }

        public ActionResult CalenderIndex()
        {
            return View("~/Views/Calender/CalenderIndex.cshtml");
        }

        #region --------------------- calender ---------------------------
        [HttpPost]
        public ActionResult GetDataForCalender(CalenderBudgetModelIn data)
        {
            return Json(_calendarService.GetDataForCalender(data), JsonRequestBehavior.AllowGet);
        }
        #endregion -------------------------------------------------------
    }
}