(function () {
  "use strict";

  var form = document.getElementById("blog-admin-form");
  if (!form) return;

  var titleInput = document.getElementById("post-title");
  var slugInput = document.getElementById("post-slug");
  var statusBox = document.getElementById("admin-status");

  function slugify(text) {
    return String(text)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  titleInput.addEventListener("input", function () {
    if (!slugInput.dataset.manual) {
      slugInput.value = slugify(titleInput.value);
    }
  });

  slugInput.addEventListener("input", function () {
    slugInput.dataset.manual = "1";
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    statusBox.textContent = "Publicando...";
    statusBox.className = "admin-status";

    var apiKey = document.getElementById("admin-api-key").value.trim();
    if (!apiKey) {
      statusBox.textContent = "Introduce la API key (ADMIN_API_KEY).";
      statusBox.className = "admin-status error";
      return;
    }

    var payload = {
      title: document.getElementById("post-title").value.trim(),
      slug: document.getElementById("post-slug").value.trim(),
      excerpt: document.getElementById("post-excerpt").value.trim(),
      content: document.getElementById("post-content").value.trim(),
      image_url: document.getElementById("post-image").value.trim(),
      published_at: document.getElementById("post-date").value || null,
      is_published: document.getElementById("post-published").checked,
    };

    fetch("/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (result) {
        if (!result.ok) {
          throw new Error(result.data.error || "Error al publicar.");
        }
        statusBox.textContent =
          "Publicado correctamente: /blog/" + result.data.slug;
        statusBox.className = "admin-status success";
        form.reset();
        slugInput.dataset.manual = "";
      })
      .catch(function (err) {
        statusBox.textContent = err.message;
        statusBox.className = "admin-status error";
      });
  });
})();
