

using HBManager.Models;
using HBManager.Service;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace HBManager.Controllers
{
    public class BudgetController : Controller
    {
        private readonly BudgetService _svc = new BudgetService();

        // Mobile-friendly budget index view
        public ActionResult BudgeMobileIndex()
        {
            return View();
        }

        public ActionResult BudgetIndex()
        {
            Response.Cache.SetCacheability(HttpCacheability.NoCache);
            Response.Cache.SetNoStore();
            return View();
        }

        public ActionResult BudgetVerification()
        {
            return View();
        }

        [HttpGet]
        public JsonResult GetBudgetVerificationData(int year, int month)
        {
            var data = _svc.GetBudgetVerificationData(year, month);
            var response = new
            {
                data.TotalIn,
                data.TotalOut,
                data.TotalNow,
                InList = data.InList.Select(item => new
                {
                    item.IdIn,
                    DateIn = item.DateIn.HasValue
                        ? item.DateIn.Value.ToString("yyyy-MM-dd h:mm tt", CultureInfo.InvariantCulture)
                        : null,
                    item.AmountIn,
                    item.DetailsIn,
                    item.YearIn,
                    item.MonthIn
                }).ToList(),
                OutList = data.OutList,
                NowList = data.NowList.Select(item => new
                {
                    item.IdNow,
                    item.AmountNow,
                    item.DetailsNow,
                    DateNow = item.DateNow.HasValue
                        ? item.DateNow.Value.ToString("yyyy-MM-dd h:mm tt", CultureInfo.InvariantCulture)
                        : null,
                    item.YearNow,
                    item.MonthNow
                }).ToList()
            };

            return Json(response, JsonRequestBehavior.AllowGet);
        }


        [HttpGet]
        public JsonResult GetAllBudgetFromTo(int year, int month)
        {
            var list = _svc.GetBudgetByFromToDate(year, month);
            list.ForEach(item => item.SpendDateText = item.SpendDate.HasValue ? item.SpendDate.Value.ToString("yyyy-MM-dd HH:mm:ss.fff") : null);
            return Json(list, JsonRequestBehavior.AllowGet);
        }

        [HttpGet]
        public JsonResult GetAllBudgetFromToWithGroup(int year, int month, int g1, int g2, int g3, int g4, bool isAll, string searchText)
        {
            var list = _svc.GetBudgetByFromToDateWithGroup(year, month, g1, g2, g3, g4, isAll, searchText);
            list.ForEach(item => item.SpendDateText = item.SpendDate.HasValue ? item.SpendDate.Value.ToString("yyyy-MM-dd HH:mm:ss.fff") : null);
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
        public JsonResult UpdateBankName(int id, string bankName)
        {
            var rowsAffected = _svc.UpdateBankName(id, bankName);
            return Json(new { Success = rowsAffected > 0 });
        }

        [HttpPost]
        public JsonResult DeleteBudgetById(int id)
        {
            var ok = _svc.DeleteBudgetById(id);
            return Json(new { Success = ok });
        }

        [HttpPost]
        public JsonResult MoveBudgetToMonthIn(MoveBudgetToMonthInModel model)
        {
            var rows = _svc.MoveBudgetToMonthIn(model);
            return Json(new { Success = rows > 0 });
        }

        [HttpGet]
        public JsonResult GetWasteTrackerByBudgetMonth(int year, int month)
        {
            return Json(_svc.GetWasteTrackerByBudgetMonth(year, month), JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        public JsonResult InsertWasteTracker(WasteTracker model)
        {
            return Json(new { Id = _svc.InsertWasteTracker(model) });
        }

        [HttpPost]
        public JsonResult UpdateWasteTracker(WasteTracker model)
        {
            return Json(new { Rows = _svc.UpdateWasteTracker(model) });
        }

        [HttpPost]
        public JsonResult DeleteWasteTracker(int id)
        {
            return Json(new { Rows = _svc.DeleteWasteTracker(id) });
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

        [HttpPost]
        public JsonResult InsertBudgetVerificationIn(BudgetVerificationInModel model)
        {
            var id = _svc.InsertBudgetVerificationIn(model);
            return Json(new { Id = id });
        }

        [HttpPost]
        public JsonResult UpdateBudgetVerificationIn(BudgetVerificationInModel model)
        {
            var rows = _svc.UpdateBudgetVerificationIn(model);
            return Json(new { Rows = rows });
        }

        [HttpPost]
        public JsonResult InsertBudgetVerificationNow(BudgetVerificationNowModel model)
        {
            var id = _svc.InsertBudgetVerificationNow(model);
            return Json(new { Id = id });
        }

        [HttpPost]
        public JsonResult UpdateBudgetVerificationNow(BudgetVerificationNowModel model)
        {
            var rows = _svc.UpdateBudgetVerificationNow(model);
            return Json(new { Rows = rows });
        }

        [HttpPost]
        public JsonResult DeleteBudgetVerificationIn(int idIn)
        {
            var rows = _svc.DeleteBudgetVerificationIn(idIn);
            return Json(new { Rows = rows });
        }

        [HttpPost]
        public JsonResult DeleteBudgetVerificationNow(int idNow)
        {
            var rows = _svc.DeleteBudgetVerificationNow(idNow);
            return Json(new { Rows = rows });
        }
        [HttpPost]
        public JsonResult UpdateText(int id, string details)
        {
            var ok = _svc.UpdateText(id, details);
            return Json(new { Success = ok });
        }

        [HttpPost]
        public JsonResult UpdateBudgetVerificationById(Budget model)
        {
            var rowIffected = _svc.UpdateBudgetVerificationById(model);
            return Json(rowIffected);
        }
    }
}