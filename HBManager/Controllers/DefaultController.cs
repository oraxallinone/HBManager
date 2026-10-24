using HBManager.Service;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Authentication;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using System.Data;
using System.Data.SqlClient;
using System.Configuration;

namespace HBManager.Controllers
{
    public class DefaultController : Controller
    {
        private readonly GraphService _graphService = new GraphService();
        private readonly DashboardService _dashboardService = new DashboardService();

        public ActionResult Dashboard()
        {
            return View();
        }

        public ActionResult BarChart()
        {
            return View();
        }
    }
}