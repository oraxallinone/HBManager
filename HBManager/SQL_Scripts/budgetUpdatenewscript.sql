SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'dbo.BudgetUpdateMonth', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.BudgetUpdateMonth
    (
        Id INT IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_BudgetUpdateMonth PRIMARY KEY,
        [Year] SMALLINT NOT NULL,
        [Month] TINYINT NOT NULL,
        MonthBeginning DECIMAL(18,2) NOT NULL
            CONSTRAINT DF_BudgetUpdateMonth_MonthBeginning DEFAULT (30000),
        CreatedAt DATETIME2(0) NOT NULL
            CONSTRAINT DF_BudgetUpdateMonth_CreatedAt DEFAULT (SYSUTCDATETIME()),
        ModifiedAt DATETIME2(0) NOT NULL
            CONSTRAINT DF_BudgetUpdateMonth_ModifiedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT UQ_BudgetUpdateMonth_Year_Month UNIQUE ([Year], [Month]),
        CONSTRAINT CK_BudgetUpdateMonth_Year CHECK ([Year] BETWEEN 1 AND 9999),
        CONSTRAINT CK_BudgetUpdateMonth_Month CHECK ([Month] BETWEEN 1 AND 12),
        CONSTRAINT CK_BudgetUpdateMonth_MonthBeginning CHECK (MonthBeginning >= 0)
    );
END;
GO

IF OBJECT_ID(N'dbo.BudgetUpdateEntry', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.BudgetUpdateEntry
    (
        Id INT IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_BudgetUpdateEntry PRIMARY KEY,
        MonthId INT NOT NULL,
        EntryDateTime DATETIME2(0) NOT NULL,
        ICIValue DECIMAL(18,2) NOT NULL,
        KOTValue DECIMAL(18,2) NOT NULL,
        SBIValue DECIMAL(18,2) NOT NULL,
        SURValue DECIMAL(18,2) NOT NULL,
        CAHValue DECIMAL(18,2) NOT NULL,
        BBBValue DECIMAL(18,2) NOT NULL,
        CreatedAt DATETIME2(0) NOT NULL
            CONSTRAINT DF_BudgetUpdateEntry_CreatedAt DEFAULT (SYSUTCDATETIME()),
        ModifiedAt DATETIME2(0) NOT NULL
            CONSTRAINT DF_BudgetUpdateEntry_ModifiedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_BudgetUpdateEntry_BudgetUpdateMonth
            FOREIGN KEY (MonthId) REFERENCES dbo.BudgetUpdateMonth (Id),
        CONSTRAINT CK_BudgetUpdateEntry_FinalAmounts CHECK
        (
            ICIValue >= 0 AND KOTValue >= 0 AND SBIValue >= 0 AND
            SURValue >= 0 AND CAHValue >= 0 AND BBBValue >= 0
        )
    );
END;
GO

IF COL_LENGTH(N'dbo.BudgetUpdateEntry', N'ICIValue') IS NULL
BEGIN
    ALTER TABLE dbo.BudgetUpdateEntry
        ADD ICIValue DECIMAL(18,2) NOT NULL
            CONSTRAINT DF_BudgetUpdateEntry_ICIValue DEFAULT (0) WITH VALUES;

    IF COL_LENGTH(N'dbo.BudgetUpdateEntry', N'IciciValue') IS NOT NULL
        EXEC sys.sp_executesql N'UPDATE dbo.BudgetUpdateEntry SET ICIValue = IciciValue';
END;
GO

IF COL_LENGTH(N'dbo.BudgetUpdateEntry', N'KOTValue') IS NULL
BEGIN
    ALTER TABLE dbo.BudgetUpdateEntry
        ADD KOTValue DECIMAL(18,2) NOT NULL
            CONSTRAINT DF_BudgetUpdateEntry_KOTValue DEFAULT (0) WITH VALUES;

    IF COL_LENGTH(N'dbo.BudgetUpdateEntry', N'KotakValue') IS NOT NULL
        EXEC sys.sp_executesql N'UPDATE dbo.BudgetUpdateEntry SET KOTValue = KotakValue';
END;
GO

IF COL_LENGTH(N'dbo.BudgetUpdateEntry', N'SURValue') IS NULL
BEGIN
    ALTER TABLE dbo.BudgetUpdateEntry
        ADD SURValue DECIMAL(18,2) NOT NULL
            CONSTRAINT DF_BudgetUpdateEntry_SURValue DEFAULT (0) WITH VALUES;
END;
GO

IF COL_LENGTH(N'dbo.BudgetUpdateEntry', N'CAHValue') IS NULL
BEGIN
    ALTER TABLE dbo.BudgetUpdateEntry
        ADD CAHValue DECIMAL(18,2) NOT NULL
            CONSTRAINT DF_BudgetUpdateEntry_CAHValue DEFAULT (0) WITH VALUES;
END;
GO

IF COL_LENGTH(N'dbo.BudgetUpdateEntry', N'BBBValue') IS NULL
BEGIN
    ALTER TABLE dbo.BudgetUpdateEntry
        ADD BBBValue DECIMAL(18,2) NOT NULL
            CONSTRAINT DF_BudgetUpdateEntry_BBBValue DEFAULT (0) WITH VALUES;
END;
GO

IF EXISTS
(
    SELECT 1
    FROM sys.check_constraints
    WHERE parent_object_id = OBJECT_ID(N'dbo.BudgetUpdateEntry')
      AND name = N'CK_BudgetUpdateEntry_Amounts'
)
BEGIN
    ALTER TABLE dbo.BudgetUpdateEntry
        DROP CONSTRAINT CK_BudgetUpdateEntry_Amounts;
END;
GO

IF COL_LENGTH(N'dbo.BudgetUpdateEntry', N'HdfcValue') IS NOT NULL
    ALTER TABLE dbo.BudgetUpdateEntry DROP COLUMN HdfcValue;

IF COL_LENGTH(N'dbo.BudgetUpdateEntry', N'AxisValue') IS NOT NULL
    ALTER TABLE dbo.BudgetUpdateEntry DROP COLUMN AxisValue;

IF COL_LENGTH(N'dbo.BudgetUpdateEntry', N'IciciValue') IS NOT NULL
    ALTER TABLE dbo.BudgetUpdateEntry DROP COLUMN IciciValue;

IF COL_LENGTH(N'dbo.BudgetUpdateEntry', N'KotakValue') IS NOT NULL
    ALTER TABLE dbo.BudgetUpdateEntry DROP COLUMN KotakValue;
GO

IF NOT EXISTS
(
    SELECT 1
    FROM sys.check_constraints
    WHERE parent_object_id = OBJECT_ID(N'dbo.BudgetUpdateEntry')
      AND name = N'CK_BudgetUpdateEntry_FinalAmounts'
)
BEGIN
    ALTER TABLE dbo.BudgetUpdateEntry
        ADD CONSTRAINT CK_BudgetUpdateEntry_FinalAmounts CHECK
        (
            ICIValue >= 0 AND KOTValue >= 0 AND SBIValue >= 0 AND
            SURValue >= 0 AND CAHValue >= 0 AND BBBValue >= 0
        );
END;
GO

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.BudgetUpdateEntry')
      AND name = N'IX_BudgetUpdateEntry_MonthId_EntryDateTime'
)
BEGIN
    CREATE INDEX IX_BudgetUpdateEntry_MonthId_EntryDateTime
        ON dbo.BudgetUpdateEntry (MonthId, EntryDateTime DESC, Id DESC);
END;
GO