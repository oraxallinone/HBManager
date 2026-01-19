using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace AdminTemp.Models
{
    public class Budget
    {
        public int Id { get; set; }
        public int Year { get; set; }
        public int Month { get; set; }
        public DateTime? SpendDate { get; set; }
        public decimal Amount { get; set; }
        public string Details { get; set; }
        public int? G1 { get; set; }
        public int? G2 { get; set; }
        public int? G3 { get; set; }
        public int? G4 { get; set; }
        public DateTime CreatedTime { get; set; }
    }
}