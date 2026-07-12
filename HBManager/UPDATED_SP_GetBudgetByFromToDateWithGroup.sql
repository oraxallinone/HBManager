-- UPDATED STORED PROCEDURE: sp_GetBudgetByFromToDateWithGroup
-- Added BankName column to the SELECT statement

CREATE PROCEDURE [dbo].[sp_GetBudgetByFromToDateWithGroup]   
    @Year INT,   
    @Month INT,   
    @g1 INT = 0,   
    @g2 INT = 0,   
    @g3 INT = 0,   
    @g4 INT = 0,   
    @isAll BIT = 0   
AS   
BEGIN   
    SET NOCOUNT ON;   
   
    DECLARE @FromDate_ DATETIME;   
    DECLARE @ToDate_ DATETIME;   
   
    ----------------------------------------------------   
    -- Fetch dates ONLY when Year/Month provided AND not "All"   
    ----------------------------------------------------   
    IF (@Year <> 0 AND @Month <> 0 AND @isAll = 0)   
    BEGIN   
        SELECT    
            @FromDate_ = FromData,   
            @ToDate_ = ToDate   
        FROM dbo.SalaryMaster   
        WHERE [YearName] = @Year    
          AND [MonthName] = @Month;   
   
        -- If no date found → return empty   
        IF @FromDate_ IS NULL OR @ToDate_ IS NULL   
        BEGIN   
            SELECT TOP 0    
                Id, [Year], [Month],  
                DATEADD(MINUTE, -750, SpendDate) AS SpendDate,  
                Amount, Details, BankName,    
                G1, G2, G3, G4, CreatedTime,   
                IsVerified   
            FROM dbo.Budget;   
            RETURN;   
        END   
    END   
   
    ----------------------------------------------------   
    -- Build Dynamic SQL (UPDATED: Added BankName)
    ----------------------------------------------------   
    DECLARE @SQL NVARCHAR(MAX) = N'   
    SELECT Id, [Year], [Month],  
           DATEADD(MINUTE, -750, SpendDate) AS SpendDate,  
           Amount, Details, BankName,   
           G1, G2, G3, G4, CreatedTime,   
           IsVerified   
    FROM dbo.Budget   
    WHERE 1 = 1';   
   
    ----------------------------------------------------   
    -- Apply Date Filter ONLY when NOT "All"   
    ----------------------------------------------------   
    IF (@Year <> 0 AND @Month <> 0 AND @isAll = 0)   
    BEGIN   
        SET @SQL += '   
        AND CAST(SpendDate AS DATE) >= @FromDate_   
        AND CAST(SpendDate AS DATE) <= @ToDate_';   
    END   
   
    ----------------------------------------------------   
    -- Apply Group Filters   
    ----------------------------------------------------   
    IF @g1 <> 0 SET @SQL += ' AND G1 = @g1';   
    IF @g2 <> 0 SET @SQL += ' AND G2 = @g2';   
    IF @g3 <> 0 SET @SQL += ' AND G3 = @g3';   
    IF @g4 <> 0 SET @SQL += ' AND G4 = @g4';   
   
    ----------------------------------------------------   
    -- ORDER BY   
    ----------------------------------------------------   
    SET @SQL += ' ORDER BY SpendDate, Id;';   
   
    ----------------------------------------------------   
    -- Execute   
    ----------------------------------------------------   
    EXEC sp_executesql    
        @SQL,   
        N'@FromDate_ DATETIME, @ToDate_ DATETIME, @g1 INT, @g2 INT, @g3 INT, @g4 INT',   
        @FromDate_, @ToDate_, @g1, @g2, @g3, @g4;   
   
END
