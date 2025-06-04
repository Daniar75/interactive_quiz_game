// db.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('scores.db');

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            score INTEGER NOT NULL,
            date TEXT NOT NULL
        )
    `);
});

module.exports = db;
