// seeds/adminSeed.js
require('dotenv').config();
const bcrypt = require("bcryptjs");
const pool = require("../config/db");

async function createAdmin() {
  const name = "System Admin";
  const email = "admin@healthcare.com";
  const password = "Admin123!";
  const phone = "0000000000";

  const hashed = await bcrypt.hash(password, 12);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Insert user
    const userRes = await client.query(
      `INSERT INTO users (name,email,password,phone,language_preference)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING user_id`,
      [name, email, hashed, phone, "en"]
    );

    const user_id = userRes.rows[0].user_id;

    // get admin role
    const roleRes = await client.query(
      `SELECT role_id FROM roles WHERE role_name = 'admin'`
    );

    const role_id = roleRes.rows[0].role_id;

    // assign role
    await client.query(
      `INSERT INTO user_roles (user_id,role_id)
       VALUES ($1,$2)`,
      [user_id, role_id]
    );

    await client.query("COMMIT");

    console.log("✅ Admin created successfully");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
  } finally {
    client.release();
    process.exit();
  }
}

createAdmin();