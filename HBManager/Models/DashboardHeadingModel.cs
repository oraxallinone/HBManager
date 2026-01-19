namespace AdminTemp.Models
{
    public class DashboardHeadingModel
    {
        public decimal ThisMonthSalary { get; set; }
        public decimal ThisMonthSpending { get; set; }
        public decimal RemainingBalance { get; set; }
        public string PercentSpending { get; set; }
    }
}