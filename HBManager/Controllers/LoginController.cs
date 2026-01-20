using HBManager.Service;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace HBManager.Controllers
{
    public class LoginController : Controller
    {
        public ActionResult LoginIndex()
        {
            return View();
        }

        [HttpPost]
        public JsonResult CheckLogin(string email, string password, bool rememberMe)
        {
            var loginService = new LoginService();
            var result = loginService.CheckLogin(email, password);
            if (result != null)
            {
                // Set session or authentication here as needed
                if (result.UserType == 9)
                {
                    return Json(new { success = true, redirectUrl = Url.Action("Dashboard", "Default") });
                }
                else if (result.UserType == 1 || result.UserType == 2)
                {
                    return Json(new { success = true, redirectUrl = Url.Action("Index", "Product", new { area = "GstBill" }) });
                }
            }
            return Json(new { success = false, message = "Invalid credentials or inactive user." });
        }

        public ActionResult Logout()
        {
            // Clear Session
            Session.Clear();
            Session.Abandon();

            // Clear Authentication Cookie (if used)
            if (Request.Cookies[".ASPXAUTH"] != null)
            {
                HttpCookie authCookie = new HttpCookie(".ASPXAUTH");
                authCookie.Expires = DateTime.Now.AddDays(-1);
                Response.Cookies.Add(authCookie);
            }

            // Clear all cookies (optional but safe)
            foreach (string cookie in Request.Cookies.AllKeys)
            {
                Response.Cookies[cookie].Expires = DateTime.Now.AddDays(-1);
            }

            // Redirect to Login page
            return RedirectToAction("LoginIndex", "Login");
        }
    }
}