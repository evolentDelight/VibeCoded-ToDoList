const { Pool } = require('pg');

let pool = null;

function getPool() {
  if (pool) return pool;
  
  const databaseUrl = process.env.DATABASE_URL;
  
  if (databaseUrl) {
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('render.com') ? { rejectUnauthorized: false } : false,
    });
  }
  
  return pool;
}

async function initDb() {
  const p = getPool();
  if (!p) return null;

  const client = await p.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    return p;
  } finally {
    client.release();
  }
}

module.exports = { getPool, initDb };
