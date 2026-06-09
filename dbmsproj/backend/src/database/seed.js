import { query, getPool } from './db.js';
import { hashPassword } from '../auth/passwords.js';

const branches = [
  ['Fernhollow Branch', '17 Walnut Lane', '555-0101'],
  ['Mistgrove Branch', '82 Moss Street', '555-0102'],
  ['Bramblewick Branch', '4 Bluebell Court', '555-0103']
];

const subjects = [
  'Fiction',
  'Mystery & Thriller',
  'Science Fiction & Fantasy',
  'Biography & Memoir',
  'History',
  'Technology & Computer Science',
  'Self-Help & Business',
  'Science & Nature'
];

const authors = [
  { first: 'J.R.R.', last: 'Tolkien', bio: 'John Ronald Reuel Tolkien was an English writer, poet, philologist, and academic, best known as the author of the high fantasy works The Hobbit and The Lord of the Rings.' },
  { first: 'Jane', last: 'Austen', bio: 'Jane Austen was an English novelist known primarily for her six major novels, which interpret, critique and comment upon the British landed gentry at the end of the 18th century.' },
  { first: 'Ursula K.', last: 'Le Guin', bio: 'Ursula Kroeber Le Guin was an American author best known for her works of speculative fiction, including science fiction works set in her Hainish universe, and the Earthsea fantasy series.' },
  { first: 'Frank', last: 'Herbert', bio: 'Franklin Patrick Herbert Jr. was an American science fiction writer best known for his 1965 novel Dune and its five sequels.' },
  { first: 'Patrick', last: 'Rothfuss', bio: 'Patrick James Rothfuss is an American writer of epic fantasy. He is best known for his projected trilogy The Kingkiller Chronicle.' },
  { first: 'Andy', last: 'Weir', bio: 'Andrew Taylor Weir is an American novelist and former software engineer whose debut novel in 2011, The Martian, was adapted into a film.' },
  { first: 'Matt', last: 'Haig', bio: 'Matt Haig is an English novelist and journalist. He has written both fiction and non-fiction books for children and adults.' },
  { first: 'James', last: 'Clear', bio: 'James Clear is an American author, entrepreneur, and photographer, best known for his book Atomic Habits.' },
  { first: 'Robert C.', last: 'Martin', bio: 'Robert Cecil Martin, colloquially known as "Uncle Bob", is an American software engineer, instructor, and author.' },
  { first: 'George', last: 'Orwell', bio: 'Eric Arthur Blair, better known by his pen name George Orwell, was an English novelist, essayist, journalist, and critic.' },
  { first: 'Harper', last: 'Lee', bio: 'Nelle Harper Lee was an American novelist best known for her 1960 novel To Kill a Mockingbird.' },
  { first: 'F. Scott', last: 'Fitzgerald', bio: 'Francis Scott Key Fitzgerald was an American novelist, essayist, screenwriter, and short-story writer.' },
  { first: 'J.D.', last: 'Salinger', bio: 'Jerome David Salinger was an American writer who won acclaim early in life with his co-founder work on American fiction.' },
  { first: 'J.K.', last: 'Rowling', bio: 'Joanne Rowling, best known by her pen name J. K. Rowling, is a British author, philanthropist, and screenwriter.' },
  { first: 'Tara', last: 'Westover', bio: 'Tara Westover is an American memoirist, essayist, and historian. Her memoir Educated debuted at #1 on the New York Times bestseller list.' },
  { first: 'Yuval Noah', last: 'Harari', bio: 'Yuval Noah Harari is an Israeli public intellectual, historian, and a professor in the Department of History at the Hebrew University of Jerusalem.' },
  { first: 'Daniel', last: 'Kahneman', bio: 'Daniel Kahneman was an Israeli-American psychologist and economist notable for his work on the psychology of judgment and decision-making.' },
  { first: 'Thomas H.', last: 'Cormen', bio: 'Thomas H. Cormen is a co-author of Introduction to Algorithms, a widely used textbook on computer algorithms.' },
  { first: 'Erich', last: 'Gamma', bio: 'Erich Gamma is a Swiss computer scientist and co-author of the influential software engineering textbook, Design Patterns.' },
  { first: 'Kyle', last: 'Simpson', bio: 'Kyle Simpson is a prominent JavaScript software engineer, teacher, and author of the "You Don\'t Know JS" book series.' },
  { first: 'Andrew', last: 'Hunt', bio: 'Andrew Hunt is a software writer, programmer, and co-author of The Pragmatic Programmer.' },
  { first: 'Stephen', last: 'Hawking', bio: 'Stephen William Hawking was an English theoretical physicist, cosmologist, and author who was director of research at the Centre for Theoretical Cosmology at the University of Cambridge.' },
  { first: 'Walter', last: 'Isaacson', bio: 'Walter Isaacson is an American author, journalist, and professor. He has been the President and CEO of the Aspen Institute.' },
  { first: 'Alex', last: 'Michaelides', bio: 'Alex Michaelides is a Cypriot-British author and screenwriter. His debut novel, the psychological thriller The Silent Patient, was a New York Times bestseller.' },
  { first: 'Gillian', last: 'Flynn', bio: 'Gillian Schieber Flynn is an American writer. She has published three novels, Sharp Objects, Dark Places, and Gone Girl.' },
  { first: 'Ray', last: 'Bradbury', bio: 'Ray Douglas Bradbury was an American author and screenwriter. One of the most celebrated 20th-century American writers.' },
  { first: 'Aldous', last: 'Huxley', bio: 'Aldous Leonard Huxley was an English writer and philosopher. He wrote nearly fifty books.' },
  { first: 'Lois', last: 'Lowry', bio: 'Lois Lowry is an American writer. She is the author of several books for children and young adults.' },
  { first: 'Markus', last: 'Zusak', bio: 'Markus Zusak is an Australian writer. He is best known for his novel The Book Thief.' },
  { first: 'Carl', last: 'Sagan', bio: 'Carl Edward Sagan was an American astronomer, planetary scientist, cosmologist, and author.' },
  { first: 'Viktor', last: 'Frankl', bio: 'Viktor Emil Frankl was an Austrian neurologist, psychiatrist, and Holocaust survivor.' },
  { first: 'Anne', last: 'Frank', bio: 'Annelies Marie Frank was a German-Dutch diarist of Jewish heritage.' },
  { first: 'Sun', last: 'Tzu', bio: 'Sun Tzu was a Chinese general, military strategist, writer, and philosopher.' },
  { first: 'Peter', last: 'Thiel', bio: 'Peter Andreas Thiel is an American billionaire entrepreneur and venture capitalist.' },
  { first: 'Eric', last: 'Ries', bio: 'Eric Ries is an American entrepreneur and author of The Lean Startup.' },
  { first: 'Bruce', last: 'Eckel', bio: 'Bruce Eckel is the author of Thinking in Java, and many other books on programming.' },
  { first: 'Douglas', last: 'Crockford', bio: 'Douglas Crockford is best known for his ongoing involvement in the development of the JavaScript language.' },
  { first: 'Martin', last: 'Fowler', bio: 'Martin Fowler is a British software developer, author, and speaker.' },
  { first: 'Dan', last: 'Brown', bio: 'Daniel Gerhard Brown is best known for his thriller novels, including The Da Vinci Code.' },
  { first: 'Stieg', last: 'Larsson', bio: 'Karl Stieg-Erland Larsson was a Swedish journalist and writer best known for Millennium trilogy.' },
  { first: 'Agatha', last: 'Christie', bio: 'Dame Agatha Mary Clarissa Christie was an English writer known for her detective novels.' },
  { first: 'Paulo', last: 'Coelho', bio: 'Paulo Coelho de Souza is a Brazilian lyricist and novelist.' },
  { first: 'Oscar', last: 'Wilde', bio: 'Oscar Fingal O\'Flahertie Wills Wilde was an Irish poet and playwright.' },
  { first: 'Mary', last: 'Shelley', bio: 'Mary Wollstonecraft Shelley was an English novelist who wrote Frankenstein.' },
  { first: 'Bram', last: 'Stoker', bio: 'Abraham Stoker was an Irish author, best known today for Dracula.' },
  { first: 'Carlos Ruiz', last: 'Zafón', bio: 'Carlos Ruiz Zafón was a Spanish novelist. His bestseller is The Shadow of the Wind.' },
  { first: 'Cal', last: 'Newport', bio: 'Calvin C. Newport is an American computer science professor and author.' },
  { first: 'Michael', last: 'Crichton', bio: 'John Michael Crichton was an American author, screenwriter, and film director.' },
  { first: 'Jay', last: 'Asher', bio: 'Jay Asher is best known for writing the book Thirteen Reasons Why.' }
];

