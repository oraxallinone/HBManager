using HBManager.Models;
using HBManager.Service;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.Linq;
using System.Web.Mvc;

namespace HBManager.Controllers
{
    public class BudgetUpdateController : Controller
    {
        private readonly IBudgetUpdateService _budgetUpdateService;
        private readonly IBudgetService _budgetService;

        public BudgetUpdateController(IBudgetUpdateService budgetUpdateService, IBudgetService budgetService)
        {
            _budgetUpdateService = budgetUpdateService ?? throw new ArgumentNullException(nameof(budgetUpdateService));
            _budgetService = budgetService ?? throw new ArgumentNullException(nameof(budgetService));
        }

        public ActionResult Index()
        {
            return View();
        }

        [HttpGet]
        public JsonResult GetByMonth(int year, int month)
        {
            if (!IsValidPeriod(year, month))
            {
                return JsonError("Select a valid month and year.", 400, JsonRequestBehavior.AllowGet);
            }

            try
            {
                var result = _budgetUpdateService.GetMonth(year, month);
                var budgetVerification = _budgetService.GetBudgetVerificationData(year, month);
                var salaryEntry = budgetVerification.InList.FirstOrDefault(entry =>
                    string.Equals(entry.DetailsIn, "Salary Amount", StringComparison.OrdinalIgnoreCase));
                return Json(new
                {
                    success = true,
                    monthBeginning = result.MonthBeginning ?? budgetVerification.TotalIn,
                    currentMonthSalary = salaryEntry == null ? 0m : salaryEntry.AmountIn,
                    entries = result.Entries.Select(entry => new
                    {
                        id = entry.Id,
                        dateTime = entry.EntryDateTime.ToString("yyyy-MM-dd'T'HH:mm", CultureInfo.InvariantCulture),
                        values = entry.Values
                    })
                }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception exception)
            {
                Trace.TraceError("Could not load Budget Update entries: {0}", exception);
                return JsonError("Could not load bank entries. Please try again.", 500, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public JsonResult SaveEntry(
            int? id,
            string entryDateTime,
            decimal? iciValue,
            decimal? kotValue,
            decimal? sbiValue,
            decimal? surValue,
            decimal? cahValue,
            decimal? bbbValue)
        {
            DateTime parsedDateTime;
            var values = new[] { iciValue, kotValue, sbiValue, surValue, cahValue, bbbValue };

            if (id.HasValue && id.Value <= 0)
            {
                return JsonError("Invalid bank entry.", 400);
            }
            if (!DateTime.TryParseExact(
                entryDateTime,
                "yyyy-MM-dd'T'HH:mm",
                CultureInfo.InvariantCulture,
                DateTimeStyles.None,
                out parsedDateTime))
            {
                return JsonError("Select a valid date and time.", 400);
            }
            if (values.Any(value => !IsValidAmount(value)))
            {
                return JsonError("Enter valid amounts with no more than two decimal places.", 400);
            }

            try
            {
                var monthBeginning = _budgetService.GetBudgetVerificationData(
                    parsedDateTime.Year,
                    parsedDateTime.Month).TotalIn;
                var entryId = _budgetUpdateService.SaveEntry(
                    id,
                    parsedDateTime,
                    monthBeginning,
                    values.Select(value => value.Value).ToArray());
                return Json(new { success = true, id = entryId });
            }
            catch (KeyNotFoundException exception)
            {
                return JsonError(exception.Message, 404);
            }
            catch (Exception exception)
            {
                Trace.TraceError("Could not save Budget Update entry: {0}", exception);
                return JsonError("Could not save the bank entry. Please try again.", 500);
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public JsonResult SaveMonthBeginning(int year, int month, decimal? monthBeginning)
        {
            if (!IsValidPeriod(year, month) || !IsValidAmount(monthBeginning))
            {
                return JsonError("Select a valid month and year and enter a non-negative amount with no more than two decimal places.", 400);
            }

            try
            {
                _budgetUpdateService.SaveMonthBeginning(year, month, monthBeginning.Value);
                return Json(new { success = true });
            }
            catch (Exception exception)
            {
                Trace.TraceError("Could not save Budget Update month beginning: {0}", exception);
                return JsonError("Could not save the month beginning value. Please try again.", 500);
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public JsonResult DeleteEntry(int id)
        {
            if (id <= 0)
            {
                return JsonError("Invalid bank entry.", 400);
            }

            try
            {
                if (!_budgetUpdateService.DeleteEntry(id))
                {
                    return JsonError("The bank entry no longer exists.", 404);
                }

                return Json(new { success = true });
            }
            catch (Exception exception)
            {
                Trace.TraceError("Could not delete Budget Update entry: {0}", exception);
                return JsonError("Could not delete the bank entry. Please try again.", 500);
            }
        }

        private JsonResult JsonError(string message, int statusCode, JsonRequestBehavior behavior = JsonRequestBehavior.DenyGet)
        {
            Response.StatusCode = statusCode;
            Response.TrySkipIisCustomErrors = true;
            return Json(new { success = false, message = message }, behavior);
        }

        private static bool IsValidPeriod(int year, int month)
        {
            return year >= 1 && year <= 9999 && month >= 1 && month <= 12;
        }

        private static bool IsValidAmount(decimal? amount)
        {
            return amount.HasValue &&
                amount.Value >= 0m &&
                amount.Value <= 9999999999999999.99m &&
                decimal.Round(amount.Value, 2) == amount.Value;
        }
    }
}
