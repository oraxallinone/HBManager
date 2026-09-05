-- ============================================
-- Stored Procedure: GetBudgetInitiateBySalaryMonth
-- Purpose: Fetch BudgetInitiate records within a salary period date range
-- Parameters: @Year INT, @Month INT, @BankName VARCHAR(150) = NULL
-- ============================================

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'GetBudgetInitiateBySalaryMonth')
    DROP PROCEDURE [dbo].[GetBudgetInitiateBySalaryMonth]
GO

CREATE PROCEDURE [dbo].[GetBudgetInitiateBySalaryMonth]
    @Year INT,
    @Month INT,
    @BankName VARCHAR(150) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @FromDate DATE;
    DECLARE @ToDate DATE;

    -- 1. Fetch the date range from SalaryMaster (Note: Column is FromData not FromDate)
    SELECT 
        @FromDate = CAST(FromData AS DATE), 
        @ToDate = CAST(ToDate AS DATE) 
    FROM [dbo].[SalaryMaster] 
    WHERE YearName = @Year AND MonthName = @Month;

    -- 2. Return the data from BudgetInitiate if dates were found
    IF @FromDate IS NOT NULL AND @ToDate IS NOT NULL
    BEGIN
                SELECT TOP 350
                        bi.Id,
                        bi.BankName,
                        bi.Year,
                        bi.Month,
                        bi.TransactionType,
                        bi.Amount,
                        LOWER(FORMAT(bi.TransactionDate, 'yyyy-MM-dd hh:mm tt')) AS TransactionDate,
                        bi.Details,
            CASE 
                                WHEN bi.IsTransfer = 1 THEN 'Transfered'
                                WHEN bi.IsTransfer = 0 THEN 'Skiped'
                ELSE ''
            END AS IsTransferStatus
                FROM [dbo].[BudgetInitiate] bi
                WHERE bi.TransactionDate >= @FromDate
                    AND bi.TransactionDate < DATEADD(DAY, 1, @ToDate)
                    AND (@BankName IS NULL OR @BankName = '' OR bi.BankName = @BankName)
                ORDER BY bi.TransactionDate ASC, bi.Id DESC;
    END
    ELSE
    BEGIN
        -- Return empty result set with proper column structure
        SELECT TOP 0
            Id, 
            BankName, 
            Year, 
            Month, 
            TransactionType, 
            Amount, 
            TransactionDate, 
            Details,
            '' AS IsTransferStatus
        FROM [dbo].[BudgetInitiate];
    END
END;
GO

-- ============================================
-- Test Execution
-- ============================================
-- EXEC [dbo].[GetBudgetInitiateBySalaryMonth] 2026, 6;
