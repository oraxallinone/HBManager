manojQuery

SELECT TOP (1000) [UserId]
      ,[UserName]
      ,[UserPassword]
      ,[FullName]
      ,[UserType]
      ,[IsActive]
  FROM [cbtsplco_annapurna].[dbo].[Users]





  select * from CounterMaster where counterValue =630
  update CounterMaster set counterValue=699 where id =3


    select * from InvoiceDetail where IDraftNo='D000019'

  select * from ItemTransaction where DraftNoT='D000019'


  select * from [dbo].[InvoiceDetail]

  truncate table [dbo].[InvoiceDetail]





--============================================================================================= delete form draft table

--   BEGIN TRANSACTION;

-- -- 1. Delete matching records from child table
-- DELETE FROM [dbo].[ItemTransaction]
-- WHERE [DraftNoT] IN (
--     'D000019',
--     'D000018',
--     'D000014',
--     'D000013',
--     'D000010',
--     'D000012',
--     'D000011',
--     'D000001'
-- );

-- -- 2. Delete matching records from parent table
-- DELETE FROM [dbo].[InvoiceDetail]
-- WHERE [IDraftNo] IN (
--     'D000019',
--     'D000018',
--     'D000014',
--     'D000013',
--     'D000010',
--     'D000012',
--     'D000011',
--     'D000001'
-- );

-- COMMIT TRANSACTION;
--=====================================================
2026-08-20 15:11:00.000


select * from [dbo].[StocksPurchasedTracker]


select * from budget where [Year]=2026 and [Month]=8 and Amount = 1500








--new waste tracker queries


select * from dbo.tblWasteTracker













--s==========================================================================================tock tracket Queries==============