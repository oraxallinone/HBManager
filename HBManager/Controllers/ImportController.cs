using HBManager.Models;
using HBManager.Service;
using System;
using System.Collections.Generic;
using System.Web.Mvc;

namespace HBManager.Controllers
{
    [HBManager.Filters.ValidateAntiForgeryTokenHeader]
    public class ImportController : Controller
    {
        private readonly IImportService _importService;

        public ImportController(IImportService importService)
        {
            _importService = importService ?? throw new ArgumentNullException(nameof(importService));
        }

        [HttpGet]
        public ActionResult ImportInitiate()
        {
            return View();
        }

        [HttpGet]
        public ActionResult ErrorLogs()
        {
            return View();
        }

        [HttpGet]
        public JsonResult GetErrorLogs()
        {
            try
            {
                var logContent = _importService.ReadAllErrorLogs();
                return Json(new { success = true, logs = logContent }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public JsonResult ClearErrorLogs()
        {
            try
            {
                _importService.ClearAllErrorLogs();
                return Json(new { success = true, message = "Logs cleared successfully." });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public JsonResult TestException()
        {
            try
            {
                _importService.WriteTestErrorLog();
                return Json(new { success = true, message = "Test exception was written to the log file." });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public JsonResult LogClientError(string controllerName, string actionName, string message, string details)
        {
            try
            {
                _importService.LogClientError(controllerName, actionName, message, details);
                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        public JsonResult GetBudgetData(int year, int month, string bankName = null)
        {
            return Json(_importService.GetBudgetData(year, month, bankName), JsonRequestBehavior.AllowGet);
        }

        [HttpGet]
        public JsonResult GetBankNames(int year, int month)
        {
            return Json(_importService.GetBankNames(year, month), JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        public JsonResult MoveData(List<RowStatusItem> items)
        {
            return Json(_importService.MoveData(items));
        }

        [HttpPost]
        public JsonResult RevertTransfer(int id)
        {
            return Json(_importService.RevertTransfer(id));
        }

        [HttpPost]
        public JsonResult UpdateDetails(int id, string details)
        {
            return Json(_importService.UpdateDetails(id, details));
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public JsonResult ImportInitiate(string sqlScript)
        {
            return Json(_importService.ImportInitiate(sqlScript));
        }

        [HttpPost]
        public JsonResult DeleteBudgetInitiate(int id)
        {
            return Json(_importService.DeleteBudgetInitiate(id));
        }
    }
}
