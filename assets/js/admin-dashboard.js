(function () {
  "use strict";

  var STORAGE_KEY = "dr_arango_admin_api_key";
  var postsCache = [];

  var sidebar = document.getElementById("admin-sidebar");
  var overlay = document.getElementById("admin-overlay");
  var menuToggle = document.getElementById("admin-menu-toggle");
  var toastEl = document.getElementById("admin-toast");
  var historyContent = document.getElementById("history-content");
  var historySearch = document.getElementById("history-search");
  var historyStatus = document.getElementById("history-status");
  var form = document.getElementById("blog-admin-form");
  var postIdInput = document.getElementById("post-id");
  var titleInput = document.getElementById("post-title");
  var slugInput = document.getElementById("post-slug");
  var editorTitle = document.getElementById("editor-title");
  var editorSubtitle = document.getElementById("editor-subtitle");
  var submitBtn = document.getElementById("post-submit-btn");
  var cancelEditBtn = document.getElementById("post-cancel-edit");
  var previewLink = document.getElementById("post-preview-link");
  var apiKeyInput = document.getElementById("admin-api-key");
  var dbStatus = document.getElementById("db-status");
  var settingsForm = document.getElementById("settings-form");

  function getApiKey() {
    return sessionStorage.getItem(STORAGE_KEY) || "";
  }

  function setApiKey(key) {
    if (key) {
      sessionStorage.setItem(STORAGE_KEY, key);
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
    apiKeyInput.value = key || "";
  }

  function showToast(message, type) {
    toastEl.textContent = message;
    toastEl.className = "admin-toast visible" + (type ? " " + type : "");
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(function () {
      toastEl.classList.remove("visible");
    }, 4000);
  }

  function slugify(text) {
    return String(text)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatDate(dateString) {
    if (!dateString) return "—";
    var date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function toDatetimeLocalValue(dateString) {
    if (!dateString) return "";
    var date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    var pad = function (n) {
      return String(n).padStart(2, "0");
    };
    return (
      date.getFullYear() +
      "-" +
      pad(date.getMonth() + 1) +
      "-" +
      pad(date.getDate()) +
      "T" +
      pad(date.getHours()) +
      ":" +
      pad(date.getMinutes())
    );
  }

  function adminFetch(url, options) {
    var key = getApiKey();
    if (!key) {
      return Promise.reject(new Error("Guarda la API key en Ajustes primero."));
    }
    var opts = options || {};
    opts.headers = Object.assign({}, opts.headers || {}, { "x-api-key": key });
    return fetch(url, opts).then(function (res) {
      return res.json().then(function (data) {
        return { ok: res.ok, status: res.status, data: data };
      });
    });
  }

  function switchPanel(panelId) {
    document.querySelectorAll(".admin-nav button").forEach(function (btn) {
      var active = btn.getAttribute("data-panel") === panelId;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
    document.querySelectorAll(".admin-panel").forEach(function (panel) {
      panel.classList.toggle("active", panel.id === "panel-" + panelId);
    });
    sidebar.classList.remove("open");
    overlay.classList.remove("visible");
  }

  function requireApiKeyOrRedirect() {
    if (!getApiKey()) {
      showToast("Configura la API key en Ajustes.", "error");
      switchPanel("ajustes");
      return false;
    }
    return true;
  }

  function loadHealth() {
    fetch("/api/health")
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        if (data.db) {
          dbStatus.className = "admin-status-row ok";
          dbStatus.innerHTML =
            '<i class="bi bi-database-check"></i><span>PostgreSQL conectado. El blog esta operativo.</span>';
        } else {
          dbStatus.className = "admin-status-row warn";
          dbStatus.innerHTML =
            '<i class="bi bi-database-x"></i><span>Base de datos no disponible. Revisa DATABASE_URL en Railway.</span>';
        }
      })
      .catch(function () {
        dbStatus.className = "admin-status-row error";
        dbStatus.innerHTML =
          '<i class="bi bi-exclamation-triangle"></i><span>No se pudo contactar con el servidor.</span>';
      });
  }

  function filterPostsLocal() {
    var q = historySearch.value.trim().toLowerCase();
    var status = historyStatus.value;
    return postsCache.filter(function (post) {
      if (status === "published" && !post.is_published) return false;
      if (status === "draft" && post.is_published) return false;
      if (q) {
        var hay = (post.title + " " + post.slug).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  function renderHistoryTable(posts) {
    if (!posts.length) {
      historyContent.innerHTML =
        '<div class="admin-empty"><i class="bi bi-inbox" style="font-size:2rem;display:block;margin-bottom:12px;"></i>No hay entradas con estos filtros.</div>';
      return;
    }

    var rows = posts
      .map(function (post) {
        var img = post.image_url || "assets/images/blog1.jpg";
        if (img.indexOf("http") !== 0 && img.indexOf("/") !== 0) {
          img = "/" + img;
        }
        var badge = post.is_published
          ? '<span class="admin-badge admin-badge-published">Publicado</span>'
          : '<span class="admin-badge admin-badge-draft">Borrador</span>';
        return (
          "<tr>" +
          '<td><img class="admin-thumb" src="' +
          escapeHtml(img) +
          '" alt=""></td>' +
          "<td><strong>" +
          escapeHtml(post.title) +
          "</strong><br><small style='color:#646464'>/" +
          escapeHtml(post.slug) +
          "</small></td>" +
          "<td>" +
          escapeHtml(formatDate(post.published_at)) +
          "</td>" +
          "<td>" +
          badge +
          "</td>" +
          '<td><div class="admin-actions">' +
          '<button type="button" class="admin-btn admin-btn-secondary" data-edit="' +
          post.id +
          '"><i class="bi bi-pencil"></i> Editar</button>' +
          '<button type="button" class="admin-btn admin-btn-danger" data-delete="' +
          post.id +
          '"><i class="bi bi-trash"></i></button>' +
          "</div></td>" +
          "</tr>"
        );
      })
      .join("");

    historyContent.innerHTML =
      '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>' +
      "<th></th><th>Titulo</th><th>Fecha</th><th>Estado</th><th>Acciones</th>" +
      "</tr></thead><tbody>" +
      rows +
      "</tbody></table></div>";

    historyContent.querySelectorAll("[data-edit]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        loadPostForEdit(parseInt(btn.getAttribute("data-edit"), 10));
      });
    });

    historyContent.querySelectorAll("[data-delete]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = parseInt(btn.getAttribute("data-delete"), 10);
        var post = postsCache.find(function (p) {
          return p.id === id;
        });
        var title = post ? post.title : "esta entrada";
        if (
          confirm(
            '¿Eliminar "' + title + '"? Esta accion no se puede deshacer.'
          )
        ) {
          deletePost(id);
        }
      });
    });
  }

  function loadHistory() {
    if (!requireApiKeyOrRedirect()) {
      historyContent.innerHTML =
        '<div class="admin-empty">Configura la API key en Ajustes para ver el historial.</div>';
      return;
    }

    historyContent.innerHTML = '<div class="admin-loading">Cargando entradas...</div>';

    var status = historyStatus.value;
    adminFetch("/api/admin/posts?status=" + encodeURIComponent(status))
      .then(function (result) {
        if (!result.ok) {
          throw new Error(result.data.error || "Error al cargar entradas.");
        }
        postsCache = result.data;
        renderHistoryTable(filterPostsLocal());
      })
      .catch(function (err) {
        historyContent.innerHTML =
          '<div class="admin-empty">' + escapeHtml(err.message) + "</div>";
        showToast(err.message, "error");
      });
  }

  function deletePost(id) {
    adminFetch("/api/posts/" + id, { method: "DELETE" })
      .then(function (result) {
        if (!result.ok) {
          throw new Error(result.data.error || "Error al eliminar.");
        }
        showToast("Entrada eliminada.", "success");
        loadHistory();
      })
      .catch(function (err) {
        showToast(err.message, "error");
      });
  }

  function resetEditor() {
    postIdInput.value = "";
    form.reset();
    document.getElementById("post-image").value = "assets/images/blog1.jpg";
    document.getElementById("post-published").checked = true;
    slugInput.dataset.manual = "";
    editorTitle.textContent = "Nueva entrada";
    editorSubtitle.textContent = "Crea una publicacion para el blog.";
    submitBtn.innerHTML = '<i class="bi bi-send"></i> Publicar';
    cancelEditBtn.hidden = true;
    previewLink.hidden = true;
  }

  function loadPostForEdit(id) {
    if (!requireApiKeyOrRedirect()) return;

    adminFetch("/api/admin/posts/" + id)
      .then(function (result) {
        if (!result.ok) {
          throw new Error(result.data.error || "No se pudo cargar la entrada.");
        }
        var post = result.data;
        switchPanel("nuevo");
        postIdInput.value = post.id;
        titleInput.value = post.title;
        slugInput.value = post.slug;
        slugInput.dataset.manual = "1";
        document.getElementById("post-subtitle").value = post.excerpt || "";
        document.getElementById("post-body").value = window.BlogApi
          ? BlogApi.contentToPlainText(post.content)
          : post.content || "";
        document.getElementById("post-image").value =
          post.image_url || "assets/images/blog1.jpg";
        document.getElementById("post-date").value = toDatetimeLocalValue(
          post.published_at
        );
        document.getElementById("post-published").checked = !!post.is_published;
        editorTitle.textContent = "Editar entrada";
        editorSubtitle.textContent = "ID #" + post.id + " · /blog/" + post.slug;
        submitBtn.innerHTML = '<i class="bi bi-check-lg"></i> Guardar cambios';
        cancelEditBtn.hidden = false;
        previewLink.href = "/blog/" + encodeURIComponent(post.slug);
        previewLink.hidden = !post.is_published;
      })
      .catch(function (err) {
        showToast(err.message, "error");
      });
  }

  document.querySelectorAll(".admin-nav button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var panel = btn.getAttribute("data-panel");
      switchPanel(panel);
      if (panel === "historial") loadHistory();
      if (panel === "ajustes") loadHealth();
    });
  });

  menuToggle.addEventListener("click", function () {
    sidebar.classList.toggle("open");
    overlay.classList.toggle("visible");
  });

  overlay.addEventListener("click", function () {
    sidebar.classList.remove("open");
    overlay.classList.remove("visible");
  });

  historySearch.addEventListener("input", function () {
    renderHistoryTable(filterPostsLocal());
  });

  historyStatus.addEventListener("change", loadHistory);
  document.getElementById("history-refresh").addEventListener("click", loadHistory);
  document.getElementById("history-new-btn").addEventListener("click", function () {
    resetEditor();
    switchPanel("nuevo");
  });

  cancelEditBtn.addEventListener("click", function () {
    resetEditor();
    switchPanel("historial");
  });

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
    if (!requireApiKeyOrRedirect()) return;

    var payload = {
      title: titleInput.value.trim(),
      slug: slugInput.value.trim(),
      excerpt: document.getElementById("post-subtitle").value.trim(),
      content: document.getElementById("post-body").value.trim(),
      image_url: document.getElementById("post-image").value.trim(),
      published_at: document.getElementById("post-date").value || null,
      is_published: document.getElementById("post-published").checked,
    };

    var editId = parseInt(postIdInput.value, 10);
    var url = editId ? "/api/posts/" + editId : "/api/posts";
    var method = editId ? "PUT" : "POST";

    submitBtn.disabled = true;

    adminFetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (result) {
        if (!result.ok) {
          throw new Error(result.data.error || "Error al guardar.");
        }
        var post = result.data;
        showToast(
          editId ? "Cambios guardados." : "Publicado: /blog/" + post.slug,
          "success"
        );
        resetEditor();
        switchPanel("historial");
        loadHistory();
      })
      .catch(function (err) {
        showToast(err.message, "error");
      })
      .finally(function () {
        submitBtn.disabled = false;
      });
  });

  settingsForm.addEventListener("submit", function (event) {
    event.preventDefault();
    var key = apiKeyInput.value.trim();
    if (!key) {
      showToast("Introduce la API key.", "error");
      return;
    }
    setApiKey(key);
    showToast("API key guardada en esta sesion.", "success");
    loadHistory();
  });

  document.getElementById("settings-clear-key").addEventListener("click", function () {
    setApiKey("");
    showToast("Clave eliminada de la sesion.", "success");
  });

  setApiKey(getApiKey());
  loadHealth();
  if (getApiKey()) {
    loadHistory();
  } else {
    historyContent.innerHTML =
      '<div class="admin-empty">Ve a <strong>Ajustes</strong> y guarda tu API key para empezar.</div>';
    switchPanel("ajustes");
  }
})();
