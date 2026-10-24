using System.Collections.Generic;
using HBManager.Models;

namespace HBManager.Service
{
    public class BudgetGroupingService : IBudgetGroupingService
    {
        private readonly GroupMappingService _groupMappingService;

        public BudgetGroupingService()
        {
            _groupMappingService = new GroupMappingService();
        }

        public string ValidateAndNormalize(GroupMappingConfiguration model)
        {
            if (model == null)
                return "Enter a valid mapping combination.";

            model.MappingGroup = (model.MappingGroup ?? string.Empty).Trim().ToLowerInvariant();
            if ((model.MappingGroup != "g1" && model.MappingGroup != "g2" &&
                 model.MappingGroup != "g3" && model.MappingGroup != "g4") ||
                model.G1Id < 0 || model.G2Id < 0 || model.G3Id < 0 || model.G4Id < 0)
                return "Enter a valid mapping combination.";

            return null;
        }

        public List<GroupMappingConfiguration> GetAll()
        {
            return _groupMappingService.GetAll();
        }

        public int Save(GroupMappingConfiguration model)
        {
            return _groupMappingService.Save(model);
        }

        public int Delete(int id)
        {
            return _groupMappingService.Delete(id);
        }
    }
}
