import pg from 'pg';

const connectionString = 'postgresql://neondb_owner:npg_Weo6v1uPaLyK@ep-cold-wind-ap3kkg8c.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require';

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
