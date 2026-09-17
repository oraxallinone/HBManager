/* Group mapping configuration persistence */
CREATE OR ALTER PROCEDURE dbo.sp_GetGroupMasterByGroupname
    @GroupType VARCHAR(250)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT [Id], [GroupName], [GroupType], [IsActive], [IsFixedAmt], [Amt]
    FROM dbo.GroupMaster
    WHERE [GroupType] = @GroupType
    ORDER BY [GroupName];
END;
GO

IF OBJECT_ID('dbo.GroupMappingConfiguration', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.GroupMappingConfiguration
    (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_GroupMappingConfiguration PRIMARY KEY,
        MappingGroup VARCHAR(2) NOT NULL,
        G1Id INT NOT NULL CONSTRAINT DF_GroupMappingConfiguration_G1Id DEFAULT (0),
        G2Id INT NOT NULL CONSTRAINT DF_GroupMappingConfiguration_G2Id DEFAULT (0),
        G3Id INT NOT NULL CONSTRAINT DF_GroupMappingConfiguration_G3Id DEFAULT (0),
        G4Id INT NOT NULL CONSTRAINT DF_GroupMappingConfiguration_G4Id DEFAULT (0),
        CONSTRAINT CK_GroupMappingConfiguration_MappingGroup CHECK (MappingGroup IN ('g1', 'g2', 'g3', 'g4')),
        CONSTRAINT UQ_GroupMappingConfiguration_Combination UNIQUE (MappingGroup, G1Id, G2Id, G3Id, G4Id)
    );
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_GetGroupMappingConfigurations
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        mapping.Id,
        mapping.MappingGroup,
        mapping.G1Id,
        mapping.G2Id,
        mapping.G3Id,
        mapping.G4Id,
        ISNULL(g1.GroupName, '') AS G1Name,
        ISNULL(g2.GroupName, '') AS G2Name,
        ISNULL(g3.GroupName, '') AS G3Name,
        ISNULL(g4.GroupName, '') AS G4Name
    FROM dbo.GroupMappingConfiguration mapping
    LEFT JOIN dbo.GroupMaster g1 ON g1.Id = mapping.G1Id
    LEFT JOIN dbo.GroupMaster g2 ON g2.Id = mapping.G2Id
    LEFT JOIN dbo.GroupMaster g3 ON g3.Id = mapping.G3Id
    LEFT JOIN dbo.GroupMaster g4 ON g4.Id = mapping.G4Id
    ORDER BY mapping.Id DESC;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_InsertGroupMappingConfiguration
    @MappingGroup VARCHAR(2),
    @G1Id INT,
    @G2Id INT,
    @G3Id INT,
    @G4Id INT
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS
    (
        SELECT 1
        FROM dbo.GroupMappingConfiguration
        WHERE MappingGroup = @MappingGroup
          AND G1Id = @G1Id AND G2Id = @G2Id AND G3Id = @G3Id AND G4Id = @G4Id
    )
    BEGIN
        SELECT -1;
        RETURN;
    END;

    INSERT INTO dbo.GroupMappingConfiguration (MappingGroup, G1Id, G2Id, G3Id, G4Id)
    VALUES (@MappingGroup, @G1Id, @G2Id, @G3Id, @G4Id);

    SELECT CONVERT(INT, SCOPE_IDENTITY());
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_UpdateGroupMappingConfiguration
    @Id INT,
    @MappingGroup VARCHAR(2),
    @G1Id INT,
    @G2Id INT,
    @G3Id INT,
    @G4Id INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.GroupMappingConfiguration WHERE Id = @Id)
    BEGIN
        SELECT 0;
        RETURN;
    END;

    IF EXISTS
    (
        SELECT 1
        FROM dbo.GroupMappingConfiguration
        WHERE MappingGroup = @MappingGroup
          AND G1Id = @G1Id AND G2Id = @G2Id AND G3Id = @G3Id AND G4Id = @G4Id
          AND Id <> @Id
    )
    BEGIN
        SELECT -1;
        RETURN;
    END;

    UPDATE dbo.GroupMappingConfiguration
    SET MappingGroup = @MappingGroup,
        G1Id = @G1Id,
        G2Id = @G2Id,
        G3Id = @G3Id,
        G4Id = @G4Id
    WHERE Id = @Id;

    SELECT @Id;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_DeleteGroupMappingConfiguration
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM dbo.GroupMappingConfiguration WHERE Id = @Id;
    SELECT @@ROWCOUNT;
END;
GO
