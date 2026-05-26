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
| `ADMIN_API_KEY` | Clave secreta para el panel `/admin` (cabecera `x-api-key`). Usa una clave larga y aleatoria. |
| `ADMIN_CORS_ORIGINS` | Opcional. Orígenes extra separados por coma (ej. `https://drpauloarango.com`). |
| `PORT` | Railway la inyecta automáticamente. |

En producción, añade tu dominio en `ADMIN_CORS_ORIGINS` si el admin llama a la API desde otro host.

## Panel de administración (`/admin`)

Al entrar, el panel está **bloqueado**: solo puedes usar **Ajustes** hasta validar la API key en el servidor.

| Apartado | Función |
|----------|---------|
| **Ajustes** | Pegar API key, **Validar y entrar**, estado de PostgreSQL, cerrar sesión |
| **Historial** | (Tras validar) listar, buscar, filtrar, editar y eliminar entradas |
| **Nuevo post** | (Tras validar) crear o editar publicaciones |

### Flujo recomendado

1. Despliega con `DATABASE_URL` y `ADMIN_API_KEY` configuradas.
2. Abre `https://tu-dominio/admin`.
3. En **Ajustes**, pega `ADMIN_API_KEY` y pulsa **Validar y entrar**.
4. Si la clave es correcta, se desbloquean Historial y Nuevo post.
5. La sesión **no se guarda** al recargar ni al abrir `/admin` de nuevo: hay que validar la API key cada vez.

Design system del admin: [`.stitch/DESIGN.md`](.stitch/DESIGN.md).

## Seguridad

- **SQL injection**: consultas con parámetros (`$1`, `$2`); filtros de estado con valores fijos; búsqueda parametrizada.
- **API key**: comparación con `crypto.timingSafeEqual`; endpoint `POST /api/admin/verify` con límite de 10 intentos / 15 min por IP.
- **CORS**: solo orígenes permitidos (localhost + `ADMIN_CORS_ORIGINS`).
- **Cabeceras HTTP**: `helmet` activo.
- **Rate limit**: rutas admin limitadas a 60 peticiones / minuto por IP.
- **Validación**: longitudes máximas en título, subtítulo, contenido e imagen; slug solo `[a-z0-9-]`.

## API REST

### Pública (sin API key)

- `GET /api/posts` — listado publicado (`?limit=3` para la home)
- `GET /api/posts/:slug` — detalle publicado
- `GET /api/health` — estado (`db: true` si PostgreSQL está conectado)

### Administración (header `x-api-key`)

- `POST /api/admin/verify` — validar clave (obligatorio antes de usar el panel)
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
