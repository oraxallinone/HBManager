using HBManager.Service;
using System;
using System.Web.Mvc;

namespace HBManager.Controllers
{
    public class DefaultController : Controller
    {
        private readonly GraphService _graphService = new GraphService();
        private readonly DashboardService _dashboardService = new DashboardService();

        [HttpGet]
        public ActionResult Dashboard()
        {
            return View();
        }

        [HttpGet]
        public ActionResult BarChart()
        {
            return View();
        }

        [HttpGet]
        public JsonResult GetBarGraphByGroup(int? g1, int? g2, int? g3, int? g4)
        {
            try
            {
                var result = _graphService.GetBarGraphByGroupService(g1, g2, g3, g4);
                return Json(result, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { error = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpGet]
        public JsonResult GetCurrentMonthSalaryDetails(int year, int month)
        {
            try
            {
                var data = _dashboardService.GetCurrentMonthSalaryDetails(year, month);
                return Json(data, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { error = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }
    }
}
