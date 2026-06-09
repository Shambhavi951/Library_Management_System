import { query } from '../database/db.js';

export async function listBranches() {
  return query('SELECT * FROM branches ORDER BY branch_name');
}

export async function searchCatalog({ q = '', branchId = null, availableOnly = false }) {
  return query(
    `SELECT p.publication_id, p.title, p.publication_year, p.publisher_name, p.language_name,
            p.publication_type, p.popularity_score, p.publication_status, bk.isbn, bk.edition_name,
            STRING_AGG(CONCAT(a.first_name, ' ', a.last_name), ', ') AS authors,
            COUNT(DISTINCT ic.copy_id) AS total_copies,
            SUM(DISTINCT CASE WHEN ic.copy_status = 'AVAILABLE' THEN 1 ELSE 0 END) AS available_copies,
            MIN(CASE WHEN ic.copy_status = 'AVAILABLE' THEN ic.branch_id END) AS first_available_branch_id,
            ROUND(CAST(AVG(r.rating_value) AS numeric), 1) AS avg_rating,
            COUNT(DISTINCT r.review_id) AS review_count
     FROM publications p
     LEFT JOIN books bk ON bk.publication_id = p.publication_id
     LEFT JOIN publication_authors pa ON pa.publication_id = p.publication_id
     LEFT JOIN authors a ON a.author_id = pa.author_id
     LEFT JOIN inventory_copies ic ON ic.publication_id = p.publication_id
       AND (CAST(@branchId AS INT) IS NULL OR ic.branch_id = CAST(@branchId AS INT))
     LEFT JOIN publication_reviews r ON r.publication_id = p.publication_id
     WHERE (@q = '' OR p.title LIKE CONCAT('%', @q, '%') OR bk.isbn LIKE CONCAT('%', @q, '%') OR a.last_name LIKE CONCAT('%', @q, '%'))
     GROUP BY p.publication_id, p.title, p.publication_year, p.publisher_name, p.language_name,
              p.publication_type, p.popularity_score, p.publication_status, bk.isbn, bk.edition_name
     HAVING (@availableOnly = 0 OR SUM(CASE WHEN ic.copy_status = 'AVAILABLE' THEN 1 ELSE 0 END) > 0)
     ORDER BY p.popularity_score DESC, p.title`,
    { q, branchId, availableOnly: availableOnly ? 1 : 0 }
  );
}

export async function getBookDetails(publicationId) {
  const [book] = await query(
    `SELECT p.*, bk.isbn, bk.edition_name, bk.page_count,
            STRING_AGG(CONCAT(a.first_name, ' ', a.last_name), ', ') AS authors
     FROM publications p
     LEFT JOIN books bk ON bk.publication_id = p.publication_id
     LEFT JOIN publication_authors pa ON pa.publication_id = p.publication_id
     LEFT JOIN authors a ON a.author_id = pa.author_id
     WHERE p.publication_id = @publicationId
     GROUP BY p.publication_id, p.title, p.publication_year, p.publisher_name, p.language_name,
              p.publication_type, p.popularity_score, p.publication_status, bk.isbn, bk.edition_name, bk.page_count`,
    { publicationId }
  );
  const copies = await query(
    `SELECT ic.*, b.branch_name
     FROM inventory_copies ic JOIN branches b ON b.branch_id = ic.branch_id
     WHERE ic.publication_id = @publicationId
     ORDER BY b.branch_name, ic.copy_number`,
    { publicationId }
  );
  const reviews = await query(
    `SELECT r.*, CONCAT(m.first_name, ' ', m.last_name) AS reviewer
     FROM publication_reviews r JOIN members m ON m.member_id = r.member_id
     WHERE r.publication_id = @publicationId ORDER BY r.review_id DESC`,
    { publicationId }
  );
  return { ...book, copies, reviews };
}

export async function branchIntelligence(publicationId) {
  return query(
    `SELECT b.branch_id, b.branch_name,
            SUM(CASE WHEN ic.copy_status = 'AVAILABLE' THEN 1 ELSE 0 END) AS available_copies,
            COUNT(r.reservation_id) AS queue_length,
            CASE
              WHEN SUM(CASE WHEN ic.copy_status = 'AVAILABLE' THEN 1 ELSE 0 END) > 0 THEN 0
              ELSE COUNT(r.reservation_id) * 2
            END AS estimated_wait_days
     FROM branches b
     LEFT JOIN inventory_copies ic ON ic.branch_id = b.branch_id AND ic.publication_id = @publicationId
     LEFT JOIN reservation_queue r ON r.assigned_branch_id = b.branch_id
       AND r.publication_id = @publicationId AND r.reservation_status IN ('QUEUED','ON_HOLD')
     GROUP BY b.branch_id, b.branch_name
     ORDER BY estimated_wait_days, available_copies DESC`,
    { publicationId }
  );
}

export async function listPublications() {
  return query(
    `SELECT publication_id, title 
     FROM publications 
     WHERE publication_status <> 'REMOVED' 
     ORDER BY title`
  );
}
