require("dotenv").config();

const crypto = require("crypto");
const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 8080;
const ROOT = __dirname;
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "";

const LIMITS = {
  title: 200,
  excerpt: 300,
  content: 50000,
  image_url: 500,
  search: 100,
};
const SLUG_REGEX = /^[a-z0-9-]{1,120}$/;
const ALLOWED_STATUS = new Set(["all", "published", "draft"]);

let pool = null;
let dbReady = false;

function getAllowedOrigins() {
  const origins = new Set([
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "https://drpauloarango.com",
    "https://www.drpauloarango.com",
  ]);
  if (process.env.ADMIN_CORS_ORIGINS) {
    process.env.ADMIN_CORS_ORIGINS.split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .forEach((value) => origins.add(value));
  }
  return origins;
}

const allowedOrigins = getAllowedOrigins();

function secureCompareApiKey(provided) {
  if (!ADMIN_API_KEY || typeof provided !== "string") {
    return false;
  }
  try {
    const expected = Buffer.from(ADMIN_API_KEY, "utf8");
    const actual = Buffer.from(provided, "utf8");
    if (expected.length !== actual.length) {
      return false;
    }
    return crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function isValidSlug(slug) {
  return SLUG_REGEX.test(slug);
}

function clampString(value, max) {
  return String(value ?? "").slice(0, max);
}

function validatePostBody(body, isUpdate = false) {
  const errors = [];
  if (!isUpdate || body.title != null) {
    const title = clampString(body.title, LIMITS.title).trim();
    if (!title) {
      errors.push("El titulo es obligatorio.");
    }
  }
  if (body.slug != null && String(body.slug).trim()) {
    const slug = slugify(body.slug);
    if (!slug || !isValidSlug(slug)) {
      errors.push("Slug invalido.");
    }
  }
  if (body.excerpt != null && clampString(body.excerpt, LIMITS.excerpt).length > LIMITS.excerpt) {
    errors.push("Subtitulo demasiado largo.");
  }
  if (body.content != null && clampString(body.content, LIMITS.content).length > LIMITS.content) {
    errors.push("Contenido demasiado largo.");
  }
  if (body.image_url != null && clampString(body.image_url, LIMITS.image_url).length > LIMITS.image_url) {
    errors.push("URL de imagen demasiado larga.");
  }
  return errors;
}

function requireApiKey(req, res, next) {
  if (!ADMIN_API_KEY) {
    return res.status(503).json({
      error: "ADMIN_API_KEY no configurada en el servidor.",
    });
  }
  const key = req.get("x-api-key") || "";
  if (!secureCompareApiKey(key)) {
    return res.status(401).json({ error: "API key invalida." });
  }
  next();
}

async function initDb() {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL no definida: el blog no estara disponible.");
    return;
  }

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("localhost")
      ? false
      : { rejectUnauthorized: false },
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      excerpt TEXT DEFAULT '',
      content TEXT DEFAULT '',
      image_url TEXT DEFAULT 'assets/images/blog1.jpg',
      published_at TIMESTAMPTZ DEFAULT NOW(),
      is_published BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  const count = await pool.query("SELECT COUNT(*)::int AS total FROM posts");
  if (count.rows[0].total === 0) {
    const seedPosts = [
      {
        title: "200+ consejos medicos para cuidar tu salud",
        slug: "consejos-medicos-salud",
        excerpt:
          "Recomendaciones practicas para cuidar tu salud cardiovascular y prevenir complicaciones.",
        content:
          "La prevencion es la base de una buena salud. En esta guia repasamos habitos diarios, revisiones medicas y senales de alerta que conviene no ignorar.\n\nConsulta con tu especialista para un plan personalizado segun tu edad y antecedentes.",
        image_url: "assets/images/blog1.jpg",
      },
      {
        title: "150+ recomendaciones para mejorar tu bienestar",
        slug: "recomendaciones-bienestar",
        excerpt:
          "Pequenos cambios en alimentacion, actividad fisica y descanso que mejoran tu calidad de vida.",
        content:
          "El bienestar integral combina salud fisica y mental. Prioriza el movimiento regular, hidratacion y pausas activas durante el dia.\n\nUn seguimiento medico periodico ayuda a mantener objetivos realistas y sostenibles.",
        image_url: "assets/images/blog2.jpg",
      },
      {
        title: "250+ claves para una vida mas saludable",
        slug: "claves-vida-saludable",
        excerpt:
          "Claves sencillas para construir habitos saludables de forma progresiva y constante.",
        content:
          "No se trata de cambios drasticos de un dia para otro. La constancia en habitos saludables genera resultados duraderos.\n\nAdapta cada recomendacion a tu contexto y consulta ante cualquier sintoma persistente.",
        image_url: "assets/images/blog3.jpg",
      },
    ];

    for (const post of seedPosts) {
      await pool.query(
        `INSERT INTO posts (title, slug, excerpt, content, image_url, published_at, is_published)
         VALUES ($1, $2, $3, $4, $5, NOW(), TRUE)`,
        [post.title, post.slug, post.excerpt, post.content, post.image_url]
      );
    }
    console.log("Posts iniciales insertados en PostgreSQL.");
  }

  dbReady = true;
  console.log("PostgreSQL conectado y tabla posts lista.");
}

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// Compresion gzip/brotli para HTML, CSS, JS y demas recursos de texto
app.use(compression());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-api-key"],
  })
);

