Berikut adalah dokumen *brief* sistem, alur kerja, cara pengaturan konfigurasi via chat, serta poin perhatian keamanan untuk sistem deployment ini.

---

# BRIEF SISTEM: TeleDeploy Bot

**Deskripsi Singkat:**
Sistem ini adalah alat pengendali jarak jauh berbasis Telegram Bot untuk mengotomatiskan deployment aplikasi di server Linux. Sistem ini menghilangkan kebutuhan untuk masuk ke server menggunakan SSH setiap kali ingin memperbarui aplikasi, cukup dengan menekan tombol di dalam ruang *chat* Telegram.

---

## 1. Alur Kerja Utama & Antarmuka (Inline Keyboard)

Sistem akan sepenuhnya memanfaatkan fitur tombol klik (*Inline Keyboard*) agar operasi berjalan cepat dan meminimalkan kesalahan ketik.

### **Menu Utama**

Ketika Anda mengetik perintah `/start` atau `/menu`, bot akan membalas dengan pesan ringkas dan dua tombol utama:

* `[🚀 Mulai Deployment]`
* `[⚙️ Pengaturan Konfigurasi]`

### **Workflow A: Menjalankan Deployment**

1. Anda mengklik tombol `[🚀 Mulai Deployment]`.
2. Bot mengubah pesan dan menampilkan daftar aplikasi yang terdaftar dalam bentuk tombol. Contoh:
* `[📱 Backend Service]`
* `[💻 Frontend Web]`
* `[↩️ Kembali ke Menu]`


3. Anda mengklik `[📱 Backend Service]`.
4. Bot menampilkan tombol konfirmasi keamanan untuk mencegah salah klik:
* `[✅ Ya, Jalankan Deployment]`
* `[❌ Batalkan]`


5. Jika Anda mengklik **Ya**, bot akan mengirim pesan *"Sedang memproses..."*. Di latar belakang, server masuk ke folder terkait dan menjalankan file `deploy.sh`.
6. Setelah selesai, bot mengirimkan laporan akhir: *"✅ Deployment Backend Service Berhasil!"* beserta potongan log prosesnya.

### **Workflow B: Mengubah Konfigurasi via Chat**

Anda tidak perlu membuka terminal server untuk menambah aplikasi baru. Semua dilakukan lewat teks chat.

1. Anda mengklik tombol `[⚙️ Pengaturan Konfigurasi]`.
2. Bot menampilkan menu pilihan:
* `[➕ Tambah Aplikasi Baru]`
* `[❌ Hapus Aplikasi]`
* `[📄 Lihat Semua Konfigurasi]`


3. Jika Anda memilih `[➕ Tambah Aplikasi Baru]`, bot akan masuk ke mode siaga dan mengirim instruksi:
> *"Ketik nama aplikasi dan lokasi foldernya dengan format: **Nama_Aplikasi | /jalur/ke/folder**"*


4. Anda mengetik dan mengirim pesan: `payment-api | /home/user/apps/payment`
5. Bot memproses teks tersebut, memasukkannya ke dalam file konfigurasi internal (`config.json`), dan membalas: *"✅ Aplikasi payment-api berhasil ditambahkan!"*

---

## 2. Perhatian Utama Keamanan (Security Concerns)

Karena bot ini memiliki akses langsung untuk menjalankan perintah di dalam terminal server, faktor keamanan adalah hal yang paling kritis.

### **A. Pintu Gerbang Utama: Validasi Chat ID (Mutlak)**

Telegram menggunakan ID angka unik untuk setiap akun pengguna (misal: `12345678`).

* **Sistem Keamanan:** Di dalam kode program bot, masukkan *Chat ID* Telegram Anda secara permanen.
* **Cara Kerja:** Setiap kali ada pesan atau klik tombol yang masuk, bot akan memeriksa: *"Apakah ID pengirim sama dengan ID pemilik?"*. Jika tidak sama, bot akan mengabaikan pesan tersebut sepenuhnya. Orang lain tidak akan bisa menggunakan bot ini meskipun mereka menemukan nama bot Anda.

### **B. Batasi Kekuasaan Bot (Hak Akses Minimum)**

Jangan pernah menjalankan program bot Telegram ini menggunakan akun `root` (super user) di Linux.

* **Sistem Keamanan:** Buat satu pengguna khusus di Linux (misalnya diberi nama user `deployer`).
* **Cara Kerja:** Jalankan program bot di bawah user `deployer` ini. Berikan user ini hak akses yang terbatas, hanya boleh membuka folder aplikasi-aplikasi Anda dan menjalankan perintah Docker. Jika bot diretas, peretas tidak bisa merusak seluruh sistem server.

### **C. Pembersihan Input: Cegah Peretasan Teks (Command Injection)**

Saat Anda menggunakan fitur "Tambah Aplikasi Baru" via chat, Anda memasukkan teks manual untuk lokasi folder.

* **Sistem Keamanan:** Bot harus memeriksa teks input secara ketat sebelum menyimpannya.
* **Cara Kerja:** Bot harus menolak input jika mendeteksi karakter berbahaya yang biasa digunakan untuk menyisipkan perintah terminal ilegal, seperti karakter titik koma (`;`), simbol Dan (`&&`), atau simbol pipa (`|`) di luar format yang ditentukan. Bot juga harus memastikan folder yang didaftarkan memang benar-benar ada di server.

### **D. Amankan Kunci Akses (Token Bot)**

Token rahasia dari @BotFather adalah kunci utama bot Anda. Jika token ini bocor di internet (misalnya tidak sengaja terunggah ke GitHub), orang lain bisa mengambil alih bot tersebut.

* **Sistem Keamanan:** Simpan token di dalam file rahasia terpisah (file `.env`) di dalam server dan jangan pernah memasukkannya langsung di dalam baris kode program.