// backend/models.js
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const dbPath = path.join(__dirname, "../database.sqlite");

const db = new sqlite3.Database(dbPath);

// Inicializar tablas
function init() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firstName TEXT,
        lastP TEXT,
        lastM TEXT,
        email TEXT UNIQUE,
        password TEXT,
        role TEXT DEFAULT 'professor',
        grade INTEGER,
        groupName TEXT,
        driveFolderId TEXT
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        driveFileId TEXT,
        driveDownloadLink TEXT,
        userId INTEGER,
        status TEXT DEFAULT 'Pendiente',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id)
      )`, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });
}

// Helpers promisificados
function run(sql, params = []) {
  return new Promise((res, rej) => db.run(sql, params, function (err) {
    if (err) return rej(err);
    res(this);
  }));
}

function get(sql, params = []) {
  return new Promise((res, rej) => db.get(sql, params, (err, row) => {
    if (err) return rej(err);
    res(row);
  }));
}

function all(sql, params = []) {
  return new Promise((res, rej) => db.all(sql, params, (err, rows) => {
    if (err) return rej(err);
    res(rows);
  }));
}

module.exports = { init, run, get, all };
