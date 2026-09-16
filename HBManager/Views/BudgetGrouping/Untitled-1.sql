select * from dbo.Budget
where details = 'ghee for puja'

select * from dbo.SalaryMaster

select * from [dbo].[GroupMaster]


select * from [dbo].[BudgetInitiate]
where Id = 746


select * from [dbo].[tblMonthIn]
where amountIn = 1662

select * from [dbo].[tblMonthNow]



-- IF OBJECT_ID('dbo.sp_GetRepeatStatus', 'P') IS NOT NULL
--     DROP PROCEDURE dbo.sp_GetRepeatStatus;
-- GO

-- CREATE PROCEDURE dbo.sp_GetRepeatStatus
--     @Year int,
--     @Month int
-- AS
-- BEGIN
--     SET NOCOUNT ON;

--     DECLARE @FromDate date, @ToDate date, @PivotColumns nvarchar(max), @SelectColumns nvarchar(max), @Sql nvarchar(max);
--     SELECT @FromDate = CAST(FromData AS date), @ToDate = CAST(ToDate AS date)
--     FROM dbo.SalaryMaster WHERE YearName = @Year AND MonthName = @Month;

--     SELECT @FromDate AS FromDate, @ToDate AS ToDate;
--     IF @FromDate IS NULL OR @ToDate IS NULL
--     BEGIN
--         SELECT TOP (0) CAST(NULL AS nvarchar(200)) AS G1, CAST(NULL AS nvarchar(200)) AS G2,
--             CAST(NULL AS nvarchar(200)) AS G3, CAST(NULL AS nvarchar(200)) AS G4,
--             CAST(0 AS bit) AS IsChecked;
--         RETURN;
--     END;

--     ;WITH Months AS
--     (
--         SELECT DATEFROMPARTS(YEAR(@FromDate), MONTH(@FromDate), 1) AS MonthStart
--         UNION ALL
--         SELECT DATEADD(month, 1, MonthStart) FROM Months
--         WHERE MonthStart < DATEFROMPARTS(YEAR(@ToDate), MONTH(@ToDate), 1)
--     )
--     SELECT @PivotColumns = STUFF((SELECT ',' + QUOTENAME(CONVERT(char(7), MonthStart, 120)) FROM Months FOR XML PATH(''), TYPE).value('.', 'nvarchar(max)'), 1, 1, ''),
--            @SelectColumns = STUFF((SELECT ',ISNULL(' + QUOTENAME(CONVERT(char(7), MonthStart, 120)) + ', 0) AS Month_' + REPLACE(CONVERT(char(7), MonthStart, 120), '-', '_') FROM Months FOR XML PATH(''), TYPE).value('.', 'nvarchar(max)'), 1, 1, '');

--     SET @Sql = N';WITH SourceData AS
--     (
--         SELECT G1.GroupName AS G1, G2.GroupName AS G2, G3.GroupName AS G3, G4.GroupName AS G4,
--             CONVERT(char(7), B.SpendDate, 120) AS MonthKey, B.Amount
--         FROM dbo.Budget B
--         LEFT JOIN dbo.GroupMaster G1 ON G1.Id = B.G1
--         LEFT JOIN dbo.GroupMaster G2 ON G2.Id = B.G2
--         LEFT JOIN dbo.GroupMaster G3 ON G3.Id = B.G3
--         LEFT JOIN dbo.GroupMaster G4 ON G4.Id = B.G4
--         WHERE B.SpendDate >= @FromDate AND B.SpendDate < DATEADD(day, 1, @ToDate)
--           AND G4.GroupName = ''Repeat''
--     ), Pivoted AS
--     (
--         SELECT G1, G2, G3, G4, ' + @PivotColumns + N'
--         FROM SourceData PIVOT (SUM(Amount) FOR MonthKey IN (' + @PivotColumns + N')) P
--     )
--     SELECT G1, G2, G3, G4, CAST(0 AS bit) AS IsChecked, ' + @SelectColumns + N'
--     FROM Pivoted ORDER BY G1, G2, G3, G4;';

--     EXEC sp_executesql @Sql, N'@FromDate date, @ToDate date', @FromDate, @ToDate;
-- END;
-- GO






SELECT DISTINCT
        b.[Year],
        b.[Month],
        b.[G1] AS G1_Id,
        gm1.GroupName AS G1_Name,
        b.[G2] AS G2_Id,
        gm2.GroupName AS G2_Name,
        b.[G3] AS G3_Id,
        gm3.GroupName AS G3_Name,
        b.[G4] AS G4_Id,
        gm4.GroupName AS G4_Name
    FROM dbo.Budget b
    LEFT JOIN dbo.GroupMaster gm1 ON b.[G1] = gm1.GroupId
    LEFT JOIN dbo.GroupMaster gm2 ON b.[G2] = gm2.GroupId
    LEFT JOIN dbo.GroupMaster gm3 ON b.[G3] = gm3.GroupId
    INNER JOIN dbo.GroupMaster gm4 ON b.[G4] = gm4.GroupId
    WHERE b.[G4] IS NOT NULL 
      AND b.[G4] <> 0
    ORDER BY 
        b.[Year] DESC, 
        b.[Month] DESC, 
        b.[G4];














--working one
SELECT 
    b.[Year],
    b.[Month],
    b.[G1] AS G1_Id,
    gm1.GroupName AS G1_Name,
    b.[G2] AS G2_Id,
    gm2.GroupName AS G2_Name,
    b.[G3] AS G3_Id,
    gm3.GroupName AS G3_Name,
    b.[G4] AS G4_Id,
    gm4.GroupName AS G4_Name,
    SUM(b.Amount) AS TotalAmount
FROM dbo.Budget b
LEFT JOIN dbo.GroupMaster gm1 ON b.[G1] = gm1.GroupId
LEFT JOIN dbo.GroupMaster gm2 ON b.[G2] = gm2.GroupId
LEFT JOIN dbo.GroupMaster gm3 ON b.[G3] = gm3.GroupId
INNER JOIN dbo.GroupMaster gm4 ON b.[G4] = gm4.GroupId
WHERE b.[G4] = 5
GROUP BY
    b.[Year],
    b.[Month],
    b.[G1],
    gm1.GroupName,
    b.[G2],
    gm2.GroupName,
    b.[G3],
    gm3.GroupName,
    b.[G4],
    gm4.GroupName
ORDER BY 
    b.[Year] DESC, 
    b.[Month] DESC, 
    b.[G4];





G1_Id	G1_Name	G2_Id	G2_Name	G3_Id	G3_Name	G4_Id	G4_Name	TotalAmount  <- these should be show as unique values and year-month show as header and below that values will show.











select * from GroupMaster where IsActive = 1

select * from RepeatStatus




--manoj work--


select * from [dbo].[ItemMaster]


select * from [dbo].[CounterMaster]
