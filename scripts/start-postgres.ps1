# Starts embedded PostgreSQL for HRMS development
$pgBin  = "$PSScriptRoot\node_modules\@embedded-postgres\windows-x64\native\bin"
$pgData = "$PSScriptRoot\pgdata"
$pgLog  = "$PSScriptRoot\postgres.log"

$env:PATH = "$pgBin;$env:PATH"

# Init data directory if it doesn't exist
if (-not (Test-Path "$pgData\PG_VERSION")) {
    Write-Host "Initializing PostgreSQL data directory..."
    & "$pgBin\initdb.exe" -D $pgData -U hrms --pwfile - <<< "hrms_secret" 2>&1
    # Use --no-auth so password is set via pg_hba.conf override
    & "$pgBin\initdb.exe" -D $pgData -U hrms --auth=trust 2>&1
    Write-Host "Done."
}

# Start postgres
Write-Host "Starting PostgreSQL on port 5432..."
& "$pgBin\pg_ctl.exe" -D $pgData -l $pgLog -o "-p 5432" start

Start-Sleep -Seconds 3

# Create database if not exists
Write-Host "Ensuring 'hrms' database exists..."
& "$pgBin\..\..\..\pg\bin\createdb.exe" -U hrms -p 5432 hrms 2>&1
Write-Host "PostgreSQL ready."
