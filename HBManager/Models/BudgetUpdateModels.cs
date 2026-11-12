using System;
using System.Collections.Generic;

namespace HBManager.Models
{
    public class BudgetUpdateEntryModel
    {
        public int Id { get; set; }
        public DateTime EntryDateTime { get; set; }
        public decimal[] Values { get; set; }
    }

    public class BudgetUpdateMonthModel
    {
        public decimal? MonthBeginning { get; set; }
        public List<BudgetUpdateEntryModel> Entries { get; set; }
    }
}
