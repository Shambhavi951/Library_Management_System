import sql from 'mssql';
import { env } from '../config/env.js';

let pool;

export async function getPool() {
  if (!pool) {
    pool = await sql.connect(env.db);
    try {
      await pool.request().query(`
        IF NOT EXISTS (
          SELECT 1 FROM sys.columns 
          WHERE object_id = OBJECT_ID('notifications') AND name = 'branch_id'
        )
        ALTER TABLE notifications ADD branch_id INT;
      `);
    } catch (err) {
      console.error('Failed to add branch_id to notifications table', err);
    }
  }
  return pool;
}

export { sql };

export async function query(text, inputs = {}) {
  const request = (await getPool()).request();
  Object.entries(inputs).forEach(([key, value]) => request.input(key, value));
  const result = await request.query(text);
  return result.recordset;
}

export async function transaction(work) {
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
  const request = new sql.Request(trx);
  Object.entries(inputs).forEach(([key, value]) => request.input(key, value));
  return request;
}

