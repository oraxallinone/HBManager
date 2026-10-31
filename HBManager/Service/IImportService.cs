using System;
using System.Collections.Generic;
using HBManager.Models;

namespace HBManager.Service
{
    public interface IImportService
    {
        bool ExecuteImport(object importPayload, out string errorMessage);
        void LogErrorDetails(Exception exception, string controllerName, string actionName);
        string ReadAllErrorLogs();
        void ClearAllErrorLogs();
        void WriteTestErrorLog();
        void LogClientError(string controllerName, string actionName, string message, string details);
        List<Dictionary<string, object>> GetBudgetData(int year, int month, string bankName);
        List<string> GetBankNames(int year, int month);
        object MoveData(List<RowStatusItem> items);
        object RevertTransfer(int id);
        object UpdateDetails(int id, string details);
        object ImportInitiate(string sqlScript);
        object DeleteBudgetInitiate(int id);
    }
}
