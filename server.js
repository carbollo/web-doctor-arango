require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 8080;
const ROOT = __dirname;
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "";

let pool = null;
let dbReady = false;

function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function requireApiKey(req, res, next) {
  if (!ADMIN_API_KEY) {
    return res.status(503).json({
      error: "ADMIN_API_KEY no configurada en el servidor.",
    });
  }
  const key = req.get("x-api-key");
  if (key !== ADMIN_API_KEY) {
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
          "<p>La prevencion es la base de una buena salud. En esta guia repasamos habitos diarios, revisiones medicas y senales de alerta que conviene no ignorar.</p><p>Consulta con tu especialista para un plan personalizado segun tu edad y antecedentes.</p>",
        image_url: "assets/images/blog1.jpg",
      },
      {
        title: "150+ recomendaciones para mejorar tu bienestar",
        slug: "recomendaciones-bienestar",
        excerpt:
          "Pequenos cambios en alimentacion, actividad fisica y descanso que mejoran tu calidad de vida.",
        content:
          "<p>El bienestar integral combina salud fisica y mental. Prioriza el movimiento regular, hidratacion y pausas activas durante el dia.</p><p>Un seguimiento medico periodico ayuda a mantener objetivos realistas y sostenibles.</p>",
        image_url: "assets/images/blog2.jpg",
      },
      {
        title: "250+ claves para una vida mas saludable",
        slug: "claves-vida-saludable",
        excerpt:
          "Claves sencillas para construir habitos saludables de forma progresiva y constante.",
        content:
          "<p>No se trata de cambios drasticos de un dia para otro. La constancia en habitos saludables genera resultados duraderos.</p><p>Adapta cada recomendacion a tu contexto y consulta ante cualquier sintoma persistente.</p>",
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

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", async (_req, res) => {
  res.json({ ok: true, db: dbReady });
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

app.get("/api/admin/posts", requireApiKey, async (req, res) => {
  if (!dbReady) {
    return res.status(503).json({ error: "Base de datos no disponible." });
  }

  const status = req.query.status || "all";
  const q = String(req.query.q || "").trim();
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
});

app.get("/api/admin/posts/:id", requireApiKey, async (req, res) => {
  if (!dbReady) {
    return res.status(503).json({ error: "Base de datos no disponible." });
  }
  const id = parseInt(req.params.id, 10);
  if (!id) {
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
});

app.get("/api/posts/:slug", async (req, res) => {
  if (!dbReady) {
    return res.status(503).json({ error: "Base de datos no disponible." });
  }
  const result = await pool.query(
    `SELECT id, title, slug, excerpt, content, image_url, published_at
     FROM posts
     WHERE slug = $1 AND is_published = TRUE
     LIMIT 1`,
    [req.params.slug]
  );
  if (!result.rows.length) {
    return res.status(404).json({ error: "Post no encontrado." });
  }
  res.json(result.rows[0]);
});

app.post("/api/posts", requireApiKey, async (req, res) => {
  if (!dbReady) {
    return res.status(503).json({ error: "Base de datos no disponible." });
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

  if (!title || !String(title).trim()) {
    return res.status(400).json({ error: "El titulo es obligatorio." });
  }

  const finalSlug = slugify(slug || title);
  if (!finalSlug) {
    return res.status(400).json({ error: "Slug invalido." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO posts (title, slug, excerpt, content, image_url, published_at, is_published)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6::timestamptz, NOW()), $7)
       RETURNING id, title, slug, excerpt, content, image_url, published_at, is_published`,
      [
        String(title).trim(),
        finalSlug,
        String(excerpt),
        String(content),
        String(image_url),
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

app.put("/api/posts/:id", requireApiKey, async (req, res) => {
  if (!dbReady) {
    return res.status(503).json({ error: "Base de datos no disponible." });
  }

  const id = parseInt(req.params.id, 10);
  if (!id) {
    return res.status(400).json({ error: "ID invalido." });
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
        title ? String(title).trim() : null,
        slug ? slugify(slug) : null,
        excerpt != null ? String(excerpt) : null,
        content != null ? String(content) : null,
        image_url != null ? String(image_url) : null,
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

app.delete("/api/posts/:id", requireApiKey, async (req, res) => {
  if (!dbReady) {
    return res.status(503).json({ error: "Base de datos no disponible." });
  }
  const id = parseInt(req.params.id, 10);
  const result = await pool.query("DELETE FROM posts WHERE id = $1 RETURNING id", [id]);
  if (!result.rows.length) {
    return res.status(404).json({ error: "Post no encontrado." });
  }
  res.json({ ok: true, id: result.rows[0].id });
});

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

app.use(express.static(ROOT, { index: false }));

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
