IF COL_LENGTH('dbo.StocksPurchasedTracker', 'Status') IS NULL
BEGIN
    ALTER TABLE dbo.StocksPurchasedTracker
    ADD Status varchar(20) NOT NULL
        CONSTRAINT DF_StocksPurchasedTracker_Status DEFAULT ('1') WITH VALUES;
END;
GO

UPDATE dbo.StocksPurchasedTracker
SET Status = '1'
WHERE Status IS NULL
    OR LTRIM(RTRIM(Status)) = ''
    OR Status NOT IN ('1', '2', '3', '4', '5');
GO
