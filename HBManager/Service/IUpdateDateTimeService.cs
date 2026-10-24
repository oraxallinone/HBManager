using System;
using System.Collections.Generic;
using HBManager.Models;

namespace HBManager.Service
{
    public interface IUpdateDateTimeService
    {
        List<UpdateDateTimeViewModel> GetBudgetDataByMonthYear(int month, int year);
        bool UpdateBudgetDate(int id, DateTime spendDate);
    }
}
