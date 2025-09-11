# Scripts

Dokumentasi singkat untuk script pendukung (seeding user, backup, dan restore database).

## 1) User Seeder

Membuat user default dalam sistem gudang sepatu.

### User yang akan dibuat

Admin:
- Username: `admin`
- Password: `adminTJA`
- Role: `ADMIN`

Users:
- `user1` / `userTJA1` (USER)
- `user2` / `userTJA2` (USER)
- `user3` / `userTJA3` (USER)

### Cara Menjalankan

Metode 1 - npm script:
```bash
npm run seed-users
```

Metode 2 - API endpoint:
```bash
curl -X POST http://localhost:3000/api/seed-users
```

Metode 3 - node langsung:
```bash
node scripts/seed-users.js
```

Catatan:
- Script akan menghapus semua user yang sudah ada sebelum membuat user baru
- Password di-hash (bcrypt, salt rounds 10)
- Pastikan Prisma client sudah di-generate, env terisi benar

## 2) Backup Database (PostgreSQL)

Membuat dump SQL dari database yang dituju oleh `DATABASE_URL`.

Butuh `pg_dump` di PATH.

### Windows (PowerShell)
```powershell
npm run backup:db:win
```
Opsi output folder (default `backups`) dapat diubah dengan:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/backup-db.ps1 -OutDir .\my-backups
```

### Linux/Mac (bash)
```bash
npm run backup:db
# atau
npm run backup:db -- ./my-backups
```

Output: file `backups/backup_YYYYMMDD_HHMMSS.sql`

## 3) Restore Database (PostgreSQL)

Menjalankan ulang SQL dump ke database pada `DATABASE_URL`.

Butuh `psql` di PATH.

PERINGATAN: Proses restore akan menimpa data sesuai isi file SQL. Pastikan database tujuan sudah benar.

### Windows (PowerShell)
```powershell
npm run restore:db:win -- -FilePath .\backups\backup_YYYYMMDD_HHMMSS.sql
```

### Linux/Mac (bash)
```bash
npm run restore:db -- ./backups/backup_YYYYMMDD_HHMMSS.sql
```

## Troubleshooting

1) `pg_dump`/`psql` tidak ditemukan: install PostgreSQL client dan tambahkan ke PATH.
2) `DATABASE_URL` tidak ditemukan: isi `.env` atau export env sebelum menjalankan script.
3) Permission error: pada Windows jalankan PowerShell sebagai Administrator atau set ExecutionPolicy Bypass pada perintah.
