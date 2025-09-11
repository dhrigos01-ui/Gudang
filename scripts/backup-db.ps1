# Requires: PostgreSQL client (pg_dump) in PATH
# Usage: powershell -File scripts/backup-db.ps1 [-OutDir .\backups]

param(
    [string]$OutDir = "backups"
)

$envUrl = (Get-ChildItem Env:DATABASE_URL).Value
if (-not $envUrl) {
    Write-Error "DATABASE_URL env var tidak ditemukan. Set terlebih dahulu di .env"
    exit 1
}

if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
    Write-Error "pg_dump tidak ditemukan di PATH. Install PostgreSQL client terlebih dahulu."
    exit 1
}

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$file = Join-Path $OutDir ("backup_" + $timestamp + ".sql")

Write-Host "Membuat backup ke $file ..."

# pg_dump dapat langsung menerima URL koneksi
pg_dump --no-owner --no-privileges --format=plain --dbname=$envUrl > $file

if ($LASTEXITCODE -ne 0) {
    Write-Error "Backup gagal dengan exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

Write-Host "Backup selesai: $file"

