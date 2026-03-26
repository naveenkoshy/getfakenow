import { createConnection } from 'mysql2/promise';

const conn = await createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute(
  'SELECT p.id, p.name, p.slug, c.name as categoryName FROM products p LEFT JOIN categories c ON p.categoryId = c.id ORDER BY p.id'
);
console.log(JSON.stringify(rows));
await conn.end();
process.exit(0);
