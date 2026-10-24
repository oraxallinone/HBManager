using System.Collections.Generic;
using HBManager.Models;

namespace HBManager.Service
{
    public interface IBudgetService
    {
        BudgetVerificationSummaryModel GetBudgetVerificationData(int year, int month);
        int InsertBudget(Budget model);
        int UpdateBudgetById(Budget model);
        int UpdateBankName(int id, string bankName);
        List<Budget> GetBudgetByFromToDate(int year, int month);
        List<Budget> GetBudgetByFromToDateWithGroup(int year, int month, int g1, int g2, int g3, int g4, bool isAll, string searchText);
        Budget GetBudgetById(int id);
        int DeleteBudgetById(int id);
        int MoveBudgetToMonthIn(MoveBudgetToMonthInModel model);
        List<WasteTracker> GetWasteTrackerByBudgetMonth(int year, int month);
        int InsertWasteTracker(WasteTracker model);
        int UpdateWasteTracker(WasteTracker model);
        int DeleteWasteTracker(int id);
        Group4Result GetAll4Group();
        int UpdateBudgetGroupsByIds(List<int> budgetIds, int? g1, int? g2, int? g3, int? g4);
        List<GroupMaster2> GetGroupMasterUncutService();
        int InsertBudgetVerificationIn(BudgetVerificationInModel model);
        int UpdateBudgetVerificationIn(BudgetVerificationInModel model);
        int InsertBudgetVerificationNow(BudgetVerificationNowModel model);
        int UpdateBudgetVerificationNow(BudgetVerificationNowModel model);
        int DeleteBudgetVerificationIn(int idIn);
        int DeleteBudgetVerificationNow(int idNow);
        bool UpdateText(int id, string details);
        int UpdateBudgetVerificationById(Budget model);
    }
}
