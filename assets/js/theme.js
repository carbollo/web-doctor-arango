(function($) {
    'use strict';

    // Ocultar loader de entrada lo antes posible
    $('body').addClass('loaded');
	
	// Mobile Menu
    $('.mobile-menu nav').meanmenu({
        meanScreenWidth: "991",
        meanMenuContainer: ".mobile-menu",
        meanMenuOpen: "<span></span> <span></span> <span></span>",
        onePage: false,
    });	

    // sticky
    var wind = $(window);
    var sticky = $('#sticky-header');
    var stickyActive = false;
    wind.on('scroll resize', function () {
        var scroll = wind.scrollTop();
        var isDesktop = wind.width() > 991;

        if (!isDesktop) {
            sticky.removeClass('sticky');
            $('body').css('padding-top', '');
            stickyActive = false;
            return;
        }

        if (scroll < 100) {
            if (stickyActive) {
                sticky.removeClass('sticky');
                $('body').css('padding-top', '');
                stickyActive = false;
            }
        } else {
            if (!stickyActive) {
                sticky.addClass('sticky');
                $('body').css('padding-top', sticky.outerHeight() + 'px');
                stickyActive = true;
            }
        }
    });
     //Header Search
    if($('.search-box-outer').length) {
        $('.search-box-outer').on('click', function() {
            $('body').addClass('search-active');
        });
        $('.close-search').on('click', function() {
            $('body').removeClass('search-active');
        });
    }
    // animate
    if (typeof WOW !== 'undefined') {
        new WOW().init();
    }

     // Case Study Active
    if ($('.team_list').length) {
    $('.team_list').owlCarousel({
        loop: true,
        autoplay: true,
        autoplayTimeout: 10000,
        dots: false,
        nav: true,
        navText: ["<i class='bi bi-arrow-left''></i>", "<i class='bi bi-arrow-right''></i>"],
        responsive: {
            0: {
                items: 1
            },
            768: {
                items: 2
            },
            992: {
                items: 1
            },
            1000: {
                items: 2
            },
            1920: {
                items: 2
            }
        }
    });
    }

    // testimonial Active
    if ($('.testimonial-list').length) {
    $('.testimonial-list').owlCarousel({
        loop: true,
        autoplay: false,
        autoplayTimeout: 10000,
        dots: false,
        nav: true,
        navText: ["<i class='fas fa-angle-double-left''></i>", "<i class='fas fa-angle-double-right''></i>"],
        responsive: {
            0: {
                items: 1
            },
            768: {
                items: 1
            },
            992: {
                items: 1
            },
            1000: {
                items: 1
            },
            1920: {
                items: 1
            }
        }
    });
    }

    // testimonial Active
    if ($('.pd_list').length) {
    $('.pd_list').owlCarousel({
        loop: true,
        autoplay: true,
        autoplayTimeout: 10000,
        dots: false,
        nav: false,
        center:true,
        navText: ["<i class='fas fa-angle-double-left''></i>", "<i class='fa fa-long-arrow-right''></i>"],
        responsive: {
            0: {
                items: 1
            },
            768: {
                items: 2
            },
            992: {
                items: 2
            },
            1000: {
                items: 2
            },
             1500: {
                items: 2
            },
            1920: {
                items: 2
            }
        }
    });
    }

    // Brand list
    if ($('.brand-list').length) {
    $('.brand-list').owlCarousel({
        loop: true,
        autoplay: true,
        autoplayTimeout: 10000,
        dots: false,
        nav:false,
        navText: ["<i class='bi bi-arrow-left''></i>", "<i class='bi bi-arrow-right''></i>"],
        responsive: {
            0: {
                items: 2
            },
            768: {
                items: 4
            },
            992: {
                items: 5
            },
            1000: {
                items: 5
            },
             1500: {
                items: 5
            },
            1920: {
                items: 5
            }
        }
    });
    }

	/*---------------------
    WOW active js 
    --------------------- */
    if (typeof WOW !== 'undefined') {
        new WOW().init();
    }

    // counterUp
    if ($('.counter').length && $.fn.counterUp) {
    $('.counter').counterUp({
        delay: 10,
        time: 1000
    });
    }

    /* Portfolio Isotope  */
    if ($('.image_load').length && $.fn.imagesLoaded) {
    $('.image_load').imagesLoaded(function() {

        if ($.fn.isotope) {

            var $portfolio = $('.image_load');

            $portfolio.isotope({

                itemSelector: '.grid-item',

                filter: '*',

                resizesContainer: true,

                layoutMode: 'masonry',

                transitionDuration: '0.8s'

            });
            $('.menu-filtering li').on('click', function() {

                $('.menu-filtering li').removeClass('current_menu_item');

                $(this).addClass('current_menu_item');

                var selector = $(this).attr('data-filter');

                $portfolio.isotope({

                    filter: selector,

                });

            });

        };

    });
    }
	
	 // Venubox

    if ($('.venobox').length && $.fn.venobox) {
    $('.venobox').venobox({

        numeratio: true,

        infinigall: true

    });
    }
	/*--------------------------
     scrollUp
    ---------------------------- */
    $.scrollUp({
        scrollText: '<i class="fa fa-angle-up"></i>',
        easingType: 'linear',
        scrollSpeed: 900,
        animation: 'fade'
    })



     // Faq Accordin
     jQuery(document).ready(function ($) {
        "use strict";

        // =======< accordion js >========
        $('.faq-accordion > li:eq(0) a').addClass('active').next().slideDown();

        $('.faq-accordion a').click(function() {
            var dropDown = $(this).closest('li').find('p');

            $(this).closest('.faq-accordion').find('p').not(dropDown).slideUp();

            if ($(this).hasClass('active')) {
                $(this).removeClass('active');
            } else {
                $(this).closest('.faq-accordion').find('a.active').removeClass('active');
                $(this).addClass('active');
            }

            dropDown.stop(false, true).slideToggle();
        });


        //======< Custom Tab >======
        $('.tab ul.tabs').addClass('active').find('> li:eq(0)').addClass('current');

        $(".tab ul.tabs li a").on("click", function (g) {
            var tab = $(this).closest('.tab'),
                index = $(this).closest('li').index();

            tab.find('ul.tabs > li').removeClass('current');
            $(this).closest('li').addClass('current');

            tab.find('.tab_content').find('div.tabs_item').not('div.tabs_item:eq(' + index + ')').slideUp();
            tab.find('.tab_content').find('div.tabs_item:eq(' + index + ')').slideDown();

            g.preventDefault();
        });

    });


        // barfiller script 
        $(".skills").addClass("active")
        $(".skills .skill .skill-bar span").each(function() {
           $(this).animate({
              "width": $(this).parent().attr("data-bar") + "%"
           }, 1000);
           $(this).append('<b>' + $(this).parent().attr("data-bar") + '%</b>');
        });
        setTimeout(function() {
           $(".skills .skill .skill-bar span b").animate({"opacity":"1"},1000);
        }, 2000);


    
        
        $(window).on('scroll', function () {
            var scrolled = $(window).scrollTop();
            if (scrolled > 300) $('.go-top').addClass('active');
            if (scrolled < 300) $('.go-top').removeClass('active');
        });

        $('.go-top').on('click', function () {
            $("html, body").animate({
                scrollTop: "0"
            }, 1200);
        });


        $(".circle_percent").each(function() {
            var $this = $(this),
                $dataV = $this.data("percent"),
                $dataDeg = $dataV * 3.6,
                $round = $this.find(".round_per");
            $round.css("transform", "rotate(" + parseInt($dataDeg + 180) + "deg)"); 
            $this.append('<div class="circle_inbox"><span class="percent_text"></span></div>');
            $this.prop('Counter', 0).animate({Counter: $dataV},
            {
                duration: 2000, 
                easing: 'swing', 
                step: function (now) {
                    $this.find(".percent_text").text(Math.ceil(now)+"%");
                }
            });
            if($dataV >= 51){
                $round.css("transform", "rotate(" + 360 + "deg)");
                setTimeout(function(){
                    $this.addClass("percent_more");
                },1000);
                setTimeout(function(){
                    $round.css("transform", "rotate(" + parseInt($dataDeg + 180) + "deg)");
                },1000);
            } 
        });

        // table tabs
        
        $(document).ready(function() { 

        (function ($) { 
            $('.tab ul.tabs').addClass('active').find('> li:eq(0)').addClass('current');
            
            $('.tab ul.tabs li a').click(function (g) { 
                var tab = $(this).closest('.tab'), 
                    index = $(this).closest('li').index();
                
                tab.find('ul.tabs > li').removeClass('current');
                $(this).closest('li').addClass('current');
                
                tab.find('.tab_content').find('div.tabs_item').not('div.tabs_item:eq(' + index + ')').slideUp();
                tab.find('.tab_content').find('div.tabs_item:eq(' + index + ')').slideDown();
                
                g.preventDefault();
            } );
        })(jQuery);

    });

        // widget categories menu
        $(document).ready(function() {
            $('.widget-categories-menu ul li').on('mouseenter', function () {
                $(this).addClass('active');
                $('.widget-categories-menu ul li').not(this).removeClass('active'); 
            });
        });

        /*  Cart Plus Minus Button
    /*----------------------------------------*/
    
    $('.ctnbutton').on('click', function () {
        var $button = $(this);
        var oldValue = $button.parent().find('input').val();
        if ($button.hasClass('inc')) {
            var newVal = parseFloat(oldValue) + 1;
        } else {
            // Don't allow decrementing below zero
            if (oldValue > 1) {
                var newVal = parseFloat(oldValue) - 1;
            } else {
                newVal = 1;
            }
        }
        $button.parent().find('input').val(newVal);
    });


     // Sidebar
     "use strict";
     jQuery(document).ready(function (o) {
         0 < o(".offset-side-bar").length &&
             o(".offset-side-bar").on("click", function (e) {
                 e.preventDefault(), e.stopPropagation(), o(".cart-group").addClass("isActive");
             }),
             0 < o(".close-side-widget").length &&
                 o(".close-side-widget").on("click", function (e) {
                     e.preventDefault(), o(".cart-group").removeClass("isActive");
                 }),
             0 < o(".navSidebar-button").length &&
                 o(".navSidebar-button").on("click", function (e) {
                     e.preventDefault(), e.stopPropagation(), o(".info-group").addClass("isActive");
                 }),
             0 < o(".close-side-widget").length &&
                 o(".close-side-widget").on("click", function (e) {
                     e.preventDefault(), o(".info-group").removeClass("isActive");
                 }),
             o("body").on("click", function (e) {
                 o(".info-group").removeClass("isActive"), o(".cart-group").removeClass("isActive");
             }),
             o(".xs-sidebar-widget").on("click", function (e) {
                 e.stopPropagation();
             }),
             0 < o(".xs-modal-popup").length &&
                 o(".xs-modal-popup").magnificPopup({
                     type: "inline",
                     fixedContentPos: !2,
                     fixedBgPos: !0,
                     overflowY: "auto",
                     closeBtnInside: !2,
                     callbacks: {
                         beforeOpen: function () {
                             this.st.mainClass = "my-mfp-slide-bottom xs-promo-popup";
                         },
                     },
                 });
     });

        


        // Calender Jquery
        var curDate = (new Date()).getDate();
        var curMonth = (new Date()).getMonth();
        var curYear = (new Date()).getFullYear();
        var startDay = (new Date(curYear, curMonth, 1)).getDay();
        var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        var noofdays = ["31", "29", "31", "30", "31", "30", "31", "31", "30", "31", "30", "31"];
        var prevMonth = noofdays[curMonth - 1];
        if (curMonth == 11) {
          prevMonth = noofdays[0];
        } else if (curMonth == 0) {
          prevMonth = noofdays[11];
        }
        var totalDays = noofdays[curMonth];
        var counter = 0;
        var precounter = prevMonth - (startDay - 1);
        var rightbox = 6;
        var flag = true;

        jQuery('.curr-month b').text(months[curMonth]);
        for (var i = 0; i < 42; i++) {
          if (i >= startDay) {
            counter++;
            if (counter > totalDays) {
              counter = 1;
              flag = false;
            }
            if (flag == true) {
              jQuery('.all-date ul').append('<li class="monthdate">' + counter + '</li>');
            } else {
              jQuery('.all-date ul').append('<li style="opacity:.8">' + counter + '</li>');
            }
          } else {
            jQuery('.all-date ul').append('<li style="opacity:.8">' + precounter + '</li>');
            precounter++;
          }

          if (i == rightbox) {
            jQuery(jQuery('.all-date ul li')[rightbox]).addClass("b-right");
            rightbox = rightbox + 7;
          }

          if (i > 34) {
            jQuery(jQuery('.all-date ul li')[i]).addClass("b-bottom");
          }

          if ((jQuery(jQuery('.all-date ul li')[i]).text() == curDate) && (jQuery(jQuery('.all-date ul li')[i]).css('opacity') == 1)) {
            jQuery(jQuery('.all-date ul li')[i]).css({
              "background-color": "#02548b",
              "color": "#fff"
            });
          }
        }
    
})(jQuery);