using HBManager.Service;
using System;
using System.Web.Mvc;

namespace HBManager.Controllers
{
    [HBManager.Filters.ValidateAntiForgeryTokenHeader]
    public class UpdateDateTimeController : Controller
    {
        private readonly IUpdateDateTimeService _service;

        public UpdateDateTimeController(IUpdateDateTimeService updateDateTimeService)
        {
            _service = updateDateTimeService ?? throw new ArgumentNullException(nameof(updateDateTimeService));
        }

        public ActionResult Index()
        {
            return View("~/Views/UpdateDatetime/Index.cshtml");
        }

        [HttpGet]
        public JsonResult GetBudgetData(int month, int year)
        {
            try
            {
                var data = _service.GetBudgetDataByMonthYear(month, year);
                return Json(new { Success = true, Data = data }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { Success = false, Message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult UpdateBudgetDate(int id, DateTime spendDate)
        {
            var success = _service.UpdateBudgetDate(id, spendDate);
            return Json(new { Success = success });
        }
    }
}
