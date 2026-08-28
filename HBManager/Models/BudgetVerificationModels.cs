using System;
using System.Collections.Generic;

namespace HBManager.Models
{
    public class BudgetVerificationInModel
    {
        public int IdIn { get; set; }
        public DateTime? DateIn { get; set; }
        public decimal AmountIn { get; set; }
        public string DetailsIn { get; set; }
        public int YearIn { get; set; }
        public int MonthIn { get; set; }
    }

    public class MoveBudgetToMonthInModel
    {
        public int BudgetId { get; set; }
        public DateTime? DateIn { get; set; }
        public decimal AmountIn { get; set; }
        public string DetailsIn { get; set; }
    }

    public class BudgetVerificationOutModel
    {
        public decimal AmountOut { get; set; }
    }

    public class BudgetVerificationNowModel
    {
        public int IdNow { get; set; }
        public decimal AmountNow { get; set; }
        public string DetailsNow { get; set; }
        public DateTime? DateNow { get; set; }
        public int YearNow { get; set; }
        public int MonthNow { get; set; }
    }

    public class BudgetVerificationSummaryModel
    {
        public decimal TotalIn { get; set; }
        public decimal TotalOut { get; set; }
        public decimal TotalNow { get; set; }
        public List<BudgetVerificationInModel> InList { get; set; }
        public List<BudgetVerificationOutModel> OutList { get; set; }
        public List<BudgetVerificationNowModel> NowList { get; set; }
    }
}
