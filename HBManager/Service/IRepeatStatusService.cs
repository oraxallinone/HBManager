using HBManager.Models;

namespace HBManager.Service
{
    public interface IRepeatStatusService
    {
        RepeatStatusResult GetRepeatStatus();
        void SetRepeatStatus(int year, int month, int? g1, int? g2, int? g3, int? g4, bool isCompleted);
    }
}