app.use(express.json({ limit: "2mb" }));

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos. Espera unos minutos." },
});

const adminWriteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas peticiones. Intenta de nuevo en un minuto." },
});

app.get("/api/health", async (_req, res) => {
  res.json({ ok: true, db: dbReady });
});

app.post("/api/admin/verify", verifyLimiter, (req, res) => {
  if (!ADMIN_API_KEY) {
    return res.status(503).json({
      error: "ADMIN_API_KEY no configurada en el servidor.",
    });
  }
  const key = req.get("x-api-key") || "";
  if (!secureCompareApiKey(key)) {
    return res.status(401).json({ error: "API key invalida." });
  }
  res.json({ ok: true });
});

app.get("/api/posts", async (req, res) => {
  if (!dbReady) {
    return res.status(503).json({ error: "Base de datos no disponible." });
  }
  const limit = Math.min(parseInt(req.query.limit, 10) || 100, 100);
  const result = await pool.query(
    `SELECT id, title, slug, excerpt, image_url, published_at
     FROM posts
     WHERE is_published = TRUE
     ORDER BY published_at DESC
     LIMIT $1`,
    [limit]
  );
  res.json(result.rows);
});

app.get(
  "/api/admin/posts",
  adminWriteLimiter,
  requireApiKey,
  async (req, res) => {
    if (!dbReady) {
      return res.status(503).json({ error: "Base de datos no disponible." });
    }

    const status = req.query.status || "all";
    if (!ALLOWED_STATUS.has(status)) {
      return res.status(400).json({ error: "Filtro de estado invalido." });
    }

    const q = clampString(req.query.q, LIMITS.search).trim();
    const conditions = [];
    const params = [];

    if (status === "published") {
      conditions.push("is_published = TRUE");
    } else if (status === "draft") {
      conditions.push("is_published = FALSE");
    }

    if (q) {
      params.push(`%${q}%`);
      conditions.push(
        `(title ILIKE $${params.length} OR slug ILIKE $${params.length})`
      );
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await pool.query(
      `SELECT id, title, slug, excerpt, image_url, published_at, is_published, created_at
       FROM posts
       ${where}
       ORDER BY published_at DESC, id DESC`,
      params
    );
    res.json(result.rows);
  }
);

app.get(
  "/api/admin/posts/:id",
  adminWriteLimiter,
  requireApiKey,
  async (req, res) => {
    if (!dbReady) {
      return res.status(503).json({ error: "Base de datos no disponible." });
    }
    const id = parseInt(req.params.id, 10);
    if (!id || id < 1) {
      return res.status(400).json({ error: "ID invalido." });
    }
    const result = await pool.query(
      `SELECT id, title, slug, excerpt, content, image_url, published_at, is_published, created_at
       FROM posts WHERE id = $1 LIMIT 1`,
      [id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: "Post no encontrado." });
    }
    res.json(result.rows[0]);
  }
);

app.get("/api/posts/:slug", async (req, res) => {
  if (!dbReady) {
    return res.status(503).json({ error: "Base de datos no disponible." });
  }
  const slug = String(req.params.slug || "").trim();
  if (!isValidSlug(slug)) {
    return res.status(400).json({ error: "Slug invalido." });
  }
  const result = await pool.query(
    `SELECT id, title, slug, excerpt, content, image_url, published_at
     FROM posts
     WHERE slug = $1 AND is_published = TRUE
     LIMIT 1`,
    [slug]
  );
  if (!result.rows.length) {
    return res.status(404).json({ error: "Post no encontrado." });
  }
  res.json(result.rows[0]);
});

