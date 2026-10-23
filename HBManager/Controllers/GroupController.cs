using HBManager.Models;
using HBManager.Service;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace HBManager.Controllers
{
    public class GroupController : Controller
    {
        private readonly GroupService _svc = new GroupService();

        #region ---------------------- group ---------------------------
        [HttpGet]
        public ActionResult GroupIndex()
        {
            return View();
        }


        [HttpGet]
        public JsonResult GetGroup(string groupType)
        {
            var list = _svc.GetGroupMasterByGroupname(groupType);
            return Json(list, JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        [HBManager.Security.ValidateAntiForgeryTokenAttribute]
        public JsonResult AddGroup(GroupMaster model)
        {
            var newId = _svc.InsertGroupMaster(model);
            return Json(new { Success = true, Id = newId }, JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        [HBManager.Security.ValidateAntiForgeryTokenAttribute]
        public JsonResult UpdateGroup(GroupMaster model)
        {
            var result = _svc.UpdateGroupMasterByID(model);
            return Json(new { Success = result }, JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        [HBManager.Security.ValidateAntiForgeryTokenAttribute]
        public JsonResult DeleteGroup(int id)
        {
            var result = _svc.DeleteGroupMasterByID(id);
            return Json(new { Success = result }, JsonRequestBehavior.AllowGet);
        }


        [HttpGet]
        public JsonResult GroupById(int id)
        {
            var item = _svc.GetGroupMasterById(id);
            return Json(item, JsonRequestBehavior.AllowGet);
        }
        #endregion
    }
}