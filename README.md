# HBManager

HBManager is a classic ASP.NET MVC web application for household budgeting and related management tools. It also contains a GST billing area.

> **Controller coverage:** This guide summarizes the controllers in the solution except `StockTrackerController`, as requested. Stock-related actions implemented in `DefaultController` are still included.

## Architecture & Tech Stack

- **Web framework:** ASP.NET MVC 5.3.0 on **.NET Framework 4.8**. This is not an ASP.NET Core application.
- **Project type:** Classic ASP.NET Web Application using `System.Web.Mvc`, Razor views, `Global.asax`, and IIS Express/IIS.
- **Routing:** Conventional MVC routes. The default route is `/{controller}/{action}/{id}` and defaults to `/Login/LoginIndex`. The `GstBill` area uses `/GstBill/{controller}/{action}/{id}`.
- **Data access:**
  - Most finance, dashboard, notes, birthday, and login services use ADO.NET (`SqlConnection`, `SqlCommand`, readers/adapters) and SQL Server stored procedures. Some actions execute parameterized SQL directly.
  - The GST billing area uses Entity Framework 6.5.2 with a generated EDMX/database-first context (`cbtsplco_annapurnaEntities`).
- **Database:** Microsoft SQL Server. The application has two connection-string entries in `HBManager/Web.config`: `ConnectionString` for ADO.NET and `cbtsplco_annapurnaEntities` for the Entity Framework model. The configured database name is `cbtsplco_annapurna`.
- **Other libraries:** Newtonsoft.Json, Razor/WebPages, jQuery, and Bootstrap are included in the project/package configuration.
- **Frontend:** ASP.NET MVC Razor views with JavaScript/jQuery and static CSS/assets.

## Functional Modules Breakdown

Routes below use the conventional controller/action pattern unless otherwise noted. **GET** labels reflect an explicit `[HttpGet]` attribute or a JSON action that permits GET requests; **POST** labels reflect an explicit `[HttpPost]` attribute. Actions without a verb label use the MVC defaults and attributes present in their source.

### Finance & Budgeting

#### `BudgetController`

Budget entry, monthly views, category/group assignment, waste tracking, and budget verification.

- Views: `BudgeMobileIndex`, `BudgetIndex`, `BudgetVerification`.
- **GET** data: `GetBudgetVerificationData(year, month)`, `GetAllBudgetFromTo(year, month)`, `GetAllBudgetFromToWithGroup(year, month, g1, g2, g3, g4, isAll, searchText)`, `GetWasteTrackerByBudgetMonth(year, month)`, `GetBudgetById(id)`, `Get4Group()`, `GetGroupMasterUncut()`.
- **POST** budget operations: `InsertBudget`, `UpdateBudgetById`, `UpdateBankName(id, bankName)`, `DeleteBudgetById(id)`, `MoveBudgetToMonthIn(model)`, `UpdateBudgetGroups(budgetIds, g1, g2, g3, g4)`.
- **POST** waste-tracker operations: `InsertWasteTracker`, `UpdateWasteTracker`, `DeleteWasteTracker(id)`.
- **POST** verification operations: `InsertBudgetVerificationIn`, `UpdateBudgetVerificationIn`, `DeleteBudgetVerificationIn(idIn)`, `InsertBudgetVerificationNow`, `UpdateBudgetVerificationNow`, `DeleteBudgetVerificationNow(idNow)`, `UpdateBudgetVerificationById(model)`, `UpdateText(id, details)`.

#### `BudgetOverviewController`

- `GroupBudgetOverview()` displays the grouped monthly budget overview.
- **GET** `BudgetOverview(year, month)` returns group totals.

#### `BudgetGroupingController`

Manages saved group-mapping configurations.

- `BudgetGroupingIndex()` displays the configuration page.
- **GET** `GetGroupMappingConfigurations()`.
- **POST** `SaveGroupMappingConfiguration(model)` validates and saves a G1–G4 mapping.
- **POST** `DeleteGroupMappingConfiguration(id)`.

#### `GroupController`

Manages budget group master data.

- `GroupIndex()` displays the group page.
- **GET** `GetGroup(groupType)`, `GroupById(id)`.
- **POST** `AddGroup(model)`, `UpdateGroup(model)`, `DeleteGroup(id)`.

#### `SalaryController`

Manages salary records used by month/year budgeting.

