(function () {
  "use strict";

  var container = document.getElementById("blog-posts-list");
  if (!container || !window.BlogApi) return;

  var FETCH_TIMEOUT_MS = 10000;

  function showMessage(html) {
    container.innerHTML = html;
  }

  function fetchWithTimeout(url, ms) {
    var controller = new AbortController();
    var timer = setTimeout(function () {
      controller.abort();
    }, ms);
    return fetch(url, { signal: controller.signal }).finally(function () {
      clearTimeout(timer);
    });
  }

  showMessage('<div class="col-12"><p>Cargando entradas...</p></div>');

  fetchWithTimeout("/api/posts", FETCH_TIMEOUT_MS)
    .then(function (res) {
      if (res.status === 503) {
        throw new Error(
          "El blog no esta disponible. Revisa DATABASE_URL en Railway."
        );
      }
      if (!res.ok) {
        throw new Error("No se pudieron cargar las entradas (" + res.status + ").");
      }
      return res.json();
    })
    .then(function (posts) {
      if (!posts.length) {
        showMessage(
          '<div class="col-12"><p>No hay entradas publicadas todavia.</p></div>'
        );
        return;
      }
      container.innerHTML = posts
        .map(function (post) {
          return BlogApi.postCardHtml(post, "../");
        })
        .join("");
    })
    .catch(function (err) {
      var message =
        err.name === "AbortError"
          ? "La carga tardo demasiado. Comprueba la conexion o el servidor."
          : err.message || "No se pudo conectar con el blog.";
      showMessage(
        '<div class="col-12"><p>' +
          String(message).replace(/</g, "&lt;") +
          "</p></div>"
      );
    });
})();
