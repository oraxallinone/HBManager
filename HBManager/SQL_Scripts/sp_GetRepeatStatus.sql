CREATE OR ALTER PROCEDURE dbo.sp_GetRepeatStatus
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @cols nvarchar(max), @query nvarchar(max);

    SELECT @cols = STRING_AGG(QUOTENAME(YearMonth), ', ')
                   WITHIN GROUP (ORDER BY [Year] DESC, [Month] DESC)
    FROM
    (
        SELECT DISTINCT
                TRY_CONVERT(int, YearName) AS [Year],
                TRY_CONVERT(int, MonthName) AS [Month],
                CONCAT(TRY_CONVERT(int, YearName), '-', RIGHT('0' + CAST(TRY_CONVERT(int, MonthName) AS varchar(2)), 2)) AS YearMonth
            FROM dbo.SalaryMaster
            WHERE TRY_CONVERT(int, YearName) IS NOT NULL
              AND TRY_CONVERT(int, MonthName) BETWEEN 1 AND 12
    ) AS ym;

    IF @cols IS NULL
    BEGIN
        SELECT TOP (0)
            CAST(NULL AS int) AS G1_Id, CAST(NULL AS nvarchar(200)) AS G1_Name,
            CAST(NULL AS int) AS G2_Id, CAST(NULL AS nvarchar(200)) AS G2_Name,
            CAST(NULL AS int) AS G3_Id, CAST(NULL AS nvarchar(200)) AS G3_Name,
            CAST(NULL AS int) AS G4_Id, CAST(NULL AS nvarchar(200)) AS G4_Name;
        RETURN;
    END;

    SET @query = N'
    WITH AggregatedData AS
    (
        SELECT
            CONCAT(TRY_CONVERT(int, sm.YearName), ''-'', RIGHT(''0'' + CAST(TRY_CONVERT(int, sm.MonthName) AS varchar(2)), 2)) AS YearMonth,
            b.[G1] AS G1_Id, gm1.GroupName AS G1_Name,
            b.[G2] AS G2_Id, gm2.GroupName AS G2_Name,
            b.[G3] AS G3_Id, gm3.GroupName AS G3_Name,
            b.[G4] AS G4_Id, gm4.GroupName AS G4_Name,
            SUM(b.Amount) AS Amount
        FROM dbo.Budget b
        INNER JOIN dbo.SalaryMaster sm
            ON b.SpendDate >= CAST(sm.FromData AS date)
           AND b.SpendDate < DATEADD(day, 1, CAST(sm.ToDate AS date))
        LEFT JOIN dbo.GroupMaster gm1 ON b.[G1] = gm1.GroupId
        LEFT JOIN dbo.GroupMaster gm2 ON b.[G2] = gm2.GroupId
        LEFT JOIN dbo.GroupMaster gm3 ON b.[G3] = gm3.GroupId
        INNER JOIN dbo.GroupMaster gm4 ON b.[G4] = gm4.GroupId
        WHERE b.[G4] = 5
        GROUP BY
            sm.YearName, sm.MonthName, b.[G1], gm1.GroupName,
            b.[G2], gm2.GroupName, b.[G3], gm3.GroupName,
            b.[G4], gm4.GroupName
            HAVING SUM(b.Amount) <> 0
    )
    SELECT G1_Id, G1_Name, G2_Id, G2_Name, G3_Id, G3_Name, G4_Id, G4_Name, ' + @cols + N'
    FROM AggregatedData
    PIVOT (SUM(Amount) FOR YearMonth IN (' + @cols + N')) AS pvt
    ORDER BY G1_Name, G2_Name, G3_Name;';

    EXEC sys.sp_executesql @query;

    SELECT YearMonth, G1, G2, G3, G4
    FROM dbo.RepeatStatus
    WHERE G4 = 5;
END;
GO

IF OBJECT_ID('dbo.RepeatStatus', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.RepeatStatus
    (
        Id int IDENTITY(1,1) NOT NULL CONSTRAINT PK_RepeatStatus PRIMARY KEY,
        YearMonth char(7) NOT NULL,
        G1 int NULL,
        G2 int NULL,
        G3 int NULL,
        G4 int NOT NULL,
        CreatedTime datetime NOT NULL CONSTRAINT DF_RepeatStatus_CreatedTime DEFAULT GETDATE()
    );
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_SetRepeatStatus
    @Year int,
    @Month int,
    @G1 int = NULL,
    @G2 int = NULL,
    @G3 int = NULL,
    @G4 int = NULL,
    @Completed bit = 0
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @YearMonth char(7) = CONCAT(@Year, '-', RIGHT('0' + CAST(@Month AS varchar(2)), 2));

    IF @Completed = 1
        MERGE dbo.RepeatStatus AS target
        USING (SELECT @YearMonth AS YearMonth, @G1 AS G1, @G2 AS G2, @G3 AS G3, @G4 AS G4) AS source
        ON target.YearMonth = source.YearMonth
           AND ISNULL(target.G1, -1) = ISNULL(source.G1, -1)
           AND ISNULL(target.G2, -1) = ISNULL(source.G2, -1)
           AND ISNULL(target.G3, -1) = ISNULL(source.G3, -1)
           AND target.G4 = source.G4
        WHEN NOT MATCHED THEN INSERT (YearMonth, G1, G2, G3, G4) VALUES (source.YearMonth, source.G1, source.G2, source.G3, source.G4);
    ELSE
        DELETE FROM dbo.RepeatStatus
        WHERE YearMonth = @YearMonth
          AND ISNULL(G1, -1) = ISNULL(@G1, -1)
          AND ISNULL(G2, -1) = ISNULL(@G2, -1)
          AND ISNULL(G3, -1) = ISNULL(@G3, -1)
          AND G4 = @G4;
END;
GO
