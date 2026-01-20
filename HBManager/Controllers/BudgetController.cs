using HBManager.Models;
using HBManager.Service;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace HBManager.Controllers
{
    public class BudgetController : Controller
    {
        private readonly BudgetService _svc = new BudgetService();

        public ActionResult BudgetIndex()
        {
            return View();
        }

        [HttpGet]
        public JsonResult GetAllBudgetFromTo(int year, int month)
        {
            var list = _svc.GetBudgetByFromToDate(year, month);
            return Json(list, JsonRequestBehavior.AllowGet);
        }

        [HttpGet]
        public JsonResult GetAllBudgetFromToWithGroup(int year, int month, int g1, int g2, int g3, int g4)
        {
            var list = _svc.GetBudgetByFromToDateWithGroup(year, month, g1, g2, g3, g4);
            return Json(list, JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        public JsonResult InsertBudget(Budget model)
        {
            var rowIffected = _svc.InsertBudget(model);
            return Json(rowIffected);
        }

        [HttpPost]
        public JsonResult UpdateBudgetById(Budget model)
        {
            var rowIffected = _svc.UpdateBudgetById(model);
            return Json(rowIffected);
        }

        [HttpPost]
        public JsonResult DeleteBudgetById(int id)
        {
            var ok = _svc.DeleteBudgetById(id);
            return Json(new { Success = ok });
        }

        [HttpGet]
        public JsonResult GetBudgetById(int id)
        {
            var item = _svc.GetBudgetById(id);
            return Json(item, JsonRequestBehavior.AllowGet);
        }

        [HttpGet]
        public JsonResult Get4Group()
        {
            var result = _svc.GetAll4Group();
            return Json(result, JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        public JsonResult UpdateBudgetGroups(List<int> budgetIds, int? g1, int? g2, int? g3, int? g4)
        {
            // Convert null to 0 if default option was selected, or keep null if value was selected
            int? g1Val = (g1.HasValue && g1.Value > 0) ? g1 : (int?)null;
            int? g2Val = (g2.HasValue && g2.Value > 0) ? g2 : (int?)null;
            int? g3Val = (g3.HasValue && g3.Value > 0) ? g3 : (int?)null;
            int? g4Val = (g4.HasValue && g4.Value > 0) ? g4 : (int?)null;

            var rowIffected = _svc.UpdateBudgetGroupsByIds(budgetIds, g1Val, g2Val, g3Val, g4Val);
            return Json(rowIffected);
        }

        [HttpGet]
        public JsonResult GetGroupMasterUncut()
        {
            var list = _svc.GetGroupMasterUncutService();
            return Json(list, JsonRequestBehavior.AllowGet);
        }
    }
}