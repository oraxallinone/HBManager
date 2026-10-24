using System.Collections.Generic;
using HBManager.Models;

namespace HBManager.Service
{
    public interface IGroupService
    {
        List<GroupMaster> GetGroupMasterByGroupname(string groupType);
        int InsertGroupMaster(GroupMaster model);
        int UpdateGroupMasterByID(GroupMaster model);
        int DeleteGroupMasterByID(int id);
        GroupMaster GetGroupMasterById(int id);
    }
}
