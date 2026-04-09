# 🚀 Guía de Despliegue — Puerta Abierta Recreando

Este documento describe todos los pasos necesarios para replicar la aplicación en un nuevo servidor o entorno.

---

## 📋 Requisitos previos

| Herramienta | Versión mínima | Notas |
|---|---|---|
| Node.js | 18+ | Necesario para el frontend |
| Bun (opcional) | 1.0+ | Alternativa más rápida a npm/yarn |
| Supabase CLI | 1.0+ | Para migraciones y funciones edge |
| Git | cualquiera | Para clonar el repositorio |

---

## 1️⃣ Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd <nombre-del-proyecto>
npm install
# o con bun:
bun install
```

---

## 2️⃣ Crear un nuevo proyecto en Supabase

1. Ir a [https://supabase.com](https://supabase.com) → **New Project**
2. Elegir organización, nombre y contraseña de la base de datos
3. Anotar los siguientes valores desde **Settings → API**:

| Variable | Dónde encontrarla |
|---|---|
| `VITE_SUPABASE_URL` | Settings → API → Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Settings → API → anon/public key |
| `VITE_SUPABASE_PROJECT_ID` | Settings → General → Reference ID |

---

## 3️⃣ Configurar variables de entorno

Crear el archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://TU_PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...tu_anon_key...
VITE_SUPABASE_PROJECT_ID=tu_project_id
```

> ⚠️ **Nunca commitees el archivo `.env` al repositorio.**

---

## 4️⃣ Aplicar el schema de base de datos

### Opción A — Usando el backup SQL (recomendado)

1. Ir al panel de Administración de la app → pestaña **Configuración**
2. Descargar el **Backup Completo** (incluye datos) o solo los **Catálogos** (configuración base)
3. En el nuevo proyecto de Supabase → **SQL Editor** → pegar y ejecutar el archivo `.sql`

### Opción B — Usando Supabase CLI

```bash
supabase login
supabase link --project-ref TU_PROJECT_ID
supabase db push
```

---

## 5️⃣ Desplegar las Edge Functions

```bash
supabase functions deploy database-backup
```

O bien, conectar el repositorio a Supabase desde el dashboard para despliegue automático.

---

## 6️⃣ Configurar autenticación

En el nuevo proyecto Supabase → **Authentication → Providers**:

- ✅ Activar **Email** (habilitado por defecto)
- Configurar **Site URL**: la URL del nuevo servidor (ej. `https://mi-nuevo-dominio.com`)
- Configurar **Redirect URLs** si se usan links de email

---

## 7️⃣ Crear el primer usuario administrador

Una vez desplegada la app:

1. Registrar el primer usuario en `/auth`
2. En Supabase → **SQL Editor**, ejecutar:

```sql
-- Reemplazar con el email real del administrador
UPDATE public.user_roles 
SET role = 'administrador' 
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'tu_email@dominio.com'
);
```

---

## 8️⃣ Construir y servir el frontend

### Desarrollo local

```bash
npm run dev
# o:
bun run dev
```

### Producción

```bash
npm run build
# Los archivos estáticos quedarán en la carpeta /dist
```

Servir la carpeta `/dist` con cualquier servidor estático (Nginx, Vercel, Netlify, Cloudflare Pages, etc.).

---

## 📦 Estructura del proyecto

```
├── src/
│   ├── pages/          # Vistas principales
│   ├── components/     # Componentes reutilizables
│   ├── lib/            # Stores y lógica de negocio
│   ├── hooks/          # Hooks de React
│   └── integrations/   # Cliente Supabase
├── supabase/
│   ├── functions/      # Edge Functions
│   └── migrations/     # Migraciones SQL
├── public/             # Archivos estáticos
└── DEPLOYMENT.md       # Este archivo
```

---

## 🔐 Variables de entorno en producción

Para plataformas como Vercel, Netlify o similares, configurar las mismas variables en el panel de variables de entorno del proveedor.

| Variable | Descripción |
|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clave pública (anon key) |
| `VITE_SUPABASE_PROJECT_ID` | ID del proyecto Supabase |

---

## 🆘 Soporte

- Documentación de Supabase: [https://supabase.com/docs](https://supabase.com/docs)
- Documentación de Lovable: [https://docs.lovable.dev](https://docs.lovable.dev)
