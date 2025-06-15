// database.js
const sqlite3 = require('sqlite3').verbose();

// Buat atau hubungkan ke file database bernama 'voting.db'
const db = new sqlite3.Database('./voting.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Terhubung ke database voting.');
});

// Jalankan perintah SQL untuk membuat tabel
db.serialize(() => {
    // Tabel untuk menyimpan data pemilih
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        name TEXT,
        has_voted INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) console.error("Gagal membuat tabel users:", err);
        else console.log("Tabel users siap.");
    });

    // Tabel untuk menyimpan data kandidat
    db.run(`CREATE TABLE IF NOT EXISTS candidates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        photo_url TEXT,
        vision_mission TEXT
    )`, (err) => {
        if (err) console.error("Gagal membuat tabel candidates:", err);
        else console.log("Tabel candidates siap.");
    });

    // Tabel untuk menyimpan suara
    db.run(`CREATE TABLE IF NOT EXISTS votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        candidate_id INTEGER,
        voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (candidate_id) REFERENCES candidates (id)
    )`, (err) => {
        if (err) console.error("Gagal membuat tabel votes:", err);
        else console.log("Tabel votes siap.");
    });
});

module.exports = db;