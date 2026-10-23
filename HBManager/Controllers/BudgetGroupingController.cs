using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using HBManager.Models;
using HBManager.Service;

namespace HBManager.Controllers
{
    public class BudgetGroupingController : Controller
    {
        private readonly GroupMappingService _mappingService = new GroupMappingService();

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
            if (model != null)
            {
                model.MappingGroup = (model.MappingGroup ?? string.Empty).Trim().ToLowerInvariant();
            }

            if (model == null || !new[] { "g1", "g2", "g3", "g4" }.Contains(model.MappingGroup) ||
                model.G1Id < 0 || model.G2Id < 0 || model.G3Id < 0 || model.G4Id < 0)
            {
                return Json(new { Success = false, Message = "Enter a valid mapping combination." });
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