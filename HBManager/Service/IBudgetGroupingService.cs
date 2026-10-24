using System.Collections.Generic;
using HBManager.Models;

namespace HBManager.Service
{
    public interface IBudgetGroupingService
    {
        string ValidateAndNormalize(GroupMappingConfiguration model);
        List<GroupMappingConfiguration> GetAll();
        int Save(GroupMappingConfiguration model);
        int Delete(int id);
    }
}
