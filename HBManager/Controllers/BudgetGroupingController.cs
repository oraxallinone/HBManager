using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace HBManager.Controllers
{
    public class BudgetGroupingController : Controller
    {
        public ActionResult BudgetGroupingIndex()
        {
            Response.Cache.SetCacheability(HttpCacheability.NoCache);
            Response.Cache.SetNoStore();
            return View();
        }
    }
}