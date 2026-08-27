IF OBJECT_ID('dbo.tblWasteTracker', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.tblWasteTracker
    (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_tblWasteTracker PRIMARY KEY,
        ReferenceID INT NOT NULL,
        WasteAmount DECIMAL(18, 2) NOT NULL,
        ReasonForWaste NVARCHAR(500) NOT NULL
    );
END
GO

IF OBJECT_ID('dbo.sp_GetWasteTrackerByBudgetMonth', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_GetWasteTrackerByBudgetMonth;
GO
CREATE PROCEDURE dbo.sp_GetWasteTrackerByBudgetMonth @Year INT, @Month INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT w.Id, w.ReferenceID, w.WasteAmount, w.ReasonForWaste,
           b.SpendDate, b.Amount AS BudgetAmount, b.Details
    FROM dbo.tblWasteTracker w
    INNER JOIN dbo.Budget b ON b.Id = w.ReferenceID
    WHERE b.[Year] = @Year AND b.[Month] = @Month;
END
GO

IF OBJECT_ID('dbo.sp_InsertWasteTracker', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_InsertWasteTracker;
GO
CREATE PROCEDURE dbo.sp_InsertWasteTracker
    @ReferenceID INT, @WasteAmount DECIMAL(18,2), @ReasonForWaste NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.tblWasteTracker (ReferenceID, WasteAmount, ReasonForWaste)
    VALUES (@ReferenceID, @WasteAmount, @ReasonForWaste);
    SELECT CAST(SCOPE_IDENTITY() AS INT);
END
GO

IF OBJECT_ID('dbo.sp_UpdateWasteTracker', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_UpdateWasteTracker;
GO
CREATE PROCEDURE dbo.sp_UpdateWasteTracker
    @Id INT, @WasteAmount DECIMAL(18,2), @ReasonForWaste NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.tblWasteTracker
    SET WasteAmount = @WasteAmount, ReasonForWaste = @ReasonForWaste
    WHERE Id = @Id;
    SELECT @@ROWCOUNT;
END
GO

IF OBJECT_ID('dbo.sp_DeleteWasteTracker', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_DeleteWasteTracker;
GO
CREATE PROCEDURE dbo.sp_DeleteWasteTracker @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.tblWasteTracker WHERE Id = @Id;
    SELECT @@ROWCOUNT;
END
GO