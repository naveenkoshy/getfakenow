import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, ".env") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

async function main() {
  // Default admin password: FakeAdmin2024!
  const defaultPassword = "FakeAdmin2024!";
  const hash = await bcrypt.hash(defaultPassword, 12);
  
  const connection = await mysql.createConnection(DATABASE_URL);
  
  // Check if user exists - use backticks for column names
  const [rows] = await connection.execute(
    "SELECT id, email, role, `passwordHash` FROM users WHERE email = ?",
    ["naveen.koshy@gmail.com"]
  );
  
  if (rows.length === 0) {
    console.log("User naveen.koshy@gmail.com not found. Creating...");
    const id = Math.floor(Math.random() * 1000000);
    await connection.execute(
      "INSERT INTO users (id, email, name, role, `passwordHash`, `emailVerified`, `createdAt`, `updatedAt`) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())",
      [id, "naveen.koshy@gmail.com", "Naveen Koshy", "admin", hash, true]
    );
    console.log("Created admin user with default password");
  } else {
    const user = rows[0];
    console.log(`Found user: ${user.email}, role: ${user.role}`);
    
    // Update password hash and ensure admin role
    await connection.execute(
      "UPDATE users SET `passwordHash` = ?, role = 'admin' WHERE email = ?",
      [hash, "naveen.koshy@gmail.com"]
    );
    console.log("Updated password hash for naveen.koshy@gmail.com");
  }
  
  // Verify
  const [verify] = await connection.execute(
    "SELECT id, email, role, `passwordHash` FROM users WHERE email = ?",
    ["naveen.koshy@gmail.com"]
  );
  if (verify.length > 0) {
    const u = verify[0];
    const matches = await bcrypt.compare(defaultPassword, u.passwordHash);
    console.log(`\nVerification:`);
    console.log(`  Email: ${u.email}`);
    console.log(`  Role: ${u.role}`);
    console.log(`  Password hash set: ${!!u.passwordHash}`);
    console.log(`  Password verify: ${matches}`);
    console.log(`\n✅ Default admin password set to: ${defaultPassword}`);
  }
  
  await connection.end();
}

main().catch(console.error);
