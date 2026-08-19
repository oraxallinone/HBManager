using System;
namespace HBManager.Models
{
    public class UpdateDatetimeViewModel
    {
        public int Id { get; set; }
        public int Year { get; set; }
        public int Month { get; set; }
        public DateTime? SpendDate { get; set; }
        public decimal Amount { get; set; }
        public string Details { get; set; }
        public string G1 { get; set; }
        public string G2 { get; set; }
        public string G3 { get; set; }
        public string G4 { get; set; }
        public string BankName { get; set; }
    }
}