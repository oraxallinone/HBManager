-- Stored procedures for Budget Verification (M IN / M Now)

/****** Object:  StoredProcedure [dbo].[sp_InsertBudgetVerificationIn]    Script Date: 2026-02-02 ******/
IF OBJECT_ID('dbo.sp_InsertBudgetVerificationIn', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_InsertBudgetVerificationIn
GO
CREATE PROCEDURE [dbo].[sp_InsertBudgetVerificationIn]
    @Year int,
    @Month int,
    @DateIn datetime = NULL,
    @AmountIn decimal(18,2),
    @DetailsIn nvarchar(max) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO BudgetVerificationIn (DateIn, AmountIn, DetailsIn, YearIn, MonthIn, CreatedTime)
    VALUES (@DateIn, @AmountIn, @DetailsIn, @Year, @Month, GETDATE());

    SELECT CAST(SCOPE_IDENTITY() AS int);
END
GO

/****** Object:  StoredProcedure [dbo].[sp_UpdateBudgetVerificationIn]    Script Date: 2026-02-02 ******/
IF OBJECT_ID('dbo.sp_UpdateBudgetVerificationIn', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_UpdateBudgetVerificationIn
GO
CREATE PROCEDURE [dbo].[sp_UpdateBudgetVerificationIn]
    @IdIn int,
    @Year int,
    @Month int,
    @DateIn datetime = NULL,
    @AmountIn decimal(18,2),
    @DetailsIn nvarchar(max) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE BudgetVerificationIn
    SET DateIn = @DateIn,
        AmountIn = @AmountIn,
        DetailsIn = @DetailsIn,
        YearIn = @Year,
        MonthIn = @Month
    WHERE IdIn = @IdIn;

    SELECT @@ROWCOUNT;
END
GO

/****** Object:  StoredProcedure [dbo].[sp_InsertBudgetVerificationNow]    Script Date: 2026-02-02 ******/
IF OBJECT_ID('dbo.sp_InsertBudgetVerificationNow', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_InsertBudgetVerificationNow
GO
CREATE PROCEDURE [dbo].[sp_InsertBudgetVerificationNow]
    @Year int,
    @Month int,
    @DateNow datetime = NULL,
    @AmountNow decimal(18,2),
    @DetailsNow nvarchar(max) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO BudgetVerificationNow (DateNow, AmountNow, DetailsNow, YearNow, MonthNow, CreatedTime)
    VALUES (@DateNow, @AmountNow, @DetailsNow, @Year, @Month, GETDATE());

    SELECT CAST(SCOPE_IDENTITY() AS int);
END
GO

/****** Object:  StoredProcedure [dbo].[sp_UpdateBudgetVerificationNow]    Script Date: 2026-02-02 ******/
IF OBJECT_ID('dbo.sp_UpdateBudgetVerificationNow', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_UpdateBudgetVerificationNow
GO
CREATE PROCEDURE [dbo].[sp_UpdateBudgetVerificationNow]
    @IdNow int,
    @Year int,
    @Month int,
    @DateNow datetime = NULL,
    @AmountNow decimal(18,2),
    @DetailsNow nvarchar(max) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE BudgetVerificationNow
    SET DateNow = @DateNow,
        AmountNow = @AmountNow,
        DetailsNow = @DetailsNow,
        YearNow = @Year,
        MonthNow = @Month
    WHERE IdNow = @IdNow;

    SELECT @@ROWCOUNT;
END
GO