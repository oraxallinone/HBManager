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
    [HBManager.Filters.ValidateAntiForgeryTokenHeader]
    public class DefaultController : Controller
    {
        private readonly IDefaultService _defaultService;

        public DefaultController(IDefaultService defaultService)
        {
            _defaultService = defaultService ?? throw new ArgumentNullException(nameof(defaultService));
        }

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