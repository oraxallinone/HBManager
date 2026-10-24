using System;
using System.Collections.Generic;
using HBManager.Models;

namespace HBManager.Service
{
    public interface IBirthdayService
    {
        int AddBirthday(string name, DateTime dob, bool isActive = true);
        List<BirthdayModel> GetAllBirthdays();
        List<BirthdayModel> GetBirthdaysByMonth(int year, int month);
        bool UpdateBirthday(int id, string name, DateTime dob, bool isActive);
        bool DeleteBirthday(int id);
    }
}
