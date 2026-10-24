using System.Collections.Generic;
using HBManager.Models;

namespace HBManager.Service
{
    public interface ISalaryService
    {
        int InsertSalaryMaster(SalaryMaster model);
        int UpdateSalaryMasterById(SalaryMaster model);
        List<SalaryMaster> GetAllSalaryMaster();
        SalaryMaster GetSalaryMasterById(int id);
        int DeleteSalaryMasterById(int id);
        List<SalaryMaster> GetSalaryByMonthYearService(int monthName, int yearName);
    }
}
