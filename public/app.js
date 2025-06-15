// Lokasi file: proyek-evoting/public/app.js

const GOOGLE_CLIENT_ID = '85562390433-kki59gskm3kash6vns62n34umaafomt9.apps.googleusercontent.com';
const API_BASE_URL = 'http://localhost:3000';

let userProfile = null; // Variabel untuk menyimpan data user setelah login

// Fungsi ini akan dijalankan saat semua elemen HTML di halaman sudah siap
document.addEventListener('DOMContentLoaded', () => {
    // Inisialisasi Google Sign-In
    google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse // Tentukan fungsi yang akan menangani hasil login
    });
    // Render tombol login Google di elemen dengan id 'google-login-button'
    google.accounts.id.renderButton(
        document.getElementById('google-login-button'),
        { theme: 'outline', size: 'large', text: 'signin_with' }
    );
});

// Fungsi yang menangani respons dari Google setelah user berhasil login
async function handleCredentialResponse(response) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: response.credential })
        });
        const data = await res.json();

        // Jika ada error dari server kita, tampilkan pesan
        if (res.status !== 200) throw new Error(data.error);

        userProfile = data.user; // Simpan data user
        document.getElementById('login-section').classList.add('hidden'); // Sembunyikan area login
        document.getElementById('user-greeting').innerText = `Selamat datang, ${userProfile.name}!`;

        // Cek apakah user sudah pernah memilih atau belum
        if (userProfile.has_voted === 1) {
            showMessage("Terima Kasih!", "Anda sudah menggunakan hak pilih Anda.");
        } else {
            // Jika belum, tampilkan daftar kandidat
            showCandidates();
        }
    } catch (error) {
        alert("Login Gagal: " + error.message);
    }
}

// Fungsi untuk mengambil data kandidat dari server dan menampilkannya
async function showCandidates() {
    document.getElementById('candidates-section').classList.remove('hidden');
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/candidates`);
        const { data: candidates } = await res.json();
        
        const listElement = document.getElementById('candidates-list');
        listElement.innerHTML = ''; // Kosongkan daftar sebelum diisi

        if (!candidates || candidates.length === 0) {
            listElement.innerHTML = "<p>Belum ada kandidat yang terdaftar.</p>";
            return;
        }

        candidates.forEach(candidate => {
            const card = document.createElement('div');
            card.className = 'candidate-card';
            card.innerHTML = `
                <img src="${candidate.photo_url || 'https://via.placeholder.com/120'}" alt="Foto ${candidate.name}">
                <h3>${candidate.name}</h3>
            `;
            // Tambahkan event agar kartu bisa diklik untuk memilih
            card.addEventListener('click', () => handleVote(candidate.id, candidate.name));
            listElement.appendChild(card);
        });
    } catch (error) {
        document.getElementById('candidates-list').innerHTML = "<p>Gagal memuat kandidat. Coba refresh halaman.</p>";
    }
}

// Fungsi untuk mengirimkan suara ke server
async function handleVote(candidateId, candidateName) {
    if (!userProfile) return alert("Sesi Anda telah berakhir. Silakan login kembali.");

    const confirmation = confirm(`Apakah Anda yakin ingin memilih ${candidateName}? Pilihan ini tidak dapat diubah.`);
    if (confirmation) {
        try {
            const res = await fetch(`${API_BASE_URL}/api/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userProfile.email, candidate_id: candidateId })
            });
            const result = await res.json();
            
            if(res.status !== 200) throw new Error(result.error);

            // Jika berhasil, tampilkan pesan terima kasih
            showMessage("Suara Berhasil Dicatat!", result.message);
        } catch (error) {
            alert("Gagal Memilih: " + error.message);
        }
    }
}

// Fungsi untuk menampilkan pesan status (misalnya, terima kasih)
function showMessage(title, body) {
    document.getElementById('candidates-section').classList.add('hidden');
    document.getElementById('login-section').classList.add('hidden');

    const messageSection = document.getElementById('message-section');
    document.getElementById('message-title').innerText = title;
    document.getElementById('message-body').innerText = body;
    messageSection.classList.remove('hidden');
}