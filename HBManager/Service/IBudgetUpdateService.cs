using System;
using HBManager.Models;

namespace HBManager.Service
{
    public interface IBudgetUpdateService
    {
        BudgetUpdateMonthModel GetMonth(int year, int month);
        int SaveEntry(int? id, DateTime entryDateTime, decimal monthBeginning, decimal[] values);
        void SaveMonthBeginning(int year, int month, decimal monthBeginning);
        bool DeleteEntry(int id);
    }
}
