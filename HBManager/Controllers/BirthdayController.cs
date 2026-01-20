using HBManager.Service;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace HBManager.Controllers
{
    public class BirthdayController : Controller
    {
        private readonly BirthdayService _birthdayService = new BirthdayService();

        public ActionResult Index()
        {
            ViewBag.Title = "Birthdays";
            return View();
        }


        [HttpPost]
        public JsonResult AddBirthday(string name, string dateOfBirth, bool isActive = true)
        {
            try
            {
                // validate
                if (string.IsNullOrWhiteSpace(name)) return Json(new { success = false, message = "Name is required" });
                DateTime dob;
                if (!DateTime.TryParse(dateOfBirth, out dob)) return Json(new { success = false, message = "Invalid DateOfBirth" });

                // call service
                var id = _birthdayService.AddBirthday(name.Trim(), dob.Date, isActive);
                if (id > 0) return Json(new { success = true, id = id });
                return Json(new { success = false, message = "Could not insert (possible duplicate)" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        public JsonResult GetAll()
        {
            try
            {
                var list = _birthdayService.GetAllBirthdays();
                return Json(list, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { error = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        public JsonResult GetByMonth(int year, int month)
        {
            try
            {
                var list = _birthdayService.GetBirthdaysByMonth(year, month);
                return Json(list, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { error = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult UpdateBirthday(int id, string name, string dateOfBirth, bool isActive = true)
        {
            try
            {
                if (id <= 0) return Json(new { success = false, message = "Invalid id" });
                if (string.IsNullOrWhiteSpace(name)) return Json(new { success = false, message = "Name required" });
                DateTime dob;
                if (!DateTime.TryParse(dateOfBirth, out dob)) return Json(new { success = false, message = "Invalid DateOfBirth" });

                var ok = _birthdayService.UpdateBirthday(id, name.Trim(), dob.Date, isActive);
                return Json(new { success = ok });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public JsonResult DeleteBirthday(int id)
        {
            try
            {
                if (id <= 0) return Json(new { success = false, message = "Invalid id" });
                var ok = _birthdayService.DeleteBirthday(id);
                return Json(new { success = ok });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        public ActionResult BirthdayIndex()
        {
            ViewBag.Title = "BirthdayIndex";
            return View();
        }
        public ActionResult ShowBirthday()
        {
            ViewBag.Title = "ShowBirthday";
            return View();
        }
    }
}