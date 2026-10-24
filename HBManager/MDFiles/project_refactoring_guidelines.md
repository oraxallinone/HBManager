# HBManager Refactoring & Quality Enhancement Guidelines

## 1. Absolute Boundary Constraints
- **CRITICAL**: **DO NOT modify, touch, refactor, or delete ANY file or code under the `Areas/` directory.**
- All scope and refactoring efforts apply **ONLY** to the main project controllers, views, models, services, scripts, and content directories outside of `Areas/`.

---

## 2. In-Scope Controllers and Mapping
Refactoring is strictly confined to these 15 controllers and their associated Views, Models, Services, CSS, and JS files:

| # | Controller Name | Required Service Interface | Required Service Implementation | Notes / Spelling Fix |
|---|---|---|---|---|
| 1 | `BirthdayController` | `IBirthdayService` | `BirthdayService` | |
| 2 | `BudgetController` | `IBudgetService` | `BudgetService` | |
| 3 | `BudgetGroupingController` | `IBudgetGroupingService` | `BudgetGroupingService` | |
| 4 | `BudgetOverviewController` | `IBudgetOverviewService` | `BudgetOverviewService` | |
| 5 | `CalendarController` | `ICalendarService` | `CalendarService` | Fixed spelling: `Calender` -> `Calendar` |
| 6 | `DefaultController` | `IDefaultService` | `DefaultService` | |
| 7 | `GroupController` | `IGroupService` | `GroupService` | |
| 8 | `HomeController` | `IHomeService` | `HomeService` | |
| 9 | `ImportController` | `IImportService` | `ImportService` | |
| 10 | `LoginController` | `ILoginService` | `LoginService` | |
| 11 | `NotesController` | `INotesService` | `NotesService` | |
| 12 | `RepeatStatusController` | `IRepeatStatusService` | `RepeatStatusService` | |
| 13 | `SalaryController` | `ISalaryService` | `SalaryService` | |
| 14 | `UpdateDateTimeController` | `IUpdateDateTimeService` | `UpdateDateTimeService` | Casing correction: `UpdateDatetime` -> `UpdateDateTime` |
| 15 | `UploadController` | `IUploadService` | `UploadService` | |

---

## 3. Mandatory Refactoring Rules

### Rule 1: Dedicated Service Pair per Controller
* Every controller must have a dedicated matching service and service interface:
  * Pattern: `[ControllerPrefix]Controller` $\rightarrow$ `I[ControllerPrefix]Service` + `[ControllerPrefix]Service`
  * Example: `HomeController` $\rightarrow$ `IHomeService` & `HomeService`.
  * All business logic, database queries, and repository operations must be in the Service class, keeping controllers lean.

### Rule 2: Strict C# Naming Conventions
* **PascalCase**: Method names, property names, class names, interface names, and public members.
* **camelCase**: Method parameters, action parameters, and local variables within methods.
* **_camelCase**: Private and internal fields (e.g., `_budgetService`).
* **Booleans**: Must use affirmative prefixes (`isCompleted`, `hasAccess`, `canEdit`).

### Rule 3: Dependency Injection via Constructor
* Services **must not** be instantiated with `new [Service]()` inside the controller.
* Controllers must receive their corresponding interface via constructor injection:
```csharp
using System;
using System.Linq;
using System.Web.Mvc;
using HBManager.Service;

namespace HBManager.Controllers
{
    public class RepeatStatusController : Controller
    {
        private readonly IRepeatStatusService _repeatStatusService;

        // Injected by the IoC container
        public RepeatStatusController(IRepeatStatusService repeatStatusService)
        {
            _repeatStatusService = repeatStatusService ?? throw new ArgumentNullException(nameof(repeatStatusService));
        }

        [HttpGet]
        public ActionResult RepeatStatus()
        {
            return View();
        }
        
        // ...
    }
}
```

### Rule 4: Typo & Spelling Audits
* Rename misspelled symbols, methods, and files across the solution:
  * Fix `CalenderController` $\rightarrow$ `CalendarController`.
  * Fix `UpdateDatetimeController` $\rightarrow$ `UpdateDateTimeController`.
  * Fix recurring typos in models/views (e.g., `recieved` $\rightarrow$ `received`, `referance` $\rightarrow$ `reference`, `succes` $\rightarrow$ `success`).

### Rule 5: Separation of CSS & JavaScript from Views (.cshtml)
* **Zero inline `<style>` or `<script>` tags** inside `.cshtml` files.
* Every `.cshtml` view must have a matching, dedicated `.css` and `.js` file sharing the exact same base name.
  * View: `Views/Budget/BudgetVerification.cshtml`
  * CSS: `Content/budget-verification.css` (or matching naming standard `budget-verification.css`)[all small case]
  * JS: `Scripts/budget-verification.js` (or `budget-verification.js`)[all small case]
* View Header Pattern:
```html
@*|| budget-verification.css || budget-verification.js ||*@
@{
    ViewBag.Title = "Budget Verification";
    Layout = "~/Views/Shared/_WebLayout.cshtml";
}

<link href="~/Content/budget-verification.css" rel="stylesheet" />
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />

<!-- View Body Content Here -->

@section Scripts {
    <script src="~/Scripts/budget-verification.js"></script>
}

### Rule 6: Security Standards: Added [ValidateAntiForgeryToken] standards and AJAX token pass-through examples for MVC views.
```

---

## 4. Commands to Create and Initialize Markdown Files

### In Windows PowerShell (Visual Studio Package Manager Console or Terminal):
```powershell
New-Item -Path ".\PROJECT_REFACTORING_GUIDELINES.md" -ItemType File -Force
```

### In Windows Command Prompt (CMD):
```cmd
type nul > PROJECT_REFACTORING_GUIDELINES.md
```

### In Git Bash / Linux Shell:
```bash
touch PROJECT_REFACTORING_GUIDELINES.md
```