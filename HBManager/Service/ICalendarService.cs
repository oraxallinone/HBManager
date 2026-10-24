using HBManager.Models;

namespace HBManager.Service
{
    public interface ICalendarService
    {
        object GetDataForCalender(CalenderBudgetModelIn data);
    }
}
