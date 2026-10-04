# Requirements: Real-Time Classroom Interactive Suite

## 1. Latar Belakang & Tujuan
Pembelajaran di kelas sering berjalan satu arah sehingga mahasiswa mudah mengantuk dan kehilangan fokus. Aplikasi ini memberi dosen alat interaksi real-time (reaksi, polling, tanya anonim, pemilihan acak) agar mahasiswa tetap terlibat dan dosen mendapat umpan balik pemahaman kelas secara langsung.

Tujuan v1: dosen dapat membuat room kelas, dan mahasiswa dapat bergabung serta berinteraksi secara real-time lewat browser (HP atau laptop).

## 2. Aktor
- **Dosen**: membuat dan mengelola room, meluncurkan polling/kuis, melihat statistik, memilih mahasiswa acak.
- **Mahasiswa**: bergabung ke room, memberi reaksi, menjawab polling, mengirim pertanyaan anonim.

## 3. Functional Requirements (v1 / MVP)
- FR-01: Dosen dapat membuat room kelas dan mendapat kode room unik.
- FR-02: Mahasiswa dapat bergabung ke room dengan memasukkan kode room dan nama tampilan.
- FR-03: Dosen dapat melihat daftar mahasiswa yang sedang online di room.
- FR-04: Mahasiswa dapat mengirim reaksi emoji ("Paham", "Bingung", "Terlalu Cepat") yang langsung terlihat oleh dosen.
- FR-05: Dosen dapat melihat ringkasan jumlah tiap reaksi secara real-time.
- FR-06: Dosen dapat membuat dan meluncurkan polling/flash quiz pilihan ganda.
- FR-07: Mahasiswa dapat menjawab polling yang aktif, satu jawaban per mahasiswa.
- FR-08: Dosen dapat melihat statistik hasil polling secara real-time dan menutup polling.
- FR-09: Mahasiswa dapat mengirim pertanyaan tanpa menampilkan identitasnya kepada siapa pun.
- FR-10: Dosen dapat melihat daftar pertanyaan anonim dan menandainya sebagai "sudah dijawab".
- FR-11: Dosen dapat memilih satu mahasiswa secara acak dan adil dari daftar yang online.
- FR-12: Dosen dapat menutup room, dan setelah itu mahasiswa tidak bisa mengirim interaksi baru.

## 4. Non-Functional Requirements
- **Kapasitas**: minimal 50 mahasiswa bersamaan per room (target awal; ditingkatkan di versi berikutnya).
- **Latensi**: pembaruan real-time (reaksi, hasil polling) tampil di bawah 500 ms pada jaringan normal.
- **Perangkat**: web responsif, mobile-first, tanpa instalasi aplikasi.
- **Anonimitas**: identitas pengirim pertanyaan anonim tidak ditampilkan ke dosen maupun mahasiswa lain.
- **Ketersediaan**: cukup untuk satu sesi kelas (sekitar 2 jam); koneksi yang terputus harus tersambung ulang otomatis.
- **Keamanan dasar**: validasi input, pembatasan laju (rate limiting) untuk mencegah spam, dan hak akses dosen vs mahasiswa.

## 5. Di Luar Scope v1
Canvas dan anotasi PDF kolaboratif, auto-beautify/OCR tulisan tangan, mini games dan gamified quiz, focus meter, video call, serta integrasi LMS. Fitur-fitur ini dijadwalkan di v2 dan seterusnya.

## 6. Risiko & Asumsi
- **Asumsi**: semua pengguna memiliki browser modern dan koneksi internet selama sesi.
- **Risiko**: pengembang tunggal dengan pengalaman JS/React yang masih berkembang, sehingga scope dijaga kecil.
- **Risiko**: jaringan kampus yang tidak stabil; mitigasi dengan reconnect otomatis dan fallback polling.
- **Risiko**: penyalahgunaan fitur anonim; mitigasi dengan rate limiting dan kemampuan dosen menyembunyikan pertanyaan.
