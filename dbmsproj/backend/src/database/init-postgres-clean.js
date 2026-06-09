import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = process.env.DATABASE_URL || process.env.DB_CONNECTION_STRING;

if (!connectionString) {
  console.error('DATABASE_URL or DB_CONNECTION_STRING is not defined in environment variables');
  process.exit(1);
}

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
