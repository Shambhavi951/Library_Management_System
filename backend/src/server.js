import { createApp } from './app.js';
import { env } from './config/env.js';
import { getPool } from './database/db.js';

await getPool();

createApp().listen(env.port, () => {
  console.log(`The Reading Nook API listening on http://localhost:${env.port}`);
});
