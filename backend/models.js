import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'database.sqlite');

export function initDB() {
  const db = new sqlite3.Database(dbPath);
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombres TEXT,
        apellido_paterno TEXT,
        apellido_materno TEXT,
        grado TEXT,
        grupo TEXT,
        email TEXT UNIQUE,
        password TEXT
      )
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT,
        drive_id TEXT,
        drive_link TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);
  });
  db.close();
}

export function getDB() {
  return new sqlite3.Database(dbPath);
}
