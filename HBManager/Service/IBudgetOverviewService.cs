using System.Collections.Generic;
using HBManager.Models;

namespace HBManager.Service
{
    public interface IBudgetOverviewService
    {
        List<GroupBudgetOverviewModel> GetSumAsGroupService(int year, int month);
    }
}
