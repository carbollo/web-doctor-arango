(function ($) {
  "use strict";

  if ($(".mobile-menu nav").length && $.fn.meanmenu) {
    $(".mobile-menu nav").meanmenu({
      meanScreenWidth: "991",
      meanMenuContainer: ".mobile-menu",
      meanMenuOpen: "<span></span> <span></span> <span></span>",
      onePage: false,
    });
  }

  var wind = $(window);
  var sticky = $("#sticky-header");
  var stickyActive = false;

  wind.on("scroll resize", function () {
    if (!sticky.length) return;
    var scroll = wind.scrollTop();
    var isDesktop = wind.width() > 991;

    if (!isDesktop) {
      sticky.removeClass("sticky");
      $("body").css("padding-top", "");
      stickyActive = false;
      return;
    }

    if (scroll < 100) {
      if (stickyActive) {
        sticky.removeClass("sticky");
        $("body").css("padding-top", "");
        stickyActive = false;
      }
    } else if (!stickyActive) {
      sticky.addClass("sticky");
      $("body").css("padding-top", sticky.outerHeight() + "px");
      stickyActive = true;
    }
  });

  if ($.fn.scrollUp) {
    $.scrollUp({
      scrollText: '<i class="bi bi-chevron-double-up"></i>',
      easingType: "linear",
      scrollSpeed: 900,
      animation: "fade",
    });
  }

  $(window).on("scroll", function () {
    var scrolled = $(window).scrollTop();
    if (scrolled > 300) $(".go-top").addClass("active");
    else $(".go-top").removeClass("active");
  });

  $(".go-top").on("click", function () {
    $("html, body").animate({ scrollTop: 0 }, 600);
  });
})(jQuery);
