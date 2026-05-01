import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const { Pool } = pg

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SCHEMA_FILE = path.join(__dirname, 'sql', 'schema.sql')
const SEED_FILE = path.join(__dirname, 'sql', 'seed.sql')

let database = null

const runSqlFile = async (pool, filePath) => {
  const sql = await fs.readFile(filePath, 'utf-8')
  const statements = sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean)

  for (const statement of statements) {
    await pool.query(statement)
  }
}

export const initializeDatabase = async () => {
  if (database) {
    return database
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required for PostgreSQL deployment.')
  }

  database = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
  })

  await database.query('SELECT 1')
  await runSqlFile(database, SCHEMA_FILE)

  const countResult = await database.query('SELECT COUNT(*)::int AS total FROM users')

  if (!countResult.rows[0]?.total) {
    await runSqlFile(database, SEED_FILE)
  }

  return database
}

export const getDatabase = () => {
  if (!database) {
    throw new Error('Database has not been initialized yet.')
  }

  return database
}
