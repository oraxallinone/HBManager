namespace AdminTemp.Models
{
    public class GroupMaster
    {
        public int Id { get; set; }
        public string GroupName { get; set; }
        public string GroupType { get; set; }
        public bool IsActive { get; set; }
        public bool IsFixedAmt { get; set; }
        public decimal Amt { get; set; }
    }

    public class GroupMaster2
    {
        public int Id { get; set; }
        public int GroupId { get; set; }
        public string GroupName { get; set; }
        public string GroupType { get; set; }
        public bool IsActive { get; set; }
        public bool IsFixedAmt { get; set; }
        public decimal? Amt { get; set; }
    }
}