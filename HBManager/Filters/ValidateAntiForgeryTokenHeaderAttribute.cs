using System;
using System.Web.Helpers;
using System.Web.Mvc;

namespace HBManager.Filters
{
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false, Inherited = true)]
    public sealed class ValidateAntiForgeryTokenHeaderAttribute : FilterAttribute, IAuthorizationFilter
    {
        public void OnAuthorization(AuthorizationContext filterContext)
        {
            var request = filterContext.HttpContext.Request;
            if (!string.Equals(request.HttpMethod, "POST", StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            var requestToken = request.Headers["RequestVerificationToken"];

            if (string.IsNullOrEmpty(requestToken))
            {
                requestToken = request.Form["__RequestVerificationToken"];
            }

            var cookie = request.Cookies[AntiForgeryConfig.CookieName];
            AntiForgery.Validate(cookie == null ? null : cookie.Value, requestToken);
        }
    }
}
