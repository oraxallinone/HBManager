manojQuery

SELECT TOP (1000) [UserId]
      ,[UserName]
      ,[UserPassword]
      ,[FullName]
      ,[UserType]
      ,[IsActive]
  FROM [cbtsplco_annapurna].[dbo].[Users]

--where IDraftNo='D000014' and IsActive=1

  select * from InvoiceDetail where IDraftNo='D000015' and IsActive=1


ALTER TABLE [dbo].[InvoiceDetail]
ADD [IInternalNote] NVARCHAR(600) NULL;







  select * from ItemTransaction where DraftNoT='D000013' and IsActive=1

IDraftNo
D000001

-- ALTER TABLE [dbo].[ItemTransaction]
-- ALTER COLUMN [Quantity] DECIMAL(18, 2) NULL;


  select * from CounterMaster