namespace AdminTemp.Models
{
    public class GroupBudgetOverviewModel
    {
        public string GroupType { get; set; }
        public int GroupId { get; set; }
        public string GroupName { get; set; }
        public decimal SumAmount { get; set; }
        public decimal FixedAmount { get; set; }
        public decimal Remaining => FixedAmount - SumAmount;
    }
}