using System;

namespace HBManager.Models
{
    public class WasteTracker
    {
        public int Id { get; set; }
        public int ReferenceID { get; set; }
        public decimal WasteAmount { get; set; }
        public string ReasonForWaste { get; set; }
        public DateTime? SpendDate { get; set; }
        public decimal BudgetAmount { get; set; }
        public string Details { get; set; }
    }
}