- `SalaryIndex()` displays salary management.
- **GET** `GetAllSalary()`, `GetSalaryById(id)`, `GetSalaryByMonthYear(monthName, yearName)`.
- **POST** `InsertSalary(model)`, `UpdateSalaryById(model)`, `DeleteSalaryById(id)`.

#### `RepeatStatusController`

Tracks completion status for group combinations by month.

- `RepeatStatus()` displays the status page.
- **GET** `GetRepeatStatus()` returns columns and rows with amounts/completion flags.
- **POST** `SetRepeatStatus(year, month, g1, g2, g3, g4, completed)`.

#### `CalenderController`

Displays calendar-oriented spending totals and date ranges.

- `CalenderIndex()` displays the calendar.
- **POST** `GetDataForCalender(data)` returns calendar dates and spending data, filtered by month/year and optional group IDs.

#### `UpdateDatetimeController`

Supports reviewing and correcting spending dates.

- `Index()` displays the date-update page.
- **GET** `GetBudgetData(month, year)`.
- **POST** `UpdateBudgetDate(id, spendDate)`.

#### `ImportController`

Imports and manages staged budget transactions in `BudgetInitiate`.

- **GET** `ImportInitiate()` displays the import page.
- **GET** `GetBudgetData(year, month, bankName)` returns staged rows; `GetBankNames(year, month)` lists banks for the selected salary period.
- **POST** `ImportInitiate(sqlScript)` accepts a pasted SQL-style values block and inserts non-duplicate staged rows.
- **POST** `MoveData(items)` applies row statuses/transfers through `dbo.usp_moveInitiateToBudget`; `RevertTransfer(id)`, `UpdateDetails(id, details)`, and `DeleteBudgetInitiate(id)` update or remove staged records.

### Dashboard, Reports & Market Data

#### `DefaultController`

Provides dashboard views, finance charts, and the stock-market data features implemented in this controller.

- Views: `Dashboard()`, `BarChart()`, `StockCandle()`, `StockTechData()`, `PurchaseStockTracker()`.
- **POST** `GetBarGraphByGroup(g1, g2, g3, g4)` and `GetCurrentMonthSalaryDetails(year, month)` return chart/dashboard data.
- **POST** `GetNseStockCandles(stockSymbol, stockExchange)` fetches historical candle data from Yahoo Finance.
- **POST** `GetStockFundamentalData(stockSymbol)` retrieves fundamentals using Alpha Vantage and then Financial Modeling Prep as a fallback; **POST** `GetStockTechFundamentalData(stockSymbol)` fetches company/financial data from Yahoo Finance.
- **GET** `GetPurchaseStockTrackerData()` returns tracked purchase data; **POST** `UpdatePurchaseStockTracker(slno, nsebse, status)` updates a tracked item’s status/exchange.

The market-data routes require outbound network access. Provider availability and any provider credentials/limits are external to the database setup; no API keys are documented here.

### Notes, Birthdays & File Utilities

#### `NotesController`

Manages notes and their child subnotes.

- `NoteIndex()` displays the notes page.
- **GET** `GetNotes()`, `GetSubNotes(noteId)`.
- **POST** `AddNote(noteName, dateOfNote, notePriority)`, `UpdateNote(noteId, noteName, dateOfNote, notePriority)`, `DeleteNote(noteId)`.
- **POST** `AddSubNote(noteId, subNoteName, dateOfSubNote)`, `UpdateSubNote(subNoteId, subNoteName, dateOfSubNote)`, `DeleteSubNote(subNoteId)`.

#### `BirthdayController`

Provides birthday views and birthday record management.

- Views: `Index()`, `BirthdayIndex()`, `ShowBirthday()`.
- **GET** `GetAll()`, `GetByMonth(year, month)`.
- **POST** `AddBirthday(name, dateOfBirth, isActive)`, `UpdateBirthday(id, name, dateOfBirth, isActive)`, `DeleteBirthday(id)`.

#### `UploadController`

Stores uploaded files under the application’s `Upload` directory and provides listing, download/view, and deletion actions.

- `Index()` displays the upload page.
- **POST** `UploadFile()` saves the first uploaded file.
- `GetFiles()` lists files; `GetFile(name)` streams a file using its detected MIME type.
- **POST** `DeleteFile(name)` deletes a file by name.

### User Access & General Pages

