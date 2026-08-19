using HBManager.Service;
using System;
using System.Web.Mvc;

namespace HBManager.Controllers
{
    public class UpdateDatetimeController : Controller
    {
        private readonly UpdateDatetimeService _svc = new UpdateDatetimeService();

        public ActionResult Index()
        {
            return View();
        }

        [HttpGet]
        public JsonResult GetBudgetData(int month, int year)
        {
            try
            {
                var data = _svc.GetBudgetDataByMonthYear(month, year);
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
            var success = _svc.UpdateBudgetDate(id, spendDate);
            return Json(new { Success = success });
        }
    }
}