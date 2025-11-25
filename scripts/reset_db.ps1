# PowerShell: reset_db.ps1
# Ejecuta los SQL de `db\init.sql` y `db\seed.sql` usando el cliente `mysql`.
# Ajusta las variables de conexión según tu entorno o exporta en variables de entorno.
$host = $env:DB_HOST  -or "localhost"
$user = $env:DB_USER  -or "root"
$pass = $env:DB_PASS  -or ""
$db   = $env:DB_NAME  -or "habitapp"

$init = Join-Path (Get-Location) "db\init.sql"
$seed = Join-Path (Get-Location) "db\seed.sql"

If (-not (Test-Path $init)) {
  Write-Host "No se encontró $init"
  exit 1
}

Write-Host "Importando esquema -> $db"
# Requiere cliente mysql en PATH
& mysql -h $host -u $user -p$pass $db < $init

if (Test-Path $seed) {
  Write-Host "Importando semillas -> $db"
  & mysql -h $host -u $user -p$pass $db < $seed
} else {
  Write-Host "No se encontró $seed, saltando semillas"
}

Write-Host "Listo."