const booksData = [
  // Original 26
  { title: 'The Hobbit', authorFirst: 'J.R.R.', authorLast: 'Tolkien', isbn: '9780547928227', year: 1937, publisher: 'Houghton Mifflin Harcourt', pages: 310, subject: 'Science Fiction & Fantasy' },
  { title: 'Pride and Prejudice', authorFirst: 'Jane', authorLast: 'Austen', isbn: '9780141439518', year: 1813, publisher: 'Penguin Classics', pages: 432, subject: 'Fiction' },
  { title: 'The Left Hand of Darkness', authorFirst: 'Ursula K.', authorLast: 'Le Guin', isbn: '9780441478125', year: 1969, publisher: 'Ace', pages: 304, subject: 'Science Fiction & Fantasy' },
  { title: 'Dune', authorFirst: 'Frank', authorLast: 'Herbert', isbn: '9780441172719', year: 1965, publisher: 'Ace', pages: 896, subject: 'Science Fiction & Fantasy' },
  { title: 'The Name of the Wind', authorFirst: 'Patrick', authorLast: 'Rothfuss', isbn: '9780756404741', year: 2007, publisher: 'DAW', pages: 722, subject: 'Science Fiction & Fantasy' },
  { title: 'Project Hail Mary', authorFirst: 'Andy', authorLast: 'Weir', isbn: '9780593135204', year: 2021, publisher: 'Ballantine', pages: 496, subject: 'Science Fiction & Fantasy' },
  { title: 'The Midnight Library', authorFirst: 'Matt', authorLast: 'Haig', isbn: '9780525559474', year: 2020, publisher: 'Viking', pages: 304, subject: 'Science Fiction & Fantasy' },
  { title: 'Atomic Habits', authorFirst: 'James', authorLast: 'Clear', isbn: '9780735211292', year: 2018, publisher: 'Avery', pages: 320, subject: 'Self-Help & Business' },
  { title: 'Clean Code', authorFirst: 'Robert C.', authorLast: 'Martin', isbn: '9780132350884', year: 2008, publisher: 'Prentice Hall', pages: 464, subject: 'Technology & Computer Science' },
  { title: '1984', authorFirst: 'George', authorLast: 'Orwell', isbn: '9780451524935', year: 1949, publisher: 'Secker & Warburg', pages: 328, subject: 'Fiction' },
  { title: 'To Kill a Mockingbird', authorFirst: 'Harper', authorLast: 'Lee', isbn: '9780061120084', year: 1960, publisher: 'J. B. Lippincott & Co.', pages: 281, subject: 'Fiction' },
  { title: 'The Great Gatsby', authorFirst: 'F. Scott', authorLast: 'Fitzgerald', isbn: '9780743273565', year: 1925, publisher: 'Charles Scribner\'s Sons', pages: 180, subject: 'Fiction' },
  { title: 'The Catcher in the Rye', authorFirst: 'J.D.', authorLast: 'Salinger', isbn: '9780316769174', year: 1951, publisher: 'Little, Brown and Company', pages: 277, subject: 'Fiction' },
  { title: 'The Lord of the Rings', authorFirst: 'J.R.R.', authorLast: 'Tolkien', isbn: '9780618640157', year: 1954, publisher: 'George Allen & Unwin', pages: 1178, subject: 'Science Fiction & Fantasy' },
  { title: 'Harry Potter and the Sorcerer\'s Stone', authorFirst: 'J.K.', authorLast: 'Rowling', isbn: '9780590353427', year: 1997, publisher: 'Bloomsbury', pages: 309, subject: 'Science Fiction & Fantasy' },
  { title: 'Educated', authorFirst: 'Tara', authorLast: 'Westover', isbn: '9780399590504', year: 2018, publisher: 'Random House', pages: 352, subject: 'Biography & Memoir' },
  { title: 'Sapiens: A Brief History of Humankind', authorFirst: 'Yuval Noah', authorLast: 'Harari', isbn: '9780062316097', year: 2011, publisher: 'Harper', pages: 443, subject: 'History' },
  { title: 'Thinking, Fast and Slow', authorFirst: 'Daniel', authorLast: 'Kahneman', isbn: '9780374275631', year: 2011, publisher: 'Farrar, Straus and Giroux', pages: 499, subject: 'Self-Help & Business' },
  { title: 'Introduction to Algorithms', authorFirst: 'Thomas H.', authorLast: 'Cormen', isbn: '9780262033848', year: 2009, publisher: 'MIT Press', pages: 1292, subject: 'Technology & Computer Science' },
  { title: 'Design Patterns', authorFirst: 'Erich', authorLast: 'Gamma', isbn: '9780201633610', year: 1994, publisher: 'Addison-Wesley', pages: 395, subject: 'Technology & Computer Science' },
  { title: 'You Don\'t Know JS', authorFirst: 'Kyle', authorLast: 'Simpson', isbn: '9781491904152', year: 2015, publisher: 'O\'Reilly Media', pages: 150, subject: 'Technology & Computer Science' },
  { title: 'The Pragmatic Programmer', authorFirst: 'Andrew', authorLast: 'Hunt', isbn: '9780201616224', year: 1999, publisher: 'Addison-Wesley', pages: 352, subject: 'Technology & Computer Science' },
  { title: 'Brief Answers to the Big Questions', authorFirst: 'Stephen', authorLast: 'Hawking', isbn: '9781524797058', year: 2018, publisher: 'Bantam Books', pages: 256, subject: 'Science & Nature' },
  { title: 'Steve Jobs', authorFirst: 'Walter', authorLast: 'Isaacson', isbn: '9781451648539', year: 2011, publisher: 'Simon & Schuster', pages: 656, subject: 'Biography & Memoir' },
  { title: 'The Silent Patient', authorFirst: 'Alex', authorLast: 'Michaelides', isbn: '9781250301697', year: 2019, publisher: 'Celadon Books', pages: 336, subject: 'Mystery & Thriller' },
  { title: 'Gone Girl', authorFirst: 'Gillian', authorLast: 'Flynn', isbn: '9780307588371', year: 2012, publisher: 'Crown Publishing Group', pages: 415, subject: 'Mystery & Thriller' },

  // Additional 25 Books (Totaling 51 Books!)
  { title: 'Fahrenheit 451', authorFirst: 'Ray', authorLast: 'Bradbury', isbn: '9780743247221', year: 1953, publisher: 'Ballantine Books', pages: 156, subject: 'Science Fiction & Fantasy' },
  { title: 'Brave New World', authorFirst: 'Aldous', authorLast: 'Huxley', isbn: '9780060850524', year: 1932, publisher: 'Chatto & Windus', pages: 311, subject: 'Science Fiction & Fantasy' },
  { title: 'The Giver', authorFirst: 'Lois', authorLast: 'Lowry', isbn: '9780544336261', year: 1993, publisher: 'Houghton Mifflin', pages: 180, subject: 'Fiction' },
  { title: 'The Book Thief', authorFirst: 'Markus', authorLast: 'Zusak', isbn: '9780375831003', year: 2005, publisher: 'Picador', pages: 552, subject: 'History' },
  { title: 'A Brief History of Time', authorFirst: 'Stephen', authorLast: 'Hawking', isbn: '9780553380163', year: 1988, publisher: 'Bantam Books', pages: 212, subject: 'Science & Nature' },
  { title: 'Cosmos', authorFirst: 'Carl', authorLast: 'Sagan', isbn: '9780345539434', year: 1980, publisher: 'Random House', pages: 365, subject: 'Science & Nature' },
  { title: 'Man\'s Search for Meaning', authorFirst: 'Viktor', authorLast: 'Frankl', isbn: '9780807014295', year: 1946, publisher: 'Beacon Press', pages: 165, subject: 'Biography & Memoir' },
  { title: 'The Diary of a Young Girl', authorFirst: 'Anne', authorLast: 'Frank', isbn: '9780553296983', year: 1947, publisher: 'Contact Publishing', pages: 283, subject: 'Biography & Memoir' },
  { title: 'The Art of War', authorFirst: 'Sun', authorLast: 'Tzu', isbn: '9780195014761', year: -500, publisher: 'Military Publishing', pages: 100, subject: 'History' },
  { title: 'Zero to One', authorFirst: 'Peter', authorLast: 'Thiel', isbn: '9780804139298', year: 2014, publisher: 'Crown Business', pages: 224, subject: 'Self-Help & Business' },
  { title: 'The Lean Startup', authorFirst: 'Eric', authorLast: 'Ries', isbn: '9780307887894', year: 2011, publisher: 'Crown Business', pages: 336, subject: 'Self-Help & Business' },
  { title: 'Thinking in Java', authorFirst: 'Bruce', authorLast: 'Eckel', isbn: '9780131872486', year: 2006, publisher: 'Prentice Hall', pages: 1482, subject: 'Technology & Computer Science' },
  { title: 'JavaScript: The Good Parts', authorFirst: 'Douglas', authorLast: 'Crockford', isbn: '9780596517748', year: 2008, publisher: 'O\'Reilly Media', pages: 176, subject: 'Technology & Computer Science' },
  { title: 'Refactoring', authorFirst: 'Martin', authorLast: 'Fowler', isbn: '9780201485677', year: 1999, publisher: 'Addison-Wesley', pages: 448, subject: 'Technology & Computer Science' },
  { title: 'The Da Vinci Code', authorFirst: 'Dan', authorLast: 'Brown', isbn: '9780307474278', year: 2003, publisher: 'Doubleday', pages: 454, subject: 'Mystery & Thriller' },
  { title: 'The Girl with the Dragon Tattoo', authorFirst: 'Stieg', authorLast: 'Larsson', isbn: '9780307949486', year: 2005, publisher: 'Norstedts Förlag', pages: 465, subject: 'Mystery & Thriller' },
  { title: 'Murder on the Orient Express', authorFirst: 'Agatha', authorLast: 'Christie', isbn: '9780007119318', year: 1934, publisher: 'Collins Crime Club', pages: 256, subject: 'Mystery & Thriller' },
  { title: 'And Then There Were None', authorFirst: 'Agatha', authorLast: 'Christie', isbn: '9780007282630', year: 1939, publisher: 'Collins Crime Club', pages: 272, subject: 'Mystery & Thriller' },
  { title: 'The Alchemist', authorFirst: 'Paulo', authorLast: 'Coelho', isbn: '9780061122415', year: 1988, publisher: 'HarperTorch', pages: 208, subject: 'Fiction' },
  { title: 'The Picture of Dorian Gray', authorFirst: 'Oscar', authorLast: 'Wilde', isbn: '9780141439570', year: 1890, publisher: 'Ward, Lock & Co.', pages: 250, subject: 'Fiction' },
  { title: 'Frankenstein', authorFirst: 'Mary', authorLast: 'Shelley', isbn: '9780141439471', year: 1818, publisher: 'Lackington', pages: 280, subject: 'Science Fiction & Fantasy' },
  { title: 'Dracula', authorFirst: 'Bram', authorLast: 'Stoker', isbn: '9780141439846', year: 1897, publisher: 'Archival Publishing', pages: 418, subject: 'Fiction' },
  { title: 'The Shadow of the Wind', authorFirst: 'Carlos Ruiz', authorLast: 'Zafón', isbn: '9780143034902', year: 2001, publisher: 'Planeta', pages: 487, subject: 'Mystery & Thriller' },
  { title: 'Deep Work', authorFirst: 'Cal', authorLast: 'Newport', isbn: '9781455586691', year: 2016, publisher: 'Grand Central Publishing', pages: 304, subject: 'Self-Help & Business' },
  { title: 'Jurassic Park', authorFirst: 'Michael', authorLast: 'Crichton', isbn: '9780345538987', year: 1990, publisher: 'Ballantine Books', pages: 448, subject: 'Science Fiction & Fantasy' }
];

