(function () {
  "use strict";

  var container = document.getElementById("blog-posts-list");
  if (!container || !window.BlogApi) return;

  BlogApi.fetchPosts()
    .then(function (posts) {
      if (!posts.length) {
        container.innerHTML =
          '<div class="col-12"><p>No hay entradas publicadas todavia.</p></div>';
        return;
      }
      container.innerHTML = posts
        .map(function (post) {
          return BlogApi.postCardHtml(post, "../");
        })
        .join("");
    })
    .catch(function () {
      container.innerHTML =
        '<div class="col-12"><p>No se pudo conectar con el blog. Revisa la base de datos en Railway.</p></div>';
    });
})();
