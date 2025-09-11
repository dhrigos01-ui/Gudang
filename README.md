# Sistem Gudang Sepatu

Aplikasi manajemen stok (Next.js + Prisma + PostgreSQL) untuk mengelola:
- Stok Upper (WIP), Molding, Finishing, Stok Gudang (Barang Jadi)
- Stok Kulit (kaki), Master Sepatu, Master Maklun, Riwayat Transaksi

## Persiapan

Prasyarat:
- Node.js 18+
- PostgreSQL (DATABASE_URL di `.env`), Prisma

Install dependensi:
```bash
npm install
```

Set environment di `.env` minimal:
```
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"
JWT_SECRET="gantilah-ini"
```

Generate Prisma Client & jalankan dev:
```bash
npx prisma generate
npm run dev
```

## Fitur Utama
- Tambah/transfer stok sepatu antar gudang (WIP → Molding → Finishing → Gudang)
- Penjualan dari Stok Gudang
- Stok Kulit: tambah, retur, barang keluar
- Histori transaksi lengkap (IN/OUT) dengan tanggal custom
- Master: Sepatu, Kulit, Maklun
- Role: ADMIN (penuh), USER (tanpa Data Finishing)

## Backup & Restore DB
Scripts tersedia di folder `scripts/` (butuh `pg_dump`/`psql`).

Backup (Windows):
```powershell
npm run backup:db:win
```
Restore (Windows):
```powershell
npm run restore:db:win -- -FilePath .\backups\backup_YYYYMMDD_HHMMSS.sql
```
Backup (Linux/Mac):
```bash
npm run backup:db
```
Restore (Linux/Mac):
```bash
npm run restore:db -- ./backups/backup_YYYYMMDD_HHMMSS.sql
```

## Catatan
- Token login auto-refresh via refresh token (cookie HttpOnly) saat kadaluarsa.
- Angka stok kulit ditampilkan 2 desimal (truncated).
- Tombol mata di login untuk lihat/sembunyi password.
