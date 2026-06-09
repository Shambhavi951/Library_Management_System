import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = 'postgresql://neondb_owner:npg_Weo6v1uPaLyK@ep-cold-wind-ap3kkg8c.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function init() {
  console.log('Connecting to Neon PostgreSQL...');
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  await client.connect();
  console.log('Connected!');

  try {
    const schemaPath = path.join(__dirname, '../../../postgres_schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Running clean Postgres schema script...');
    await client.query(schemaSql);
    console.log('PostgreSQL Database Schema Created successfully on Neon!');

  } catch (err) {
    console.error('Initialization error:', err);
  } finally {
    await client.end();
  }
}

init();
