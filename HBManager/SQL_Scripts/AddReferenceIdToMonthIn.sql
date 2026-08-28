IF COL_LENGTH('dbo.tblMonthIn', 'ReferenceId') IS NULL
BEGIN
    ALTER TABLE dbo.tblMonthIn
    ADD ReferenceId INT NULL;
END;
GO