import pg from 'pg';

const connectionString = 'postgresql://neondb_owner:npg_Weo6v1uPaLyK@ep-cold-wind-ap3kkg8c.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function test() {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  try {
    const q = '';
    const branchId = null;
    const availableOnly = 0;
    
    // Exact SQL from catalogService.js
    let sqlText = `
      SELECT p.publication_id, p.title, p.publication_year, p.publisher_name, p.language_name,
             p.publication_type, p.popularity_score, p.publication_status, bk.isbn, bk.edition_name,
             STRING_AGG(CONCAT(a.first_name, ' ', a.last_name), ', ') AS authors,
             COUNT(DISTINCT ic.copy_id) AS total_copies,
             SUM(DISTINCT CASE WHEN ic.copy_status = 'AVAILABLE' THEN 1 ELSE 0 END) AS available_copies,
             MIN(CASE WHEN ic.copy_status = 'AVAILABLE' THEN ic.branch_id END) AS first_available_branch_id,
             ROUND(AVG(CAST(r.rating_value AS FLOAT)), 1) AS avg_rating,
             COUNT(DISTINCT r.review_id) AS review_count
      FROM publications p
      LEFT JOIN books bk ON bk.publication_id = p.publication_id
      LEFT JOIN publication_authors pa ON pa.publication_id = p.publication_id
      LEFT JOIN authors a ON a.author_id = pa.author_id
      LEFT JOIN inventory_copies ic ON ic.publication_id = p.publication_id
        AND (@branchId IS NULL OR ic.branch_id = @branchId)
      LEFT JOIN publication_reviews r ON r.publication_id = p.publication_id
      WHERE (@q = '' OR p.title LIKE CONCAT('%', @q, '%') OR bk.isbn LIKE CONCAT('%', @q, '%') OR a.last_name LIKE CONCAT('%', @q, '%'))
      GROUP BY p.publication_id, p.title, p.publication_year, p.publisher_name, p.language_name,
               p.publication_type, p.popularity_score, p.publication_status, bk.isbn, bk.edition_name
      HAVING (@availableOnly = 0 OR SUM(CASE WHEN ic.copy_status = 'AVAILABLE' THEN 1 ELSE 0 END) > 0)
      ORDER BY p.popularity_score DESC, p.title
    `;
    
    // Translate using our db.js rules
    let pgText = sqlText
      .replace(/ISNULL\(/gi, 'COALESCE(')
      .replace(/GETDATE\(\)/gi, 'NOW()')
      .replace(/TOP 1\s+([a-zA-Z0-9_*,\s]+)\s+FROM/gi, '$1 FROM')
      .replace(/SELECT TOP\s+(\d+)/gi, 'SELECT');

    const outputMatch = pgText.match(/OUTPUT\s+INSERTED\.(\w+)/i);
    if (outputMatch) {
      const colName = outputMatch[1];
      pgText = pgText.replace(/OUTPUT\s+INSERTED\.\w+/i, '');
      pgText = pgText.trim() + ` RETURNING ${colName}`;
    }

    const sortedKeys = ['q', 'branchId', 'availableOnly'];
    const inputs = { q, branchId, availableOnly };
    const stmtValues = [];
    let valCounter = 1;
    
    for (const key of sortedKeys) {
      const placeholder = `@${key}`;
      if (pgText.includes(placeholder)) {
        pgText = pgText.replaceAll(placeholder, `$${valCounter}`);
        stmtValues.push(inputs[key]);
        valCounter++;
      }
    }
    
    console.log('Testing SQL Query:', pgText);
    console.log('With values:', stmtValues);
    const res = await client.query(pgText, stmtValues);
    console.log('SUCCESS! Found books count:', res.rows.length);
  } catch (err) {
    console.error('ERROR ON QUERY:', err);
  } finally {
    await client.end();
  }
}
test();
