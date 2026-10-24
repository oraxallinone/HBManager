using System;
using System.Collections.Generic;
using System.Web.Mvc;
using HBManager.Controllers;
using HBManager.Service;

namespace HBManager
{
    public sealed class HBManagerDependencyResolver : IDependencyResolver
    {
        private readonly IDictionary<Type, Func<object>> _registrations;

        public HBManagerDependencyResolver()
        {
            _registrations = new Dictionary<Type, Func<object>>
            {
                { typeof(BirthdayController), () => new BirthdayController(new BirthdayService()) },
                { typeof(BudgetController), () => new BudgetController(new BudgetService()) },
                { typeof(BudgetGroupingController), () => new BudgetGroupingController(new BudgetGroupingService()) },
                { typeof(BudgetOverviewController), () => new BudgetOverviewController(new BudgetOverviewService()) },
                { typeof(CalendarController), () => new CalendarController(new CalendarService()) },
                { typeof(DefaultController), () => new DefaultController(new DefaultService()) },
                { typeof(GroupController), () => new GroupController(new GroupService()) },
                { typeof(HomeController), () => new HomeController(new HomeService()) },
                { typeof(ImportController), () => new ImportController(new ImportService()) },
                { typeof(LoginController), () => new LoginController(new LoginService()) },
                { typeof(NotesController), () => new NotesController(new NotesService()) },
                { typeof(RepeatStatusController), () => new RepeatStatusController(new RepeatStatusService()) },
                { typeof(SalaryController), () => new SalaryController(new SalaryService()) },
                { typeof(UpdateDateTimeController), () => new UpdateDateTimeController(new UpdateDateTimeService()) },
                { typeof(UploadController), () => new UploadController(new UploadService()) },
                { typeof(IBirthdayService), () => new BirthdayService() },
                { typeof(IBudgetService), () => new BudgetService() },
                { typeof(IBudgetGroupingService), () => new BudgetGroupingService() },
                { typeof(IBudgetOverviewService), () => new BudgetOverviewService() },
                { typeof(ICalendarService), () => new CalendarService() },
                { typeof(IDefaultService), () => new DefaultService() },
                { typeof(IGroupService), () => new GroupService() },
                { typeof(IHomeService), () => new HomeService() },
                { typeof(IImportService), () => new ImportService() },
                { typeof(ILoginService), () => new LoginService() },
                { typeof(INotesService), () => new NotesService() },
                { typeof(IRepeatStatusService), () => new RepeatStatusService() },
                { typeof(ISalaryService), () => new SalaryService() },
                { typeof(IUpdateDateTimeService), () => new UpdateDateTimeService() },
                { typeof(IUploadService), () => new UploadService() }
            };
        }

        public object GetService(Type serviceType)
        {
            Func<object> factory;
            if (_registrations.TryGetValue(serviceType, out factory))
            {
                return factory();
            }

            return null;
        }

        public IEnumerable<object> GetServices(Type serviceType)
        {
            var service = GetService(serviceType);
            return service == null ? new object[0] : new[] { service };
        }
    }
}
