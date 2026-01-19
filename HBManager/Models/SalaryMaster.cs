using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace AdminTemp.Models
{
    public class SalaryMaster
    {
        public int Id { get; set; }
        public string MonthName { get; set; }
        public string YearName { get; set; }
        public decimal? SalaryAmount { get; set; }
        public decimal? Need50 { get; set; }
        public decimal? Save20 { get; set; }
        public decimal? Want30 { get; set; }
        public DateTime? FromData { get; set; }
        public DateTime? ToDate { get; set; }
        public int? OrderRowAll { get; set; }
        public int? OrderRowYear { get; set; }
        public decimal? SalaryTillNow { get; set; }
    }
}