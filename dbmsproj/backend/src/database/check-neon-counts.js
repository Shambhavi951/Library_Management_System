import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.DB_CONNECTION_STRING;

async function check() {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  try {
    const tables = ['branches', 'membership_plans', 'owner_settings', 'subjects', 'authors', 'publications', 'books', 'inventory_copies'];
    for (const t of tables) {
      const res = await client.query(`SELECT COUNT(*) FROM ${t}`);
      console.log(`${t}: ${res.rows[0].count}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
check();
