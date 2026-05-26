(function () {
  "use strict";

  var container = document.getElementById("home-blog-posts");
  if (!container || !window.BlogApi) return;

  BlogApi.fetchPosts(3)
    .then(function (posts) {
      if (!posts.length) {
        container.innerHTML =
          '<div class="col-12"><p>Pronto publicaremos novedades de salud.</p></div>';
        return;
      }
      container.innerHTML = posts
        .map(function (post) {
          return BlogApi.postCardHtml(post, "");
        })
        .join("");
    })
    .catch(function () {
      container.innerHTML =
        '<div class="col-lg-4 col-md-6"><div class="single-blog-box"><div class="blog-content"><p>El blog estara disponible en breve.</p></div></div></div>';
    });
})();
