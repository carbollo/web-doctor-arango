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

## Publicar entradas

1. Despliega con `DATABASE_URL` y `ADMIN_API_KEY` configuradas.
2. Abre `https://tu-dominio/admin`.
3. Pega la misma `ADMIN_API_KEY`, rellena el formulario y pulsa **Publicar**.
4. La entrada aparece en `/blog` y en la sección de novedades de la home (últimas 3).

## API REST

- `GET /api/posts` — listado (`?limit=3` para la home)
- `GET /api/posts/:slug` — detalle
- `POST /api/posts` — crear (header `x-api-key`)
- `PUT /api/posts/:id` — editar (header `x-api-key`)
- `DELETE /api/posts/:id` — borrar (header `x-api-key`)
- `GET /api/health` — estado (`db: true` si PostgreSQL está conectado)

Al primer arranque con base de datos vacía se insertan 3 posts de ejemplo (mismos títulos que la home anterior).

## Imágenes

En esta versión la imagen del post es una ruta o URL (`assets/images/blog1.jpg`). La subida de archivos al servidor requeriría almacenamiento externo (S3/R2) en una fase posterior.
