# Web Dr. Arango

Sitio del Dr. Paulo César Arango con blog dinámico en PostgreSQL, servido por Node.js + Express.

## Desarrollo local

1. Instalar dependencias:

```bash
npm install
```

2. Crear un archivo `.env` (opcional en local):

```env
DATABASE_URL=postgresql://usuario:password@localhost:5432/doctor_arango
ADMIN_API_KEY=tu-clave-secreta-local
PORT=8080
```

3. Arrancar el servidor:

```bash
npm start
```

- Home: http://localhost:8080/
- Blog: http://localhost:8080/blog
- Admin: http://localhost:8080/admin

Sin `DATABASE_URL`, la web estática sigue funcionando; el blog mostrará un mensaje de error amigable.

## Variables en Railway

En el **servicio web** (no solo en PostgreSQL), configura:

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Connection string del plugin PostgreSQL de Railway (copiar desde el servicio de base de datos). |
| `ADMIN_API_KEY` | Clave secreta para publicar desde `/admin` (cabecera `x-api-key`). |
| `PORT` | Railway la inyecta automáticamente. |

## Panel de administración (`/admin`)

El panel tiene tres apartados:

| Apartado | Función |
|----------|---------|
| **Historial** | Lista todas las entradas (publicadas y borradores), buscar, filtrar, editar y eliminar |
| **Nuevo post** | Crear entrada o editar una existente (mismo formulario) |
| **Ajustes** | Guardar la API key en la sesión del navegador y ver estado de la base de datos |

### Flujo recomendado

1. Despliega con `DATABASE_URL` y `ADMIN_API_KEY` configuradas.
2. Abre `https://tu-dominio/admin`.
3. Ve a **Ajustes**, pega `ADMIN_API_KEY` y pulsa **Guardar clave**.
4. En **Historial** gestiona entradas existentes o **Nueva entrada** para publicar.
5. Las entradas publicadas aparecen en `/blog` y en la home (últimas 3).

Design system del admin: [`.stitch/DESIGN.md`](.stitch/DESIGN.md).

## API REST

### Pública (sin API key)

- `GET /api/posts` — listado publicado (`?limit=3` para la home)
- `GET /api/posts/:slug` — detalle publicado
- `GET /api/health` — estado (`db: true` si PostgreSQL está conectado)

### Administración (header `x-api-key`)

- `GET /api/admin/posts` — todas las entradas (`?status=published|draft|all`, `?q=texto`)
- `GET /api/admin/posts/:id` — detalle completo para edición
- `POST /api/posts` — crear
- `PUT /api/posts/:id` — editar
- `DELETE /api/posts/:id` — eliminar

Al primer arranque con base de datos vacía se insertan 3 posts de ejemplo (mismos títulos que la home anterior).

## Contenido de las entradas

En el admin cada post se escribe con tres campos:

- **Título** — cabecera del artículo
- **Subtítulo** — frase breve (se guarda en `excerpt` y aparece bajo el título en `/blog/:slug`)
- **Contenido** — texto plano; separa párrafos con una línea en blanco (se convierte automáticamente a HTML al publicar)

No hace falta escribir HTML. Las entradas antiguas con HTML siguen mostrándose correctamente.

## Imágenes

En esta versión la imagen del post es una ruta o URL (`assets/images/blog1.jpg`). La subida de archivos al servidor requeriría almacenamiento externo (S3/R2) en una fase posterior.
