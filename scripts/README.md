# 🔧 Scripts de Utilidades

Este directorio contiene scripts útiles para la gestión del proyecto.

## 📦 sync-env - Sincronización de Variables de Entorno

Sincroniza automáticamente las variables de entorno de `.env.local` a Vercel.

### Uso

**Windows (PowerShell):**
```bash
npm run sync-env
```

**Linux/Mac (Bash):**
```bash
npm run sync-env:bash
```

### ¿Qué hace este script?

1. ✅ Lee las variables de tu archivo `.env.local`
2. ✅ Las valida para asegurar que existan
3. ✅ Elimina las variables antiguas de Vercel (si existen)
4. ✅ Sube las nuevas variables a todos los entornos:
   - Production
   - Preview
   - Development
5. ✅ Muestra las variables actuales en Vercel
6. ✅ Opcionalmente hace redeploy a producción

### Variables sincronizadas

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (opcional)

### Requisitos previos

1. Debes haber iniciado sesión en Vercel CLI:
   ```bash
   vercel login
   ```

2. Tu proyecto debe estar vinculado a Vercel:
   ```bash
   vercel link
   ```

3. Debes tener un archivo `.env.local` con las variables requeridas

### Notas importantes

- 🔒 Nunca compartas tu archivo `.env.local` en Git
- 🔄 Ejecuta este script cada vez que cambies las variables de Supabase
- 🚀 El redeploy es necesario para que Next.js use las nuevas variables `NEXT_PUBLIC_*`

---

## 🔄 fix-duplicate-inventory

Corrige inventarios duplicados en la base de datos.

### Uso

```bash
npm run fix-duplicates
```

---

## ¿Cómo agregar más scripts?

1. Crea tu script en este directorio
2. Hazlo ejecutable: `chmod +x scripts/tu-script.sh`
3. Agrégalo a `package.json` en la sección `scripts`
4. Documéntalo aquí en este README
