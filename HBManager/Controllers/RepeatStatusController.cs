using HBManager.Service;
using System;
using System.Linq;
using System.Web.Mvc;

namespace HBManager.Controllers
{
    public class RepeatStatusController : Controller
    {
        private readonly RepeatStatusService _service = new RepeatStatusService();

        public ActionResult RepeatStatus()
        {
            return View();
        }

        [HttpGet]
        public JsonResult GetRepeatStatus()
        {
            var result = _service.GetRepeatStatus();
            return Json(new
            {
                columns = result.Columns,
                rows = result.Rows.Select(row => new { row.G1Id, row.G1Name, row.G2Id, row.G2Name, row.G3Id, row.G3Name, row.G4Id, row.G4Name, amounts = row.Amounts, completed = row.CompletedColumns })
            }, JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        public JsonResult SetRepeatStatus(int year, int month, int? g1, int? g2, int? g3, int? g4, bool completed)
        {
            _service.SetRepeatStatus(year, month, g1, g2, g3, g4, completed);
            return Json(new { success = true });
        }
    }
}