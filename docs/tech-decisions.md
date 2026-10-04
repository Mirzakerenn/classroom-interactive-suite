# Tech Decisions

## TD-01: Stack Utama
| Lapisan | Pilihan | Alasan |
|---|---|---|
| Frontend | Next.js + TypeScript | Banyak dipakai di industri, cocok untuk portofolio, dokumentasi lengkap. |
| Styling | Tailwind CSS | Cepat dibangun, tidak perlu mengelola banyak file CSS. |
| Real-time | Socket.IO | API paling mudah dipelajari, reconnect otomatis bawaan. |
| Backend | Node.js (satu bahasa dengan frontend) | Mengurangi beban belajar bahasa baru. |
| Database | PostgreSQL (Neon/Supabase) | Relasional, sudah dikenal dari perkuliahan basis data. |
| Package manager | pnpm | Cepat dan hemat disk. |

## TD-02: Strategi Pengembangan
- Rilis bertahap: v1 hanya 5 fitur inti (lihat requirements.md).
- Fitur kompleks (canvas, OCR) ditunda sampai fondasi real-time stabil.

## TD-03: Alternatif yang Dipertimbangkan
- **SvelteKit**: lebih sederhana, tetapi ekosistem dan nilai portofolio lebih kecil dibanding Next.js.
- **Firebase Realtime**: cepat untuk prototipe, tetapi kurang melatih arsitektur backend sendiri.

## TD-04: Ditunda ke Versi Berikutnya
- Yjs/tldraw untuk canvas kolaboratif, PDF.js untuk anotasi, Tesseract.js untuk OCR, Redis untuk scaling.
