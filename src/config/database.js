import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { envConfig } from './env.js';

function initializeDatabase() {
  const dbRelativePath = envConfig.database.path;
  const dbAbsolutePath = path.isAbsolute(dbRelativePath)
    ? dbRelativePath
    : path.resolve(process.cwd(), dbRelativePath);

  const directoryPath = path.dirname(dbAbsolutePath);
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }

  const db = new Database(dbAbsolutePath);

  db.pragma('foreign_keys = ON');

  const requiredTables = ['companies', 'tracking', 'tracking_events'];
  const existingTablesQuery = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name IN (?, ?, ?)"
  );
  const existingTables = existingTablesQuery.all(...requiredTables).map((row) => row.name);

  if (existingTables.length < requiredTables.length) {
    const schemaPath = path.resolve(process.cwd(), 'database', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`El archivo del esquema SQL no fue encontrado en: ${schemaPath}`);
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql);
  }

  return db;
}

export const db = initializeDatabase();
export default db;
