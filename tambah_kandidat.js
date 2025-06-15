// Lokasi file: proyek-evoting/tambah_kandidat.js

const db = require('./database.js');

// --- ANDA BISA MENGUBAH DATA KANDIDAT DI BAWAH INI ---
const kandidat = [
    {
        nama: "Budi Santoso",
        foto: "https://i.pravatar.cc/150?u=budi", // Ganti dengan link foto kandidat asli
        visi_misi: "Mewujudkan himpunan yang solid, inovatif, dan berprestasi di tingkat nasional."
    },
    {
        nama: "Citra Lestari",
        foto: "https://i.pravatar.cc/150?u=citra", // Ganti dengan link foto kandidat asli
        visi_misi: "Menjadikan himpunan sebagai rumah kedua yang nyaman dan suportif bagi semua anggota."
    },
    {
        nama: "Agus Wijaya",
        foto: "https://i.pravatar.cc/150?u=agus", // Ganti dengan link foto kandidat asli
        visi_misi: "Meningkatkan kolaborasi antar angkatan dan memperluas jaringan dengan alumni."
    }
    // Anda bisa menambahkan objek kandidat lain di sini jika ada lebih dari 3
];
// ----------------------------------------------------

const sql = `INSERT INTO candidates (name, photo_url, vision_mission) VALUES (?, ?, ?)`;

console.log("Memulai proses penambahan data kandidat ke database...");

db.serialize(() => {
    kandidat.forEach((calon) => {
        db.run(sql, [calon.nama, calon.foto, calon.visi_misi], function(err) {
            if (err) {
                return console.error(`Gagal memasukkan data "${calon.nama}":`, err.message);
            }
            console.log(`✅ Kandidat "${calon.nama}" berhasil ditambahkan.`);
        });
    });
});

// Menutup koneksi database setelah semua perintah dijalankan
db.close((err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('\nProses selesai. Semua data kandidat telah dimasukkan.');
});