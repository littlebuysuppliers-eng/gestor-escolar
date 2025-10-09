import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export async function initDB() {
  const db = await open({ filename: './backend/database.sqlite', driver: sqlite3.Database });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombres TEXT,
      ap_paterno TEXT,
      ap_materno TEXT,
      grado INTEGER,
      grupo TEXT,
      email TEXT UNIQUE,
      password TEXT,
      rol TEXT
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      title TEXT,
      filepath TEXT,
      status TEXT DEFAULT 'pendiente',
      FOREIGN KEY(userId) REFERENCES users(id)
    );
  `);

  console.log('Base de datos inicializada');
}
