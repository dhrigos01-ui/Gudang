# Requires: PostgreSQL client (psql) in PATH
# Usage: powershell -File scripts/restore-db.ps1 -FilePath .\backups\backup_YYYYMMDD_HHMMSS.sql

param(
    [Parameter(Mandatory=$true)]
    [string]$FilePath
)

$envUrl = (Get-ChildItem Env:DATABASE_URL).Value
if (-not $envUrl) {
    Write-Error "DATABASE_URL env var tidak ditemukan. Set terlebih dahulu di .env"
    exit 1
}

if (-not (Test-Path $FilePath)) {
    Write-Error "File backup tidak ditemukan: $FilePath"
    exit 1
}

if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
    Write-Error "psql tidak ditemukan di PATH. Install PostgreSQL client terlebih dahulu."
    exit 1
}

Write-Warning "PERINGATAN: Proses restore akan mengeksekusi SQL pada database tujuan. Pastikan database benar."

Read-Host "Tekan Enter untuk melanjutkan, Ctrl+C untuk membatalkan" | Out-Null

Write-Host "Melakukan restore dari $FilePath ..."

psql "$envUrl" -f "$FilePath"

if ($LASTEXITCODE -ne 0) {
    Write-Error "Restore gagal dengan exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

Write-Host "Restore selesai."

