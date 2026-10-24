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
