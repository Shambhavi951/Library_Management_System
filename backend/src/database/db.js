import sql from 'mssql';
import pg from 'pg';
import { env } from '../config/env.js';

let pool;
let pgClient;
const isPg = env.db.connectionString || (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres'));

export async function getPool() {
  if (isPg) {
    if (!pgClient) {
      pgClient = new pg.Pool({
        connectionString: env.db.connectionString || process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
    }
    return pgClient;
  }

  if (!pool) {
    pool = await sql.connect(env.db);
    try {
      await pool.request().query(`
        IF NOT EXISTS (
          SELECT 1 FROM sys.columns 
          WHERE object_id = OBJECT_ID('notifications') AND name = 'branch_id'
        )
        ALTER TABLE notifications ADD branch_id INT;
        IF NOT EXISTS (
          SELECT 1 FROM sys.columns 
          WHERE object_id = OBJECT_ID('branch_transfers') AND name = 'requested_by_member_id'
        )
        ALTER TABLE branch_transfers ADD requested_by_member_id INT;
      `);
    } catch (err) {
      console.error('Failed to add branch_id to notifications table', err);
    }
  }
  return pool;
}

export { sql };

export async function query(text, inputs = {}) {
  if (isPg) {
    const db = await getPool();
    let pgText = text;
    // Convert basic T-SQL syntax helper functions to standard Postgres
    pgText = pgText
      .replace(/ISNULL\(/gi, 'COALESCE(')
      .replace(/GETDATE\(\)/gi, 'NOW()')
      .replace(/TOP 1\s+([a-zA-Z0-9_*,\s]+)\s+FROM/gi, '$1 FROM') // Simplified TOP 1 conversion helper
      .replace(/SELECT TOP\s+(\d+)/gi, 'SELECT'); // Handled by LIMIT below

    // Convert DATEADD(day, -2, date) to date + INTERVAL '-2 days'
    pgText = pgText.replace(/DATEADD\s*\(\s*(\w+)\s*,\s*(-?\d+)\s*,\s*(NOW\(\)|GETDATE\(\)|\w+)\)/gi, (match, unit, val, date) => {
      const cleanUnit = unit.toLowerCase().trim();
      return `(${date.trim()} + INTERVAL '${val} ${cleanUnit}s')`;
    });

    // Convert OUTPUT INSERTED.col_name syntax to RETURNING col_name
    const outputMatch = pgText.match(/OUTPUT\s+INSERTED\.(\w+)/i);
    if (outputMatch) {
      const colName = outputMatch[1];
      pgText = pgText.replace(/OUTPUT\s+INSERTED\.\w+/i, ''); // remove the OUTPUT clause
      pgText = pgText.trim() + ` RETURNING ${colName}`; // append RETURNING at the end
    }

    // Split by semicolon to run multiple statements if present
    const statements = pgText.split(';').map(s => s.trim()).filter(s => s.length > 0);
    const sortedKeys = Object.keys(inputs).sort((a, b) => b.length - a.length);
    let lastResult = null;
    
    for (const stmt of statements) {
      const stmtValues = [];
      let stmtText = stmt;
      let valCounter = 1;
      
      for (const key of sortedKeys) {
        const placeholder = `@${key}`;
        if (stmtText.includes(placeholder)) {
          stmtText = stmtText.replaceAll(placeholder, `$${valCounter}`);
          stmtValues.push(inputs[key]);
          valCounter++;
        }
      }
      
      const res = await db.query(stmtText, stmtValues);
      lastResult = res.rows;
    }
    
    return lastResult;
  }

  const request = (await getPool()).request();
  Object.entries(inputs).forEach(([key, value]) => request.input(key, value));
  const result = await request.query(text);
  return result.recordset;
}

export async function transaction(work) {
  if (isPg) {
    const db = await getPool();
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const result = await work(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  const trx = new sql.Transaction(await getPool());
  await trx.begin();
  try {
    const result = await work(trx);
    await trx.commit();
    return result;
  } catch (error) {
    await trx.rollback();
    throw error;
  }
}

export function trxRequest(trx, inputs = {}) {
  if (isPg) {
    // Return a custom request object for transactions that mimics sql.Request
    return {
      query: async (text) => {
        let pgText = text;
        const values = [];
        let counter = 1;
        const sortedKeys = Object.keys(inputs).sort((a, b) => b.length - a.length);
        for (const key of sortedKeys) {
          const placeholder = `@${key}`;
          if (pgText.includes(placeholder)) {
            pgText = pgText.replaceAll(placeholder, `$${counter}`);
            values.push(inputs[key]);
            counter++;
          }
        }
        pgText = pgText
          .replace(/ISNULL\(/gi, 'COALESCE(')
          .replace(/GETDATE\(\)/gi, 'NOW()');
        const res = await trx.query(pgText, values);
        return { recordset: res.rows };
      }
    };
  }

  const request = new sql.Request(trx);
  Object.entries(inputs).forEach(([key, value]) => request.input(key, value));
  return request;
}

