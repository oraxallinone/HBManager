using System;
using System.Web.Helpers;
using System.Web.Mvc;

namespace HBManager.Security
{
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false, Inherited = true)]
    public sealed class ValidateAntiForgeryTokenAttribute : FilterAttribute, IAuthorizationFilter
    {
        private const string FormFieldName = "__RequestVerificationToken";

        public void OnAuthorization(AuthorizationContext filterContext)
        {
            var request = filterContext.HttpContext.Request;
            var cookie = request.Cookies[AntiForgeryConfig.CookieName];
            var formToken = request.Form[FormFieldName];
            var headerToken = request.Headers["RequestVerificationToken"];
            var requestToken = string.IsNullOrWhiteSpace(formToken) ? headerToken : formToken;

            AntiForgery.Validate(cookie == null ? null : cookie.Value, requestToken);
        }
    }
}
