using HBManager.Service;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace HBManager.Controllers
{
    [HBManager.Filters.ValidateAntiForgeryTokenHeader]
    public class BudgetOverviewController : Controller
    {
        private readonly IBudgetOverviewService _svc;

        public BudgetOverviewController(IBudgetOverviewService budgetOverviewService)
        {
            _svc = budgetOverviewService ?? throw new ArgumentNullException(nameof(budgetOverviewService));
        }

        public ActionResult GroupBudgetOverview()
        {
            //budget-overview
            //budgetOverview:js
            //GetBudgetOverview() js function
            //GroupBudgetOverview :action method
            //BudgetOverviewService.cs :service
            //GroupBudgetOverviewService

            //sp_GetGroupBudgetOverview month, year salary table get fromDate toDate
            return View();
        }

        // existing action: GroupBudgetOverview view (unchanged)

        [HttpGet]
        public JsonResult BudgetOverview(int year, int month)
        {
            var list = _svc.GetSumAsGroupService(year, month);
            return Json(list, JsonRequestBehavior.AllowGet);
        }
    }
}