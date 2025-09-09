# Deployment Guide untuk Vercel

## Konfigurasi yang Diperlukan

### 1. Environment Variables di Vercel
Set environment variables berikut di dashboard Vercel:

```
DATABASE_URL=postgresql://username:password@host:port/database_name
JWT_SECRET=your-jwt-secret-key-here
```

### 2. Database Setup
- Pastikan database PostgreSQL sudah running
- Jalankan migration: `npx prisma migrate deploy`
- Generate Prisma client: `npx prisma generate`

### 3. Build Settings di Vercel
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next` (atau biarkan kosong untuk Next.js)
- **Install Command**: `npm install`

### 4. File Konfigurasi
File `vercel.json` dan `next.config.js` sudah dikonfigurasi dengan benar.

## Langkah Deployment

1. **Push ke GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Connect ke Vercel**:
   - Import project dari GitHub
   - Set environment variables
   - Deploy

3. **Post-deployment**:
   - Jalankan seeder untuk user: `npm run seed-users`
   - Atau akses `/api/seed-users` via POST request

## Troubleshooting

### Error: "No Output Directory named 'dist' found"
- Pastikan menggunakan framework preset "Next.js" di Vercel
- Output directory harus `.next` atau kosong

### Database Connection Error
- Pastikan `DATABASE_URL` sudah benar
- Pastikan database accessible dari Vercel

### Build Error
- Pastikan semua dependencies terinstall
- Check TypeScript errors: `npm run lint`
