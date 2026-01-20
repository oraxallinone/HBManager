using HBManager.Models;
using HBManager.Service;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace HBManager.Controllers
{
    public class SalaryController : Controller
    {
        private readonly SalaryService _svc = new SalaryService();

        public ActionResult SalaryIndex()
        {
            return View();
        }

        [HttpGet]
        public JsonResult GetAllSalary()
        {
            var list = _svc.GetAllSalaryMaster();
            return Json(list, JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        public JsonResult InsertSalary(SalaryMaster model)
        {
            var id = _svc.InsertSalaryMaster(model);
            return Json(new { Success = id > 0, Id = id });
        }

        [HttpPost]
        public JsonResult UpdateSalaryById(SalaryMaster model)
        {
            var ok = _svc.UpdateSalaryMasterById(model);
            return Json(new { Success = ok });
        }

        [HttpPost]
        public JsonResult DeleteSalaryById(int id)
        {
            var ok = _svc.DeleteSalaryMasterById(id);
            return Json(new { Success = ok });
        }

        [HttpGet]
        public JsonResult GetSalaryById(int id)
        {
            var item = _svc.GetSalaryMasterById(id);
            return Json(item, JsonRequestBehavior.AllowGet);
        }

        [HttpGet]
        public JsonResult GetSalaryByMonthYear(int monthName, int yearName)
        {
            var list = _svc.GetSalaryByMonthYearService(monthName, yearName);
            return Json(list, JsonRequestBehavior.AllowGet);
        }
    }
}