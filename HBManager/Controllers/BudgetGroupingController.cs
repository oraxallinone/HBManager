using System;
using System.Collections.Generic;
using System.Web;
using System.Web.Mvc;
using HBManager.Models;
using HBManager.Service;

namespace HBManager.Controllers
{
    [HBManager.Filters.ValidateAntiForgeryTokenHeader]
    public class BudgetGroupingController : Controller
    {
        private readonly IBudgetGroupingService _mappingService;

        public BudgetGroupingController(IBudgetGroupingService budgetGroupingService)
        {
            _mappingService = budgetGroupingService ?? throw new ArgumentNullException(nameof(budgetGroupingService));
        }

        public ActionResult BudgetGroupingIndex()
        {
            Response.Cache.SetCacheability(HttpCacheability.NoCache);
            Response.Cache.SetNoStore();
            return View();
        }

        [HttpGet]
        public JsonResult GetGroupMappingConfigurations()
        {
            return Json(_mappingService.GetAll(), JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        public JsonResult SaveGroupMappingConfiguration(GroupMappingConfiguration model)
        {
            var validationMessage = _mappingService.ValidateAndNormalize(model);
            if (validationMessage != null)
            {
                return Json(new { Success = false, Message = validationMessage });
            }

            var result = _mappingService.Save(model);
            if (result == -1)
            {
                return Json(new { Success = false, Duplicate = true, Message = "This combination already exists." });
            }

            return Json(new { Success = result > 0, Id = result });
        }

        [HttpPost]
        public JsonResult DeleteGroupMappingConfiguration(int id)
        {
            var result = _mappingService.Delete(id);
            return Json(new { Success = result > 0 });
        }
    }
}