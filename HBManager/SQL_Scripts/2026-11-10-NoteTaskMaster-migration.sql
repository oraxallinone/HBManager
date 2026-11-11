IF COL_LENGTH('dbo.NoteTracker', 'NoteDescription') IS NULL
BEGIN
    ALTER TABLE dbo.NoteTracker ADD NoteDescription NVARCHAR(MAX) NULL;
END;
GO

IF COL_LENGTH('dbo.NoteTracker', 'IsCompleted') IS NULL
BEGIN
    ALTER TABLE dbo.NoteTracker
        ADD IsCompleted BIT NOT NULL
            CONSTRAINT DF_NoteTracker_IsCompleted DEFAULT (0) WITH VALUES;
END;
GO

IF COL_LENGTH('dbo.SubNoteTracker', 'IsCompleted') IS NULL
BEGIN
    ALTER TABLE dbo.SubNoteTracker
        ADD IsCompleted BIT NOT NULL
            CONSTRAINT DF_SubNoteTracker_IsCompleted DEFAULT (0) WITH VALUES;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_getNotes
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        n.NoteId,
        n.NoteName,
        n.NoteDescription,
        n.DateOfNote,
        n.NotePriority,
        n.IsCompleted,
        COALESCE(subnotes.SubNoteCount, 0) AS SubNoteCount,
        COALESCE(subnotes.CompletedSubNoteCount, 0) AS CompletedSubNoteCount,
        COALESCE(subnotes.SubNoteNames, N'') AS SubNoteNames
    FROM dbo.NoteTracker AS n
    OUTER APPLY
    (
        SELECT
            COUNT(*) AS SubNoteCount,
            SUM(CASE WHEN sn.IsCompleted = 1 THEN 1 ELSE 0 END) AS CompletedSubNoteCount,
            STUFF
            (
                (
                    SELECT N' ' + COALESCE(searchSubNote.SubNoteName, N'')
                    FROM dbo.SubNoteTracker AS searchSubNote
                    WHERE searchSubNote.NoteId = n.NoteId
                    FOR XML PATH(''), TYPE
                ).value('.', 'NVARCHAR(MAX)'),
                1,
                1,
                N''
            ) AS SubNoteNames
        FROM dbo.SubNoteTracker AS sn
        WHERE sn.NoteId = n.NoteId
    ) AS subnotes
    ORDER BY n.NotePriority ASC;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_addNote
    @NoteName NVARCHAR(255),
    @NoteDescription NVARCHAR(MAX),
    @DateOfNote DATE,
    @NotePriority INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NULLIF(LTRIM(RTRIM(@NoteName)), N'') IS NULL
    BEGIN
        RAISERROR('Note name cannot be empty', 16, 1);
        RETURN;
    END;

    INSERT INTO dbo.NoteTracker (NoteName, NoteDescription, DateOfNote, NotePriority)
    VALUES (@NoteName, @NoteDescription, @DateOfNote, @NotePriority);

    SELECT CAST(SCOPE_IDENTITY() AS INT) AS NoteId;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_updateNote
    @NoteId INT,
    @NoteName NVARCHAR(255),
    @NoteDescription NVARCHAR(MAX),
    @DateOfNote DATE,
    @NotePriority INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.NoteTracker
    SET NoteName = @NoteName,
        NoteDescription = @NoteDescription,
        DateOfNote = @DateOfNote,
        NotePriority = @NotePriority
    WHERE NoteId = @NoteId;

    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_updateNoteCompletion
    @NoteId INT,
    @IsCompleted BIT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.NoteTracker
    SET IsCompleted = @IsCompleted
    WHERE NoteId = @NoteId;

    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_getSubNotes
    @NoteId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT SubNoteId, NoteId, SubNoteName, DateOfSubNote, IsCompleted
    FROM dbo.SubNoteTracker
    WHERE NoteId = @NoteId
    ORDER BY DateOfSubNote, SubNoteId;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_updateSubNote
    @SubNoteId INT,
    @SubNoteName NVARCHAR(255),
    @DateOfSubNote DATE
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.SubNoteTracker
    SET SubNoteName = @SubNoteName,
        DateOfSubNote = @DateOfSubNote
    WHERE SubNoteId = @SubNoteId;

    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_updateSubNoteCompletion
    @SubNoteId INT,
    @IsCompleted BIT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.SubNoteTracker
    SET IsCompleted = @IsCompleted
    WHERE SubNoteId = @SubNoteId;

    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO
