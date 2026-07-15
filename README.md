# BDB DocGen

Sistem generator & penomoran otomatis surat PT. Banana Digital Boost.

## Setup Lokal

```bash
npm install
npx prisma migrate dev   # atau: npx prisma db push (kalau DB sudah ada)
npx prisma db seed
npm run dev
```

Salin `.env.example` ke `.env` dan isi:

- `DATABASE_URL` — PostgreSQL. Untuk dev cepat tanpa install apa pun: `npx create-db` (Prisma Postgres gratis, sementara sampai di-claim).
- `AUTH_SECRET` — generate dengan `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.
- `RESEND_API_KEY` / `EMAIL_FROM` — untuk fitur kirim email (opsional saat dev; tanpa ini, fitur email gagal secara graceful dan tercatat di `EmailLog` dengan status `FAILED`).
- `NEXT_PUBLIC_APP_URL` — dipakai sebagai fallback origin untuk render PDF internal (`/print/surat/[token]`); di produksi Host header dari request yang jadi prioritas, bukan variabel ini.

Login awal: `admin@bananadigitalboost.com` / password dari `SEED_ADMIN_PASSWORD` env (default `ubah-password-ini`) — **wajib diganti setelah login pertama** (belum ada fitur ganti password sendiri, ganti manual lewat `Kelola User` atau langsung di DB untuk saat ini).

## Menjalankan Test

```bash
npm run test:unit          # murni, tanpa DB
npm run test:integration   # butuh DATABASE_URL nyata (numbering engine, concurrency, dsb)
```

## Arsitektur Singkat

- **Next.js 16** (App Router, Turbopack) — perhatikan `proxy.ts` (bukan `middleware.ts`) dan `params`/`searchParams` async di semua page/route, ini konvensi v16.
- **Prisma 7** dengan driver adapter (`@prisma/adapter-pg`) — client generator baru (`prisma-client`) butuh adapter eksplisit, tidak lagi baca `DATABASE_URL` otomatis dari schema.
- **Numbering engine** (`src/lib/numbering/generateNomorSurat.ts`) — atomic `INSERT ... ON CONFLICT` per (divisi, jenisSurat, tahun), row-level lock di Postgres. Nomor yang sudah dialokasikan tidak pernah di-rollback/dipakai ulang.
- **PDF pipeline** (`src/lib/pdf/`) — Puppeteer menembak halaman internal `/print/surat/[token]` (bukan render HTML lepas), sehingga PDF 100% WYSIWYG dengan live preview. Payload render dijembatani lewat file temp (`renderCache.ts`), BUKAN in-memory Map — Next.js dev server tidak menjamin route handler & page render berbagi module state.
- **Template surat** (`src/components/templates/surat/`) — pola: 1 komponen React + 1 row `SuratTemplate` (field schema JSON) + 1 entry di `templateRegistry.ts`. Tambah jenis surat baru tidak perlu ubah kode numbering/RBAC/routing.
- **RBAC** (`src/lib/rbac/permissions.ts`) — bedakan `canManageKategori` (create/void/edit) dari `canViewKategori`/`isRestrictedToKomersial` (lihat log). VIEWER read-only tapi lihat SEMUA kategori; FINANCE_SALES/AE dibatasi ke KOMERSIAL saja untuk create maupun view.

## Status Implementasi

Selesai & terverifikasi end-to-end (browser + automated test):

- Auth, RBAC 6-role, master data karyawan/klien (dengan masking NIK KTP)
- Numbering engine + test konkurensi (50 alokasi paralel, no race condition)
- 4 template surat: Offering Letter (KOMERSIAL), Surat Peringatan (INTERNAL), Surat Keterangan (INTERNAL), Surat Edaran (EDARAN) — satu contoh per kategori
- Live preview + PDF generation asli (Puppeteer)
- Generate & log flow lengkap (nomor → PDF → simpan, dengan penanganan gagal-render yang tidak membakar ulang nomor)
- Dashboard/log book: search/filter, export Excel, Void (permanen, nomor tidak dipakai ulang), Edit-as-revision (nomor baru, surat asli tidak berubah)
- Verifikasi QR publik (`/verify/[qrToken]`) dan kirim email (Resend + `EmailLog`)

**Belum dikerjakan / follow-up:**

1. **6 jenis surat tersisa** (SKK, SPHK, SKP, PKS, BA, ST) — pola sudah terbukti di 4 contoh di atas. Untuk masing-masing: (a) tambah komponen di `src/components/templates/surat/`, (b) daftarkan di `templateRegistry.ts`, (c) tambah row `SuratTemplate` + `formSchemaJson` di `prisma/seed.ts`.
2. **Halaman kelola template** — saat ini template dikelola lewat seed script manual, belum ada UI admin untuk upload/edit template baru (disebut di NFR PRD "mudah tambah template" — arsitekturnya sudah mendukung, UI-nya belum dibangun).
3. **Ganti password sendiri** oleh user (self-service).
4. **Database produksi** — saat ini pakai Prisma Postgres gratis sementara (klaim di link yang sudah dibagikan sebelumnya, atau ganti `DATABASE_URL` ke Postgres produksi Anda sendiri).
5. **Deployment** — `docker-compose.yml` disediakan untuk Postgres lokal; app sendiri butuh proses Node long-lived (BUKAN serverless) karena Puppeteer perlu browser pool warm. Lihat rekomendasi VPS + Docker di rencana awal.
6. **RESEND_API_KEY produksi** — isi untuk mengaktifkan pengiriman email sungguhan (saat ini gagal graceful & tercatat di `EmailLog`).
