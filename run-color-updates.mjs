import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';

const sql = readFileSync('/home/ubuntu/update_color_images.sql', 'utf-8');
const statements = sql.split('\n').filter(s => s.trim().length > 0);

console.log(`Executing ${statements.length} UPDATE statements...`);

const conn = await createConnection(process.env.DATABASE_URL);

let success = 0;
let failed = 0;

for (const stmt of statements) {
  try {
    const [result] = await conn.execute(stmt);
    if (result.affectedRows > 0) {
      success++;
    } else {
      console.log(`No rows affected: ${stmt.substring(0, 80)}...`);
      failed++;
    }
  } catch (err) {
    console.error(`Error: ${err.message} for: ${stmt.substring(0, 80)}...`);
    failed++;
  }
}

console.log(`Done: ${success} updated, ${failed} failed/no-match`);
await conn.end();
process.exit(0);
