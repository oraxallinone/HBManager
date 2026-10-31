using System;
using System.Web.Mvc;
using System.Web.Routing;

namespace HBManager.Filters
{
    public sealed class RequireLoginSessionAttribute : FilterAttribute, IAuthorizationFilter
    {
        public const string SessionKey = "AuthenticatedUserType";

        public void OnAuthorization(AuthorizationContext filterContext)
        {
            var routeData = filterContext.RouteData;
            object areaValue;
            routeData.DataTokens.TryGetValue("area", out areaValue);
            var area = areaValue as string;
            var controller = Convert.ToString(routeData.Values["controller"]);

            if (string.Equals(area, "GstBill", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(controller, "Login", StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            var session = filterContext.HttpContext.Session;
            if (session != null && session[SessionKey] != null)
            {
                return;
            }

            filterContext.Result = new RedirectToRouteResult(
                "Default",
                new RouteValueDictionary
                {
                    { "controller", "Login" },
                    { "action", "LoginIndex" },
                    { "area", string.Empty }
                });
        }
    }
}