app.post("/api/posts", adminWriteLimiter, requireApiKey, async (req, res) => {
  if (!dbReady) {
    return res.status(503).json({ error: "Base de datos no disponible." });
  }

  const validationErrors = validatePostBody(req.body, false);
  if (validationErrors.length) {
    return res.status(400).json({ error: validationErrors[0] });
  }

  const {
    title,
    slug,
    excerpt = "",
    content = "",
    image_url = "assets/images/blog1.jpg",
    published_at,
    is_published = true,
  } = req.body;

  const finalSlug = slugify(slug || title);
  if (!finalSlug || !isValidSlug(finalSlug)) {
    return res.status(400).json({ error: "Slug invalido." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO posts (title, slug, excerpt, content, image_url, published_at, is_published)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6::timestamptz, NOW()), $7)
       RETURNING id, title, slug, excerpt, content, image_url, published_at, is_published`,
      [
        clampString(title, LIMITS.title).trim(),
        finalSlug,
        clampString(excerpt, LIMITS.excerpt),
        clampString(content, LIMITS.content),
        clampString(image_url, LIMITS.image_url),
        published_at || null,
        Boolean(is_published),
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Ya existe un post con ese slug." });
    }
    console.error(err);
    res.status(500).json({ error: "Error al crear el post." });
  }
});

app.put("/api/posts/:id", adminWriteLimiter, requireApiKey, async (req, res) => {
  if (!dbReady) {
    return res.status(503).json({ error: "Base de datos no disponible." });
  }

  const id = parseInt(req.params.id, 10);
  if (!id || id < 1) {
    return res.status(400).json({ error: "ID invalido." });
  }

  const validationErrors = validatePostBody(req.body, true);
  if (validationErrors.length) {
    return res.status(400).json({ error: validationErrors[0] });
  }

  const {
    title,
    slug,
    excerpt,
    content,
    image_url,
    published_at,
    is_published,
  } = req.body;

  const nextSlug = slug != null && String(slug).trim() ? slugify(slug) : null;
  if (nextSlug && !isValidSlug(nextSlug)) {
    return res.status(400).json({ error: "Slug invalido." });
  }

  try {
    const result = await pool.query(
      `UPDATE posts SET
        title = COALESCE($2, title),
        slug = COALESCE($3, slug),
        excerpt = COALESCE($4, excerpt),
        content = COALESCE($5, content),
        image_url = COALESCE($6, image_url),
        published_at = COALESCE($7::timestamptz, published_at),
        is_published = COALESCE($8, is_published)
       WHERE id = $1
       RETURNING id, title, slug, excerpt, content, image_url, published_at, is_published`,
      [
        id,
        title != null ? clampString(title, LIMITS.title).trim() : null,
        nextSlug,
        excerpt != null ? clampString(excerpt, LIMITS.excerpt) : null,
        content != null ? clampString(content, LIMITS.content) : null,
        image_url != null ? clampString(image_url, LIMITS.image_url) : null,
        published_at || null,
        is_published != null ? Boolean(is_published) : null,
      ]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: "Post no encontrado." });
    }
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Ya existe un post con ese slug." });
    }
    console.error(err);
    res.status(500).json({ error: "Error al actualizar el post." });
  }
});

app.delete(
  "/api/posts/:id",
  adminWriteLimiter,
  requireApiKey,
  async (req, res) => {
    if (!dbReady) {
      return res.status(503).json({ error: "Base de datos no disponible." });
    }
    const id = parseInt(req.params.id, 10);
    if (!id || id < 1) {
      return res.status(400).json({ error: "ID invalido." });
    }
    const result = await pool.query(
      "DELETE FROM posts WHERE id = $1 RETURNING id",
      [id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: "Post no encontrado." });
    }
    res.json({ ok: true, id: result.rows[0].id });
  }
);

app.get("/admin", (_req, res) => {
  res.sendFile(path.join(ROOT, "admin", "index.html"));
});

app.get(["/blog", "/blog/"], (_req, res) => {
  res.sendFile(path.join(ROOT, "blog", "index.html"));
});

app.get("/blog/:slug", (req, res, next) => {
  if (req.params.slug.includes(".")) {
    return next();
  }
  res.sendFile(path.join(ROOT, "blog", "post.html"));
});

// Estaticos con politica de cache eficiente:
//  - imagenes/fuentes: cache larga (1 ano) ya que cambian poco
//  - css/js: 30 dias
//  - html: revalidar siempre para que los cambios se publiquen al instante
app.use(
  express.static(ROOT, {
    index: false,
    etag: true,
    lastModified: true,
    setHeaders(res, filePath) {
      if (/\.(?:webp|avif|png|jpe?g|gif|svg|ico|woff2?|ttf|eot)$/i.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else if (/\.(?:css|js)$/i.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=2592000");
      } else if (/\.html?$/i.test(filePath)) {
        res.setHeader("Cache-Control", "no-cache");
      }
    },
  })
);

app.get("/", (_req, res) => {
  res.sendFile(path.join(ROOT, "index.html"));
});

initDb()
  .catch((err) => {
    console.error("Error inicializando base de datos:", err.message);
  })
  .finally(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Servidor en http://0.0.0.0:${PORT}`);
    });
  });
