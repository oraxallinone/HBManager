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
        private readonly ILoginService _loginService;

        public LoginController(ILoginService loginService)
        {
            _loginService = loginService ?? throw new ArgumentNullException(nameof(loginService));
        }

        public ActionResult LoginIndex()
        {
            Response.Cache.SetCacheability(HttpCacheability.NoCache);
            Response.Cache.SetNoStore();
            Response.Cache.SetExpires(DateTime.UtcNow.AddDays(-1));
            Response.Cache.SetRevalidation(HttpCacheRevalidation.AllCaches);
            return View();
        }

        [HttpPost]
        public JsonResult CheckLogin(string email, string password, bool rememberMe)
        {
            var result = _loginService.CheckLogin(email, password);
            if (result != null)
            {
                string redirectUrl = null;
                if (result.UserType == 9)
                {
                    redirectUrl = Url.Action("BudgetVerification", "Budget");
                }
                else if (result.UserType == 1 || result.UserType == 2)
                {
                    redirectUrl = Url.Action("Index", "Product", new { area = "GstBill" });
                }

                if (redirectUrl != null)
                {
                    Session.Timeout = 20;
                    Session[HBManager.Filters.RequireLoginSessionAttribute.SessionKey] = result.UserType;
                    return Json(new { success = true, redirectUrl = redirectUrl });
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