#### `LoginController`

- `LoginIndex()` displays the login page.
- **POST** `CheckLogin(email, password, rememberMe)` checks credentials through `LoginService` and returns a JSON redirect according to the user type.
- `Logout()` clears the session and expires cookies before redirecting to `LoginIndex`.

#### `HomeController`

- `Index()`, `About()`, and `Contact()` return the corresponding general-purpose pages.

### GST Billing Area

These controllers are registered under the `/GstBill` route prefix and use the Entity Framework model.

#### `ProductController`

Manages customer and item master records.

- `Index()` displays the area’s main page.
- Customer pages/actions: `CustomerAdd()` (form and **POST** save), `CustomerList()`, `CustomerView(id)`, `CustomerEdit(id)` (form and **POST** update).
- **POST** `GetCustomers()` returns customer data as JSON.
- Item pages/actions: `ItemAdd()` (form and **POST** save), `ItemList()`, `ItemEdit(id)` (form and **POST** update), `ItemView(id)`.
- `getNewItemNo()` generates the next item number for the item-entry workflow.

#### `InvoiceController`

Creates and manages GST invoice drafts/invoices, related transactions, and invoice counters.

- `GstInvoiceCreate(draftNo)` displays a new or existing draft; **POST** `GstInvoiceCreate(model)` saves the draft/invoice and line items.
- `GstDraftList()`, `GstInvoiceList()`, and `GstInvoicePrint(INo)` display drafts, invoices, and printable invoice details.
- `InvoiceCounterUpdate()` displays the counter; **POST** `InvoiceCounterUpdate(counterValue, secretKey)` updates it.
- **GET** JSON/data actions: `GetAllItemList()`, `GetItemsJson(search)`, `GetCustomerList()`, `GetItemByCode(itemCode)`, `GetRupeesInwords(rps)`, and `GetDraftData(draftNo)`.
- `GetItmByName(itemname)` looks up an item; **POST** `UpdateItemPart(idT, itemPart)` changes an invoice-line part.
- `CancelInvoice(dNo)` changes an active invoice record to draft status and returns to the draft list.
- `getNewDraftNo()` and `getNewInvoiceNo()` generate the next identifiers used by invoice workflows.

## Setup & Installation

1. Install Visual Studio with the **ASP.NET and web development** workload and the **.NET Framework 4.8 Developer Pack/targeting pack**.
2. Open the solution at `HBManager.sln`.
3. Restore NuGet packages using Visual Studio’s package restore (the project’s dependencies are listed in `HBManager/packages.config`).
4. Configure the SQL Server connection strings as described under [Database Configuration](#database-configuration). Do not commit real credentials to source control.
5. Ensure the target database contains the tables and stored procedures used by the application. SQL scripts included in the project include `HBManager/GetBudgetInitiateBySalaryMonth.sql`, `HBManager/UPDATED_SP_GetBudgetByFromToDateWithGroup.sql`, and `HBManager/Upload/sp_budget_verification.sql`; confirm database-specific deployment requirements before applying scripts.

## Database Configuration

The application connects to SQL Server through two named entries in `HBManager/Web.config`:

- `ConnectionString` is used by the ADO.NET services and direct SQL actions.
- `cbtsplco_annapurnaEntities` is the Entity Framework connection for the GST billing EDMX model.

Set both entries to the appropriate SQL Server and database for the environment you are running. The checked-in configuration contains environment-specific connection details; keep production credentials private and use a secure deployment configuration. `Web.Debug.config` and `Web.Release.config` are transformation templates and do not currently provide configured replacement connection strings.

The web application expects the database objects referenced by its stored procedures and queries, including budget, salary, group, birthday, note, repeat-status, upload/import, and GST billing data. This repository contains SQL scripts for selected procedures, not a complete database backup or schema installer.

## Run Instructions

1. In Visual Studio, set `HBManager` as the startup project.
2. Build the solution and resolve any missing package or database configuration errors.
3. Start the application with **IIS Express** (for example, press **F5**).
4. The default MVC route opens `/Login/LoginIndex`. From there, use the application pages and controller actions; GST billing routes are under `/GstBill/...`.

To host outside Visual Studio, deploy the classic ASP.NET application to IIS with the .NET Framework 4.8 runtime/ASP.NET features enabled, and provide the correct environment-specific SQL Server connection strings and database objects.
