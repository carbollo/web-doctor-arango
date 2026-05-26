(function () {
  "use strict";

  var root = document.getElementById("blog-post-root");
  if (!root || !window.BlogApi) return;

  var parts = window.location.pathname.split("/").filter(Boolean);
  var slug = parts.length >= 2 && parts[0] === "blog" ? parts[1] : "";

  if (!slug) {
    root.innerHTML = "<p>Entrada no encontrada.</p>";
    return;
  }

  BlogApi.fetchPostBySlug(slug)
    .then(function (post) {
      if (!post) {
        root.innerHTML =
          '<p>Entrada no encontrada. <a href="/blog/">Volver al blog</a></p>';
        return;
      }

      document.title = post.title + " — DR Arango";
      var image = post.image_url || "assets/images/blog1.jpg";
      if (image.indexOf("../") !== 0 && image.indexOf("http") !== 0) {
        image = "../" + image;
      }

      root.innerHTML =
        '<div class="blog-details-main">' +
        '<div class="blog-details-meta"><span><i class="bi bi-calendar3"></i> ' +
        BlogApi.escapeHtml(BlogApi.formatDate(post.published_at)) +
        "</span></div>" +
        '<div class="blog-details-content"><h2>' +
        BlogApi.escapeHtml(post.title) +
        "</h2></div>" +
        '<div class="blog-details-thumb"><img src="' +
        BlogApi.escapeHtml(image) +
        '" alt="' +
        BlogApi.escapeHtml(post.title) +
        '"></div>' +
        '<div class="blog-details-des">' +
        post.content +
        "</div>" +
        '<div class="blog-details-button"><a class="active" href="/blog/">Volver al blog</a></div>' +
        "</div>";
    })
    .catch(function () {
      root.innerHTML =
        '<p>No se pudo cargar la entrada. <a href="/blog/">Volver al blog</a></p>';
    });
})();
