USE LibraryDB;
GO

SELECT 'Members Count' as Category, COUNT(*) as Count FROM members
UNION ALL
SELECT 'Authors Count', COUNT(*) FROM authors
UNION ALL
SELECT 'Publications Count', COUNT(*) FROM publications
UNION ALL
SELECT 'Books Count', COUNT(*) FROM books
UNION ALL
SELECT 'User Accounts Count', COUNT(*) FROM user_accounts
UNION ALL
SELECT 'Inventory Copies Count', COUNT(*) FROM inventory_copies;
GO

-- Display first 5 members to verify Indian names and phone numbers
SELECT TOP 5 member_id, first_name, last_name, email, phone_number FROM members ORDER BY member_id ASC;
GO

-- Display first 5 authors to verify Indian authors are included
SELECT TOP 5 author_id, first_name, last_name FROM authors ORDER BY author_id DESC;
GO
