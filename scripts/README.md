# User Seeder

Script ini digunakan untuk membuat user default dalam sistem gudang sepatu.

## User yang akan dibuat:

### Admin
- **Username**: `admin`
- **Password**: `adminTJA`
- **Role**: `ADMIN`

### Users
- **Username**: `user1`
- **Password**: `userTJA1`
- **Role**: `USER`

- **Username**: `user2`
- **Password**: `userTJA2`
- **Role**: `USER`

- **Username**: `user3`
- **Password**: `userTJA3`
- **Role**: `USER`

## Cara Menjalankan Seeder

### Metode 1: Menggunakan npm script
```bash
npm run seed-users
```

### Metode 2: Menggunakan API endpoint
```bash
curl -X POST http://localhost:3000/api/seed-users
```

### Metode 3: Menjalankan script langsung
```bash
node scripts/seed-users.js
```

## Catatan

- Script akan menghapus semua user yang sudah ada sebelum membuat user baru
- Password akan di-hash menggunakan bcrypt dengan salt rounds 10
- Pastikan database sudah terhubung dan Prisma client sudah di-generate
- Pastikan environment variables sudah di-set dengan benar

## Troubleshooting

Jika terjadi error, pastikan:
1. Database sudah running
2. Prisma client sudah di-generate (`npx prisma generate`)
3. Environment variables sudah di-set
4. Dependencies sudah di-install (`npm install`)
