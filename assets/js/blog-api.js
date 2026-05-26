(function (window) {
  "use strict";

  function formatDate(dateString) {
    if (!dateString) return "";
    var date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function isLegacyHtmlContent(text) {
    var value = String(text || "").trim();
    return /^</.test(value) || /<p[\s>]/i.test(value);
  }

  function contentToPlainText(text) {
    var value = String(text || "").trim();
    if (!value) return "";
    if (!isLegacyHtmlContent(value)) return value;
    var div = document.createElement("div");
    div.innerHTML = value;
    var blocks = div.querySelectorAll("p, li, h1, h2, h3, h4");
    if (blocks.length) {
      return Array.prototype.map
        .call(blocks, function (el) {
          return (el.textContent || "").trim();
        })
        .filter(Boolean)
        .join("\n\n");
    }
    return (div.textContent || "").trim();
  }

  function plainTextToHtml(text) {
    var value = String(text || "").trim();
    if (!value) return "";
    if (isLegacyHtmlContent(value)) return value;
    return value
      .split(/\n\s*\n/)
      .map(function (block) {
        return block.trim();
      })
      .filter(Boolean)
      .map(function (block) {
        return (
          "<p>" +
          escapeHtml(block.replace(/\n+/g, " ")) +
          "</p>"
        );
      })
      .join("");
  }

  function postCardHtml(post, assetPrefix) {
    var prefix = assetPrefix || "";
    var image = post.image_url || "assets/images/blog1.jpg";
    if (prefix && image.indexOf(prefix) !== 0 && image.indexOf("http") !== 0) {
      image = prefix + image;
    }
    var href = "/blog/" + encodeURIComponent(post.slug);
    return (
      '<div class="col-lg-4 col-md-6">' +
      '<div class="single-blog-box">' +
      '<div class="blog-thumb"><img src="' +
      escapeHtml(image) +
      '" alt="' +
      escapeHtml(post.title) +
      '"></div>' +
      '<div class="blog-content">' +
      '<div class="meta-blog"><span>' +
      escapeHtml(formatDate(post.published_at)) +
      "</span></div>" +
      '<h4 class="title"><a href="' +
      href +
      '">' +
      escapeHtml(post.title) +
      "</a></h4>" +
      "</div></div></div>"
    );
  }

  function fetchPosts(limit) {
    var url = "/api/posts";
    if (limit) {
      url += "?limit=" + encodeURIComponent(limit);
    }
    return fetch(url).then(function (res) {
      if (!res.ok) {
        throw new Error("No se pudieron cargar los posts.");
      }
      return res.json();
    });
  }

  function fetchPostBySlug(slug) {
    return fetch("/api/posts/" + encodeURIComponent(slug)).then(function (res) {
      if (res.status === 404) {
        return null;
      }
      if (!res.ok) {
        throw new Error("No se pudo cargar el post.");
      }
      return res.json();
    });
  }

  window.BlogApi = {
    formatDate: formatDate,
    escapeHtml: escapeHtml,
    contentToPlainText: contentToPlainText,
    plainTextToHtml: plainTextToHtml,
    postCardHtml: postCardHtml,
    fetchPosts: fetchPosts,
    fetchPostBySlug: fetchPostBySlug,
  };
})(window);