async function clearDatabase() {
  console.log('Cleaning existing tables...');
  await query('DELETE FROM borrowing_history');
  await query('DELETE FROM reading_list_items');
  await query('DELETE FROM reading_lists');
  await query('DELETE FROM publication_reviews');
  await query('DELETE FROM notifications');
  await query('DELETE FROM acquisition_requests');
  await query('DELETE FROM branch_transfers');
  await query('DELETE FROM quality_checks');
  await query('DELETE FROM book_holds');
  await query('DELETE FROM reservation_queue');
  await query('DELETE FROM borrowing_records');
  await query('DELETE FROM inventory_copies');
  await query('DELETE FROM publication_subjects');
  await query('DELETE FROM publication_authors');
  await query('DELETE FROM books');
  await query('DELETE FROM publications');
  await query('DELETE FROM subjects');
  await query('DELETE FROM authors');
  await query('DELETE FROM owner_settings');
  await query('DELETE FROM admin_profiles');
  await query('DELETE FROM user_accounts');
  await query('DELETE FROM members');
  await query('DELETE FROM membership_plans');
  await query('DELETE FROM branches');

  console.log('Resetting identity counters...');
  const identityTables = [
    'borrowing_history', 'reading_list_items', 'reading_lists', 'publication_reviews',
    'notifications', 'acquisition_requests', 'branch_transfers', 'quality_checks',
    'book_holds', 'reservation_queue', 'borrowing_records', 'inventory_copies',
    'publications', 'subjects', 'authors', 'owner_settings', 'admin_profiles',
    'user_accounts', 'members', 'membership_plans', 'branches'
  ];

  for (const table of identityTables) {
    try {
      await query(`DBCC CHECKIDENT ('${table}', RESEED, 0)`);
    } catch (e) {
      try {
        // Fallback for PostgreSQL sequence reset
        const seqName = `${table}_${table.slice(0, -1)}_id_seq`;
        // Handle irregular plural sequence naming conventions
        let actualSeq = seqName;
        if (table === 'reading_lists') actualSeq = 'reading_lists_reading_list_id_seq';
        if (table === 'reading_list_items') actualSeq = 'reading_list_items_item_id_seq';
        if (table === 'publications') actualSeq = 'publications_publication_id_seq';
        if (table === 'subjects') actualSeq = 'subjects_subject_id_seq';
        if (table === 'authors') actualSeq = 'authors_author_id_seq';
        if (table === 'owner_settings') actualSeq = 'owner_settings_setting_id_seq';
        if (table === 'admin_profiles') actualSeq = 'admin_profiles_admin_profile_id_seq';
        if (table === 'user_accounts') actualSeq = 'user_accounts_account_id_seq';
        if (table === 'members') actualSeq = 'members_member_id_seq';
        if (table === 'membership_plans') actualSeq = 'membership_plans_membership_plan_id_seq';
        if (table === 'branches') actualSeq = 'branches_branch_id_seq';
        if (table === 'borrowing_history') actualSeq = 'borrowing_history_history_id_seq';
        if (table === 'borrowing_records') actualSeq = 'borrowing_records_borrow_id_seq';
        if (table === 'inventory_copies') actualSeq = 'inventory_copies_copy_id_seq';
        if (table === 'book_holds') actualSeq = 'book_holds_hold_id_seq';
        if (table === 'reservation_queue') actualSeq = 'reservation_queue_reservation_id_seq';
        if (table === 'quality_checks') actualSeq = 'quality_checks_quality_check_id_seq';
        if (table === 'branch_transfers') actualSeq = 'branch_transfers_transfer_id_seq';
        if (table === 'acquisition_requests') actualSeq = 'acquisition_requests_acquisition_request_id_seq';
        if (table === 'notifications') actualSeq = 'notifications_notification_id_seq';
        if (table === 'publication_reviews') actualSeq = 'publication_reviews_review_id_seq';

        await query(`ALTER SEQUENCE ${actualSeq} RESTART WITH 1`);
      } catch (err) {
        console.warn(`Could not reseed table sequence for ${table}: ${err.message}`);
      }
    }
  }
}

