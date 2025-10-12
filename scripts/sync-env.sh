#!/bin/bash

# Script para sincronizar variables de entorno de .env.local a Vercel
# Uso: npm run sync-env

echo "🔄 Sincronizando variables de entorno con Vercel..."
echo ""

# Verificar que el archivo .env.local existe
if [ ! -f .env.local ]; then
  echo "❌ Error: No se encontró el archivo .env.local"
  exit 1
fi

# Cargar variables de .env.local
source .env.local

# Función para agregar variable a Vercel
add_env_var() {
  local var_name=$1
  local var_value=$2

  echo "📦 Agregando $var_name..."

  # Eliminar variable existente (ignorar errores)
  vercel env rm "$var_name" production --yes 2>/dev/null || true
  vercel env rm "$var_name" preview --yes 2>/dev/null || true
  vercel env rm "$var_name" development --yes 2>/dev/null || true

  # Agregar nueva variable
  echo "$var_value" | vercel env add "$var_name" production
  echo "$var_value" | vercel env add "$var_name" preview
  echo "$var_value" | vercel env add "$var_name" development

  echo "✅ $var_name agregada correctamente"
  echo ""
}

# Verificar que las variables existan
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo "❌ Error: NEXT_PUBLIC_SUPABASE_URL no está definida en .env.local"
  exit 1
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
  echo "❌ Error: NEXT_PUBLIC_SUPABASE_ANON_KEY no está definida en .env.local"
  exit 1
fi

# Sincronizar variables
add_env_var "NEXT_PUBLIC_SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_URL"
add_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$NEXT_PUBLIC_SUPABASE_ANON_KEY"

if [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  add_env_var "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY"
fi

echo "🎉 Variables sincronizadas correctamente!"
echo ""
echo "📋 Variables actuales en Vercel:"
vercel env ls

echo ""
echo "🚀 ¿Deseas hacer redeploy a producción? (y/n)"
read -r response

if [ "$response" = "y" ] || [ "$response" = "Y" ]; then
  echo "🚀 Deploying a producción..."
  vercel --prod
  echo "✅ Deploy completado!"
else
  echo "⏭️  Redeploy omitido. Ejecuta 'vercel --prod' cuando estés listo."
fi

echo ""
echo "✨ ¡Listo!"
