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
        private readonly IDefaultService _defaultService;
        private readonly GraphService _graphService;

        public DefaultController(IDefaultService defaultService, GraphService graphService)
        {
            _defaultService = defaultService ?? throw new ArgumentNullException(nameof(defaultService));
            _graphService = graphService ?? throw new ArgumentNullException(nameof(graphService));
        }

        public ActionResult Dashboard()
        {
            return View();
        }

        public ActionResult BarChart()
        {
            return View();
        }

        [HttpPost]
        public JsonResult GetBarGraphByGroup(int? g1, int? g2, int? g3, int? g4)
        {
            var result = _graphService.GetBarGraphByGroupService(g1, g2, g3, g4);
            return Json(result);
        }
    }
}