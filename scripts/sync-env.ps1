# Script para sincronizar variables de entorno de .env.local a Vercel (Windows PowerShell)
# Uso: npm run sync-env

Write-Host "🔄 Sincronizando variables de entorno con Vercel..." -ForegroundColor Cyan
Write-Host ""

# Verificar que el archivo .env.local existe
if (-not (Test-Path ".env.local")) {
    Write-Host "❌ Error: No se encontró el archivo .env.local" -ForegroundColor Red
    exit 1
}

# Función para leer variables de .env.local
function Get-EnvVariable {
    param($VarName)

    $content = Get-Content .env.local | Where-Object { $_ -match "^$VarName=" }
    if ($content) {
        return $content -replace "^$VarName=", ""
    }
    return $null
}

# Función para agregar variable a Vercel
function Add-VercelEnvVar {
    param($VarName, $VarValue)

    Write-Host "📦 Agregando $VarName..." -ForegroundColor Yellow

    # Eliminar variable existente (ignorar errores)
    vercel env rm "$VarName" production --yes 2>$null
    vercel env rm "$VarName" preview --yes 2>$null
    vercel env rm "$VarName" development --yes 2>$null

    # Agregar nueva variable
    Write-Output "$VarValue" | vercel env add "$VarName" production
    Write-Output "$VarValue" | vercel env add "$VarName" preview
    Write-Output "$VarValue" | vercel env add "$VarName" development

    Write-Host "✅ $VarName agregada correctamente" -ForegroundColor Green
    Write-Host ""
}

# Leer variables
$SUPABASE_URL = Get-EnvVariable "NEXT_PUBLIC_SUPABASE_URL"
$SUPABASE_ANON_KEY = Get-EnvVariable "NEXT_PUBLIC_SUPABASE_ANON_KEY"
$SUPABASE_SERVICE_ROLE_KEY = Get-EnvVariable "SUPABASE_SERVICE_ROLE_KEY"

# Verificar que las variables existan
if (-not $SUPABASE_URL) {
    Write-Host "❌ Error: NEXT_PUBLIC_SUPABASE_URL no está definida en .env.local" -ForegroundColor Red
    exit 1
}

if (-not $SUPABASE_ANON_KEY) {
    Write-Host "❌ Error: NEXT_PUBLIC_SUPABASE_ANON_KEY no está definida en .env.local" -ForegroundColor Red
    exit 1
}

# Sincronizar variables
Add-VercelEnvVar "NEXT_PUBLIC_SUPABASE_URL" $SUPABASE_URL
Add-VercelEnvVar "NEXT_PUBLIC_SUPABASE_ANON_KEY" $SUPABASE_ANON_KEY

if ($SUPABASE_SERVICE_ROLE_KEY) {
    Add-VercelEnvVar "SUPABASE_SERVICE_ROLE_KEY" $SUPABASE_SERVICE_ROLE_KEY
}

Write-Host "🎉 Variables sincronizadas correctamente!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Variables actuales en Vercel:"
vercel env ls

Write-Host ""
$response = Read-Host "🚀 ¿Deseas hacer redeploy a producción? (y/n)"

if ($response -eq "y" -or $response -eq "Y") {
    Write-Host "🚀 Deploying a producción..." -ForegroundColor Cyan
    vercel --prod
    Write-Host "✅ Deploy completado!" -ForegroundColor Green
} else {
    Write-Host "⏭️  Redeploy omitido. Ejecuta 'vercel --prod' cuando estés listo." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✨ ¡Listo!" -ForegroundColor Green