async function seed() {
  await getPool();
  await clearDatabase();

  console.log('Seeding branches...');
  for (const [name, address, phone] of branches) {
    await query(
      `INSERT INTO branches(branch_name, address_line, contact_number, branch_status)
       VALUES(@name, @address, @phone, 'ACTIVE')`,
      { name, address, phone }
    );
  }

  console.log('Seeding membership plans...');
  await query(`
    INSERT INTO membership_plans (plan_name, monthly_cost, max_active_borrows, reservation_limit, hold_duration_hours, queue_priority, cross_branch_priority, reading_list_limit)
    VALUES 
    ('STANDARD', 299.00, 3, 5, 24, 0, 'N', 1),
    ('PREMIUM', 799.00, 8, 15, 72, 1, 'Y', 10);
  `);

  console.log('Seeding owner configuration...');
  await query(`
    INSERT INTO owner_settings(fine_per_day, premium_membership_cost, standard_membership_cost, standard_hold_hours, premium_hold_hours)
    VALUES(25.00, 799.00, 299.00, 24, 72);
  `);

  console.log('Seeding subjects...');
  for (const subjectName of subjects) {
    await query(`INSERT INTO subjects(subject_name) VALUES(@subjectName)`, { subjectName });
  }

  console.log('Seeding authors...');
  for (const author of authors) {
    await query(
      `INSERT INTO authors(first_name, last_name, biography) VALUES(@first, @last, @bio)`,
      { first: author.first, last: author.last, bio: author.bio }
    );
  }

  console.log('Seeding publications and books...');
  for (const b of booksData) {
    const [author] = await query('SELECT author_id FROM authors WHERE first_name = @first AND last_name = @last', { first: b.authorFirst, last: b.authorLast });
    const [subject] = await query('SELECT subject_id FROM subjects WHERE subject_name = @name', { name: b.subject });

    if (!author || !subject) continue;

    const [pub] = await query(
      `INSERT INTO publications(title, publication_year, publisher_name, language_name, publication_type, popularity_score, publication_status)
       OUTPUT INSERTED.publication_id
       VALUES(@title, @year, @publisher, 'English', 'BOOK', @popularity, 'AVAILABLE')`,
      {
        title: b.title,
        year: b.year,
        publisher: b.publisher,
        popularity: Math.floor(Math.random() * 60) + 40
      }
    );

    const publicationId = pub.publication_id;

    await query(
      `INSERT INTO books(publication_id, isbn, edition_name, page_count)
       VALUES(@publicationId, @isbn, 'Library Edition', @pages)`,
      { publicationId, isbn: b.isbn, pages: b.pages }
    );

    await query(
      `INSERT INTO publication_authors(publication_id, author_id, author_order)
       VALUES(@publicationId, @authorId, 1)`,
      { publicationId, authorId: author.author_id }
    );

    await query(
      `INSERT INTO publication_subjects(publication_id, subject_id)
       VALUES(@publicationId, @subjectId)`,
      { publicationId, subjectId: subject.subject_id }
    );
  }

  console.log('Seeding inventory copies...');
  const allPubs = await query('SELECT publication_id, title FROM publications');
  const sections = {
    'Fiction': 'FIC',
    'Mystery & Thriller': 'MYS',
    'Science Fiction & Fantasy': 'SFF',
    'Biography & Memoir': 'BIO',
    'History': 'HIS',
    'Technology & Computer Science': 'CS',
    'Self-Help & Business': 'BUS',
    'Science & Nature': 'SCI'
  };

  let copyIdCounter = 1;
  const conditions = ['GOOD', 'GOOD', 'GOOD', 'GOOD', 'GOOD', 'FAIR', 'FAIR', 'DAMAGED', 'LOST'];

  for (const pub of allPubs) {
    const [pubSub] = await query(
      `SELECT s.subject_name FROM publication_subjects ps 
       JOIN subjects s ON s.subject_id = ps.subject_id 
       WHERE ps.publication_id = @publicationId`,
      { publicationId: pub.publication_id }
    );
    const sectionCode = pubSub ? (sections[pubSub.subject_name] || 'GEN') : 'GEN';

    for (const branchId of [1, 2, 3]) {
      // Expanded: Seed 1-3 copies per branch depending on popularity
      const score = pub.popularity_score || 50;
      const numCopies = score > 85 ? 3 : score > 60 ? 2 : 1;
      let copyNum = 1;

      for (let c = 0; c < numCopies; c++) {
        const condition = conditions[Math.floor(Math.random() * conditions.length)];
        let status = 'AVAILABLE';
        if (condition === 'DAMAGED') {
          status = 'MAINTENANCE';
        } else if (condition === 'LOST') {
          status = 'LOST';
        }

        await query(
          `INSERT INTO inventory_copies(publication_id, branch_id, copy_number, copy_condition, copy_status, floor_number, section_code, shelf_number, rack_number, position_number, qr_identifier, barcode_identifier)
           VALUES(@publicationId, @branchId, @copyNumber, @condition, @status, @floor, @section, @shelf, @rack, @position, @qr, @barcode)`,
          {
            publicationId: pub.publication_id,
            branchId,
            copyNumber: copyNum++,
            condition,
            status,
            floor: Math.floor(Math.random() * 3) + 1,
            section: sectionCode,
            shelf: 'SH-' + (Math.floor(Math.random() * 20) + 1).toString().padStart(2, '0'),
            rack: String.fromCharCode(65 + Math.floor(Math.random() * 6)), // A to F
            position: (Math.floor(Math.random() * 15) + 1).toString(),
            qr: `RN-${pub.publication_id}-${branchId}-${copyIdCounter}`,
            barcode: `BOOK-${pub.publication_id}-${branchId}-${copyIdCounter}`
          }
        );
        copyIdCounter++;
      }
    }
  }

  console.log('Seeding user accounts, members, and admin profiles...');
  const fern = 1;
  const mist = 2;
  const bramble = 3;

  async function createAccount(username, email, password, role, memberId, branchId) {
    const { hash, salt } = await hashPassword(password);
    await query(
      `INSERT INTO user_accounts(username,email,password_hash,password_salt,role_type,member_id,branch_id)
       VALUES(@username,@email,@hash,@salt,@role,@memberId,@branchId)`,
      { username, email, hash, salt, role, memberId, branchId }
    );
  }

  async function createAdmin(email, username, password, branchId, salary) {
    await createAccount(username, email, password, 'ADMIN', null, branchId);
    await query(
      `INSERT INTO admin_profiles(account_id, branch_id, salary_amount, hire_date) 
       VALUES((SELECT account_id FROM user_accounts WHERE email = @email), @branchId, @salary, GETDATE())`,
      { email, branchId, salary }
    );
  }

  async function createMember(email, first, last, password, branchId, planName, joinDateOffsetDays = 0) {
    const [plan] = await query('SELECT membership_plan_id FROM membership_plans WHERE plan_name = @planName', { planName });
    const planId = plan.membership_plan_id;
    
    const joinDate = new Date();
    joinDate.setDate(joinDate.getDate() - joinDateOffsetDays);

    const [member] = await query(
      `INSERT INTO members(first_name,last_name,email,phone_number,home_branch_id,preferred_branch_id,membership_plan_id,join_date)
       OUTPUT INSERTED.member_id
       VALUES(@first,@last,@email,'555-0199',@branchId,@branchId,@planId,@joinDate)`,
      { email, first, last, branchId, planId, joinDate }
    );
    await createAccount(email, email, password, 'MEMBER', member.member_id, branchId);
    return member.member_id;
  }

  // Global Owner
  await createAccount('owner@readingnook.local', 'owner@readingnook.local', 'OwnerPass!2026', 'OWNER', null, null);

  // Branch Admins
  await createAdmin('fern.admin@readingnook.local', 'Fernhollow Admin', 'AdminPass!2026', fern, 72000);
  await createAdmin('mist.admin@readingnook.local', 'Mistgrove Admin', 'AdminPass!2026', mist, 75000);
  await createAdmin('bramble.admin@readingnook.local', 'Bramblewick Admin', 'AdminPass!2026', bramble, 71000);

  // Default Members
  const miraId = await createMember('member@readingnook.local', 'Mira', 'Pages', 'MemberPass!2026', fern, 'STANDARD', 30);
  const theoId = await createMember('premium@readingnook.local', 'Theo', 'Quill', 'PremiumPass!2026', mist, 'PREMIUM', 30);

  // Expanded Patrons List (20 Additional Patrons, totaling 22 members!)
  const aliceId = await createMember('alice.reading@readingnook.local', 'Alice', 'Smith', 'MemberPass!2026', fern, 'STANDARD', 25);
  const bobId = await createMember('bob.reads@readingnook.local', 'Bob', 'Johnson', 'MemberPass!2026', mist, 'PREMIUM', 22);
  const charlieId = await createMember('charlie.bookworm@readingnook.local', 'Charlie', 'Brown', 'MemberPass!2026', bramble, 'STANDARD', 20);
  const dianaId = await createMember('diana.prince@readingnook.local', 'Diana', 'Prince', 'MemberPass!2026', fern, 'PREMIUM', 18);
  const ethanId = await createMember('ethan.hunt@readingnook.local', 'Ethan', 'Hunt', 'MemberPass!2026', mist, 'STANDARD', 15);
  const fionaId = await createMember('fiona.gallagher@readingnook.local', 'Fiona', 'Gallagher', 'MemberPass!2026', bramble, 'STANDARD', 14);
  const georgeId = await createMember('george.rr@readingnook.local', 'George', 'Martin', 'MemberPass!2026', fern, 'PREMIUM', 12);
  const hannahId = await createMember('hannah.baker@readingnook.local', 'Hannah', 'Baker', 'MemberPass!2026', mist, 'STANDARD', 10);
  const ianId = await createMember('ian.malcolm@readingnook.local', 'Ian', 'Malcolm', 'MemberPass!2026', bramble, 'PREMIUM', 9);
  const juliaId = await createMember('julia.roberts@readingnook.local', 'Julia', 'Roberts', 'MemberPass!2026', fern, 'STANDARD', 8);

  const karenId = await createMember('karen.smith@readingnook.local', 'Karen', 'Smith', 'MemberPass!2026', fern, 'STANDARD', 7);
  const leoId = await createMember('leo.dicaprio@readingnook.local', 'Leo', 'DiCaprio', 'MemberPass!2026', mist, 'PREMIUM', 6);
  const monicaId = await createMember('monica.geller@readingnook.local', 'Monica', 'Geller', 'MemberPass!2026', bramble, 'STANDARD', 6);
  const neilId = await createMember('neil.armstrong@readingnook.local', 'Neil', 'Armstrong', 'MemberPass!2026', fern, 'PREMIUM', 5);
  const oliviaId = await createMember('olivia.rodrigo@readingnook.local', 'Olivia', 'Rodrigo', 'MemberPass!2026', mist, 'STANDARD', 4);
  const peterId = await createMember('peter.parker@readingnook.local', 'Peter', 'Parker', 'MemberPass!2026', bramble, 'PREMIUM', 3);
  const quentinId = await createMember('quentin.tarantino@readingnook.local', 'Quentin', 'Tarantino', 'MemberPass!2026', fern, 'STANDARD', 2);
  const rachelId = await createMember('rachel.green@readingnook.local', 'Rachel', 'Green', 'MemberPass!2026', mist, 'PREMIUM', 2);
  const samId = await createMember('sam.winchester@readingnook.local', 'Sam', 'Winchester', 'MemberPass!2026', bramble, 'STANDARD', 1);
  const tonyId = await createMember('tony.stark@readingnook.local', 'Tony', 'Stark', 'MemberPass!2026', fern, 'PREMIUM', 1);

  console.log('Seeding transaction histories and active borrows...');

  async function seedReturnedBorrow(memberId, publicationId, branchId, borrowedDaysAgo, returnedDaysAgo, finePaid = 0) {
    const [copy] = await query(
      `SELECT TOP 1 copy_id FROM inventory_copies 
       WHERE publication_id = @publicationId AND branch_id = @branchId`,
      { publicationId, branchId }
    );
    if (!copy) return;
    
    const copyId = copy.copy_id;
    const borrowedDate = new Date();
    borrowedDate.setDate(borrowedDate.getDate() - borrowedDaysAgo);
    
    const returnedDate = new Date();
    returnedDate.setDate(returnedDate.getDate() - returnedDaysAgo);
    
    const dueDate = new Date(borrowedDate);
    dueDate.setDate(dueDate.getDate() + 14);
    
    const daysKept = borrowedDaysAgo - returnedDaysAgo;

    await query(
      `INSERT INTO borrowing_records(copy_id, member_id, borrowed_date, due_date, returned_date, borrow_status, fine_amount)
       VALUES(@copyId, @memberId, @borrowedDate, @dueDate, @returnedDate, 'RETURNED', @finePaid)`,
      { copyId, memberId, borrowedDate, dueDate, returnedDate, finePaid }
    );

    await query(
      `INSERT INTO borrowing_history(member_id, copy_id, publication_id, borrowed_date, returned_date, days_kept, fine_paid)
       VALUES(@memberId, @copyId, @publicationId, @borrowedDate, @returnedDate, @daysKept, @finePaid)`,
      { memberId, copyId, publicationId, borrowedDate, returnedDate, daysKept, finePaid }
    );
  }

  async function seedActiveBorrow(memberId, publicationId, branchId, borrowedDaysAgo) {
    const [copy] = await query(
      `SELECT TOP 1 copy_id FROM inventory_copies 
       WHERE publication_id = @publicationId AND branch_id = @branchId AND copy_status = 'AVAILABLE'`,
      { publicationId, branchId }
    );
    if (!copy) return;
    
    const copyId = copy.copy_id;
    const borrowedDate = new Date();
    borrowedDate.setDate(borrowedDate.getDate() - borrowedDaysAgo);
    
    const dueDate = new Date(borrowedDate);
    dueDate.setDate(dueDate.getDate() + 14);
    
    let fineAmount = 0;
    if (borrowedDaysAgo > 14) {
      fineAmount = (borrowedDaysAgo - 14) * 25.00;
    }

    await query(
      `UPDATE inventory_copies SET copy_status = 'BORROWED' WHERE copy_id = @copyId;
       INSERT INTO borrowing_records(copy_id, member_id, borrowed_date, due_date, borrow_status, fine_amount)
       VALUES(@copyId, @memberId, @borrowedDate, @dueDate, 'ACTIVE', @fineAmount)`,
      { copyId, memberId, borrowedDate, dueDate, fineAmount }
    );
  }

  const getPubId = (title) => allPubs.find(p => p.title === title)?.publication_id;

  const hobbitId = getPubId('The Hobbit');
  const prideId = getPubId('Pride and Prejudice');
  const leftHandId = getPubId('The Left Hand of Darkness');
  const duneId = getPubId('Dune');
  const windId = getPubId('The Name of the Wind');
  const hailMaryId = getPubId('Project Hail Mary');
  const libraryId = getPubId('The Midnight Library');
  const habitsId = getPubId('Atomic Habits');
  const cleanCodeId = getPubId('Clean Code');
  const designPatternsId = getPubId('Design Patterns');
  const algorithmsId = getPubId('Introduction to Algorithms');
  const sapiensId = getPubId('Sapiens: A Brief History of Humankind');
  const ydkjsId = getPubId('You Don\'t Know JS');
  const pragmaticId = getPubId('The Pragmatic Programmer');
  
  const fahrenheitId = getPubId('Fahrenheit 451');
  const braveNewWorldId = getPubId('Brave New World');
  const giverId = getPubId('The Giver');
  const bookThiefId = getPubId('The Book Thief');
  const briefTimeId = getPubId('A Brief History of Time');
  const cosmosId = getPubId('Cosmos');
  const searchMeaningId = getPubId('Man\'s Search for Meaning');
  const youngGirlId = getPubId('The Diary of a Young Girl');
  const artWarId = getPubId('The Art of War');
  const zeroOneId = getPubId('Zero to One');
  const leanStartupId = getPubId('The Lean Startup');
  const thinkingJavaId = getPubId('Thinking in Java');
  const jsGoodPartsId = getPubId('JavaScript: The Good Parts');
  const refactoringId = getPubId('Refactoring');
  const daVinciId = getPubId('The Da Vinci Code');
  const dragonTattooId = getPubId('The Girl with the Dragon Tattoo');
  const orientExpressId = getPubId('Murder on the Orient Express');
  const noneWereLeftId = getPubId('And Then There Were None');
  const alchemistId = getPubId('The Alchemist');
  const dorianGrayId = getPubId('The Picture of Dorian Gray');
  const frankensteinId = getPubId('Frankenstein');
  const draculaId = getPubId('Dracula');
  const shadowWindId = getPubId('The Shadow of the Wind');
  const deepWorkId = getPubId('Deep Work');
  const jurassicParkId = getPubId('Jurassic Park');

  // Seed returned borrows (History)
  if (hobbitId) await seedReturnedBorrow(miraId, hobbitId, fern, 20, 10, 0);
  if (duneId) await seedReturnedBorrow(theoId, duneId, mist, 25, 18, 0);
  if (cleanCodeId) await seedReturnedBorrow(aliceId, cleanCodeId, fern, 30, 10, 150.00); // overdue
  if (habitsId) await seedReturnedBorrow(bobId, habitsId, mist, 12, 2, 0);
  if (prideId) await seedReturnedBorrow(charlieId, prideId, bramble, 15, 5, 0);
  if (hailMaryId) await seedReturnedBorrow(dianaId, hailMaryId, fern, 40, 26, 0);
  if (libraryId) await seedReturnedBorrow(ethanId, libraryId, mist, 8, 1, 0);
  if (sapiensId) await seedReturnedBorrow(fionaId, sapiensId, bramble, 18, 4, 0);
  if (pragmaticId) await seedReturnedBorrow(georgeId, pragmaticId, fern, 14, 7, 0);
  if (fahrenheitId) await seedReturnedBorrow(karenId, fahrenheitId, fern, 10, 3, 0);
  if (braveNewWorldId) await seedReturnedBorrow(leoId, braveNewWorldId, mist, 22, 10, 0);
  if (giverId) await seedReturnedBorrow(monicaId, giverId, bramble, 14, 4, 0);
  if (bookThiefId) await seedReturnedBorrow(neilId, bookThiefId, fern, 45, 20, 275.00); // overdue
  if (briefTimeId) await seedReturnedBorrow(oliviaId, briefTimeId, mist, 9, 2, 0);
  if (cosmosId) await seedReturnedBorrow(peterId, cosmosId, bramble, 16, 6, 0);
  if (searchMeaningId) await seedReturnedBorrow(quentinId, searchMeaningId, fern, 12, 4, 0);
  if (youngGirlId) await seedReturnedBorrow(rachelId, youngGirlId, mist, 30, 15, 25.00); // overdue
  if (artWarId) await seedReturnedBorrow(samId, artWarId, bramble, 15, 1, 0);
  if (zeroOneId) await seedReturnedBorrow(tonyId, zeroOneId, fern, 8, 1, 0);

  // Seed active borrows (Current Checkouts)
  if (leftHandId) await seedActiveBorrow(miraId, leftHandId, fern, 5);
  if (cleanCodeId) await seedActiveBorrow(theoId, cleanCodeId, mist, 3);
  if (prideId) await seedActiveBorrow(aliceId, prideId, fern, 10);
  if (duneId) await seedActiveBorrow(bobId, duneId, mist, 25); // Overdue
  if (habitsId) await seedActiveBorrow(charlieId, habitsId, bramble, 18); // Overdue
  if (algorithmsId) await seedActiveBorrow(dianaId, algorithmsId, fern, 7);
  if (libraryId) await seedActiveBorrow(ethanId, libraryId, mist, 6);
  if (pragmaticId) await seedActiveBorrow(fionaId, pragmaticId, bramble, 4);
  if (windId) await seedActiveBorrow(georgeId, windId, fern, 2);
  if (leanStartupId) await seedActiveBorrow(karenId, leanStartupId, fern, 9);
  if (thinkingJavaId) await seedActiveBorrow(leoId, thinkingJavaId, mist, 28); // Overdue
  if (jsGoodPartsId) await seedActiveBorrow(monicaId, jsGoodPartsId, bramble, 6);
  if (refactoringId) await seedActiveBorrow(neilId, refactoringId, fern, 3);
  if (daVinciId) await seedActiveBorrow(oliviaId, daVinciId, mist, 8);
  if (dragonTattooId) await seedActiveBorrow(peterId, dragonTattooId, bramble, 27); // Overdue
  if (orientExpressId) await seedActiveBorrow(quentinId, orientExpressId, fern, 12);
  if (noneWereLeftId) await seedActiveBorrow(rachelId, noneWereLeftId, mist, 1);
  if (alchemistId) await seedActiveBorrow(samId, alchemistId, bramble, 5);
  if (dorianGrayId) await seedActiveBorrow(tonyId, dorianGrayId, fern, 4);

  console.log('Seeding holds and reservation queues...');

  async function seedHoldReady(memberId, publicationId, branchId) {
    const [copy] = await query(
      `SELECT TOP 1 copy_id FROM inventory_copies 
       WHERE publication_id = @publicationId AND branch_id = @branchId AND copy_status = 'AVAILABLE'`,
      { publicationId, branchId }
    );
    if (!copy) return;
    
    const copyId = copy.copy_id;
    
    const [res] = await query(
      `INSERT INTO reservation_queue(member_id, publication_id, preferred_branch_id, assigned_branch_id, queue_position, reservation_status, reservation_date, hold_expiry)
       OUTPUT INSERTED.reservation_id
       VALUES(@memberId, @publicationId, @branchId, @branchId, 0, 'ON_HOLD', DATEADD(day, -2, GETDATE()), DATEADD(hour, 24, GETDATE()))`,
      { memberId, publicationId, branchId }
    );
    
    const reservationId = res.reservation_id;
    
    const [hold] = await query(
      `UPDATE inventory_copies SET copy_status = 'ON_HOLD' WHERE copy_id = @copyId;
       INSERT INTO book_holds(reservation_id, copy_id, member_id, hold_created, hold_expiry, hold_status)
       OUTPUT INSERTED.hold_id
       VALUES(@reservationId, @copyId, @memberId, GETDATE(), DATEADD(hour, 24, GETDATE()), 'ACTIVE')`,
      { reservationId, copyId, memberId }
    );

    const holdId = hold.hold_id;

    // Admin pickup notifications
    await query(
      `INSERT INTO notifications(member_id, notification_type, title, message_body, read_status, branch_id, created_date)
       VALUES(NULL, 'BOOK_READY_ADMIN', 'Reserved Book Ready', @msg, 'N', @branchId, GETDATE())`,
      {
        msg: `[Hold #${holdId}] Copy #${copyId} is ready for pickup by member #${memberId}.`,
        branchId
      }
    );

    // Member pickup notification
    await query(
      `INSERT INTO notifications(member_id, notification_type, title, message_body, read_status, branch_id, created_date)
       VALUES(@memberId, 'BOOK_READY', 'Book ready for pickup', 'A reserved book is now on hold for you.', 'N', NULL, GETDATE())`,
      { memberId }
    );
  }

  // Holds ready for pickup
  if (hobbitId) await seedHoldReady(miraId, hobbitId, fern);
  if (hailMaryId) await seedHoldReady(theoId, hailMaryId, mist);
  if (cleanCodeId) await seedHoldReady(bobId, cleanCodeId, mist);
  if (frankensteinId) await seedHoldReady(neilId, frankensteinId, fern);
  if (draculaId) await seedHoldReady(tonyId, draculaId, fern);

  // Seeding queued reservations (waiting in line)
  if (cleanCodeId) {
    await query(
      `INSERT INTO reservation_queue(member_id, publication_id, preferred_branch_id, assigned_branch_id, queue_position, reservation_status, reservation_date)
       VALUES 
       (@ethanId, @cleanCodeId, @mist, @mist, 1, 'QUEUED', DATEADD(day, -1, GETDATE())),
       (@hannahId, @cleanCodeId, @mist, @mist, 2, 'QUEUED', GETDATE())`,
      { ethanId, hannahId, cleanCodeId, mist }
    );
  }
  if (duneId) {
    await query(
      `INSERT INTO reservation_queue(member_id, publication_id, preferred_branch_id, assigned_branch_id, queue_position, reservation_status, reservation_date)
       VALUES (@ianId, @duneId, @bramble, @bramble, 1, 'QUEUED', GETDATE())`,
      { ianId, duneId, bramble }
    );
  }

  console.log('Seeding branch transfers...');

  async function seedTransfer(publicationId, sourceBranchId, destBranchId, status, requestedDaysAgo, arrivalDaysAgo = null) {
    const [copy] = await query(
      `SELECT TOP 1 copy_id FROM inventory_copies 
       WHERE publication_id = @publicationId AND branch_id = @sourceBranchId AND copy_status = 'AVAILABLE'`,
      { publicationId, sourceBranchId }
    );
    if (!copy) return;

    const copyId = copy.copy_id;
    const requestedDate = new Date();
    requestedDate.setDate(requestedDate.getDate() - requestedDaysAgo);
    
    let arrivalDate = null;
    if (arrivalDaysAgo !== null) {
      arrivalDate = new Date();
      arrivalDate.setDate(arrivalDate.getDate() - arrivalDaysAgo);
    }

    if (status === 'IN_TRANSIT' || status === 'APPROVED' || status === 'REQUESTED') {
      await query(`UPDATE inventory_copies SET copy_status = 'IN_TRANSIT' WHERE copy_id = @copyId`, { copyId });
    } else if (status === 'SHELVED' || status === 'ARRIVED') {
      await query(`UPDATE inventory_copies SET branch_id = @destBranchId, copy_status = 'AVAILABLE' WHERE copy_id = @copyId`, { destBranchId, copyId });
    }

    await query(
      `INSERT INTO branch_transfers(copy_id, source_branch_id, destination_branch_id, transfer_status, requested_date, arrival_date)
       VALUES(@copyId, @sourceBranchId, @destBranchId, @status, @requestedDate, @arrivalDate)`,
      { copyId, sourceBranchId, destBranchId, status, requestedDate, arrivalDate }
    );
  }

  if (designPatternsId) await seedTransfer(designPatternsId, mist, bramble, 'REQUESTED', 1);
  if (ydkjsId) await seedTransfer(ydkjsId, fern, mist, 'IN_TRANSIT', 3);
  if (sapiensId) await seedTransfer(sapiensId, fern, bramble, 'SHELVED', 10, 8);
  if (shadowWindId) await seedTransfer(shadowWindId, fern, mist, 'REQUESTED', 2);

  console.log('Seeding quality checks...');

  async function seedQualityCheck(publicationId, branchId, prevCond, nextCond, remarks, daysAgo) {
    const [copy] = await query(
      `SELECT TOP 1 copy_id FROM inventory_copies 
       WHERE publication_id = @publicationId AND branch_id = @branchId`,
      { publicationId, branchId }
    );
    if (!copy) return;

    const copyId = copy.copy_id;
    const inspectionDate = new Date();
    inspectionDate.setDate(inspectionDate.getDate() - daysAgo);
    
    await query(
      `INSERT INTO quality_checks(copy_id, previous_condition, updated_condition, remarks, inspection_date)
       VALUES(@copyId, @prevCond, @nextCond, @remarks, @inspectionDate);
       UPDATE inventory_copies SET copy_condition = @nextCond, copy_status = @status WHERE copy_id = @copyId`,
      {
        copyId,
        prevCond,
        nextCond,
        remarks,
        inspectionDate,
        status: nextCond === 'DAMAGED' ? 'MAINTENANCE' : nextCond === 'LOST' ? 'LOST' : 'AVAILABLE'
      }
    );
  }

  if (pragmaticId) await seedQualityCheck(pragmaticId, mist, 'GOOD', 'FAIR', 'Cover corners bent, pages intact.', 5);
  if (designPatternsId) await seedQualityCheck(designPatternsId, fern, 'GOOD', 'DAMAGED', 'Spine splits. Needs bindings repair.', 15);

  console.log('Seeding acquisition requests...');
  const acqRequests = [
    { memberId: miraId, title: 'The Silent Patient', author: 'Alex Michaelides', isbn: '9781250301697', branchId: 1, priority: 'NORMAL', status: 'AVAILABLE' },
    { memberId: aliceId, title: 'Deep Work', author: 'Cal Newport', isbn: '9781455586691', branchId: 1, priority: 'NORMAL', status: 'REQUESTED' },
    { memberId: bobId, title: 'Jurassic Park', author: 'Michael Crichton', isbn: '9780345538987', branchId: 2, priority: 'HIGH', status: 'ORDERED' },
    { memberId: charlieId, title: 'Atomic Habits', author: 'James Clear', isbn: '9780735211292', branchId: 3, priority: 'LOW', status: 'AVAILABLE' },
    { memberId: hannahId, title: 'Thirteen Reasons Why', author: 'Jay Asher', isbn: '9781595141880', branchId: 2, priority: 'NORMAL', status: 'REJECTED' },
    { memberId: tonyId, title: 'Zero to One', author: 'Peter Thiel', isbn: '9780804139298', branchId: 1, priority: 'HIGH', status: 'AVAILABLE' }
  ];
  for (const req of acqRequests) {
    await query(
      `INSERT INTO acquisition_requests(member_id, requested_title, requested_author, requested_isbn, preferred_branch_id, priority_level, request_status)
       VALUES(@memberId, @title, @author, @isbn, @branchId, @priority, @status)`,
      {
        memberId: req.memberId,
        title: req.title,
        author: req.author,
        isbn: req.isbn,
        branchId: req.branchId,
        priority: req.priority,
        status: req.status
      }
    );
  }

  console.log('Seeding reviews...');
  async function seedReview(memberId, publicationId, rating, text) {
    if (!publicationId) return;
    await query(
      `INSERT INTO publication_reviews(publication_id, member_id, rating_value, review_text)
       VALUES(@publicationId, @memberId, @rating, @text)`,
      { memberId, publicationId, rating, text }
    );
  }

  await seedReview(miraId, hobbitId, 5, 'An absolute masterpiece of high fantasy. Tolkien\'s worldbuilding is legendary!');
  await seedReview(theoId, prideId, 4, 'A delightful satire of nineteenth-century society. Jane Austen\'s wit remains unmatched.');
  await seedReview(bobId, cleanCodeId, 5, 'Essential reading for any software engineer. It completely changed the way I write programs.');
  await seedReview(charlieId, habitsId, 5, 'Incredibly practical advice for building habits and improving daily systems. Highly recommended.');
  await seedReview(dianaId, duneId, 4, 'A sweeping sci-fi epic. The political intrigues are fascinating, although the middle chapters drag a bit.');
  await seedReview(karenId, fahrenheitId, 5, 'Chilling dystopia. Ray Bradbury\'s warning about the decline of reading feels eerily relevant.');
  await seedReview(leoId, braveNewWorldId, 4, 'Terrifying look at a genetically engineered future. Huxley writes with absolute brilliance.');
  await seedReview(peterId, cosmosId, 5, 'Carl Sagan makes the vastness of the universe feel accessible and poetic. Best book ever!');

  console.log('Seeding reading lists...');
  async function seedReadingList(memberId, name, visibility, pubIds) {
    const validPubIds = pubIds.filter(id => id !== undefined && id !== null);
    if (!validPubIds.length) return;
    
    const [list] = await query(
      `INSERT INTO reading_lists(member_id, list_name, visibility_status)
       OUTPUT INSERTED.reading_list_id
       VALUES(@memberId, @name, @visibility)`,
      { memberId, name, visibility }
    );
    const listId = list.reading_list_id;
    for (const pubId of validPubIds) {
      await query(
        `INSERT INTO reading_list_items(reading_list_id, publication_id)
         VALUES(@listId, @pubId)`,
         { listId, pubId }
      );
    }
  }

  await seedReadingList(miraId, 'My Favorite Sci-Fi', 'PUBLIC', [duneId, leftHandId, hailMaryId]);
  await seedReadingList(theoId, 'Must Read Classics', 'PUBLIC', [prideId, hobbitId]);
  await seedReadingList(bobId, 'Developer Bookshelf', 'PRIVATE', [cleanCodeId, designPatternsId, ydkjsId]);
  await seedReadingList(tonyId, 'Tech Leadership', 'PUBLIC', [zeroOneId, leanStartupId, pragmaticId]);

  console.log('Seeding extra notifications...');
  // Overdue alerts
  await query(
    `INSERT INTO notifications(member_id, notification_type, title, message_body, read_status, branch_id, created_date)
     VALUES 
     (@bobId, 'OVERDUE_ALERT', 'Overdue Book Warning', 'Your checkout of Dune is overdue! Please return it to avoid further fines.', 'N', NULL, DATEADD(day, -2, GETDATE())),
     (@charlieId, 'OVERDUE_ALERT', 'Overdue Book Warning', 'Your checkout of Atomic Habits is overdue! Please return it to avoid further fines.', 'N', NULL, DATEADD(day, -1, GETDATE()))`,
    { bobId, charlieId }
  );

  // Welcome notices
  const memberIds = [miraId, theoId, aliceId, bobId, charlieId, dianaId, ethanId, fionaId, georgeId, hannahId, ianId, juliaId, karenId, leoId, monicaId, neilId, oliviaId, peterId, quentinId, rachelId, samId, tonyId];
  for (const mid of memberIds) {
    await query(
      `INSERT INTO notifications(member_id, notification_type, title, message_body, read_status, branch_id, created_date)
       VALUES(@mid, 'WELCOME', 'Welcome to The Reading Nook!', 'We are excited to have you as part of our intelligent library management network.', 'N', NULL, DATEADD(day, -4, GETDATE()))`,
      { mid }
    );
  }

  console.log('Seed complete.');
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
