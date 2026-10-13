# Famiglia Moltisanti — Web oficial

Sitio estático (HTML + CSS + JS) para **GitHub Pages**, con login y base de datos mediante **Supabase** (gratis).

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `index.html` | Estructura de la página |
| `styles.css` | Diseño oscuro/elegante y adaptable a móvil |
| `app.js` | Animaciones, panel, login y tablón |
| `config.js` | **Lo único que debes editar** (Discord y Supabase) |
| `schema.sql` | Crea las tablas y la seguridad en Supabase |
| `.nojekyll` | Evita que GitHub procese el sitio con Jekyll |

## Paso 1 — Crear el proyecto en Supabase
1. Entra en https://supabase.com e inicia sesión → **New project** (nombre: `famiglia-moltisanti`, elige región y contraseña).
2. Cuando termine de crearse, abre **SQL Editor → New query**, pega todo `schema.sql` y pulsa **Run**.
3. Ve a **Project Settings → API** y copia:
   - **Project URL**
   - **anon public key**
4. (Opcional) En **Authentication → Providers → Email**, desactiva "Confirm email" si quieres que los registros entren al instante.

## Paso 2 — Editar `config.js`
Pega tu invitación de Discord, la Project URL y la anon key. La anon key es pública por diseño; la protección real son las políticas RLS de `schema.sql`.

## Paso 3 — Subir a GitHub
1. Crea un repositorio nuevo en GitHub (por ejemplo `famiglia-moltisanti`), público.
2. Sube todos los archivos a la raíz (**Add file → Upload files**, o con git):
   ```bash
   git init
   git add .
   git commit -m "Web Famiglia Moltisanti"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/famiglia-moltisanti.git
   git push -u origin main
   ```

## Paso 4 — Activar GitHub Pages
1. En el repo: **Settings → Pages**.
2. En **Source** elige **Deploy from a branch**, rama `main`, carpeta `/ (root)` → **Save**.
3. En 1–2 minutos tu web estará en `https://TU_USUARIO.github.io/famiglia-moltisanti/`.

## Paso 5 — Permitir tu dominio en Supabase
En Supabase → **Authentication → URL Configuration**, pon como **Site URL** la dirección de tu GitHub Pages y añádela también en **Redirect URLs**. Así los correos de confirmación apuntarán a tu web.

## Gestionar contenido
- **Anuncios:** Supabase → Table Editor → `announcements` → Insert row.
- **Rangos de miembros:** Table Editor → `profiles` → edita la columna `rank` (desde la web nadie puede cambiarse el rango).
- **Moderar el tablón:** Table Editor → `posts` → borra filas.

## Personalizar
- Colores: variables al inicio de `styles.css` (`--gold`, `--bg`, `--red`…).
- Textos de Familia, Rangos y Reglas: directamente en `index.html`.

> Nota: GitHub Pages solo sirve archivos estáticos, por eso el login y los datos viven en Supabase. Nunca pongas la `service_role` key en la web.
