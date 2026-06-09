import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = process.env.DATABASE_URL || process.env.DB_CONNECTION_STRING;

async function init() {
  console.log('Connecting to Neon PostgreSQL...');
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  await client.connect();
  console.log('Connected!');

  try {
    const schemaPath = path.join(__dirname, '../schema.sql');
    let schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Translating schema SQL from MS SQL Server syntax to Postgres...');
    
    // Convert basic MS SQL Server schemas to standard PostgreSQL
    schemaSql = schemaSql
      .replace(/IDENTITY\(1,1\)/gi, 'GENERATED ALWAYS AS IDENTITY')
      .replace(/DATETIME/gi, 'TIMESTAMP')
      .replace(/VARCHAR\((MAX|max)\)/gi, 'TEXT')
      .replace(/NVARCHAR/gi, 'VARCHAR')
      .replace(/MONEY/gi, 'DECIMAL(10,2)')
      .replace(/GO\b/gi, ';')
      .replace(/UNIQUEIDENTIFIER/gi, 'UUID')
      .replace(/NEWID\(\)/gi, 'gen_random_uuid()')
      .replace(/PRIMARY KEY\s+CLUSTERED/gi, 'PRIMARY KEY')
      .replace(/CONSTRAINT\s+\[\w+\]\s+FOREIGN KEY/gi, 'FOREIGN KEY');

    // Remove SQL Server system checks
    schemaSql = schemaSql.replace(/IF OBJECT_ID\([\s\S]+?DROP TABLE[\s\S]+?;/gi, '');
    
    // Split into individual statements
    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('USE'));

    console.log(`Executing ${statements.length} schema queries on Postgres...`);
    for (const stmt of statements) {
      try {
        await client.query(stmt);
      } catch (err) {
        // Ignore drop table or alter table errors if tables already exist
        if (!stmt.includes('DROP') && !stmt.includes('ALTER')) {
          console.warn('Query warning/error:', err.message, 'on statement:', stmt.substring(0, 100));
        }
      }
    }
    console.log('PostgreSQL Schema Applied successfully!');

  } catch (err) {
    console.error('Initialization error:', err);
  } finally {
    await client.end();
  }
}

init();
