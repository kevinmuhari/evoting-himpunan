// Lokasi file: proyek-evoting/server.js

const express = require('express');
const cors = require('cors');
const db = require('./database.js');
const { OAuth2Client } = require('google-auth-library');

// --- PENGATURAN PENTING ---
// Ganti nilai di bawah ini sesuai dengan data Anda
const GOOGLE_CLIENT_ID = '85562390433-kki59gskm3kash6vns62n34umaafomt9.apps.googleusercontent.com';
const DOMAIN_KAMPUS = '@student.itera.ac.id'; // CONTOH, Ganti dengan domain email kampus Anda
const PORT = 3000;
// -------------------------

const app = express();
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// Middleware (Aturan Umum Server)
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// === API ENDPOINTS (Layanan Khusus Server) ===

// 1. API untuk verifikasi token Google dan login/register user
app.post('/api/auth/google', async (req, res) => {
    const { token } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { name, email } = payload;

        if (!email.endsWith(DOMAIN_KAMPUS)) {
            return res.status(403).json({ error: "Otentikasi gagal. Hanya email mahasiswa dari domain " + DOMAIN_KAMPUS + " yang diizinkan." });
        }

        db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
            if (err) return res.status(500).json({ error: "Database error: " + err.message });

            if (user) {
                res.json({ user });
            } else {
                const insertSql = "INSERT INTO users (email, name) VALUES (?, ?)";
                db.run(insertSql, [email, name], function (err) {
                    if (err) return res.status(500).json({ error: "Database error: " + err.message });
                    db.get("SELECT * FROM users WHERE id = ?", [this.lastID], (err, newUser) => {
                        if (err) return res.status(500).json({ error: "Database error: " + err.message });
                        res.json({ user: newUser });
                    });
                });
            }
        });
    } catch (error) {
        res.status(401).json({ error: "Token tidak valid atau sesi telah kedaluwarsa." });
    }
});

// 2. API untuk mengambil daftar kandidat
app.get('/api/candidates', (req, res) => {
    const sql = "SELECT * FROM candidates";
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ "error": err.message });
        res.json({ data: rows });
    });
});

// 3. API untuk mengirimkan suara (VOTE) - VERSI DENGAN LOGIKA YANG BENAR
app.post('/api/vote', (req, res) => {
    const { email, candidate_id } = req.body;
    if (!email || !candidate_id) {
        return res.status(400).json({ "error": "Informasi tidak lengkap." });
    }

    const checkSql = "SELECT has_voted FROM users WHERE email = ?";
    db.get(checkSql, [email], (err, user) => {
        if (err) return res.status(500).json({ "error": "Database error: " + err.message });
        if (!user) return res.status(404).json({ "error": "Pengguna tidak ditemukan." });
        if (user.has_voted === 1) {
            return res.status(403).json({ "error": "Anda sudah menggunakan hak pilih Anda." });
        }

        // Transaksi Database untuk memastikan keamanan
        const insertVoteSql = 'INSERT INTO votes (candidate_id) VALUES (?)';
        const updateUserSql = 'UPDATE users SET has_voted = 1 WHERE email = ?';

        db.serialize(() => {
            db.run('BEGIN TRANSACTION;', (err) => {
                if (err) return res.status(500).json({ error: "Gagal memulai transaksi: " + err.message });
            });

            db.run(insertVoteSql, [candidate_id], function(err) {
                if (err) {
                    db.run('ROLLBACK;');
                    return res.status(500).json({ error: "Gagal mencatat suara: " + err.message });
                }
            });

            db.run(updateUserSql, [email], function(err) {
                if (err) {
                    db.run('ROLLBACK;');
                    return res.status(500).json({ error: "Gagal update status pemilih: " + err.message });
                }
            });

            db.run('COMMIT;', (err) => {
                if (err) return res.status(500).json({ error: "Gagal menyelesaikan transaksi: " + err.message });
                res.json({ "message": "Terima kasih, suara Anda telah berhasil dicatat." });
            });
        });
    });
});

// 4. API untuk melihat hasil suara (untuk panitia)
app.get('/api/results', (req, res) => {
    const sql = `
        SELECT c.id, c.name, c.photo_url, COUNT(v.id) as vote_count
        FROM candidates c
        LEFT JOIN votes v ON c.id = v.candidate_id
        GROUP BY c.id
        ORDER BY vote_count DESC
    `;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ "error": err.message });
        res.json({ data: rows });
    });
});


// Menjalankan server
app.listen(PORT, () => {
    console.log(`Server e-voting berjalan di http://localhost:${PORT}`);
});