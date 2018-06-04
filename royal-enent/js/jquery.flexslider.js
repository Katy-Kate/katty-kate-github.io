/*
 * jQuery FlexSlider v2.7.0
 * Copyright 2012 WooThemes
 * Contributing Author: Tyler Smith
 */
;
(function ($) {

  var focused = true;

  //FlexSlider: Object Instance
  $.flexslider = function(el, options) {
    var slider = $(el);

    // making variables public

    //if rtl value was not passed and html is in rtl..enable it by default.
    if(typeof options.rtl=='undefined' && $('html').attr('dir')=='rtl'){
      options.rtl=true;
    }
    slider.vars = $.extend({}, $.flexslider.defaults, options);

    var namespace = slider.vars.namespace,
        msGesture = window.navigator && window.navigator.msPointerEnabled && window.MSGesture,
        touch = (( "ontouchstart" in window ) || msGesture || window.DocumentTouch && document instanceof DocumentTouch) && slider.vars.touch,
        // deprecating this idea, as devices are being released with both of these events
        eventType = "click touchend MSPointerUp keyup",
        watchedEvent = "",
        watchedEventClearTimer,
        vertical = slider.vars.direction === "vertical",
        reverse = slider.vars.reverse,
        carousel = (slider.vars.itemWidth > 0),
        fade = slider.vars.animation === "fade",
        asNav = slider.vars.asNavFor !== "",
        methods = {};

    // Store a reference to the slider object
    $.data(el, "flexslider", slider);

    // Private slider methods
    methods = {
      init: function() {
        slider.animating = false;
        // Get current slide and make sure it is a number
        slider.currentSlide = parseInt( ( slider.vars.startAt ? slider.vars.startAt : 0), 10 );
        if ( isNaN( slider.currentSlide ) ) { slider.currentSlide = 0; }
        slider.animatingTo = slider.currentSlide;
        slider.atEnd = (slider.currentSlide === 0 || slider.currentSlide === slider.last);
        slider.containerSelector = slider.vars.selector.substr(0,slider.vars.selector.search(' '));
        slider.slides = $(slider.vars.selector, slider);
        slider.container = $(slider.containerSelector, slider);
        slider.count = slider.slides.length;
        // SYNC:
        slider.syncExists = $(slider.vars.sync).length > 0;
        // SLIDE:
        if (slider.vars.animation === "slide") { slider.vars.animation = "swing"; }
        slider.prop = (vertical) ? "top" : ( slider.vars.rtl ? "marginRight" : "marginLeft" );
        slider.args = {};
        // SLIDESHOW:
        slider.manualPause = false;
        slider.stopped = false;
        //PAUSE WHEN INVISIBLE
        slider.started = false;
        slider.startTimeout = null;
        // TOUCH/USECSS:
        slider.transitions = !slider.vars.video && !fade && slider.vars.useCSS && (function() {
          var obj = document.createElement('div'),
              props = ['perspectiveProperty', 'WebkitPerspective', 'MozPerspective', 'OPerspective', 'msPerspective'];
          for (var i in props) {
            if ( obj.style[ props[i] ] !== undefined ) {
              slider.pfx = props[i].replace('Perspective','').toLowerCase();
              slider.prop = "-" + slider.pfx + "-transform";
              return true;
            }
          }
          return false;
        }());
        slider.ensureAnimationEnd = '';
        // CONTROLSCONTAINER:
        if (slider.vars.controlsContainer !== "") slider.controlsContainer = $(slider.vars.controlsContainer).length > 0 && $(slider.vars.controlsContainer);
        // MANUAL:
        if (slider.vars.manualControls !== "") slider.manualControls = $(slider.vars.manualControls).length > 0 && $(slider.vars.manualControls);

        // CUSTOM DIRECTION NAV:
        if (slider.vars.customDirectionNav !== "") slider.customDirectionNav = $(slider.vars.customDirectionNav).length === 2 && $(slider.vars.customDirectionNav);

        // RANDOMIZE:
        if (slider.vars.randomize) {
          slider.slides.sort(function() { return (Math.round(Math.random())-0.5); });
          slider.container.empty().append(slider.slides);
        }

        slider.doMath();

        // INIT
        slider.setup("init");

        // CONTROLNAV:
        if (slider.vars.controlNav) { methods.controlNav.setup(); }

        // DIRECTIONNAV:
        if (slider.vars.directionNav) { methods.directionNav.setup(); }

        // KEYBOARD:
        if (slider.vars.keyboard && ($(slider.containerSelector).length === 1 || slider.vars.multipleKeyboard)) {
          $(document).bind('keyup', function(event) {
            var keycode = event.keyCode;
            if (!slider.animating && (keycode === 39 || keycode === 37)) {
              var target = (slider.vars.rtl?
                                ((keycode === 37) ? slider.getTarget('next') :
                                (keycode === 39) ? slider.getTarget('prev') : false)
                                :
                                ((keycode === 39) ? slider.getTarget('next') :
                                (keycode === 37) ? slider.getTarget('prev') : false)
                                )
                                ;
              slider.flexAnimate(target, slider.vars.pauseOnAction);
            }
          });
        }
        // MOUSEWHEEL:
        if (slider.vars.mousewheel) {
          slider.bind('mousewheel', function(event, delta, deltaX, deltaY) {
            event.preventDefault();
            var target = (delta < 0) ? slider.getTarget('next') : slider.getTarget('prev');
            slider.flexAnimate(target, slider.vars.pauseOnAction);
          });
        }

        // PAUSEPLAY
        if (slider.vars.pausePlay) { methods.pausePlay.setup(); }

        //PAUSE WHEN INVISIBLE
        if (slider.vars.slideshow && slider.vars.pauseInvisible) { methods.pauseInvisible.init(); }

        // SLIDSESHOW
        if (slider.vars.slideshow) {
          if (slider.vars.pauseOnHover) {
            slider.hover(function() {
              if (!slider.manualPlay && !slider.manualPause) { slider.pause(); }
            }, function() {
              if (!slider.manualPause && !slider.manualPlay && !slider.stopped) { slider.play(); }
            });
          }
          // initialize animation
          //If we're visible, or we don't use PageVisibility API
          if(!slider.vars.pauseInvisible || !methods.pauseInvisible.isHidden()) {
            (slider.vars.initDelay > 0) ? slider.startTimeout = setTimeout(slider.play, slider.vars.initDelay) : slider.play();
          }
        }

        // ASNAV:
        if (asNav) { methods.asNav.setup(); }

        // TOUCH
        if (touch && slider.vars.touch) { methods.touch(); }

        // FADE&&SMOOTHHEIGHT || SLIDE:
        if (!fade || (fade && slider.vars.smoothHeight)) { $(window).bind("resize orientationchange focus", methods.resize); }

        slider.find("img").attr("draggable", "false");

        // API: start() Callback
        setTimeout(function(){
          slider.vars.start(slider);
        }, 200);
      },
      asNav: {
        setup: function() {
          slider.asNav = true;
          slider.animatingTo = Math.floor(slider.currentSlide/slider.move);
          slider.currentItem = slider.currentSlide;
          slider.slides.removeClass(namespace + "active-slide").eq(slider.currentItem).addClass(namespace + "active-slide");
          if(!msGesture){
              slider.slides.on(eventType, function(e){
                e.preventDefault();
                var $slide = $(this),
                    target = $slide.index();
                var posFromX;
                if(slider.vars.rtl){
                  posFromX = -1*($slide.offset().right - $(slider).scrollLeft()); // Find position of slide relative to right of slider container
                }
                else
                {
                  posFromX = $slide.offset().left - $(slider).scrollLeft(); // Find position of slide relative to left of slider container
                }
                if( posFromX <= 0 && $slide.hasClass( namespace + 'active-slide' ) ) {
                  slider.flexAnimate(slider.getTarget("prev"), true);
                } else if (!$(slider.vars.asNavFor).data('flexslider').animating && !$slide.hasClass(namespace + "active-slide")) {
                  slider.direction = (slider.currentItem < target) ? "next" : "prev";
                  slider.flexAnimate(target, slider.vars.pauseOnAction, false, true, true);
                }
              });
          }else{
              el._slider = slider;
              slider.slides.each(function (){
                  var that = this;
                  that._gesture = new MSGesture();
                  that._gesture.target = that;
                  that.addEventListener("MSPointerDown", function (e){
                      e.preventDefault();
                      if(e.currentTarget._gesture) {
                        e.currentTarget._gesture.addPointer(e.pointerId);
                      }
                  }, false);
                  that.addEventListener("MSGestureTap", function (e){
                      e.preventDefault();
                      var $slide = $(this),
                          target = $slide.index();
                      if (!$(slider.vars.asNavFor).data('flexslider').animating && !$slide.hasClass('active')) {
                          slider.direction = (slider.currentItem < target) ? "next" : "prev";
                          slider.flexAnimate(target, slider.vars.pauseOnAction, false, true, true);
                      }
                  });
              });
          }
        }
      },
      controlNav: {
        setup: function() {
          if (!slider.manualControls) {
            methods.controlNav.setupPaging();
          } else { // MANUALCONTROLS:
            methods.controlNav.setupManual();
          }
        },
        setupPaging: function() {
          var type = (slider.vars.controlNav === "thumbnails") ? 'control-thumbs' : 'control-paging',
              j = 1,
              item,
              slide;

          slider.controlNavScaffold = $('<ol class="'+ namespace + 'control-nav ' + namespace + type + '"></ol>');

          if (slider.pagingCount > 1) {
            for (var i = 0; i < slider.pagingCount; i++) {
              slide = slider.slides.eq(i);
              if ( undefined === slide.attr( 'data-thumb-alt' ) ) { slide.attr( 'data-thumb-alt', '' ); }
              var altText = ( '' !== slide.attr( 'data-thumb-alt' ) ) ? altText = ' alt="' + slide.attr( 'data-thumb-alt' ) + '"' : '';
              item = (slider.vars.controlNav === "thumbnails") ? '<img src="' + slide.attr( 'data-thumb' ) + '"' + altText + '/>' : '<a href="#">' + j + '</a>';
              if ( 'thumbnails' === slider.vars.controlNav && true === slider.vars.thumbCaptions ) {
                var captn = slide.attr( 'data-thumbcaption' );
                if ( '' !== captn && undefined !== captn ) { item += '<span class="' + namespace + 'caption">' + captn + '</span>'; }
              }
              slider.controlNavScaffold.append('<li>' + item + '</li>');
              j++;
            }
          }

          // CONTROLSCONTAINER:
          (slider.controlsContainer) ? $(slider.controlsContainer).append(slider.controlNavScaffold) : slider.append(slider.controlNavScaffold);
          methods.controlNav.set();

          methods.controlNav.active();

          slider.controlNavScaffold.delegate('a, img', eventType, function(event) {
            event.preventDefault();

            if (watchedEvent === "" || watchedEvent === event.type) {
              var $this = $(this),
                  target = slider.controlNav.index($this);

              if (!$this.hasClass(namespace + 'active')) {
                slider.direction = (target > slider.currentSlide) ? "next" : "prev";
                slider.flexAnimate(target, slider.vars.pauseOnAction);
              }
            }

            // setup flags to prevent event duplication
            if (watchedEvent === "") {
              watchedEvent = event.type;
            }
            methods.setToClearWatchedEvent();

          });
        },
        setupManual: function() {
          slider.controlNav = slider.manualControls;
          methods.controlNav.active();

          slider.controlNav.bind(eventType, function(event) {
            event.preventDefault();

            if (watchedEvent === "" || watchedEvent === event.type) {
              var $this = $(this),
                  target = slider.controlNav.index($this);

              if (!$this.hasClass(namespace + 'active')) {
                (target > slider.currentSlide) ? slider.direction = "next" : slider.direction = "prev";
                slider.flexAnimate(target, slider.vars.pauseOnAction);
              }
            }

            // setup flags to prevent event duplication
            if (watchedEvent === "") {
              watchedEvent = event.type;
            }
            methods.setToClearWatchedEvent();
          });
        },
        set: function() {
          var selector = (slider.vars.controlNav === "thumbnails") ? 'img' : 'a';
          slider.controlNav = $('.' + namespace + 'control-nav li ' + selector, (slider.controlsContainer) ? slider.controlsContainer : slider);
        },
        active: function() {
          slider.controlNav.removeClass(namespace + "active").eq(slider.animatingTo).addClass(namespace + "active");
        },
        update: function(action, pos) {
          if (slider.pagingCount > 1 && action === "add") {
            slider.controlNavScaffold.append($('<li><a href="#">' + slider.count + '</a></li>'));
          } else if (slider.pagingCount === 1) {
            slider.controlNavScaffold.find('li').remove();
          } else {
            slider.controlNav.eq(pos).closest('li').remove();
          }
          methods.controlNav.set();
          (slider.pagingCount > 1 && slider.pagingCount !== slider.controlNav.length) ? slider.update(pos, action) : methods.controlNav.active();
        }
      },
      directionNav: {
        setup: function() {
          var directionNavScaffold = $('<ul class="' + namespace + 'direction-nav"><li class="' + namespace + 'nav-prev"><a class="' + namespace + 'prev" href="#">' + slider.vars.prevText + '</a></li><li class="' + namespace + 'nav-next"><a class="' + namespace + 'next" href="#">' + slider.vars.nextText + '</a></li></ul>');

          // CUSTOM DIRECTION NAV:
          if (slider.customDirectionNav) {
            slider.directionNav = slider.customDirectionNav;
          // CONTROLSCONTAINER:
          } else if (slider.controlsContainer) {
            $(slider.controlsContainer).append(directionNavScaffold);
            slider.directionNav = $('.' + namespace + 'direction-nav li a', slider.controlsContainer);
          } else {
            slider.append(directionNavScaffold);
            slider.directionNav = $('.' + namespace + 'direction-nav li a', slider);
          }

          methods.directionNav.update();

          slider.directionNav.bind(eventType, function(event) {
            event.preventDefault();
            var target;

            if (watchedEvent === "" || watchedEvent === event.type) {
              target = ($(this).hasClass(namespace + 'next')) ? slider.getTarget('next') : slider.getTarget('prev');
              slider.flexAnimate(target, slider.vars.pauseOnAction);
            }

            // setup flags to prevent event duplication
            if (watchedEvent === "") {
              watchedEvent = event.type;
            }
            methods.setToClearWatchedEvent();
          });
        },
        update: function() {
          var disabledClass = namespace + 'disabled';
          if (slider.pagingCount === 1) {
            slider.directionNav.addClass(disabledClass).attr('tabindex', '-1');
          } else if (!slider.vars.animationLoop) {
            if (slider.animatingTo === 0) {
              slider.directionNav.removeClass(disabledClass).filter('.' + namespace + "prev").addClass(disabledClass).attr('tabindex', '-1');
            } else if (slider.animatingTo === slider.last) {
              slider.directionNav.removeClass(disabledClass).filter('.' + namespace + "next").addClass(disabledClass).attr('tabindex', '-1');
            } else {
              slider.directionNav.removeClass(disabledClass).removeAttr('tabindex');
            }
          } else {
            slider.directionNav.removeClass(disabledClass).removeAttr('tabindex');
          }
        }
      },
      pausePlay: {
        setup: function() {
          var pausePlayScaffold = $('<div class="' + namespace + 'pauseplay"><a href="#"></a></div>');

          // CONTROLSCONTAINER:
          if (slider.controlsContainer) {
            slider.controlsContainer.append(pausePlayScaffold);
            slider.pausePlay = $('.' + namespace + 'pauseplay a', slider.controlsContainer);
          } else {
            slider.append(pausePlayScaffold);
            slider.pausePlay = $('.' + namespace + 'pauseplay a', slider);
          }

          methods.pausePlay.update((slider.vars.slideshow) ? namespace + 'pause' : namespace + 'play');

          slider.pausePlay.bind(eventType, function(event) {
            event.preventDefault();

            if (watchedEvent === "" || watchedEvent === event.type) {
              if ($(this).hasClass(namespace + 'pause')) {
                slider.manualPause = true;
                slider.manualPlay = false;
                slider.pause();
              } else {
                slider.manualPause = false;
                slider.manualPlay = true;
                slider.play();
              }
            }

            // setup flags to prevent event duplication
            if (watchedEvent === "") {
              watchedEvent = event.type;
            }
            methods.setToClearWatchedEvent();
          });
        },
        update: function(state) {
          (state === "play") ? slider.pausePlay.removeClass(namespace + 'pause').addClass(namespace + 'play').html(slider.vars.playText) : slider.pausePlay.removeClass(namespace + 'play').addClass(namespace + 'pause').html(slider.vars.pauseText);
        }
      },
      touch: function() {
        var startX,
          startY,
          offset,
          cwidth,
          dx,
          startT,
          onTouchStart,
          onTouchMove,
          onTouchEnd,
          scrolling = false,
          localX = 0,
          localY = 0,
          accDx = 0;

        if(!msGesture){
            onTouchStart = function(e) {
              if (slider.animating) {
                e.preventDefault();
              } else if ( ( window.navigator.msPointerEnabled ) || e.touches.length === 1 ) {
                slider.pause();
                // CAROUSEL:
                cwidth = (vertical) ? slider.h : slider. w;
                startT = Number(new Date());
                // CAROUSEL:

                // Local vars for X and Y points.
                localX = e.touches[0].pageX;
                localY = e.touches[0].pageY;

                offset = (carousel && reverse && slider.animatingTo === slider.last) ? 0 :
                         (carousel && reverse) ? slider.limit - (((slider.itemW + slider.vars.itemMargin) * slider.move) * slider.animatingTo) :
                         (carousel && slider.currentSlide === slider.last) ? slider.limit :
                         (carousel) ? ((slider.itemW + slider.vars.itemMargin) * slider.move) * slider.currentSlide :
                         (reverse) ? (slider.last - slider.currentSlide + slider.cloneOffset) * cwidth : (slider.currentSlide + slider.cloneOffset) * cwidth;
                startX = (vertical) ? localY : localX;
                startY = (vertical) ? localX : localY;
                el.addEventListener('touchmove', onTouchMove, false);
                el.addEventListener('touchend', onTouchEnd, false);
              }
            };

            onTouchMove = function(e) {
              // Local vars for X and Y points.

              localX = e.touches[0].pageX;
              localY = e.touches[0].pageY;

              dx = (vertical) ? startX - localY : (slider.vars.rtl?-1:1)*(startX - localX);
              scrolling = (vertical) ? (Math.abs(dx) < Math.abs(localX - startY)) : (Math.abs(dx) < Math.abs(localY - startY));
              var fxms = 500;

              if ( ! scrolling || Number( new Date() ) - startT > fxms ) {
                e.preventDefault();
                if (!fade && slider.transitions) {
                  if (!slider.vars.animationLoop) {
                    dx = dx/((slider.currentSlide === 0 && dx < 0 || slider.currentSlide === slider.last && dx > 0) ? (Math.abs(dx)/cwidth+2) : 1);
                  }
                  slider.setProps(offset + dx, "setTouch");
                }
              }
            };

            onTouchEnd = function(e) {
              // finish the touch by undoing the touch session
              el.removeEventListener('touchmove', onTouchMove, false);

              if (slider.animatingTo === slider.currentSlide && !scrolling && !(dx === null)) {
                var updateDx = (reverse) ? -dx : dx,
                    target = (updateDx > 0) ? slider.getTarget('next') : slider.getTarget('prev');

                if (slider.canAdvance(target) && (Number(new Date()) - startT < 550 && Math.abs(updateDx) > 50 || Math.abs(updateDx) > cwidth/2)) {
                  slider.flexAnimate(target, slider.vars.pauseOnAction);
                } else {
                  if (!fade) { slider.flexAnimate(slider.currentSlide, slider.vars.pauseOnAction, true); }
                }
              }
              el.removeEventListener('touchend', onTouchEnd, false);

              startX = null;
              startY = null;
              dx = null;
              offset = null;
            };

            el.addEventListener('touchstart', onTouchStart, false);
        }else{
            el.style.msTouchAction = "none";
            el._gesture = new MSGesture();
            el._gesture.target = el;
            el.addEventListener("MSPointerDown", onMSPointerDown, false);
            el._slider = slider;
            el.addEventListener("MSGestureChange", onMSGestureChange, false);
            el.addEventListener("MSGestureEnd", onMSGestureEnd, false);

            function onMSPointerDown(e){
                e.stopPropagation();
                if (slider.animating) {
                    e.preventDefault();
                }else{
                    slider.pause();
                    el._gesture.addPointer(e.pointerId);
                    accDx = 0;
                    cwidth = (vertical) ? slider.h : slider. w;
                    startT = Number(new Date());
                    // CAROUSEL:

                    offset = (carousel && reverse && slider.animatingTo === slider.last) ? 0 :
                        (carousel && reverse) ? slider.limit - (((slider.itemW + slider.vars.itemMargin) * slider.move) * slider.animatingTo) :
                            (carousel && slider.currentSlide === slider.last) ? slider.limit :
                                (carousel) ? ((slider.itemW + slider.vars.itemMargin) * slider.move) * slider.currentSlide :
                                    (reverse) ? (slider.last - slider.currentSlide + slider.cloneOffset) * cwidth : (slider.currentSlide + slider.cloneOffset) * cwidth;
                }
            }

            function onMSGestureChange(e) {
                e.stopPropagation();
                var slider = e.target._slider;
                if(!slider){
                    return;
                }
                var transX = -e.translationX,
                    transY = -e.translationY;

                //Accumulate translations.
                accDx = accDx + ((vertical) ? transY : transX);
                dx = (slider.vars.rtl?-1:1)*accDx;
                scrolling = (vertical) ? (Math.abs(accDx) < Math.abs(-transX)) : (Math.abs(accDx) < Math.abs(-transY));

                if(e.detail === e.MSGESTURE_FLAG_INERTIA){
                    setImmediate(function (){
                        el._gesture.stop();
                    });

                    return;
                }

                if (!scrolling || Number(new Date()) - startT > 500) {
                    e.preventDefault();
                    if (!fade && slider.transitions) {
                        if (!slider.vars.animationLoop) {
                            dx = accDx / ((slider.currentSlide === 0 && accDx < 0 || slider.currentSlide === slider.last && accDx > 0) ? (Math.abs(accDx) / cwidth + 2) : 1);
                        }
                        slider.setProps(offset + dx, "setTouch");
                    }
                }
            }

            function onMSGestureEnd(e) {
                e.stopPropagation();
                var slider = e.target._slider;
                if(!slider){
                    return;
                }
                if (slider.animatingTo === slider.currentSlide && !scrolling && !(dx === null)) {
                    var updateDx = (reverse) ? -dx : dx,
                        target = (updateDx > 0) ? slider.getTarget('next') : slider.getTarget('prev');

                    if (slider.canAdvance(target) && (Number(new Date()) - startT < 550 && Math.abs(updateDx) > 50 || Math.abs(updateDx) > cwidth/2)) {
                        slider.flexAnimate(target, slider.vars.pauseOnAction);
                    } else {
                        if (!fade) { slider.flexAnimate(slider.currentSlide, slider.vars.pauseOnAction, true); }
                    }
                }

                startX = null;
                startY = null;
                dx = null;
                offset = null;
                accDx = 0;
            }
        }
      },
      resize: function() {
        if (!slider.animating && slider.is(':visible')) {
          if (!carousel) { slider.doMath(); }

          if (fade) {
            // SMOOTH HEIGHT:
            methods.smoothHeight();
          } else if (carousel) { //CAROUSEL:
            slider.slides.width(slider.computedW);
            slider.update(slider.pagingCount);
            slider.setProps();
          }
          else if (vertical) { //VERTICAL:
            slider.viewport.height(slider.h);
            slider.setProps(slider.h, "setTotal");
          } else {
            // SMOOTH HEIGHT:
            if (slider.vars.smoothHeight) { methods.smoothHeight(); }
            slider.newSlides.width(slider.computedW);
            slider.setProps(slider.computedW, "setTotal");
          }
        }
      },
      smoothHeight: function(dur) {
        if (!vertical || fade) {
          var $obj = (fade) ? slider : slider.viewport;
          (dur) ? $obj.animate({"height": slider.slides.eq(slider.animatingTo).innerHeight()}, dur) : $obj.innerHeight(slider.slides.eq(slider.animatingTo).innerHeight());
        }
      },
      sync: function(action) {
        var $obj = $(slider.vars.sync).data("flexslider"),
            target = slider.animatingTo;

        switch (action) {
          case "animate": $obj.flexAnimate(target, slider.vars.pauseOnAction, false, true); break;
          case "play": if (!$obj.playing && !$obj.asNav) { $obj.play(); } break;
          case "pause": $obj.pause(); break;
        }
      },
      uniqueID: function($clone) {
        // Append _clone to current level and children elements with id attributes
        $clone.filter( '[id]' ).add($clone.find( '[id]' )).each(function() {
          var $this = $(this);
          $this.attr( 'id', $this.attr( 'id' ) + '_clone' );
        });
        return $clone;
      },
      pauseInvisible: {
        visProp: null,
        init: function() {
          var visProp = methods.pauseInvisible.getHiddenProp();
          if (visProp) {
            var evtname = visProp.replace(/[H|h]idden/,'') + 'visibilitychange';
            document.addEventListener(evtname, function() {
              if (methods.pauseInvisible.isHidden()) {
                if(slider.startTimeout) {
                  clearTimeout(slider.startTimeout); //If clock is ticking, stop timer and prevent from starting while invisible
                } else {
                  slider.pause(); //Or just pause
                }
              }
              else {
                if(slider.started) {
                  slider.play(); //Initiated before, just play
                } else {
                  if (slider.vars.initDelay > 0) {
                    setTimeout(slider.play, slider.vars.initDelay);
                  } else {
                    slider.play(); //Didn't init before: simply init or wait for it
                  }
                }
              }
            });
          }
        },
        isHidden: function() {
          var prop = methods.pauseInvisible.getHiddenProp();
          if (!prop) {
            return false;
          }
          return document[prop];
        },
        getHiddenProp: function() {
          var prefixes = ['webkit','moz','ms','o'];
          // if 'hidden' is natively supported just return it
          if ('hidden' in document) {
            return 'hidden';
          }
          // otherwise loop over all the known prefixes until we find one
          for ( var i = 0; i < prefixes.length; i++ ) {
              if ((prefixes[i] + 'Hidden') in document) {
                return prefixes[i] + 'Hidden';
              }
          }
          // otherwise it's not supported
          return null;
        }
      },
      setToClearWatchedEvent: function() {
        clearTimeout(watchedEventClearTimer);
        watchedEventClearTimer = setTimeout(function() {
          watchedEvent = "";
        }, 3000);
      }
    };

    // public methods
    slider.flexAnimate = function(target, pause, override, withSync, fromNav) {
      if (!slider.vars.animationLoop && target !== slider.currentSlide) {
        slider.direction = (target > slider.currentSlide) ? "next" : "prev";
      }

      if (asNav && slider.pagingCount === 1) slider.direction = (slider.currentItem < target) ? "next" : "prev";

      if (!slider.animating && (slider.canAdvance(target, fromNav) || override) && slider.is(":visible")) {
        if (asNav && withSync) {
          var master = $(slider.vars.asNavFor).data('flexslider');
          slider.atEnd = target === 0 || target === slider.count - 1;
          master.flexAnimate(target, true, false, true, fromNav);
          slider.direction = (slider.currentItem < target) ? "next" : "prev";
          master.direction = slider.direction;

          if (Math.ceil((target + 1)/slider.visible) - 1 !== slider.currentSlide && target !== 0) {
            slider.currentItem = target;
            slider.slides.removeClass(namespace + "active-slide").eq(target).addClass(namespace + "active-slide");
            target = Math.floor(target/slider.visible);
          } else {
            slider.currentItem = target;
            slider.slides.removeClass(namespace + "active-slide").eq(target).addClass(namespace + "active-slide");
            return false;
          }
        }

        slider.animating = true;
        slider.animatingTo = target;

        // SLIDESHOW:
        if (pause) { slider.pause(); }

        // API: before() animation Callback
        slider.vars.before(slider);

        // SYNC:
        if (slider.syncExists && !fromNav) { methods.sync("animate"); }

        // CONTROLNAV
        if (slider.vars.controlNav) { methods.controlNav.active(); }

        // !CAROUSEL:
        // CANDIDATE: slide active class (for add/remove slide)
        if (!carousel) { slider.slides.removeClass(namespace + 'active-slide').eq(target).addClass(namespace + 'active-slide'); }

        // INFINITE LOOP:
        // CANDIDATE: atEnd
        slider.atEnd = target === 0 || target === slider.last;

        // DIRECTIONNAV:
        if (slider.vars.directionNav) { methods.directionNav.update(); }

        if (target === slider.last) {
          // API: end() of cycle Callback
          slider.vars.end(slider);
          // SLIDESHOW && !INFINITE LOOP:
          if (!slider.vars.animationLoop) { slider.pause(); }
        }

        // SLIDE:
        if (!fade) {
          var dimension = (vertical) ? slider.slides.filter(':first').height() : slider.computedW,
              margin, slideString, calcNext;

          // INFINITE LOOP / REVERSE:
          if (carousel) {
            margin = slider.vars.itemMargin;
            calcNext = ((slider.itemW + margin) * slider.move) * slider.animatingTo;
            slideString = (calcNext > slider.limit && slider.visible !== 1) ? slider.limit : calcNext;
          } else if (slider.currentSlide === 0 && target === slider.count - 1 && slider.vars.animationLoop && slider.direction !== "next") {
            slideString = (reverse) ? (slider.count + slider.cloneOffset) * dimension : 0;
          } else if (slider.currentSlide === slider.last && target === 0 && slider.vars.animationLoop && slider.direction !== "prev") {
            slideString = (reverse) ? 0 : (slider.count + 1) * dimension;
          } else {
            slideString = (reverse) ? ((slider.count - 1) - target + slider.cloneOffset) * dimension : (target + slider.cloneOffset) * dimension;
          }
          slider.setProps(slideString, "", slider.vars.animationSpeed);
          if (slider.transitions) {
            if (!slider.vars.animationLoop || !slider.atEnd) {
              slider.animating = false;
              slider.currentSlide = slider.animatingTo;
            }

            // Unbind previous transitionEnd events and re-bind new transitionEnd event
            slider.container.unbind("webkitTransitionEnd transitionend");
            slider.container.bind("webkitTransitionEnd transitionend", function() {
              clearTimeout(slider.ensureAnimationEnd);
              slider.wrapup(dimension);
            });

            // Insurance for the ever-so-fickle transitionEnd event
            clearTimeout(slider.ensureAnimationEnd);
            slider.ensureAnimationEnd = setTimeout(function() {
              slider.wrapup(dimension);
            }, slider.vars.animationSpeed + 100);

          } else {
            slider.container.animate(slider.args, slider.vars.animationSpeed, slider.vars.easing, function(){
              slider.wrapup(dimension);
            });
          }
        } else { // FADE:
          if (!touch) {
            slider.slides.eq(slider.currentSlide).css({"zIndex": 1}).animate({"opacity": 0}, slider.vars.animationSpeed, slider.vars.easing);
            slider.slides.eq(target).css({"zIndex": 2}).animate({"opacity": 1}, slider.vars.animationSpeed, slider.vars.easing, slider.wrapup);
          } else {
            slider.slides.eq(slider.currentSlide).css({ "opacity": 0, "zIndex": 1 });
            slider.slides.eq(target).css({ "opacity": 1, "zIndex": 2 });
            slider.wrapup(dimension);
          }
        }
        // SMOOTH HEIGHT:
        if (slider.vars.smoothHeight) { methods.smoothHeight(slider.vars.animationSpeed); }
      }
    };
    slider.wrapup = function(dimension) {
      // SLIDE:
      if (!fade && !carousel) {
        if (slider.currentSlide === 0 && slider.animatingTo === slider.last && slider.vars.animationLoop) {
          slider.setProps(dimension, "jumpEnd");
        } else if (slider.currentSlide === slider.last && slider.animatingTo === 0 && slider.vars.animationLoop) {
          slider.setProps(dimension, "jumpStart");
        }
      }
      slider.animating = false;
      slider.currentSlide = slider.animatingTo;
      // API: after() animation Callback
      slider.vars.after(slider);
    };

    // SLIDESHOW:
    slider.animateSlides = function() {
      if (!slider.animating && focused ) { slider.flexAnimate(slider.getTarget("next")); }
    };
    // SLIDESHOW:
    slider.pause = function() {
      clearInterval(slider.animatedSlides);
      slider.animatedSlides = null;
      slider.playing = false;
      // PAUSEPLAY:
      if (slider.vars.pausePlay) { methods.pausePlay.update("play"); }
      // SYNC:
      if (slider.syncExists) { methods.sync("pause"); }
    };
    // SLIDESHOW:
    slider.play = function() {
      if (slider.playing) { clearInterval(slider.animatedSlides); }
      slider.animatedSlides = slider.animatedSlides || setInterval(slider.animateSlides, slider.vars.slideshowSpeed);
      slider.started = slider.playing = true;
      // PAUSEPLAY:
      if (slider.vars.pausePlay) { methods.pausePlay.update("pause"); }
      // SYNC:
      if (slider.syncExists) { methods.sync("play"); }
    };
    // STOP:
    slider.stop = function () {
      slider.pause();
      slider.stopped = true;
    };
    slider.canAdvance = function(target, fromNav) {
      // ASNAV:
      var last = (asNav) ? slider.pagingCount - 1 : slider.last;
      return (fromNav) ? true :
             (asNav && slider.currentItem === slider.count - 1 && target === 0 && slider.direction === "prev") ? true :
             (asNav && slider.currentItem === 0 && target === slider.pagingCount - 1 && slider.direction !== "next") ? false :
             (target === slider.currentSlide && !asNav) ? false :
             (slider.vars.animationLoop) ? true :
             (slider.atEnd && slider.currentSlide === 0 && target === last && slider.direction !== "next") ? false :
             (slider.atEnd && slider.currentSlide === last && target === 0 && slider.direction === "next") ? false :
             true;
    };
    slider.getTarget = function(dir) {
      slider.direction = dir;
      if (dir === "next") {
        return (slider.currentSlide === slider.last) ? 0 : slider.currentSlide + 1;
      } else {
        return (slider.currentSlide === 0) ? slider.last : slider.currentSlide - 1;
      }
    };

    // SLIDE:
    slider.setProps = function(pos, special, dur) {
      var target = (function() {
        var posCheck = (pos) ? pos : ((slider.itemW + slider.vars.itemMargin) * slider.move) * slider.animatingTo,
            posCalc = (function() {
              if (carousel) {
                return (special === "setTouch") ? pos :
                       (reverse && slider.animatingTo === slider.last) ? 0 :
                       (reverse) ? slider.limit - (((slider.itemW + slider.vars.itemMargin) * slider.move) * slider.animatingTo) :
                       (slider.animatingTo === slider.last) ? slider.limit : posCheck;
              } else {
                switch (special) {
                  case "setTotal": return (reverse) ? ((slider.count - 1) - slider.currentSlide + slider.cloneOffset) * pos : (slider.currentSlide + slider.cloneOffset) * pos;
                  case "setTouch": return (reverse) ? pos : pos;
                  case "jumpEnd": return (reverse) ? pos : slider.count * pos;
                  case "jumpStart": return (reverse) ? slider.count * pos : pos;
                  default: return pos;
                }
              }
            }());

            return (posCalc * ((slider.vars.rtl)?1:-1)) + "px";
          }());

      if (slider.transitions) {
        target = (vertical) ? "translate3d(0," + target + ",0)" : "translate3d(" + ((slider.vars.rtl?-1:1)*parseInt(target)+'px') + ",0,0)";
        dur = (dur !== undefined) ? (dur/1000) + "s" : "0s";
        slider.container.css("-" + slider.pfx + "-transition-duration", dur);
         slider.container.css("transition-duration", dur);
      }

      slider.args[slider.prop] = target;
      if (slider.transitions || dur === undefined) { slider.container.css(slider.args); }

      slider.container.css('transform',target);
    };

    slider.setup = function(type) {
      // SLIDE:
      if (!fade) {
        var sliderOffset, arr;

        if (type === "init") {
          slider.viewport = $('<div class="' + namespace + 'viewport"></div>').css({"overflow": "hidden", "position": "relative"}).appendTo(slider).append(slider.container);
          // INFINITE LOOP:
          slider.cloneCount = 0;
          slider.cloneOffset = 0;
          // REVERSE:
          if (reverse) {
            arr = $.makeArray(slider.slides).reverse();
            slider.slides = $(arr);
            slider.container.empty().append(slider.slides);
          }
        }
        // INFINITE LOOP && !CAROUSEL:
        if (slider.vars.animationLoop && !carousel) {
          slider.cloneCount = 2;
          slider.cloneOffset = 1;
          // clear out old clones
          if (type !== "init") { slider.container.find('.clone').remove(); }
          slider.container.append(methods.uniqueID(slider.slides.first().clone().addClass('clone')).attr('aria-hidden', 'true'))
                          .prepend(methods.uniqueID(slider.slides.last().clone().addClass('clone')).attr('aria-hidden', 'true'));
        }
        slider.newSlides = $(slider.vars.selector, slider);

        sliderOffset = (reverse) ? slider.count - 1 - slider.currentSlide + slider.cloneOffset : slider.currentSlide + slider.cloneOffset;
        // VERTICAL:
        if (vertical && !carousel) {
          slider.container.height((slider.count + slider.cloneCount) * 200 + "%").css("position", "absolute").width("100%");
          setTimeout(function(){
            slider.newSlides.css({"display": "block"});
            slider.doMath();
            slider.viewport.height(slider.h);
            slider.setProps(sliderOffset * slider.h, "init");
          }, (type === "init") ? 100 : 0);
        } else {
          slider.container.width((slider.count + slider.cloneCount) * 200 + "%");
          slider.setProps(sliderOffset * slider.computedW, "init");
          setTimeout(function(){
            slider.doMath();
          if(slider.vars.rtl){
              slider.newSlides.css({"width": slider.computedW, "marginRight" : slider.computedM, "float": "left", "display": "block"});
           }
            else{
              slider.newSlides.css({"width": slider.computedW, "marginRight" : slider.computedM, "float": "left", "display": "block"});
            }
            // SMOOTH HEIGHT:
            if (slider.vars.smoothHeight) { methods.smoothHeight(); }
          }, (type === "init") ? 100 : 0);
        }
      } else { // FADE:
        if(slider.vars.rtl){
          slider.slides.css({"width": "100%", "float": 'right', "marginLeft": "-100%", "position": "relative"});
        }
        else{
          slider.slides.css({"width": "100%", "float": 'left', "marginRight": "-100%", "position": "relative"});
        }
        if (type === "init") {
          if (!touch) {
            //slider.slides.eq(slider.currentSlide).fadeIn(slider.vars.animationSpeed, slider.vars.easing);
            if (slider.vars.fadeFirstSlide == false) {
              slider.slides.css({ "opacity": 0, "display": "block", "zIndex": 1 }).eq(slider.currentSlide).css({"zIndex": 2}).css({"opacity": 1});
            } else {
              slider.slides.css({ "opacity": 0, "display": "block", "zIndex": 1 }).eq(slider.currentSlide).css({"zIndex": 2}).animate({"opacity": 1},slider.vars.animationSpeed,slider.vars.easing);
            }
          } else {
            slider.slides.css({ "opacity": 0, "display": "block", "webkitTransition": "opacity " + slider.vars.animationSpeed / 1000 + "s ease", "zIndex": 1 }).eq(slider.currentSlide).css({ "opacity": 1, "zIndex": 2});
          }
        }
        // SMOOTH HEIGHT:
        if (slider.vars.smoothHeight) { methods.smoothHeight(); }
      }
      // !CAROUSEL:
      // CANDIDATE: active slide
      if (!carousel) { slider.slides.removeClass(namespace + "active-slide").eq(slider.currentSlide).addClass(namespace + "active-slide"); }

      //FlexSlider: init() Callback
      slider.vars.init(slider);
    };

    slider.doMath = function() {
      var slide = slider.slides.first(),
          slideMargin = slider.vars.itemMargin,
          minItems = slider.vars.minItems,
          maxItems = slider.vars.maxItems;

      slider.w = (slider.viewport===undefined) ? slider.width() : slider.viewport.width();
      slider.h = slide.height();
      slider.boxPadding = slide.outerWidth() - slide.width();

      // CAROUSEL:
      if (carousel) {
        slider.itemT = slider.vars.itemWidth + slideMargin;
        slider.itemM = slideMargin;
        slider.minW = (minItems) ? minItems * slider.itemT : slider.w;
        slider.maxW = (maxItems) ? (maxItems * slider.itemT) - slideMargin : slider.w;
        slider.itemW = (slider.minW > slider.w) ? (slider.w - (slideMargin * (minItems - 1)))/minItems :
                       (slider.maxW < slider.w) ? (slider.w - (slideMargin * (maxItems - 1)))/maxItems :
                       (slider.vars.itemWidth > slider.w) ? slider.w : slider.vars.itemWidth;

        slider.visible = Math.floor(slider.w/(slider.itemW));
        slider.move = (slider.vars.move > 0 && slider.vars.move < slider.visible ) ? slider.vars.move : slider.visible;
        slider.pagingCount = Math.ceil(((slider.count - slider.visible)/slider.move) + 1);
        slider.last =  slider.pagingCount - 1;
        slider.limit = (slider.pagingCount === 1) ? 0 :
                       (slider.vars.itemWidth > slider.w) ? (slider.itemW * (slider.count - 1)) + (slideMargin * (slider.count - 1)) : ((slider.itemW + slideMargin) * slider.count) - slider.w - slideMargin;
      } else {
        slider.itemW = slider.w;
        slider.itemM = slideMargin;
        slider.pagingCount = slider.count;
        slider.last = slider.count - 1;
      }
      slider.computedW = slider.itemW - slider.boxPadding;
      slider.computedM = slider.itemM;
    };

    slider.update = function(pos, action) {
      slider.doMath();

      // update currentSlide and slider.animatingTo if necessary
      if (!carousel) {
        if (pos < slider.currentSlide) {
          slider.currentSlide += 1;
        } else if (pos <= slider.currentSlide && pos !== 0) {
          slider.currentSlide -= 1;
        }
        slider.animatingTo = slider.currentSlide;
      }

      // update controlNav
      if (slider.vars.controlNav && !slider.manualControls) {
        if ((action === "add" && !carousel) || slider.pagingCount > slider.controlNav.length) {
          methods.controlNav.update("add");
        } else if ((action === "remove" && !carousel) || slider.pagingCount < slider.controlNav.length) {
          if (carousel && slider.currentSlide > slider.last) {
            slider.currentSlide -= 1;
            slider.animatingTo -= 1;
          }
          methods.controlNav.update("remove", slider.last);
        }
      }
      // update directionNav
      if (slider.vars.directionNav) { methods.directionNav.update(); }

    };

    slider.addSlide = function(obj, pos) {
      var $obj = $(obj);

      slider.count += 1;
      slider.last = slider.count - 1;

      // append new slide
      if (vertical && reverse) {
        (pos !== undefined) ? slider.slides.eq(slider.count - pos).after($obj) : slider.container.prepend($obj);
      } else {
        (pos !== undefined) ? slider.slides.eq(pos).before($obj) : slider.container.append($obj);
      }

      // update currentSlide, animatingTo, controlNav, and directionNav
      slider.update(pos, "add");

      // update slider.slides
      slider.slides = $(slider.vars.selector + ':not(.clone)', slider);
      // re-setup the slider to accomdate new slide
      slider.setup();

      //FlexSlider: added() Callback
      slider.vars.added(slider);
    };
    slider.removeSlide = function(obj) {
      var pos = (isNaN(obj)) ? slider.slides.index($(obj)) : obj;

      // update count
      slider.count -= 1;
      slider.last = slider.count - 1;

      // remove slide
      if (isNaN(obj)) {
        $(obj, slider.slides).remove();
      } else {
        (vertical && reverse) ? slider.slides.eq(slider.last).remove() : slider.slides.eq(obj).remove();
      }

      // update currentSlide, animatingTo, controlNav, and directionNav
      slider.doMath();
      slider.update(pos, "remove");

      // update slider.slides
      slider.slides = $(slider.vars.selector + ':not(.clone)', slider);
      // re-setup the slider to accomdate new slide
      slider.setup();

      // FlexSlider: removed() Callback
      slider.vars.removed(slider);
    };

    //FlexSlider: Initialize
    methods.init();
  };

  // Ensure the slider isn't focussed if the window loses focus.
  $( window ).blur( function ( e ) {
    focused = false;
  }).focus( function ( e ) {
    focused = true;
  });

  //FlexSlider: Default Settings
  $.flexslider.defaults = {
    namespace: "flex-",             //{NEW} String: Prefix string attached to the class of every element generated by the plugin
    selector: ".slides > li",       //{NEW} Selector: Must match a simple pattern. '{container} > {slide}' -- Ignore pattern at your own peril
    animation: "fade",              //String: Select your animation type, "fade" or "slide"
    easing: "swing",                //{NEW} String: Determines the easing method used in jQuery transitions. jQuery easing plugin is supported!
    direction: "horizontal",        //String: Select the sliding direction, "horizontal" or "vertical"
    reverse: false,                 //{NEW} Boolean: Reverse the animation direction
    animationLoop: true,            //Boolean: Should the animation loop? If false, directionNav will received "disable" classes at either end
    smoothHeight: false,            //{NEW} Boolean: Allow height of the slider to animate smoothly in horizontal mode
    startAt: 0,                     //Integer: The slide that the slider should start on. Array notation (0 = first slide)
    slideshow: true,                //Boolean: Animate slider automatically
    slideshowSpeed: 7000,           //Integer: Set the speed of the slideshow cycling, in milliseconds
    animationSpeed: 600,            //Integer: Set the speed of animations, in milliseconds
    initDelay: 0,                   //{NEW} Integer: Set an initialization delay, in milliseconds
    randomize: false,               //Boolean: Randomize slide order
    fadeFirstSlide: true,           //Boolean: Fade in the first slide when animation type is "fade"
    thumbCaptions: false,           //Boolean: Whether or not to put captions on thumbnails when using the "thumbnails" controlNav.

    // Usability features
    pauseOnAction: true,            //Boolean: Pause the slideshow when interacting with control elements, highly recommended.
    pauseOnHover: false,            //Boolean: Pause the slideshow when hovering over slider, then resume when no longer hovering
    pauseInvisible: true,       //{NEW} Boolean: Pause the slideshow when tab is invisible, resume when visible. Provides better UX, lower CPU usage.
    useCSS: true,                   //{NEW} Boolean: Slider will use CSS3 transitions if available
    touch: true,                    //{NEW} Boolean: Allow touch swipe navigation of the slider on touch-enabled devices
    video: false,                   //{NEW} Boolean: If using video in the slider, will prevent CSS3 3D Transforms to avoid graphical glitches

    // Primary Controls
    controlNav: true,               //Boolean: Create navigation for paging control of each slide? Note: Leave true for manualControls usage
    directionNav: true,             //Boolean: Create navigation for previous/next navigation? (true/false)
    prevText: "Previous",           //String: Set the text for the "previous" directionNav item
    nextText: "Next",               //String: Set the text for the "next" directionNav item

    // Secondary Navigation
    keyboard: true,                 //Boolean: Allow slider navigating via keyboard left/right keys
    multipleKeyboard: false,        //{NEW} Boolean: Allow keyboard navigation to affect multiple sliders. Default behavior cuts out keyboard navigation with more than one slider present.
    mousewheel: false,              //{UPDATED} Boolean: Requires jquery.mousewheel.js (https://github.com/brandonaaron/jquery-mousewheel) - Allows slider navigating via mousewheel
    pausePlay: false,               //Boolean: Create pause/play dynamic element
    pauseText: "Pause",             //String: Set the text for the "pause" pausePlay item
    playText: "Play",               //String: Set the text for the "play" pausePlay item

    // Special properties
    controlsContainer: "",          //{UPDATED} jQuery Object/Selector: Declare which container the navigation elements should be appended too. Default container is the FlexSlider element. Example use would be $(".flexslider-container"). Property is ignored if given element is not found.
    manualControls: "",             //{UPDATED} jQuery Object/Selector: Declare custom control navigation. Examples would be $(".flex-control-nav li") or "#tabs-nav li img", etc. The number of elements in your controlNav should match the number of slides/tabs.
    customDirectionNav: "",         //{NEW} jQuery Object/Selector: Custom prev / next button. Must be two jQuery elements. In order to make the events work they have to have the classes "prev" and "next" (plus namespace)
    sync: "",                       //{NEW} Selector: Mirror the actions performed on this slider with another slider. Use with care.
    asNavFor: "",                   //{NEW} Selector: Internal property exposed for turning the slider into a thumbnail navigation for another slider

    // Carousel Options
    itemWidth: 0,                   //{NEW} Integer: Box-model width of individual carousel items, including horizontal borders and padding.
    itemMargin: 0,                  //{NEW} Integer: Margin between carousel items.
    minItems: 1,                    //{NEW} Integer: Minimum number of carousel items that should be visible. Items will resize fluidly when below this.
    maxItems: 0,                    //{NEW} Integer: Maxmimum number of carousel items that should be visible. Items will resize fluidly when above this limit.
    move: 0,                        //{NEW} Integer: Number of carousel items that should move on animation. If 0, slider will move all visible items.
    allowOneSlide: true,           //{NEW} Boolean: Whether or not to allow a slider comprised of a single slide

    // Callback API
    start: function(){},            //Callback: function(slider) - Fires when the slider loads the first slide
    before: function(){},           //Callback: function(slider) - Fires asynchronously with each slider animation
    after: function(){},            //Callback: function(slider) - Fires after each slider animation completes
    end: function(){},              //Callback: function(slider) - Fires when the slider reaches the last slide (asynchronous)
    added: function(){},            //{NEW} Callback: function(slider) - Fires after a slide is added
    removed: function(){},           //{NEW} Callback: function(slider) - Fires after a slide is removed
    init: function() {},             //{NEW} Callback: function(slider) - Fires after the slider is initially setup
  rtl: false             //{NEW} Boolean: Whether or not to enable RTL mode
  };

  //FlexSlider: Plugin Function
  $.fn.flexslider = function(options) {
    if (options === undefined) { options = {}; }

    if (typeof options === "object") {
      return this.each(function() {
        var $this = $(this),
            selector = (options.selector) ? options.selector : ".slides > li",
            $slides = $this.find(selector);

      if ( ( $slides.length === 1 && options.allowOneSlide === false ) || $slides.length === 0 ) {
          $slides.fadeIn(400);
          if (options.start) { options.start($this); }
        } else if ($this.data('flexslider') === undefined) {
          new $.flexslider(this, options);
        }
      });
    } else {
      // Helper strings to quickly perform functions on the slider
      var $slider = $(this).data('flexslider');
      switch (options) {
        case "play": $slider.play(); break;
        case "pause": $slider.pause(); break;
        case "stop": $slider.stop(); break;
        case "next": $slider.flexAnimate($slider.getTarget("next"), true); break;
        case "prev":
        case "previous": $slider.flexAnimate($slider.getTarget("prev"), true); break;
        default: if (typeof options === "number") { $slider.flexAnimate(options, true); }
      }
    }
  };
})(jQuery);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJqcXVlcnkuZmxleHNsaWRlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogalF1ZXJ5IEZsZXhTbGlkZXIgdjIuNy4wXG4gKiBDb3B5cmlnaHQgMjAxMiBXb29UaGVtZXNcbiAqIENvbnRyaWJ1dGluZyBBdXRob3I6IFR5bGVyIFNtaXRoXG4gKi9cbjtcbihmdW5jdGlvbiAoJCkge1xuXG4gIHZhciBmb2N1c2VkID0gdHJ1ZTtcblxuICAvL0ZsZXhTbGlkZXI6IE9iamVjdCBJbnN0YW5jZVxuICAkLmZsZXhzbGlkZXIgPSBmdW5jdGlvbihlbCwgb3B0aW9ucykge1xuICAgIHZhciBzbGlkZXIgPSAkKGVsKTtcblxuICAgIC8vIG1ha2luZyB2YXJpYWJsZXMgcHVibGljXG5cbiAgICAvL2lmIHJ0bCB2YWx1ZSB3YXMgbm90IHBhc3NlZCBhbmQgaHRtbCBpcyBpbiBydGwuLmVuYWJsZSBpdCBieSBkZWZhdWx0LlxuICAgIGlmKHR5cGVvZiBvcHRpb25zLnJ0bD09J3VuZGVmaW5lZCcgJiYgJCgnaHRtbCcpLmF0dHIoJ2RpcicpPT0ncnRsJyl7XG4gICAgICBvcHRpb25zLnJ0bD10cnVlO1xuICAgIH1cbiAgICBzbGlkZXIudmFycyA9ICQuZXh0ZW5kKHt9LCAkLmZsZXhzbGlkZXIuZGVmYXVsdHMsIG9wdGlvbnMpO1xuXG4gICAgdmFyIG5hbWVzcGFjZSA9IHNsaWRlci52YXJzLm5hbWVzcGFjZSxcbiAgICAgICAgbXNHZXN0dXJlID0gd2luZG93Lm5hdmlnYXRvciAmJiB3aW5kb3cubmF2aWdhdG9yLm1zUG9pbnRlckVuYWJsZWQgJiYgd2luZG93Lk1TR2VzdHVyZSxcbiAgICAgICAgdG91Y2ggPSAoKCBcIm9udG91Y2hzdGFydFwiIGluIHdpbmRvdyApIHx8IG1zR2VzdHVyZSB8fCB3aW5kb3cuRG9jdW1lbnRUb3VjaCAmJiBkb2N1bWVudCBpbnN0YW5jZW9mIERvY3VtZW50VG91Y2gpICYmIHNsaWRlci52YXJzLnRvdWNoLFxuICAgICAgICAvLyBkZXByZWNhdGluZyB0aGlzIGlkZWEsIGFzIGRldmljZXMgYXJlIGJlaW5nIHJlbGVhc2VkIHdpdGggYm90aCBvZiB0aGVzZSBldmVudHNcbiAgICAgICAgZXZlbnRUeXBlID0gXCJjbGljayB0b3VjaGVuZCBNU1BvaW50ZXJVcCBrZXl1cFwiLFxuICAgICAgICB3YXRjaGVkRXZlbnQgPSBcIlwiLFxuICAgICAgICB3YXRjaGVkRXZlbnRDbGVhclRpbWVyLFxuICAgICAgICB2ZXJ0aWNhbCA9IHNsaWRlci52YXJzLmRpcmVjdGlvbiA9PT0gXCJ2ZXJ0aWNhbFwiLFxuICAgICAgICByZXZlcnNlID0gc2xpZGVyLnZhcnMucmV2ZXJzZSxcbiAgICAgICAgY2Fyb3VzZWwgPSAoc2xpZGVyLnZhcnMuaXRlbVdpZHRoID4gMCksXG4gICAgICAgIGZhZGUgPSBzbGlkZXIudmFycy5hbmltYXRpb24gPT09IFwiZmFkZVwiLFxuICAgICAgICBhc05hdiA9IHNsaWRlci52YXJzLmFzTmF2Rm9yICE9PSBcIlwiLFxuICAgICAgICBtZXRob2RzID0ge307XG5cbiAgICAvLyBTdG9yZSBhIHJlZmVyZW5jZSB0byB0aGUgc2xpZGVyIG9iamVjdFxuICAgICQuZGF0YShlbCwgXCJmbGV4c2xpZGVyXCIsIHNsaWRlcik7XG5cbiAgICAvLyBQcml2YXRlIHNsaWRlciBtZXRob2RzXG4gICAgbWV0aG9kcyA9IHtcbiAgICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBzbGlkZXIuYW5pbWF0aW5nID0gZmFsc2U7XG4gICAgICAgIC8vIEdldCBjdXJyZW50IHNsaWRlIGFuZCBtYWtlIHN1cmUgaXQgaXMgYSBudW1iZXJcbiAgICAgICAgc2xpZGVyLmN1cnJlbnRTbGlkZSA9IHBhcnNlSW50KCAoIHNsaWRlci52YXJzLnN0YXJ0QXQgPyBzbGlkZXIudmFycy5zdGFydEF0IDogMCksIDEwICk7XG4gICAgICAgIGlmICggaXNOYU4oIHNsaWRlci5jdXJyZW50U2xpZGUgKSApIHsgc2xpZGVyLmN1cnJlbnRTbGlkZSA9IDA7IH1cbiAgICAgICAgc2xpZGVyLmFuaW1hdGluZ1RvID0gc2xpZGVyLmN1cnJlbnRTbGlkZTtcbiAgICAgICAgc2xpZGVyLmF0RW5kID0gKHNsaWRlci5jdXJyZW50U2xpZGUgPT09IDAgfHwgc2xpZGVyLmN1cnJlbnRTbGlkZSA9PT0gc2xpZGVyLmxhc3QpO1xuICAgICAgICBzbGlkZXIuY29udGFpbmVyU2VsZWN0b3IgPSBzbGlkZXIudmFycy5zZWxlY3Rvci5zdWJzdHIoMCxzbGlkZXIudmFycy5zZWxlY3Rvci5zZWFyY2goJyAnKSk7XG4gICAgICAgIHNsaWRlci5zbGlkZXMgPSAkKHNsaWRlci52YXJzLnNlbGVjdG9yLCBzbGlkZXIpO1xuICAgICAgICBzbGlkZXIuY29udGFpbmVyID0gJChzbGlkZXIuY29udGFpbmVyU2VsZWN0b3IsIHNsaWRlcik7XG4gICAgICAgIHNsaWRlci5jb3VudCA9IHNsaWRlci5zbGlkZXMubGVuZ3RoO1xuICAgICAgICAvLyBTWU5DOlxuICAgICAgICBzbGlkZXIuc3luY0V4aXN0cyA9ICQoc2xpZGVyLnZhcnMuc3luYykubGVuZ3RoID4gMDtcbiAgICAgICAgLy8gU0xJREU6XG4gICAgICAgIGlmIChzbGlkZXIudmFycy5hbmltYXRpb24gPT09IFwic2xpZGVcIikgeyBzbGlkZXIudmFycy5hbmltYXRpb24gPSBcInN3aW5nXCI7IH1cbiAgICAgICAgc2xpZGVyLnByb3AgPSAodmVydGljYWwpID8gXCJ0b3BcIiA6ICggc2xpZGVyLnZhcnMucnRsID8gXCJtYXJnaW5SaWdodFwiIDogXCJtYXJnaW5MZWZ0XCIgKTtcbiAgICAgICAgc2xpZGVyLmFyZ3MgPSB7fTtcbiAgICAgICAgLy8gU0xJREVTSE9XOlxuICAgICAgICBzbGlkZXIubWFudWFsUGF1c2UgPSBmYWxzZTtcbiAgICAgICAgc2xpZGVyLnN0b3BwZWQgPSBmYWxzZTtcbiAgICAgICAgLy9QQVVTRSBXSEVOIElOVklTSUJMRVxuICAgICAgICBzbGlkZXIuc3RhcnRlZCA9IGZhbHNlO1xuICAgICAgICBzbGlkZXIuc3RhcnRUaW1lb3V0ID0gbnVsbDtcbiAgICAgICAgLy8gVE9VQ0gvVVNFQ1NTOlxuICAgICAgICBzbGlkZXIudHJhbnNpdGlvbnMgPSAhc2xpZGVyLnZhcnMudmlkZW8gJiYgIWZhZGUgJiYgc2xpZGVyLnZhcnMudXNlQ1NTICYmIChmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgb2JqID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG4gICAgICAgICAgICAgIHByb3BzID0gWydwZXJzcGVjdGl2ZVByb3BlcnR5JywgJ1dlYmtpdFBlcnNwZWN0aXZlJywgJ01velBlcnNwZWN0aXZlJywgJ09QZXJzcGVjdGl2ZScsICdtc1BlcnNwZWN0aXZlJ107XG4gICAgICAgICAgZm9yICh2YXIgaSBpbiBwcm9wcykge1xuICAgICAgICAgICAgaWYgKCBvYmouc3R5bGVbIHByb3BzW2ldIF0gIT09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgICAgICAgc2xpZGVyLnBmeCA9IHByb3BzW2ldLnJlcGxhY2UoJ1BlcnNwZWN0aXZlJywnJykudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgc2xpZGVyLnByb3AgPSBcIi1cIiArIHNsaWRlci5wZnggKyBcIi10cmFuc2Zvcm1cIjtcbiAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSgpKTtcbiAgICAgICAgc2xpZGVyLmVuc3VyZUFuaW1hdGlvbkVuZCA9ICcnO1xuICAgICAgICAvLyBDT05UUk9MU0NPTlRBSU5FUjpcbiAgICAgICAgaWYgKHNsaWRlci52YXJzLmNvbnRyb2xzQ29udGFpbmVyICE9PSBcIlwiKSBzbGlkZXIuY29udHJvbHNDb250YWluZXIgPSAkKHNsaWRlci52YXJzLmNvbnRyb2xzQ29udGFpbmVyKS5sZW5ndGggPiAwICYmICQoc2xpZGVyLnZhcnMuY29udHJvbHNDb250YWluZXIpO1xuICAgICAgICAvLyBNQU5VQUw6XG4gICAgICAgIGlmIChzbGlkZXIudmFycy5tYW51YWxDb250cm9scyAhPT0gXCJcIikgc2xpZGVyLm1hbnVhbENvbnRyb2xzID0gJChzbGlkZXIudmFycy5tYW51YWxDb250cm9scykubGVuZ3RoID4gMCAmJiAkKHNsaWRlci52YXJzLm1hbnVhbENvbnRyb2xzKTtcblxuICAgICAgICAvLyBDVVNUT00gRElSRUNUSU9OIE5BVjpcbiAgICAgICAgaWYgKHNsaWRlci52YXJzLmN1c3RvbURpcmVjdGlvbk5hdiAhPT0gXCJcIikgc2xpZGVyLmN1c3RvbURpcmVjdGlvbk5hdiA9ICQoc2xpZGVyLnZhcnMuY3VzdG9tRGlyZWN0aW9uTmF2KS5sZW5ndGggPT09IDIgJiYgJChzbGlkZXIudmFycy5jdXN0b21EaXJlY3Rpb25OYXYpO1xuXG4gICAgICAgIC8vIFJBTkRPTUlaRTpcbiAgICAgICAgaWYgKHNsaWRlci52YXJzLnJhbmRvbWl6ZSkge1xuICAgICAgICAgIHNsaWRlci5zbGlkZXMuc29ydChmdW5jdGlvbigpIHsgcmV0dXJuIChNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkpLTAuNSk7IH0pO1xuICAgICAgICAgIHNsaWRlci5jb250YWluZXIuZW1wdHkoKS5hcHBlbmQoc2xpZGVyLnNsaWRlcyk7XG4gICAgICAgIH1cblxuICAgICAgICBzbGlkZXIuZG9NYXRoKCk7XG5cbiAgICAgICAgLy8gSU5JVFxuICAgICAgICBzbGlkZXIuc2V0dXAoXCJpbml0XCIpO1xuXG4gICAgICAgIC8vIENPTlRST0xOQVY6XG4gICAgICAgIGlmIChzbGlkZXIudmFycy5jb250cm9sTmF2KSB7IG1ldGhvZHMuY29udHJvbE5hdi5zZXR1cCgpOyB9XG5cbiAgICAgICAgLy8gRElSRUNUSU9OTkFWOlxuICAgICAgICBpZiAoc2xpZGVyLnZhcnMuZGlyZWN0aW9uTmF2KSB7IG1ldGhvZHMuZGlyZWN0aW9uTmF2LnNldHVwKCk7IH1cblxuICAgICAgICAvLyBLRVlCT0FSRDpcbiAgICAgICAgaWYgKHNsaWRlci52YXJzLmtleWJvYXJkICYmICgkKHNsaWRlci5jb250YWluZXJTZWxlY3RvcikubGVuZ3RoID09PSAxIHx8IHNsaWRlci52YXJzLm11bHRpcGxlS2V5Ym9hcmQpKSB7XG4gICAgICAgICAgJChkb2N1bWVudCkuYmluZCgna2V5dXAnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgdmFyIGtleWNvZGUgPSBldmVudC5rZXlDb2RlO1xuICAgICAgICAgICAgaWYgKCFzbGlkZXIuYW5pbWF0aW5nICYmIChrZXljb2RlID09PSAzOSB8fCBrZXljb2RlID09PSAzNykpIHtcbiAgICAgICAgICAgICAgdmFyIHRhcmdldCA9IChzbGlkZXIudmFycy5ydGw/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICgoa2V5Y29kZSA9PT0gMzcpID8gc2xpZGVyLmdldFRhcmdldCgnbmV4dCcpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGtleWNvZGUgPT09IDM5KSA/IHNsaWRlci5nZXRUYXJnZXQoJ3ByZXYnKSA6IGZhbHNlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICgoa2V5Y29kZSA9PT0gMzkpID8gc2xpZGVyLmdldFRhcmdldCgnbmV4dCcpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGtleWNvZGUgPT09IDM3KSA/IHNsaWRlci5nZXRUYXJnZXQoJ3ByZXYnKSA6IGZhbHNlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDtcbiAgICAgICAgICAgICAgc2xpZGVyLmZsZXhBbmltYXRlKHRhcmdldCwgc2xpZGVyLnZhcnMucGF1c2VPbkFjdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gTU9VU0VXSEVFTDpcbiAgICAgICAgaWYgKHNsaWRlci52YXJzLm1vdXNld2hlZWwpIHtcbiAgICAgICAgICBzbGlkZXIuYmluZCgnbW91c2V3aGVlbCcsIGZ1bmN0aW9uKGV2ZW50LCBkZWx0YSwgZGVsdGFYLCBkZWx0YVkpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0gKGRlbHRhIDwgMCkgPyBzbGlkZXIuZ2V0VGFyZ2V0KCduZXh0JykgOiBzbGlkZXIuZ2V0VGFyZ2V0KCdwcmV2Jyk7XG4gICAgICAgICAgICBzbGlkZXIuZmxleEFuaW1hdGUodGFyZ2V0LCBzbGlkZXIudmFycy5wYXVzZU9uQWN0aW9uKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFBBVVNFUExBWVxuICAgICAgICBpZiAoc2xpZGVyLnZhcnMucGF1c2VQbGF5KSB7IG1ldGhvZHMucGF1c2VQbGF5LnNldHVwKCk7IH1cblxuICAgICAgICAvL1BBVVNFIFdIRU4gSU5WSVNJQkxFXG4gICAgICAgIGlmIChzbGlkZXIudmFycy5zbGlkZXNob3cgJiYgc2xpZGVyLnZhcnMucGF1c2VJbnZpc2libGUpIHsgbWV0aG9kcy5wYXVzZUludmlzaWJsZS5pbml0KCk7IH1cblxuICAgICAgICAvLyBTTElEU0VTSE9XXG4gICAgICAgIGlmIChzbGlkZXIudmFycy5zbGlkZXNob3cpIHtcbiAgICAgICAgICBpZiAoc2xpZGVyLnZhcnMucGF1c2VPbkhvdmVyKSB7XG4gICAgICAgICAgICBzbGlkZXIuaG92ZXIoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIGlmICghc2xpZGVyLm1hbnVhbFBsYXkgJiYgIXNsaWRlci5tYW51YWxQYXVzZSkgeyBzbGlkZXIucGF1c2UoKTsgfVxuICAgICAgICAgICAgfSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIGlmICghc2xpZGVyLm1hbnVhbFBhdXNlICYmICFzbGlkZXIubWFudWFsUGxheSAmJiAhc2xpZGVyLnN0b3BwZWQpIHsgc2xpZGVyLnBsYXkoKTsgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIGluaXRpYWxpemUgYW5pbWF0aW9uXG4gICAgICAgICAgLy9JZiB3ZSdyZSB2aXNpYmxlLCBvciB3ZSBkb24ndCB1c2UgUGFnZVZpc2liaWxpdHkgQVBJXG4gICAgICAgICAgaWYoIXNsaWRlci52YXJzLnBhdXNlSW52aXNpYmxlIHx8ICFtZXRob2RzLnBhdXNlSW52aXNpYmxlLmlzSGlkZGVuKCkpIHtcbiAgICAgICAgICAgIChzbGlkZXIudmFycy5pbml0RGVsYXkgPiAwKSA/IHNsaWRlci5zdGFydFRpbWVvdXQgPSBzZXRUaW1lb3V0KHNsaWRlci5wbGF5LCBzbGlkZXIudmFycy5pbml0RGVsYXkpIDogc2xpZGVyLnBsYXkoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBU05BVjpcbiAgICAgICAgaWYgKGFzTmF2KSB7IG1ldGhvZHMuYXNOYXYuc2V0dXAoKTsgfVxuXG4gICAgICAgIC8vIFRPVUNIXG4gICAgICAgIGlmICh0b3VjaCAmJiBzbGlkZXIudmFycy50b3VjaCkgeyBtZXRob2RzLnRvdWNoKCk7IH1cblxuICAgICAgICAvLyBGQURFJiZTTU9PVEhIRUlHSFQgfHwgU0xJREU6XG4gICAgICAgIGlmICghZmFkZSB8fCAoZmFkZSAmJiBzbGlkZXIudmFycy5zbW9vdGhIZWlnaHQpKSB7ICQod2luZG93KS5iaW5kKFwicmVzaXplIG9yaWVudGF0aW9uY2hhbmdlIGZvY3VzXCIsIG1ldGhvZHMucmVzaXplKTsgfVxuXG4gICAgICAgIHNsaWRlci5maW5kKFwiaW1nXCIpLmF0dHIoXCJkcmFnZ2FibGVcIiwgXCJmYWxzZVwiKTtcblxuICAgICAgICAvLyBBUEk6IHN0YXJ0KCkgQ2FsbGJhY2tcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgIHNsaWRlci52YXJzLnN0YXJ0KHNsaWRlcik7XG4gICAgICAgIH0sIDIwMCk7XG4gICAgICB9LFxuICAgICAgYXNOYXY6IHtcbiAgICAgICAgc2V0dXA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHNsaWRlci5hc05hdiA9IHRydWU7XG4gICAgICAgICAgc2xpZGVyLmFuaW1hdGluZ1RvID0gTWF0aC5mbG9vcihzbGlkZXIuY3VycmVudFNsaWRlL3NsaWRlci5tb3ZlKTtcbiAgICAgICAgICBzbGlkZXIuY3VycmVudEl0ZW0gPSBzbGlkZXIuY3VycmVudFNsaWRlO1xuICAgICAgICAgIHNsaWRlci5zbGlkZXMucmVtb3ZlQ2xhc3MobmFtZXNwYWNlICsgXCJhY3RpdmUtc2xpZGVcIikuZXEoc2xpZGVyLmN1cnJlbnRJdGVtKS5hZGRDbGFzcyhuYW1lc3BhY2UgKyBcImFjdGl2ZS1zbGlkZVwiKTtcbiAgICAgICAgICBpZighbXNHZXN0dXJlKXtcbiAgICAgICAgICAgICAgc2xpZGVyLnNsaWRlcy5vbihldmVudFR5cGUsIGZ1bmN0aW9uKGUpe1xuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB2YXIgJHNsaWRlID0gJCh0aGlzKSxcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0ID0gJHNsaWRlLmluZGV4KCk7XG4gICAgICAgICAgICAgICAgdmFyIHBvc0Zyb21YO1xuICAgICAgICAgICAgICAgIGlmKHNsaWRlci52YXJzLnJ0bCl7XG4gICAgICAgICAgICAgICAgICBwb3NGcm9tWCA9IC0xKigkc2xpZGUub2Zmc2V0KCkucmlnaHQgLSAkKHNsaWRlcikuc2Nyb2xsTGVmdCgpKTsgLy8gRmluZCBwb3NpdGlvbiBvZiBzbGlkZSByZWxhdGl2ZSB0byByaWdodCBvZiBzbGlkZXIgY29udGFpbmVyXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBwb3NGcm9tWCA9ICRzbGlkZS5vZmZzZXQoKS5sZWZ0IC0gJChzbGlkZXIpLnNjcm9sbExlZnQoKTsgLy8gRmluZCBwb3NpdGlvbiBvZiBzbGlkZSByZWxhdGl2ZSB0byBsZWZ0IG9mIHNsaWRlciBjb250YWluZXJcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYoIHBvc0Zyb21YIDw9IDAgJiYgJHNsaWRlLmhhc0NsYXNzKCBuYW1lc3BhY2UgKyAnYWN0aXZlLXNsaWRlJyApICkge1xuICAgICAgICAgICAgICAgICAgc2xpZGVyLmZsZXhBbmltYXRlKHNsaWRlci5nZXRUYXJnZXQoXCJwcmV2XCIpLCB0cnVlKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCEkKHNsaWRlci52YXJzLmFzTmF2Rm9yKS5kYXRhKCdmbGV4c2xpZGVyJykuYW5pbWF0aW5nICYmICEkc2xpZGUuaGFzQ2xhc3MobmFtZXNwYWNlICsgXCJhY3RpdmUtc2xpZGVcIikpIHtcbiAgICAgICAgICAgICAgICAgIHNsaWRlci5kaXJlY3Rpb24gPSAoc2xpZGVyLmN1cnJlbnRJdGVtIDwgdGFyZ2V0KSA/IFwibmV4dFwiIDogXCJwcmV2XCI7XG4gICAgICAgICAgICAgICAgICBzbGlkZXIuZmxleEFuaW1hdGUodGFyZ2V0LCBzbGlkZXIudmFycy5wYXVzZU9uQWN0aW9uLCBmYWxzZSwgdHJ1ZSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgZWwuX3NsaWRlciA9IHNsaWRlcjtcbiAgICAgICAgICAgICAgc2xpZGVyLnNsaWRlcy5lYWNoKGZ1bmN0aW9uICgpe1xuICAgICAgICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgdGhhdC5fZ2VzdHVyZSA9IG5ldyBNU0dlc3R1cmUoKTtcbiAgICAgICAgICAgICAgICAgIHRoYXQuX2dlc3R1cmUudGFyZ2V0ID0gdGhhdDtcbiAgICAgICAgICAgICAgICAgIHRoYXQuYWRkRXZlbnRMaXN0ZW5lcihcIk1TUG9pbnRlckRvd25cIiwgZnVuY3Rpb24gKGUpe1xuICAgICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICBpZihlLmN1cnJlbnRUYXJnZXQuX2dlc3R1cmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGUuY3VycmVudFRhcmdldC5fZ2VzdHVyZS5hZGRQb2ludGVyKGUucG9pbnRlcklkKTtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICB0aGF0LmFkZEV2ZW50TGlzdGVuZXIoXCJNU0dlc3R1cmVUYXBcIiwgZnVuY3Rpb24gKGUpe1xuICAgICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICB2YXIgJHNsaWRlID0gJCh0aGlzKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0ID0gJHNsaWRlLmluZGV4KCk7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKCEkKHNsaWRlci52YXJzLmFzTmF2Rm9yKS5kYXRhKCdmbGV4c2xpZGVyJykuYW5pbWF0aW5nICYmICEkc2xpZGUuaGFzQ2xhc3MoJ2FjdGl2ZScpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNsaWRlci5kaXJlY3Rpb24gPSAoc2xpZGVyLmN1cnJlbnRJdGVtIDwgdGFyZ2V0KSA/IFwibmV4dFwiIDogXCJwcmV2XCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNsaWRlci5mbGV4QW5pbWF0ZSh0YXJnZXQsIHNsaWRlci52YXJzLnBhdXNlT25BY3Rpb24sIGZhbHNlLCB0cnVlLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgY29udHJvbE5hdjoge1xuICAgICAgICBzZXR1cDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKCFzbGlkZXIubWFudWFsQ29udHJvbHMpIHtcbiAgICAgICAgICAgIG1ldGhvZHMuY29udHJvbE5hdi5zZXR1cFBhZ2luZygpO1xuICAgICAgICAgIH0gZWxzZSB7IC8vIE1BTlVBTENPTlRST0xTOlxuICAgICAgICAgICAgbWV0aG9kcy5jb250cm9sTmF2LnNldHVwTWFudWFsKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBzZXR1cFBhZ2luZzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIHR5cGUgPSAoc2xpZGVyLnZhcnMuY29udHJvbE5hdiA9PT0gXCJ0aHVtYm5haWxzXCIpID8gJ2NvbnRyb2wtdGh1bWJzJyA6ICdjb250cm9sLXBhZ2luZycsXG4gICAgICAgICAgICAgIGogPSAxLFxuICAgICAgICAgICAgICBpdGVtLFxuICAgICAgICAgICAgICBzbGlkZTtcblxuICAgICAgICAgIHNsaWRlci5jb250cm9sTmF2U2NhZmZvbGQgPSAkKCc8b2wgY2xhc3M9XCInKyBuYW1lc3BhY2UgKyAnY29udHJvbC1uYXYgJyArIG5hbWVzcGFjZSArIHR5cGUgKyAnXCI+PC9vbD4nKTtcblxuICAgICAgICAgIGlmIChzbGlkZXIucGFnaW5nQ291bnQgPiAxKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNsaWRlci5wYWdpbmdDb3VudDsgaSsrKSB7XG4gICAgICAgICAgICAgIHNsaWRlID0gc2xpZGVyLnNsaWRlcy5lcShpKTtcbiAgICAgICAgICAgICAgaWYgKCB1bmRlZmluZWQgPT09IHNsaWRlLmF0dHIoICdkYXRhLXRodW1iLWFsdCcgKSApIHsgc2xpZGUuYXR0ciggJ2RhdGEtdGh1bWItYWx0JywgJycgKTsgfVxuICAgICAgICAgICAgICB2YXIgYWx0VGV4dCA9ICggJycgIT09IHNsaWRlLmF0dHIoICdkYXRhLXRodW1iLWFsdCcgKSApID8gYWx0VGV4dCA9ICcgYWx0PVwiJyArIHNsaWRlLmF0dHIoICdkYXRhLXRodW1iLWFsdCcgKSArICdcIicgOiAnJztcbiAgICAgICAgICAgICAgaXRlbSA9IChzbGlkZXIudmFycy5jb250cm9sTmF2ID09PSBcInRodW1ibmFpbHNcIikgPyAnPGltZyBzcmM9XCInICsgc2xpZGUuYXR0ciggJ2RhdGEtdGh1bWInICkgKyAnXCInICsgYWx0VGV4dCArICcvPicgOiAnPGEgaHJlZj1cIiNcIj4nICsgaiArICc8L2E+JztcbiAgICAgICAgICAgICAgaWYgKCAndGh1bWJuYWlscycgPT09IHNsaWRlci52YXJzLmNvbnRyb2xOYXYgJiYgdHJ1ZSA9PT0gc2xpZGVyLnZhcnMudGh1bWJDYXB0aW9ucyApIHtcbiAgICAgICAgICAgICAgICB2YXIgY2FwdG4gPSBzbGlkZS5hdHRyKCAnZGF0YS10aHVtYmNhcHRpb24nICk7XG4gICAgICAgICAgICAgICAgaWYgKCAnJyAhPT0gY2FwdG4gJiYgdW5kZWZpbmVkICE9PSBjYXB0biApIHsgaXRlbSArPSAnPHNwYW4gY2xhc3M9XCInICsgbmFtZXNwYWNlICsgJ2NhcHRpb25cIj4nICsgY2FwdG4gKyAnPC9zcGFuPic7IH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBzbGlkZXIuY29udHJvbE5hdlNjYWZmb2xkLmFwcGVuZCgnPGxpPicgKyBpdGVtICsgJzwvbGk+Jyk7XG4gICAgICAgICAgICAgIGorKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBDT05UUk9MU0NPTlRBSU5FUjpcbiAgICAgICAgICAoc2xpZGVyLmNvbnRyb2xzQ29udGFpbmVyKSA/ICQoc2xpZGVyLmNvbnRyb2xzQ29udGFpbmVyKS5hcHBlbmQoc2xpZGVyLmNvbnRyb2xOYXZTY2FmZm9sZCkgOiBzbGlkZXIuYXBwZW5kKHNsaWRlci5jb250cm9sTmF2U2NhZmZvbGQpO1xuICAgICAgICAgIG1ldGhvZHMuY29udHJvbE5hdi5zZXQoKTtcblxuICAgICAgICAgIG1ldGhvZHMuY29udHJvbE5hdi5hY3RpdmUoKTtcblxuICAgICAgICAgIHNsaWRlci5jb250cm9sTmF2U2NhZmZvbGQuZGVsZWdhdGUoJ2EsIGltZycsIGV2ZW50VHlwZSwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICAgIGlmICh3YXRjaGVkRXZlbnQgPT09IFwiXCIgfHwgd2F0Y2hlZEV2ZW50ID09PSBldmVudC50eXBlKSB7XG4gICAgICAgICAgICAgIHZhciAkdGhpcyA9ICQodGhpcyksXG4gICAgICAgICAgICAgICAgICB0YXJnZXQgPSBzbGlkZXIuY29udHJvbE5hdi5pbmRleCgkdGhpcyk7XG5cbiAgICAgICAgICAgICAgaWYgKCEkdGhpcy5oYXNDbGFzcyhuYW1lc3BhY2UgKyAnYWN0aXZlJykpIHtcbiAgICAgICAgICAgICAgICBzbGlkZXIuZGlyZWN0aW9uID0gKHRhcmdldCA+IHNsaWRlci5jdXJyZW50U2xpZGUpID8gXCJuZXh0XCIgOiBcInByZXZcIjtcbiAgICAgICAgICAgICAgICBzbGlkZXIuZmxleEFuaW1hdGUodGFyZ2V0LCBzbGlkZXIudmFycy5wYXVzZU9uQWN0aW9uKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBzZXR1cCBmbGFncyB0byBwcmV2ZW50IGV2ZW50IGR1cGxpY2F0aW9uXG4gICAgICAgICAgICBpZiAod2F0Y2hlZEV2ZW50ID09PSBcIlwiKSB7XG4gICAgICAgICAgICAgIHdhdGNoZWRFdmVudCA9IGV2ZW50LnR5cGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtZXRob2RzLnNldFRvQ2xlYXJXYXRjaGVkRXZlbnQoKTtcblxuICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBzZXR1cE1hbnVhbDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgc2xpZGVyLmNvbnRyb2xOYXYgPSBzbGlkZXIubWFudWFsQ29udHJvbHM7XG4gICAgICAgICAgbWV0aG9kcy5jb250cm9sTmF2LmFjdGl2ZSgpO1xuXG4gICAgICAgICAgc2xpZGVyLmNvbnRyb2xOYXYuYmluZChldmVudFR5cGUsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgICAgICBpZiAod2F0Y2hlZEV2ZW50ID09PSBcIlwiIHx8IHdhdGNoZWRFdmVudCA9PT0gZXZlbnQudHlwZSkge1xuICAgICAgICAgICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpLFxuICAgICAgICAgICAgICAgICAgdGFyZ2V0ID0gc2xpZGVyLmNvbnRyb2xOYXYuaW5kZXgoJHRoaXMpO1xuXG4gICAgICAgICAgICAgIGlmICghJHRoaXMuaGFzQ2xhc3MobmFtZXNwYWNlICsgJ2FjdGl2ZScpKSB7XG4gICAgICAgICAgICAgICAgKHRhcmdldCA+IHNsaWRlci5jdXJyZW50U2xpZGUpID8gc2xpZGVyLmRpcmVjdGlvbiA9IFwibmV4dFwiIDogc2xpZGVyLmRpcmVjdGlvbiA9IFwicHJldlwiO1xuICAgICAgICAgICAgICAgIHNsaWRlci5mbGV4QW5pbWF0ZSh0YXJnZXQsIHNsaWRlci52YXJzLnBhdXNlT25BY3Rpb24pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHNldHVwIGZsYWdzIHRvIHByZXZlbnQgZXZlbnQgZHVwbGljYXRpb25cbiAgICAgICAgICAgIGlmICh3YXRjaGVkRXZlbnQgPT09IFwiXCIpIHtcbiAgICAgICAgICAgICAgd2F0Y2hlZEV2ZW50ID0gZXZlbnQudHlwZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG1ldGhvZHMuc2V0VG9DbGVhcldhdGNoZWRFdmVudCgpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBzZWxlY3RvciA9IChzbGlkZXIudmFycy5jb250cm9sTmF2ID09PSBcInRodW1ibmFpbHNcIikgPyAnaW1nJyA6ICdhJztcbiAgICAgICAgICBzbGlkZXIuY29udHJvbE5hdiA9ICQoJy4nICsgbmFtZXNwYWNlICsgJ2NvbnRyb2wtbmF2IGxpICcgKyBzZWxlY3RvciwgKHNsaWRlci5jb250cm9sc0NvbnRhaW5lcikgPyBzbGlkZXIuY29udHJvbHNDb250YWluZXIgOiBzbGlkZXIpO1xuICAgICAgICB9LFxuICAgICAgICBhY3RpdmU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHNsaWRlci5jb250cm9sTmF2LnJlbW92ZUNsYXNzKG5hbWVzcGFjZSArIFwiYWN0aXZlXCIpLmVxKHNsaWRlci5hbmltYXRpbmdUbykuYWRkQ2xhc3MobmFtZXNwYWNlICsgXCJhY3RpdmVcIik7XG4gICAgICAgIH0sXG4gICAgICAgIHVwZGF0ZTogZnVuY3Rpb24oYWN0aW9uLCBwb3MpIHtcbiAgICAgICAgICBpZiAoc2xpZGVyLnBhZ2luZ0NvdW50ID4gMSAmJiBhY3Rpb24gPT09IFwiYWRkXCIpIHtcbiAgICAgICAgICAgIHNsaWRlci5jb250cm9sTmF2U2NhZmZvbGQuYXBwZW5kKCQoJzxsaT48YSBocmVmPVwiI1wiPicgKyBzbGlkZXIuY291bnQgKyAnPC9hPjwvbGk+JykpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoc2xpZGVyLnBhZ2luZ0NvdW50ID09PSAxKSB7XG4gICAgICAgICAgICBzbGlkZXIuY29udHJvbE5hdlNjYWZmb2xkLmZpbmQoJ2xpJykucmVtb3ZlKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNsaWRlci5jb250cm9sTmF2LmVxKHBvcykuY2xvc2VzdCgnbGknKS5yZW1vdmUoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgbWV0aG9kcy5jb250cm9sTmF2LnNldCgpO1xuICAgICAgICAgIChzbGlkZXIucGFnaW5nQ291bnQgPiAxICYmIHNsaWRlci5wYWdpbmdDb3VudCAhPT0gc2xpZGVyLmNvbnRyb2xOYXYubGVuZ3RoKSA/IHNsaWRlci51cGRhdGUocG9zLCBhY3Rpb24pIDogbWV0aG9kcy5jb250cm9sTmF2LmFjdGl2ZSgpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgZGlyZWN0aW9uTmF2OiB7XG4gICAgICAgIHNldHVwOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgZGlyZWN0aW9uTmF2U2NhZmZvbGQgPSAkKCc8dWwgY2xhc3M9XCInICsgbmFtZXNwYWNlICsgJ2RpcmVjdGlvbi1uYXZcIj48bGkgY2xhc3M9XCInICsgbmFtZXNwYWNlICsgJ25hdi1wcmV2XCI+PGEgY2xhc3M9XCInICsgbmFtZXNwYWNlICsgJ3ByZXZcIiBocmVmPVwiI1wiPicgKyBzbGlkZXIudmFycy5wcmV2VGV4dCArICc8L2E+PC9saT48bGkgY2xhc3M9XCInICsgbmFtZXNwYWNlICsgJ25hdi1uZXh0XCI+PGEgY2xhc3M9XCInICsgbmFtZXNwYWNlICsgJ25leHRcIiBocmVmPVwiI1wiPicgKyBzbGlkZXIudmFycy5uZXh0VGV4dCArICc8L2E+PC9saT48L3VsPicpO1xuXG4gICAgICAgICAgLy8gQ1VTVE9NIERJUkVDVElPTiBOQVY6XG4gICAgICAgICAgaWYgKHNsaWRlci5jdXN0b21EaXJlY3Rpb25OYXYpIHtcbiAgICAgICAgICAgIHNsaWRlci5kaXJlY3Rpb25OYXYgPSBzbGlkZXIuY3VzdG9tRGlyZWN0aW9uTmF2O1xuICAgICAgICAgIC8vIENPTlRST0xTQ09OVEFJTkVSOlxuICAgICAgICAgIH0gZWxzZSBpZiAoc2xpZGVyLmNvbnRyb2xzQ29udGFpbmVyKSB7XG4gICAgICAgICAgICAkKHNsaWRlci5jb250cm9sc0NvbnRhaW5lcikuYXBwZW5kKGRpcmVjdGlvbk5hdlNjYWZmb2xkKTtcbiAgICAgICAgICAgIHNsaWRlci5kaXJlY3Rpb25OYXYgPSAkKCcuJyArIG5hbWVzcGFjZSArICdkaXJlY3Rpb24tbmF2IGxpIGEnLCBzbGlkZXIuY29udHJvbHNDb250YWluZXIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzbGlkZXIuYXBwZW5kKGRpcmVjdGlvbk5hdlNjYWZmb2xkKTtcbiAgICAgICAgICAgIHNsaWRlci5kaXJlY3Rpb25OYXYgPSAkKCcuJyArIG5hbWVzcGFjZSArICdkaXJlY3Rpb24tbmF2IGxpIGEnLCBzbGlkZXIpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIG1ldGhvZHMuZGlyZWN0aW9uTmF2LnVwZGF0ZSgpO1xuXG4gICAgICAgICAgc2xpZGVyLmRpcmVjdGlvbk5hdi5iaW5kKGV2ZW50VHlwZSwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB2YXIgdGFyZ2V0O1xuXG4gICAgICAgICAgICBpZiAod2F0Y2hlZEV2ZW50ID09PSBcIlwiIHx8IHdhdGNoZWRFdmVudCA9PT0gZXZlbnQudHlwZSkge1xuICAgICAgICAgICAgICB0YXJnZXQgPSAoJCh0aGlzKS5oYXNDbGFzcyhuYW1lc3BhY2UgKyAnbmV4dCcpKSA/IHNsaWRlci5nZXRUYXJnZXQoJ25leHQnKSA6IHNsaWRlci5nZXRUYXJnZXQoJ3ByZXYnKTtcbiAgICAgICAgICAgICAgc2xpZGVyLmZsZXhBbmltYXRlKHRhcmdldCwgc2xpZGVyLnZhcnMucGF1c2VPbkFjdGlvbik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHNldHVwIGZsYWdzIHRvIHByZXZlbnQgZXZlbnQgZHVwbGljYXRpb25cbiAgICAgICAgICAgIGlmICh3YXRjaGVkRXZlbnQgPT09IFwiXCIpIHtcbiAgICAgICAgICAgICAgd2F0Y2hlZEV2ZW50ID0gZXZlbnQudHlwZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG1ldGhvZHMuc2V0VG9DbGVhcldhdGNoZWRFdmVudCgpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICB1cGRhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBkaXNhYmxlZENsYXNzID0gbmFtZXNwYWNlICsgJ2Rpc2FibGVkJztcbiAgICAgICAgICBpZiAoc2xpZGVyLnBhZ2luZ0NvdW50ID09PSAxKSB7XG4gICAgICAgICAgICBzbGlkZXIuZGlyZWN0aW9uTmF2LmFkZENsYXNzKGRpc2FibGVkQ2xhc3MpLmF0dHIoJ3RhYmluZGV4JywgJy0xJyk7XG4gICAgICAgICAgfSBlbHNlIGlmICghc2xpZGVyLnZhcnMuYW5pbWF0aW9uTG9vcCkge1xuICAgICAgICAgICAgaWYgKHNsaWRlci5hbmltYXRpbmdUbyA9PT0gMCkge1xuICAgICAgICAgICAgICBzbGlkZXIuZGlyZWN0aW9uTmF2LnJlbW92ZUNsYXNzKGRpc2FibGVkQ2xhc3MpLmZpbHRlcignLicgKyBuYW1lc3BhY2UgKyBcInByZXZcIikuYWRkQ2xhc3MoZGlzYWJsZWRDbGFzcykuYXR0cigndGFiaW5kZXgnLCAnLTEnKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc2xpZGVyLmFuaW1hdGluZ1RvID09PSBzbGlkZXIubGFzdCkge1xuICAgICAgICAgICAgICBzbGlkZXIuZGlyZWN0aW9uTmF2LnJlbW92ZUNsYXNzKGRpc2FibGVkQ2xhc3MpLmZpbHRlcignLicgKyBuYW1lc3BhY2UgKyBcIm5leHRcIikuYWRkQ2xhc3MoZGlzYWJsZWRDbGFzcykuYXR0cigndGFiaW5kZXgnLCAnLTEnKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHNsaWRlci5kaXJlY3Rpb25OYXYucmVtb3ZlQ2xhc3MoZGlzYWJsZWRDbGFzcykucmVtb3ZlQXR0cigndGFiaW5kZXgnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2xpZGVyLmRpcmVjdGlvbk5hdi5yZW1vdmVDbGFzcyhkaXNhYmxlZENsYXNzKS5yZW1vdmVBdHRyKCd0YWJpbmRleCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHBhdXNlUGxheToge1xuICAgICAgICBzZXR1cDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIHBhdXNlUGxheVNjYWZmb2xkID0gJCgnPGRpdiBjbGFzcz1cIicgKyBuYW1lc3BhY2UgKyAncGF1c2VwbGF5XCI+PGEgaHJlZj1cIiNcIj48L2E+PC9kaXY+Jyk7XG5cbiAgICAgICAgICAvLyBDT05UUk9MU0NPTlRBSU5FUjpcbiAgICAgICAgICBpZiAoc2xpZGVyLmNvbnRyb2xzQ29udGFpbmVyKSB7XG4gICAgICAgICAgICBzbGlkZXIuY29udHJvbHNDb250YWluZXIuYXBwZW5kKHBhdXNlUGxheVNjYWZmb2xkKTtcbiAgICAgICAgICAgIHNsaWRlci5wYXVzZVBsYXkgPSAkKCcuJyArIG5hbWVzcGFjZSArICdwYXVzZXBsYXkgYScsIHNsaWRlci5jb250cm9sc0NvbnRhaW5lcik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNsaWRlci5hcHBlbmQocGF1c2VQbGF5U2NhZmZvbGQpO1xuICAgICAgICAgICAgc2xpZGVyLnBhdXNlUGxheSA9ICQoJy4nICsgbmFtZXNwYWNlICsgJ3BhdXNlcGxheSBhJywgc2xpZGVyKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBtZXRob2RzLnBhdXNlUGxheS51cGRhdGUoKHNsaWRlci52YXJzLnNsaWRlc2hvdykgPyBuYW1lc3BhY2UgKyAncGF1c2UnIDogbmFtZXNwYWNlICsgJ3BsYXknKTtcblxuICAgICAgICAgIHNsaWRlci5wYXVzZVBsYXkuYmluZChldmVudFR5cGUsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgICAgICBpZiAod2F0Y2hlZEV2ZW50ID09PSBcIlwiIHx8IHdhdGNoZWRFdmVudCA9PT0gZXZlbnQudHlwZSkge1xuICAgICAgICAgICAgICBpZiAoJCh0aGlzKS5oYXNDbGFzcyhuYW1lc3BhY2UgKyAncGF1c2UnKSkge1xuICAgICAgICAgICAgICAgIHNsaWRlci5tYW51YWxQYXVzZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgc2xpZGVyLm1hbnVhbFBsYXkgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBzbGlkZXIucGF1c2UoKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzbGlkZXIubWFudWFsUGF1c2UgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBzbGlkZXIubWFudWFsUGxheSA9IHRydWU7XG4gICAgICAgICAgICAgICAgc2xpZGVyLnBsYXkoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBzZXR1cCBmbGFncyB0byBwcmV2ZW50IGV2ZW50IGR1cGxpY2F0aW9uXG4gICAgICAgICAgICBpZiAod2F0Y2hlZEV2ZW50ID09PSBcIlwiKSB7XG4gICAgICAgICAgICAgIHdhdGNoZWRFdmVudCA9IGV2ZW50LnR5cGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtZXRob2RzLnNldFRvQ2xlYXJXYXRjaGVkRXZlbnQoKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgdXBkYXRlOiBmdW5jdGlvbihzdGF0ZSkge1xuICAgICAgICAgIChzdGF0ZSA9PT0gXCJwbGF5XCIpID8gc2xpZGVyLnBhdXNlUGxheS5yZW1vdmVDbGFzcyhuYW1lc3BhY2UgKyAncGF1c2UnKS5hZGRDbGFzcyhuYW1lc3BhY2UgKyAncGxheScpLmh0bWwoc2xpZGVyLnZhcnMucGxheVRleHQpIDogc2xpZGVyLnBhdXNlUGxheS5yZW1vdmVDbGFzcyhuYW1lc3BhY2UgKyAncGxheScpLmFkZENsYXNzKG5hbWVzcGFjZSArICdwYXVzZScpLmh0bWwoc2xpZGVyLnZhcnMucGF1c2VUZXh0KTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHRvdWNoOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHN0YXJ0WCxcbiAgICAgICAgICBzdGFydFksXG4gICAgICAgICAgb2Zmc2V0LFxuICAgICAgICAgIGN3aWR0aCxcbiAgICAgICAgICBkeCxcbiAgICAgICAgICBzdGFydFQsXG4gICAgICAgICAgb25Ub3VjaFN0YXJ0LFxuICAgICAgICAgIG9uVG91Y2hNb3ZlLFxuICAgICAgICAgIG9uVG91Y2hFbmQsXG4gICAgICAgICAgc2Nyb2xsaW5nID0gZmFsc2UsXG4gICAgICAgICAgbG9jYWxYID0gMCxcbiAgICAgICAgICBsb2NhbFkgPSAwLFxuICAgICAgICAgIGFjY0R4ID0gMDtcblxuICAgICAgICBpZighbXNHZXN0dXJlKXtcbiAgICAgICAgICAgIG9uVG91Y2hTdGFydCA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgaWYgKHNsaWRlci5hbmltYXRpbmcpIHtcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAoICggd2luZG93Lm5hdmlnYXRvci5tc1BvaW50ZXJFbmFibGVkICkgfHwgZS50b3VjaGVzLmxlbmd0aCA9PT0gMSApIHtcbiAgICAgICAgICAgICAgICBzbGlkZXIucGF1c2UoKTtcbiAgICAgICAgICAgICAgICAvLyBDQVJPVVNFTDpcbiAgICAgICAgICAgICAgICBjd2lkdGggPSAodmVydGljYWwpID8gc2xpZGVyLmggOiBzbGlkZXIuIHc7XG4gICAgICAgICAgICAgICAgc3RhcnRUID0gTnVtYmVyKG5ldyBEYXRlKCkpO1xuICAgICAgICAgICAgICAgIC8vIENBUk9VU0VMOlxuXG4gICAgICAgICAgICAgICAgLy8gTG9jYWwgdmFycyBmb3IgWCBhbmQgWSBwb2ludHMuXG4gICAgICAgICAgICAgICAgbG9jYWxYID0gZS50b3VjaGVzWzBdLnBhZ2VYO1xuICAgICAgICAgICAgICAgIGxvY2FsWSA9IGUudG91Y2hlc1swXS5wYWdlWTtcblxuICAgICAgICAgICAgICAgIG9mZnNldCA9IChjYXJvdXNlbCAmJiByZXZlcnNlICYmIHNsaWRlci5hbmltYXRpbmdUbyA9PT0gc2xpZGVyLmxhc3QpID8gMCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgKGNhcm91c2VsICYmIHJldmVyc2UpID8gc2xpZGVyLmxpbWl0IC0gKCgoc2xpZGVyLml0ZW1XICsgc2xpZGVyLnZhcnMuaXRlbU1hcmdpbikgKiBzbGlkZXIubW92ZSkgKiBzbGlkZXIuYW5pbWF0aW5nVG8pIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAoY2Fyb3VzZWwgJiYgc2xpZGVyLmN1cnJlbnRTbGlkZSA9PT0gc2xpZGVyLmxhc3QpID8gc2xpZGVyLmxpbWl0IDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAoY2Fyb3VzZWwpID8gKChzbGlkZXIuaXRlbVcgKyBzbGlkZXIudmFycy5pdGVtTWFyZ2luKSAqIHNsaWRlci5tb3ZlKSAqIHNsaWRlci5jdXJyZW50U2xpZGUgOlxuICAgICAgICAgICAgICAgICAgICAgICAgIChyZXZlcnNlKSA/IChzbGlkZXIubGFzdCAtIHNsaWRlci5jdXJyZW50U2xpZGUgKyBzbGlkZXIuY2xvbmVPZmZzZXQpICogY3dpZHRoIDogKHNsaWRlci5jdXJyZW50U2xpZGUgKyBzbGlkZXIuY2xvbmVPZmZzZXQpICogY3dpZHRoO1xuICAgICAgICAgICAgICAgIHN0YXJ0WCA9ICh2ZXJ0aWNhbCkgPyBsb2NhbFkgOiBsb2NhbFg7XG4gICAgICAgICAgICAgICAgc3RhcnRZID0gKHZlcnRpY2FsKSA/IGxvY2FsWCA6IGxvY2FsWTtcbiAgICAgICAgICAgICAgICBlbC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCBvblRvdWNoTW92ZSwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgb25Ub3VjaEVuZCwgZmFsc2UpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBvblRvdWNoTW92ZSA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgLy8gTG9jYWwgdmFycyBmb3IgWCBhbmQgWSBwb2ludHMuXG5cbiAgICAgICAgICAgICAgbG9jYWxYID0gZS50b3VjaGVzWzBdLnBhZ2VYO1xuICAgICAgICAgICAgICBsb2NhbFkgPSBlLnRvdWNoZXNbMF0ucGFnZVk7XG5cbiAgICAgICAgICAgICAgZHggPSAodmVydGljYWwpID8gc3RhcnRYIC0gbG9jYWxZIDogKHNsaWRlci52YXJzLnJ0bD8tMToxKSooc3RhcnRYIC0gbG9jYWxYKTtcbiAgICAgICAgICAgICAgc2Nyb2xsaW5nID0gKHZlcnRpY2FsKSA/IChNYXRoLmFicyhkeCkgPCBNYXRoLmFicyhsb2NhbFggLSBzdGFydFkpKSA6IChNYXRoLmFicyhkeCkgPCBNYXRoLmFicyhsb2NhbFkgLSBzdGFydFkpKTtcbiAgICAgICAgICAgICAgdmFyIGZ4bXMgPSA1MDA7XG5cbiAgICAgICAgICAgICAgaWYgKCAhIHNjcm9sbGluZyB8fCBOdW1iZXIoIG5ldyBEYXRlKCkgKSAtIHN0YXJ0VCA+IGZ4bXMgKSB7XG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIGlmICghZmFkZSAmJiBzbGlkZXIudHJhbnNpdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAgIGlmICghc2xpZGVyLnZhcnMuYW5pbWF0aW9uTG9vcCkge1xuICAgICAgICAgICAgICAgICAgICBkeCA9IGR4Lygoc2xpZGVyLmN1cnJlbnRTbGlkZSA9PT0gMCAmJiBkeCA8IDAgfHwgc2xpZGVyLmN1cnJlbnRTbGlkZSA9PT0gc2xpZGVyLmxhc3QgJiYgZHggPiAwKSA/IChNYXRoLmFicyhkeCkvY3dpZHRoKzIpIDogMSk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBzbGlkZXIuc2V0UHJvcHMob2Zmc2V0ICsgZHgsIFwic2V0VG91Y2hcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBvblRvdWNoRW5kID0gZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAvLyBmaW5pc2ggdGhlIHRvdWNoIGJ5IHVuZG9pbmcgdGhlIHRvdWNoIHNlc3Npb25cbiAgICAgICAgICAgICAgZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgb25Ub3VjaE1vdmUsIGZhbHNlKTtcblxuICAgICAgICAgICAgICBpZiAoc2xpZGVyLmFuaW1hdGluZ1RvID09PSBzbGlkZXIuY3VycmVudFNsaWRlICYmICFzY3JvbGxpbmcgJiYgIShkeCA9PT0gbnVsbCkpIHtcbiAgICAgICAgICAgICAgICB2YXIgdXBkYXRlRHggPSAocmV2ZXJzZSkgPyAtZHggOiBkeCxcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0ID0gKHVwZGF0ZUR4ID4gMCkgPyBzbGlkZXIuZ2V0VGFyZ2V0KCduZXh0JykgOiBzbGlkZXIuZ2V0VGFyZ2V0KCdwcmV2Jyk7XG5cbiAgICAgICAgICAgICAgICBpZiAoc2xpZGVyLmNhbkFkdmFuY2UodGFyZ2V0KSAmJiAoTnVtYmVyKG5ldyBEYXRlKCkpIC0gc3RhcnRUIDwgNTUwICYmIE1hdGguYWJzKHVwZGF0ZUR4KSA+IDUwIHx8IE1hdGguYWJzKHVwZGF0ZUR4KSA+IGN3aWR0aC8yKSkge1xuICAgICAgICAgICAgICAgICAgc2xpZGVyLmZsZXhBbmltYXRlKHRhcmdldCwgc2xpZGVyLnZhcnMucGF1c2VPbkFjdGlvbik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIGlmICghZmFkZSkgeyBzbGlkZXIuZmxleEFuaW1hdGUoc2xpZGVyLmN1cnJlbnRTbGlkZSwgc2xpZGVyLnZhcnMucGF1c2VPbkFjdGlvbiwgdHJ1ZSk7IH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBvblRvdWNoRW5kLCBmYWxzZSk7XG5cbiAgICAgICAgICAgICAgc3RhcnRYID0gbnVsbDtcbiAgICAgICAgICAgICAgc3RhcnRZID0gbnVsbDtcbiAgICAgICAgICAgICAgZHggPSBudWxsO1xuICAgICAgICAgICAgICBvZmZzZXQgPSBudWxsO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZWwuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIG9uVG91Y2hTdGFydCwgZmFsc2UpO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIGVsLnN0eWxlLm1zVG91Y2hBY3Rpb24gPSBcIm5vbmVcIjtcbiAgICAgICAgICAgIGVsLl9nZXN0dXJlID0gbmV3IE1TR2VzdHVyZSgpO1xuICAgICAgICAgICAgZWwuX2dlc3R1cmUudGFyZ2V0ID0gZWw7XG4gICAgICAgICAgICBlbC5hZGRFdmVudExpc3RlbmVyKFwiTVNQb2ludGVyRG93blwiLCBvbk1TUG9pbnRlckRvd24sIGZhbHNlKTtcbiAgICAgICAgICAgIGVsLl9zbGlkZXIgPSBzbGlkZXI7XG4gICAgICAgICAgICBlbC5hZGRFdmVudExpc3RlbmVyKFwiTVNHZXN0dXJlQ2hhbmdlXCIsIG9uTVNHZXN0dXJlQ2hhbmdlLCBmYWxzZSk7XG4gICAgICAgICAgICBlbC5hZGRFdmVudExpc3RlbmVyKFwiTVNHZXN0dXJlRW5kXCIsIG9uTVNHZXN0dXJlRW5kLCBmYWxzZSk7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIG9uTVNQb2ludGVyRG93bihlKXtcbiAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIGlmIChzbGlkZXIuYW5pbWF0aW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgc2xpZGVyLnBhdXNlKCk7XG4gICAgICAgICAgICAgICAgICAgIGVsLl9nZXN0dXJlLmFkZFBvaW50ZXIoZS5wb2ludGVySWQpO1xuICAgICAgICAgICAgICAgICAgICBhY2NEeCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGN3aWR0aCA9ICh2ZXJ0aWNhbCkgPyBzbGlkZXIuaCA6IHNsaWRlci4gdztcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRUID0gTnVtYmVyKG5ldyBEYXRlKCkpO1xuICAgICAgICAgICAgICAgICAgICAvLyBDQVJPVVNFTDpcblxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQgPSAoY2Fyb3VzZWwgJiYgcmV2ZXJzZSAmJiBzbGlkZXIuYW5pbWF0aW5nVG8gPT09IHNsaWRlci5sYXN0KSA/IDAgOlxuICAgICAgICAgICAgICAgICAgICAgICAgKGNhcm91c2VsICYmIHJldmVyc2UpID8gc2xpZGVyLmxpbWl0IC0gKCgoc2xpZGVyLml0ZW1XICsgc2xpZGVyLnZhcnMuaXRlbU1hcmdpbikgKiBzbGlkZXIubW92ZSkgKiBzbGlkZXIuYW5pbWF0aW5nVG8pIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoY2Fyb3VzZWwgJiYgc2xpZGVyLmN1cnJlbnRTbGlkZSA9PT0gc2xpZGVyLmxhc3QpID8gc2xpZGVyLmxpbWl0IDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGNhcm91c2VsKSA/ICgoc2xpZGVyLml0ZW1XICsgc2xpZGVyLnZhcnMuaXRlbU1hcmdpbikgKiBzbGlkZXIubW92ZSkgKiBzbGlkZXIuY3VycmVudFNsaWRlIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChyZXZlcnNlKSA/IChzbGlkZXIubGFzdCAtIHNsaWRlci5jdXJyZW50U2xpZGUgKyBzbGlkZXIuY2xvbmVPZmZzZXQpICogY3dpZHRoIDogKHNsaWRlci5jdXJyZW50U2xpZGUgKyBzbGlkZXIuY2xvbmVPZmZzZXQpICogY3dpZHRoO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gb25NU0dlc3R1cmVDaGFuZ2UoZSkge1xuICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgdmFyIHNsaWRlciA9IGUudGFyZ2V0Ll9zbGlkZXI7XG4gICAgICAgICAgICAgICAgaWYoIXNsaWRlcil7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHRyYW5zWCA9IC1lLnRyYW5zbGF0aW9uWCxcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNZID0gLWUudHJhbnNsYXRpb25ZO1xuXG4gICAgICAgICAgICAgICAgLy9BY2N1bXVsYXRlIHRyYW5zbGF0aW9ucy5cbiAgICAgICAgICAgICAgICBhY2NEeCA9IGFjY0R4ICsgKCh2ZXJ0aWNhbCkgPyB0cmFuc1kgOiB0cmFuc1gpO1xuICAgICAgICAgICAgICAgIGR4ID0gKHNsaWRlci52YXJzLnJ0bD8tMToxKSphY2NEeDtcbiAgICAgICAgICAgICAgICBzY3JvbGxpbmcgPSAodmVydGljYWwpID8gKE1hdGguYWJzKGFjY0R4KSA8IE1hdGguYWJzKC10cmFuc1gpKSA6IChNYXRoLmFicyhhY2NEeCkgPCBNYXRoLmFicygtdHJhbnNZKSk7XG5cbiAgICAgICAgICAgICAgICBpZihlLmRldGFpbCA9PT0gZS5NU0dFU1RVUkVfRkxBR19JTkVSVElBKXtcbiAgICAgICAgICAgICAgICAgICAgc2V0SW1tZWRpYXRlKGZ1bmN0aW9uICgpe1xuICAgICAgICAgICAgICAgICAgICAgICAgZWwuX2dlc3R1cmUuc3RvcCgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKCFzY3JvbGxpbmcgfHwgTnVtYmVyKG5ldyBEYXRlKCkpIC0gc3RhcnRUID4gNTAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFmYWRlICYmIHNsaWRlci50cmFuc2l0aW9ucykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFzbGlkZXIudmFycy5hbmltYXRpb25Mb29wKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHggPSBhY2NEeCAvICgoc2xpZGVyLmN1cnJlbnRTbGlkZSA9PT0gMCAmJiBhY2NEeCA8IDAgfHwgc2xpZGVyLmN1cnJlbnRTbGlkZSA9PT0gc2xpZGVyLmxhc3QgJiYgYWNjRHggPiAwKSA/IChNYXRoLmFicyhhY2NEeCkgLyBjd2lkdGggKyAyKSA6IDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgc2xpZGVyLnNldFByb3BzKG9mZnNldCArIGR4LCBcInNldFRvdWNoXCIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBvbk1TR2VzdHVyZUVuZChlKSB7XG4gICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICB2YXIgc2xpZGVyID0gZS50YXJnZXQuX3NsaWRlcjtcbiAgICAgICAgICAgICAgICBpZighc2xpZGVyKXtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoc2xpZGVyLmFuaW1hdGluZ1RvID09PSBzbGlkZXIuY3VycmVudFNsaWRlICYmICFzY3JvbGxpbmcgJiYgIShkeCA9PT0gbnVsbCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHVwZGF0ZUR4ID0gKHJldmVyc2UpID8gLWR4IDogZHgsXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQgPSAodXBkYXRlRHggPiAwKSA/IHNsaWRlci5nZXRUYXJnZXQoJ25leHQnKSA6IHNsaWRlci5nZXRUYXJnZXQoJ3ByZXYnKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoc2xpZGVyLmNhbkFkdmFuY2UodGFyZ2V0KSAmJiAoTnVtYmVyKG5ldyBEYXRlKCkpIC0gc3RhcnRUIDwgNTUwICYmIE1hdGguYWJzKHVwZGF0ZUR4KSA+IDUwIHx8IE1hdGguYWJzKHVwZGF0ZUR4KSA+IGN3aWR0aC8yKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2xpZGVyLmZsZXhBbmltYXRlKHRhcmdldCwgc2xpZGVyLnZhcnMucGF1c2VPbkFjdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWZhZGUpIHsgc2xpZGVyLmZsZXhBbmltYXRlKHNsaWRlci5jdXJyZW50U2xpZGUsIHNsaWRlci52YXJzLnBhdXNlT25BY3Rpb24sIHRydWUpOyB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBzdGFydFggPSBudWxsO1xuICAgICAgICAgICAgICAgIHN0YXJ0WSA9IG51bGw7XG4gICAgICAgICAgICAgICAgZHggPSBudWxsO1xuICAgICAgICAgICAgICAgIG9mZnNldCA9IG51bGw7XG4gICAgICAgICAgICAgICAgYWNjRHggPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgcmVzaXplOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCFzbGlkZXIuYW5pbWF0aW5nICYmIHNsaWRlci5pcygnOnZpc2libGUnKSkge1xuICAgICAgICAgIGlmICghY2Fyb3VzZWwpIHsgc2xpZGVyLmRvTWF0aCgpOyB9XG5cbiAgICAgICAgICBpZiAoZmFkZSkge1xuICAgICAgICAgICAgLy8gU01PT1RIIEhFSUdIVDpcbiAgICAgICAgICAgIG1ldGhvZHMuc21vb3RoSGVpZ2h0KCk7XG4gICAgICAgICAgfSBlbHNlIGlmIChjYXJvdXNlbCkgeyAvL0NBUk9VU0VMOlxuICAgICAgICAgICAgc2xpZGVyLnNsaWRlcy53aWR0aChzbGlkZXIuY29tcHV0ZWRXKTtcbiAgICAgICAgICAgIHNsaWRlci51cGRhdGUoc2xpZGVyLnBhZ2luZ0NvdW50KTtcbiAgICAgICAgICAgIHNsaWRlci5zZXRQcm9wcygpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIGlmICh2ZXJ0aWNhbCkgeyAvL1ZFUlRJQ0FMOlxuICAgICAgICAgICAgc2xpZGVyLnZpZXdwb3J0LmhlaWdodChzbGlkZXIuaCk7XG4gICAgICAgICAgICBzbGlkZXIuc2V0UHJvcHMoc2xpZGVyLmgsIFwic2V0VG90YWxcIik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFNNT09USCBIRUlHSFQ6XG4gICAgICAgICAgICBpZiAoc2xpZGVyLnZhcnMuc21vb3RoSGVpZ2h0KSB7IG1ldGhvZHMuc21vb3RoSGVpZ2h0KCk7IH1cbiAgICAgICAgICAgIHNsaWRlci5uZXdTbGlkZXMud2lkdGgoc2xpZGVyLmNvbXB1dGVkVyk7XG4gICAgICAgICAgICBzbGlkZXIuc2V0UHJvcHMoc2xpZGVyLmNvbXB1dGVkVywgXCJzZXRUb3RhbFwiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBzbW9vdGhIZWlnaHQ6IGZ1bmN0aW9uKGR1cikge1xuICAgICAgICBpZiAoIXZlcnRpY2FsIHx8IGZhZGUpIHtcbiAgICAgICAgICB2YXIgJG9iaiA9IChmYWRlKSA/IHNsaWRlciA6IHNsaWRlci52aWV3cG9ydDtcbiAgICAgICAgICAoZHVyKSA/ICRvYmouYW5pbWF0ZSh7XCJoZWlnaHRcIjogc2xpZGVyLnNsaWRlcy5lcShzbGlkZXIuYW5pbWF0aW5nVG8pLmlubmVySGVpZ2h0KCl9LCBkdXIpIDogJG9iai5pbm5lckhlaWdodChzbGlkZXIuc2xpZGVzLmVxKHNsaWRlci5hbmltYXRpbmdUbykuaW5uZXJIZWlnaHQoKSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBzeW5jOiBmdW5jdGlvbihhY3Rpb24pIHtcbiAgICAgICAgdmFyICRvYmogPSAkKHNsaWRlci52YXJzLnN5bmMpLmRhdGEoXCJmbGV4c2xpZGVyXCIpLFxuICAgICAgICAgICAgdGFyZ2V0ID0gc2xpZGVyLmFuaW1hdGluZ1RvO1xuXG4gICAgICAgIHN3aXRjaCAoYWN0aW9uKSB7XG4gICAgICAgICAgY2FzZSBcImFuaW1hdGVcIjogJG9iai5mbGV4QW5pbWF0ZSh0YXJnZXQsIHNsaWRlci52YXJzLnBhdXNlT25BY3Rpb24sIGZhbHNlLCB0cnVlKTsgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcInBsYXlcIjogaWYgKCEkb2JqLnBsYXlpbmcgJiYgISRvYmouYXNOYXYpIHsgJG9iai5wbGF5KCk7IH0gYnJlYWs7XG4gICAgICAgICAgY2FzZSBcInBhdXNlXCI6ICRvYmoucGF1c2UoKTsgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICB1bmlxdWVJRDogZnVuY3Rpb24oJGNsb25lKSB7XG4gICAgICAgIC8vIEFwcGVuZCBfY2xvbmUgdG8gY3VycmVudCBsZXZlbCBhbmQgY2hpbGRyZW4gZWxlbWVudHMgd2l0aCBpZCBhdHRyaWJ1dGVzXG4gICAgICAgICRjbG9uZS5maWx0ZXIoICdbaWRdJyApLmFkZCgkY2xvbmUuZmluZCggJ1tpZF0nICkpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyICR0aGlzID0gJCh0aGlzKTtcbiAgICAgICAgICAkdGhpcy5hdHRyKCAnaWQnLCAkdGhpcy5hdHRyKCAnaWQnICkgKyAnX2Nsb25lJyApO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuICRjbG9uZTtcbiAgICAgIH0sXG4gICAgICBwYXVzZUludmlzaWJsZToge1xuICAgICAgICB2aXNQcm9wOiBudWxsLFxuICAgICAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgdmlzUHJvcCA9IG1ldGhvZHMucGF1c2VJbnZpc2libGUuZ2V0SGlkZGVuUHJvcCgpO1xuICAgICAgICAgIGlmICh2aXNQcm9wKSB7XG4gICAgICAgICAgICB2YXIgZXZ0bmFtZSA9IHZpc1Byb3AucmVwbGFjZSgvW0h8aF1pZGRlbi8sJycpICsgJ3Zpc2liaWxpdHljaGFuZ2UnO1xuICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldnRuYW1lLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgaWYgKG1ldGhvZHMucGF1c2VJbnZpc2libGUuaXNIaWRkZW4oKSkge1xuICAgICAgICAgICAgICAgIGlmKHNsaWRlci5zdGFydFRpbWVvdXQpIHtcbiAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChzbGlkZXIuc3RhcnRUaW1lb3V0KTsgLy9JZiBjbG9jayBpcyB0aWNraW5nLCBzdG9wIHRpbWVyIGFuZCBwcmV2ZW50IGZyb20gc3RhcnRpbmcgd2hpbGUgaW52aXNpYmxlXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHNsaWRlci5wYXVzZSgpOyAvL09yIGp1c3QgcGF1c2VcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYoc2xpZGVyLnN0YXJ0ZWQpIHtcbiAgICAgICAgICAgICAgICAgIHNsaWRlci5wbGF5KCk7IC8vSW5pdGlhdGVkIGJlZm9yZSwganVzdCBwbGF5XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIGlmIChzbGlkZXIudmFycy5pbml0RGVsYXkgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoc2xpZGVyLnBsYXksIHNsaWRlci52YXJzLmluaXREZWxheSk7XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzbGlkZXIucGxheSgpOyAvL0RpZG4ndCBpbml0IGJlZm9yZTogc2ltcGx5IGluaXQgb3Igd2FpdCBmb3IgaXRcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgaXNIaWRkZW46IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBwcm9wID0gbWV0aG9kcy5wYXVzZUludmlzaWJsZS5nZXRIaWRkZW5Qcm9wKCk7XG4gICAgICAgICAgaWYgKCFwcm9wKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBkb2N1bWVudFtwcm9wXTtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0SGlkZGVuUHJvcDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIHByZWZpeGVzID0gWyd3ZWJraXQnLCdtb3onLCdtcycsJ28nXTtcbiAgICAgICAgICAvLyBpZiAnaGlkZGVuJyBpcyBuYXRpdmVseSBzdXBwb3J0ZWQganVzdCByZXR1cm4gaXRcbiAgICAgICAgICBpZiAoJ2hpZGRlbicgaW4gZG9jdW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybiAnaGlkZGVuJztcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gb3RoZXJ3aXNlIGxvb3Agb3ZlciBhbGwgdGhlIGtub3duIHByZWZpeGVzIHVudGlsIHdlIGZpbmQgb25lXG4gICAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgcHJlZml4ZXMubGVuZ3RoOyBpKysgKSB7XG4gICAgICAgICAgICAgIGlmICgocHJlZml4ZXNbaV0gKyAnSGlkZGVuJykgaW4gZG9jdW1lbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJlZml4ZXNbaV0gKyAnSGlkZGVuJztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBvdGhlcndpc2UgaXQncyBub3Qgc3VwcG9ydGVkXG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBzZXRUb0NsZWFyV2F0Y2hlZEV2ZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHdhdGNoZWRFdmVudENsZWFyVGltZXIpO1xuICAgICAgICB3YXRjaGVkRXZlbnRDbGVhclRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICB3YXRjaGVkRXZlbnQgPSBcIlwiO1xuICAgICAgICB9LCAzMDAwKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gcHVibGljIG1ldGhvZHNcbiAgICBzbGlkZXIuZmxleEFuaW1hdGUgPSBmdW5jdGlvbih0YXJnZXQsIHBhdXNlLCBvdmVycmlkZSwgd2l0aFN5bmMsIGZyb21OYXYpIHtcbiAgICAgIGlmICghc2xpZGVyLnZhcnMuYW5pbWF0aW9uTG9vcCAmJiB0YXJnZXQgIT09IHNsaWRlci5jdXJyZW50U2xpZGUpIHtcbiAgICAgICAgc2xpZGVyLmRpcmVjdGlvbiA9ICh0YXJnZXQgPiBzbGlkZXIuY3VycmVudFNsaWRlKSA/IFwibmV4dFwiIDogXCJwcmV2XCI7XG4gICAgICB9XG5cbiAgICAgIGlmIChhc05hdiAmJiBzbGlkZXIucGFnaW5nQ291bnQgPT09IDEpIHNsaWRlci5kaXJlY3Rpb24gPSAoc2xpZGVyLmN1cnJlbnRJdGVtIDwgdGFyZ2V0KSA/IFwibmV4dFwiIDogXCJwcmV2XCI7XG5cbiAgICAgIGlmICghc2xpZGVyLmFuaW1hdGluZyAmJiAoc2xpZGVyLmNhbkFkdmFuY2UodGFyZ2V0LCBmcm9tTmF2KSB8fCBvdmVycmlkZSkgJiYgc2xpZGVyLmlzKFwiOnZpc2libGVcIikpIHtcbiAgICAgICAgaWYgKGFzTmF2ICYmIHdpdGhTeW5jKSB7XG4gICAgICAgICAgdmFyIG1hc3RlciA9ICQoc2xpZGVyLnZhcnMuYXNOYXZGb3IpLmRhdGEoJ2ZsZXhzbGlkZXInKTtcbiAgICAgICAgICBzbGlkZXIuYXRFbmQgPSB0YXJnZXQgPT09IDAgfHwgdGFyZ2V0ID09PSBzbGlkZXIuY291bnQgLSAxO1xuICAgICAgICAgIG1hc3Rlci5mbGV4QW5pbWF0ZSh0YXJnZXQsIHRydWUsIGZhbHNlLCB0cnVlLCBmcm9tTmF2KTtcbiAgICAgICAgICBzbGlkZXIuZGlyZWN0aW9uID0gKHNsaWRlci5jdXJyZW50SXRlbSA8IHRhcmdldCkgPyBcIm5leHRcIiA6IFwicHJldlwiO1xuICAgICAgICAgIG1hc3Rlci5kaXJlY3Rpb24gPSBzbGlkZXIuZGlyZWN0aW9uO1xuXG4gICAgICAgICAgaWYgKE1hdGguY2VpbCgodGFyZ2V0ICsgMSkvc2xpZGVyLnZpc2libGUpIC0gMSAhPT0gc2xpZGVyLmN1cnJlbnRTbGlkZSAmJiB0YXJnZXQgIT09IDApIHtcbiAgICAgICAgICAgIHNsaWRlci5jdXJyZW50SXRlbSA9IHRhcmdldDtcbiAgICAgICAgICAgIHNsaWRlci5zbGlkZXMucmVtb3ZlQ2xhc3MobmFtZXNwYWNlICsgXCJhY3RpdmUtc2xpZGVcIikuZXEodGFyZ2V0KS5hZGRDbGFzcyhuYW1lc3BhY2UgKyBcImFjdGl2ZS1zbGlkZVwiKTtcbiAgICAgICAgICAgIHRhcmdldCA9IE1hdGguZmxvb3IodGFyZ2V0L3NsaWRlci52aXNpYmxlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2xpZGVyLmN1cnJlbnRJdGVtID0gdGFyZ2V0O1xuICAgICAgICAgICAgc2xpZGVyLnNsaWRlcy5yZW1vdmVDbGFzcyhuYW1lc3BhY2UgKyBcImFjdGl2ZS1zbGlkZVwiKS5lcSh0YXJnZXQpLmFkZENsYXNzKG5hbWVzcGFjZSArIFwiYWN0aXZlLXNsaWRlXCIpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHNsaWRlci5hbmltYXRpbmcgPSB0cnVlO1xuICAgICAgICBzbGlkZXIuYW5pbWF0aW5nVG8gPSB0YXJnZXQ7XG5cbiAgICAgICAgLy8gU0xJREVTSE9XOlxuICAgICAgICBpZiAocGF1c2UpIHsgc2xpZGVyLnBhdXNlKCk7IH1cblxuICAgICAgICAvLyBBUEk6IGJlZm9yZSgpIGFuaW1hdGlvbiBDYWxsYmFja1xuICAgICAgICBzbGlkZXIudmFycy5iZWZvcmUoc2xpZGVyKTtcblxuICAgICAgICAvLyBTWU5DOlxuICAgICAgICBpZiAoc2xpZGVyLnN5bmNFeGlzdHMgJiYgIWZyb21OYXYpIHsgbWV0aG9kcy5zeW5jKFwiYW5pbWF0ZVwiKTsgfVxuXG4gICAgICAgIC8vIENPTlRST0xOQVZcbiAgICAgICAgaWYgKHNsaWRlci52YXJzLmNvbnRyb2xOYXYpIHsgbWV0aG9kcy5jb250cm9sTmF2LmFjdGl2ZSgpOyB9XG5cbiAgICAgICAgLy8gIUNBUk9VU0VMOlxuICAgICAgICAvLyBDQU5ESURBVEU6IHNsaWRlIGFjdGl2ZSBjbGFzcyAoZm9yIGFkZC9yZW1vdmUgc2xpZGUpXG4gICAgICAgIGlmICghY2Fyb3VzZWwpIHsgc2xpZGVyLnNsaWRlcy5yZW1vdmVDbGFzcyhuYW1lc3BhY2UgKyAnYWN0aXZlLXNsaWRlJykuZXEodGFyZ2V0KS5hZGRDbGFzcyhuYW1lc3BhY2UgKyAnYWN0aXZlLXNsaWRlJyk7IH1cblxuICAgICAgICAvLyBJTkZJTklURSBMT09QOlxuICAgICAgICAvLyBDQU5ESURBVEU6IGF0RW5kXG4gICAgICAgIHNsaWRlci5hdEVuZCA9IHRhcmdldCA9PT0gMCB8fCB0YXJnZXQgPT09IHNsaWRlci5sYXN0O1xuXG4gICAgICAgIC8vIERJUkVDVElPTk5BVjpcbiAgICAgICAgaWYgKHNsaWRlci52YXJzLmRpcmVjdGlvbk5hdikgeyBtZXRob2RzLmRpcmVjdGlvbk5hdi51cGRhdGUoKTsgfVxuXG4gICAgICAgIGlmICh0YXJnZXQgPT09IHNsaWRlci5sYXN0KSB7XG4gICAgICAgICAgLy8gQVBJOiBlbmQoKSBvZiBjeWNsZSBDYWxsYmFja1xuICAgICAgICAgIHNsaWRlci52YXJzLmVuZChzbGlkZXIpO1xuICAgICAgICAgIC8vIFNMSURFU0hPVyAmJiAhSU5GSU5JVEUgTE9PUDpcbiAgICAgICAgICBpZiAoIXNsaWRlci52YXJzLmFuaW1hdGlvbkxvb3ApIHsgc2xpZGVyLnBhdXNlKCk7IH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNMSURFOlxuICAgICAgICBpZiAoIWZhZGUpIHtcbiAgICAgICAgICB2YXIgZGltZW5zaW9uID0gKHZlcnRpY2FsKSA/IHNsaWRlci5zbGlkZXMuZmlsdGVyKCc6Zmlyc3QnKS5oZWlnaHQoKSA6IHNsaWRlci5jb21wdXRlZFcsXG4gICAgICAgICAgICAgIG1hcmdpbiwgc2xpZGVTdHJpbmcsIGNhbGNOZXh0O1xuXG4gICAgICAgICAgLy8gSU5GSU5JVEUgTE9PUCAvIFJFVkVSU0U6XG4gICAgICAgICAgaWYgKGNhcm91c2VsKSB7XG4gICAgICAgICAgICBtYXJnaW4gPSBzbGlkZXIudmFycy5pdGVtTWFyZ2luO1xuICAgICAgICAgICAgY2FsY05leHQgPSAoKHNsaWRlci5pdGVtVyArIG1hcmdpbikgKiBzbGlkZXIubW92ZSkgKiBzbGlkZXIuYW5pbWF0aW5nVG87XG4gICAgICAgICAgICBzbGlkZVN0cmluZyA9IChjYWxjTmV4dCA+IHNsaWRlci5saW1pdCAmJiBzbGlkZXIudmlzaWJsZSAhPT0gMSkgPyBzbGlkZXIubGltaXQgOiBjYWxjTmV4dDtcbiAgICAgICAgICB9IGVsc2UgaWYgKHNsaWRlci5jdXJyZW50U2xpZGUgPT09IDAgJiYgdGFyZ2V0ID09PSBzbGlkZXIuY291bnQgLSAxICYmIHNsaWRlci52YXJzLmFuaW1hdGlvbkxvb3AgJiYgc2xpZGVyLmRpcmVjdGlvbiAhPT0gXCJuZXh0XCIpIHtcbiAgICAgICAgICAgIHNsaWRlU3RyaW5nID0gKHJldmVyc2UpID8gKHNsaWRlci5jb3VudCArIHNsaWRlci5jbG9uZU9mZnNldCkgKiBkaW1lbnNpb24gOiAwO1xuICAgICAgICAgIH0gZWxzZSBpZiAoc2xpZGVyLmN1cnJlbnRTbGlkZSA9PT0gc2xpZGVyLmxhc3QgJiYgdGFyZ2V0ID09PSAwICYmIHNsaWRlci52YXJzLmFuaW1hdGlvbkxvb3AgJiYgc2xpZGVyLmRpcmVjdGlvbiAhPT0gXCJwcmV2XCIpIHtcbiAgICAgICAgICAgIHNsaWRlU3RyaW5nID0gKHJldmVyc2UpID8gMCA6IChzbGlkZXIuY291bnQgKyAxKSAqIGRpbWVuc2lvbjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2xpZGVTdHJpbmcgPSAocmV2ZXJzZSkgPyAoKHNsaWRlci5jb3VudCAtIDEpIC0gdGFyZ2V0ICsgc2xpZGVyLmNsb25lT2Zmc2V0KSAqIGRpbWVuc2lvbiA6ICh0YXJnZXQgKyBzbGlkZXIuY2xvbmVPZmZzZXQpICogZGltZW5zaW9uO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzbGlkZXIuc2V0UHJvcHMoc2xpZGVTdHJpbmcsIFwiXCIsIHNsaWRlci52YXJzLmFuaW1hdGlvblNwZWVkKTtcbiAgICAgICAgICBpZiAoc2xpZGVyLnRyYW5zaXRpb25zKSB7XG4gICAgICAgICAgICBpZiAoIXNsaWRlci52YXJzLmFuaW1hdGlvbkxvb3AgfHwgIXNsaWRlci5hdEVuZCkge1xuICAgICAgICAgICAgICBzbGlkZXIuYW5pbWF0aW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgIHNsaWRlci5jdXJyZW50U2xpZGUgPSBzbGlkZXIuYW5pbWF0aW5nVG87XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFVuYmluZCBwcmV2aW91cyB0cmFuc2l0aW9uRW5kIGV2ZW50cyBhbmQgcmUtYmluZCBuZXcgdHJhbnNpdGlvbkVuZCBldmVudFxuICAgICAgICAgICAgc2xpZGVyLmNvbnRhaW5lci51bmJpbmQoXCJ3ZWJraXRUcmFuc2l0aW9uRW5kIHRyYW5zaXRpb25lbmRcIik7XG4gICAgICAgICAgICBzbGlkZXIuY29udGFpbmVyLmJpbmQoXCJ3ZWJraXRUcmFuc2l0aW9uRW5kIHRyYW5zaXRpb25lbmRcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIGNsZWFyVGltZW91dChzbGlkZXIuZW5zdXJlQW5pbWF0aW9uRW5kKTtcbiAgICAgICAgICAgICAgc2xpZGVyLndyYXB1cChkaW1lbnNpb24pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIEluc3VyYW5jZSBmb3IgdGhlIGV2ZXItc28tZmlja2xlIHRyYW5zaXRpb25FbmQgZXZlbnRcbiAgICAgICAgICAgIGNsZWFyVGltZW91dChzbGlkZXIuZW5zdXJlQW5pbWF0aW9uRW5kKTtcbiAgICAgICAgICAgIHNsaWRlci5lbnN1cmVBbmltYXRpb25FbmQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICBzbGlkZXIud3JhcHVwKGRpbWVuc2lvbik7XG4gICAgICAgICAgICB9LCBzbGlkZXIudmFycy5hbmltYXRpb25TcGVlZCArIDEwMCk7XG5cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2xpZGVyLmNvbnRhaW5lci5hbmltYXRlKHNsaWRlci5hcmdzLCBzbGlkZXIudmFycy5hbmltYXRpb25TcGVlZCwgc2xpZGVyLnZhcnMuZWFzaW5nLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICBzbGlkZXIud3JhcHVwKGRpbWVuc2lvbik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7IC8vIEZBREU6XG4gICAgICAgICAgaWYgKCF0b3VjaCkge1xuICAgICAgICAgICAgc2xpZGVyLnNsaWRlcy5lcShzbGlkZXIuY3VycmVudFNsaWRlKS5jc3Moe1wiekluZGV4XCI6IDF9KS5hbmltYXRlKHtcIm9wYWNpdHlcIjogMH0sIHNsaWRlci52YXJzLmFuaW1hdGlvblNwZWVkLCBzbGlkZXIudmFycy5lYXNpbmcpO1xuICAgICAgICAgICAgc2xpZGVyLnNsaWRlcy5lcSh0YXJnZXQpLmNzcyh7XCJ6SW5kZXhcIjogMn0pLmFuaW1hdGUoe1wib3BhY2l0eVwiOiAxfSwgc2xpZGVyLnZhcnMuYW5pbWF0aW9uU3BlZWQsIHNsaWRlci52YXJzLmVhc2luZywgc2xpZGVyLndyYXB1cCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNsaWRlci5zbGlkZXMuZXEoc2xpZGVyLmN1cnJlbnRTbGlkZSkuY3NzKHsgXCJvcGFjaXR5XCI6IDAsIFwiekluZGV4XCI6IDEgfSk7XG4gICAgICAgICAgICBzbGlkZXIuc2xpZGVzLmVxKHRhcmdldCkuY3NzKHsgXCJvcGFjaXR5XCI6IDEsIFwiekluZGV4XCI6IDIgfSk7XG4gICAgICAgICAgICBzbGlkZXIud3JhcHVwKGRpbWVuc2lvbik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIFNNT09USCBIRUlHSFQ6XG4gICAgICAgIGlmIChzbGlkZXIudmFycy5zbW9vdGhIZWlnaHQpIHsgbWV0aG9kcy5zbW9vdGhIZWlnaHQoc2xpZGVyLnZhcnMuYW5pbWF0aW9uU3BlZWQpOyB9XG4gICAgICB9XG4gICAgfTtcbiAgICBzbGlkZXIud3JhcHVwID0gZnVuY3Rpb24oZGltZW5zaW9uKSB7XG4gICAgICAvLyBTTElERTpcbiAgICAgIGlmICghZmFkZSAmJiAhY2Fyb3VzZWwpIHtcbiAgICAgICAgaWYgKHNsaWRlci5jdXJyZW50U2xpZGUgPT09IDAgJiYgc2xpZGVyLmFuaW1hdGluZ1RvID09PSBzbGlkZXIubGFzdCAmJiBzbGlkZXIudmFycy5hbmltYXRpb25Mb29wKSB7XG4gICAgICAgICAgc2xpZGVyLnNldFByb3BzKGRpbWVuc2lvbiwgXCJqdW1wRW5kXCIpO1xuICAgICAgICB9IGVsc2UgaWYgKHNsaWRlci5jdXJyZW50U2xpZGUgPT09IHNsaWRlci5sYXN0ICYmIHNsaWRlci5hbmltYXRpbmdUbyA9PT0gMCAmJiBzbGlkZXIudmFycy5hbmltYXRpb25Mb29wKSB7XG4gICAgICAgICAgc2xpZGVyLnNldFByb3BzKGRpbWVuc2lvbiwgXCJqdW1wU3RhcnRcIik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHNsaWRlci5hbmltYXRpbmcgPSBmYWxzZTtcbiAgICAgIHNsaWRlci5jdXJyZW50U2xpZGUgPSBzbGlkZXIuYW5pbWF0aW5nVG87XG4gICAgICAvLyBBUEk6IGFmdGVyKCkgYW5pbWF0aW9uIENhbGxiYWNrXG4gICAgICBzbGlkZXIudmFycy5hZnRlcihzbGlkZXIpO1xuICAgIH07XG5cbiAgICAvLyBTTElERVNIT1c6XG4gICAgc2xpZGVyLmFuaW1hdGVTbGlkZXMgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmICghc2xpZGVyLmFuaW1hdGluZyAmJiBmb2N1c2VkICkgeyBzbGlkZXIuZmxleEFuaW1hdGUoc2xpZGVyLmdldFRhcmdldChcIm5leHRcIikpOyB9XG4gICAgfTtcbiAgICAvLyBTTElERVNIT1c6XG4gICAgc2xpZGVyLnBhdXNlID0gZnVuY3Rpb24oKSB7XG4gICAgICBjbGVhckludGVydmFsKHNsaWRlci5hbmltYXRlZFNsaWRlcyk7XG4gICAgICBzbGlkZXIuYW5pbWF0ZWRTbGlkZXMgPSBudWxsO1xuICAgICAgc2xpZGVyLnBsYXlpbmcgPSBmYWxzZTtcbiAgICAgIC8vIFBBVVNFUExBWTpcbiAgICAgIGlmIChzbGlkZXIudmFycy5wYXVzZVBsYXkpIHsgbWV0aG9kcy5wYXVzZVBsYXkudXBkYXRlKFwicGxheVwiKTsgfVxuICAgICAgLy8gU1lOQzpcbiAgICAgIGlmIChzbGlkZXIuc3luY0V4aXN0cykgeyBtZXRob2RzLnN5bmMoXCJwYXVzZVwiKTsgfVxuICAgIH07XG4gICAgLy8gU0xJREVTSE9XOlxuICAgIHNsaWRlci5wbGF5ID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoc2xpZGVyLnBsYXlpbmcpIHsgY2xlYXJJbnRlcnZhbChzbGlkZXIuYW5pbWF0ZWRTbGlkZXMpOyB9XG4gICAgICBzbGlkZXIuYW5pbWF0ZWRTbGlkZXMgPSBzbGlkZXIuYW5pbWF0ZWRTbGlkZXMgfHwgc2V0SW50ZXJ2YWwoc2xpZGVyLmFuaW1hdGVTbGlkZXMsIHNsaWRlci52YXJzLnNsaWRlc2hvd1NwZWVkKTtcbiAgICAgIHNsaWRlci5zdGFydGVkID0gc2xpZGVyLnBsYXlpbmcgPSB0cnVlO1xuICAgICAgLy8gUEFVU0VQTEFZOlxuICAgICAgaWYgKHNsaWRlci52YXJzLnBhdXNlUGxheSkgeyBtZXRob2RzLnBhdXNlUGxheS51cGRhdGUoXCJwYXVzZVwiKTsgfVxuICAgICAgLy8gU1lOQzpcbiAgICAgIGlmIChzbGlkZXIuc3luY0V4aXN0cykgeyBtZXRob2RzLnN5bmMoXCJwbGF5XCIpOyB9XG4gICAgfTtcbiAgICAvLyBTVE9QOlxuICAgIHNsaWRlci5zdG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgc2xpZGVyLnBhdXNlKCk7XG4gICAgICBzbGlkZXIuc3RvcHBlZCA9IHRydWU7XG4gICAgfTtcbiAgICBzbGlkZXIuY2FuQWR2YW5jZSA9IGZ1bmN0aW9uKHRhcmdldCwgZnJvbU5hdikge1xuICAgICAgLy8gQVNOQVY6XG4gICAgICB2YXIgbGFzdCA9IChhc05hdikgPyBzbGlkZXIucGFnaW5nQ291bnQgLSAxIDogc2xpZGVyLmxhc3Q7XG4gICAgICByZXR1cm4gKGZyb21OYXYpID8gdHJ1ZSA6XG4gICAgICAgICAgICAgKGFzTmF2ICYmIHNsaWRlci5jdXJyZW50SXRlbSA9PT0gc2xpZGVyLmNvdW50IC0gMSAmJiB0YXJnZXQgPT09IDAgJiYgc2xpZGVyLmRpcmVjdGlvbiA9PT0gXCJwcmV2XCIpID8gdHJ1ZSA6XG4gICAgICAgICAgICAgKGFzTmF2ICYmIHNsaWRlci5jdXJyZW50SXRlbSA9PT0gMCAmJiB0YXJnZXQgPT09IHNsaWRlci5wYWdpbmdDb3VudCAtIDEgJiYgc2xpZGVyLmRpcmVjdGlvbiAhPT0gXCJuZXh0XCIpID8gZmFsc2UgOlxuICAgICAgICAgICAgICh0YXJnZXQgPT09IHNsaWRlci5jdXJyZW50U2xpZGUgJiYgIWFzTmF2KSA/IGZhbHNlIDpcbiAgICAgICAgICAgICAoc2xpZGVyLnZhcnMuYW5pbWF0aW9uTG9vcCkgPyB0cnVlIDpcbiAgICAgICAgICAgICAoc2xpZGVyLmF0RW5kICYmIHNsaWRlci5jdXJyZW50U2xpZGUgPT09IDAgJiYgdGFyZ2V0ID09PSBsYXN0ICYmIHNsaWRlci5kaXJlY3Rpb24gIT09IFwibmV4dFwiKSA/IGZhbHNlIDpcbiAgICAgICAgICAgICAoc2xpZGVyLmF0RW5kICYmIHNsaWRlci5jdXJyZW50U2xpZGUgPT09IGxhc3QgJiYgdGFyZ2V0ID09PSAwICYmIHNsaWRlci5kaXJlY3Rpb24gPT09IFwibmV4dFwiKSA/IGZhbHNlIDpcbiAgICAgICAgICAgICB0cnVlO1xuICAgIH07XG4gICAgc2xpZGVyLmdldFRhcmdldCA9IGZ1bmN0aW9uKGRpcikge1xuICAgICAgc2xpZGVyLmRpcmVjdGlvbiA9IGRpcjtcbiAgICAgIGlmIChkaXIgPT09IFwibmV4dFwiKSB7XG4gICAgICAgIHJldHVybiAoc2xpZGVyLmN1cnJlbnRTbGlkZSA9PT0gc2xpZGVyLmxhc3QpID8gMCA6IHNsaWRlci5jdXJyZW50U2xpZGUgKyAxO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIChzbGlkZXIuY3VycmVudFNsaWRlID09PSAwKSA/IHNsaWRlci5sYXN0IDogc2xpZGVyLmN1cnJlbnRTbGlkZSAtIDE7XG4gICAgICB9XG4gICAgfTtcblxuICAgIC8vIFNMSURFOlxuICAgIHNsaWRlci5zZXRQcm9wcyA9IGZ1bmN0aW9uKHBvcywgc3BlY2lhbCwgZHVyKSB7XG4gICAgICB2YXIgdGFyZ2V0ID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcG9zQ2hlY2sgPSAocG9zKSA/IHBvcyA6ICgoc2xpZGVyLml0ZW1XICsgc2xpZGVyLnZhcnMuaXRlbU1hcmdpbikgKiBzbGlkZXIubW92ZSkgKiBzbGlkZXIuYW5pbWF0aW5nVG8sXG4gICAgICAgICAgICBwb3NDYWxjID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICBpZiAoY2Fyb3VzZWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHNwZWNpYWwgPT09IFwic2V0VG91Y2hcIikgPyBwb3MgOlxuICAgICAgICAgICAgICAgICAgICAgICAocmV2ZXJzZSAmJiBzbGlkZXIuYW5pbWF0aW5nVG8gPT09IHNsaWRlci5sYXN0KSA/IDAgOlxuICAgICAgICAgICAgICAgICAgICAgICAocmV2ZXJzZSkgPyBzbGlkZXIubGltaXQgLSAoKChzbGlkZXIuaXRlbVcgKyBzbGlkZXIudmFycy5pdGVtTWFyZ2luKSAqIHNsaWRlci5tb3ZlKSAqIHNsaWRlci5hbmltYXRpbmdUbykgOlxuICAgICAgICAgICAgICAgICAgICAgICAoc2xpZGVyLmFuaW1hdGluZ1RvID09PSBzbGlkZXIubGFzdCkgPyBzbGlkZXIubGltaXQgOiBwb3NDaGVjaztcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHNwZWNpYWwpIHtcbiAgICAgICAgICAgICAgICAgIGNhc2UgXCJzZXRUb3RhbFwiOiByZXR1cm4gKHJldmVyc2UpID8gKChzbGlkZXIuY291bnQgLSAxKSAtIHNsaWRlci5jdXJyZW50U2xpZGUgKyBzbGlkZXIuY2xvbmVPZmZzZXQpICogcG9zIDogKHNsaWRlci5jdXJyZW50U2xpZGUgKyBzbGlkZXIuY2xvbmVPZmZzZXQpICogcG9zO1xuICAgICAgICAgICAgICAgICAgY2FzZSBcInNldFRvdWNoXCI6IHJldHVybiAocmV2ZXJzZSkgPyBwb3MgOiBwb3M7XG4gICAgICAgICAgICAgICAgICBjYXNlIFwianVtcEVuZFwiOiByZXR1cm4gKHJldmVyc2UpID8gcG9zIDogc2xpZGVyLmNvdW50ICogcG9zO1xuICAgICAgICAgICAgICAgICAgY2FzZSBcImp1bXBTdGFydFwiOiByZXR1cm4gKHJldmVyc2UpID8gc2xpZGVyLmNvdW50ICogcG9zIDogcG9zO1xuICAgICAgICAgICAgICAgICAgZGVmYXVsdDogcmV0dXJuIHBvcztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0oKSk7XG5cbiAgICAgICAgICAgIHJldHVybiAocG9zQ2FsYyAqICgoc2xpZGVyLnZhcnMucnRsKT8xOi0xKSkgKyBcInB4XCI7XG4gICAgICAgICAgfSgpKTtcblxuICAgICAgaWYgKHNsaWRlci50cmFuc2l0aW9ucykge1xuICAgICAgICB0YXJnZXQgPSAodmVydGljYWwpID8gXCJ0cmFuc2xhdGUzZCgwLFwiICsgdGFyZ2V0ICsgXCIsMClcIiA6IFwidHJhbnNsYXRlM2QoXCIgKyAoKHNsaWRlci52YXJzLnJ0bD8tMToxKSpwYXJzZUludCh0YXJnZXQpKydweCcpICsgXCIsMCwwKVwiO1xuICAgICAgICBkdXIgPSAoZHVyICE9PSB1bmRlZmluZWQpID8gKGR1ci8xMDAwKSArIFwic1wiIDogXCIwc1wiO1xuICAgICAgICBzbGlkZXIuY29udGFpbmVyLmNzcyhcIi1cIiArIHNsaWRlci5wZnggKyBcIi10cmFuc2l0aW9uLWR1cmF0aW9uXCIsIGR1cik7XG4gICAgICAgICBzbGlkZXIuY29udGFpbmVyLmNzcyhcInRyYW5zaXRpb24tZHVyYXRpb25cIiwgZHVyKTtcbiAgICAgIH1cblxuICAgICAgc2xpZGVyLmFyZ3Nbc2xpZGVyLnByb3BdID0gdGFyZ2V0O1xuICAgICAgaWYgKHNsaWRlci50cmFuc2l0aW9ucyB8fCBkdXIgPT09IHVuZGVmaW5lZCkgeyBzbGlkZXIuY29udGFpbmVyLmNzcyhzbGlkZXIuYXJncyk7IH1cblxuICAgICAgc2xpZGVyLmNvbnRhaW5lci5jc3MoJ3RyYW5zZm9ybScsdGFyZ2V0KTtcbiAgICB9O1xuXG4gICAgc2xpZGVyLnNldHVwID0gZnVuY3Rpb24odHlwZSkge1xuICAgICAgLy8gU0xJREU6XG4gICAgICBpZiAoIWZhZGUpIHtcbiAgICAgICAgdmFyIHNsaWRlck9mZnNldCwgYXJyO1xuXG4gICAgICAgIGlmICh0eXBlID09PSBcImluaXRcIikge1xuICAgICAgICAgIHNsaWRlci52aWV3cG9ydCA9ICQoJzxkaXYgY2xhc3M9XCInICsgbmFtZXNwYWNlICsgJ3ZpZXdwb3J0XCI+PC9kaXY+JykuY3NzKHtcIm92ZXJmbG93XCI6IFwiaGlkZGVuXCIsIFwicG9zaXRpb25cIjogXCJyZWxhdGl2ZVwifSkuYXBwZW5kVG8oc2xpZGVyKS5hcHBlbmQoc2xpZGVyLmNvbnRhaW5lcik7XG4gICAgICAgICAgLy8gSU5GSU5JVEUgTE9PUDpcbiAgICAgICAgICBzbGlkZXIuY2xvbmVDb3VudCA9IDA7XG4gICAgICAgICAgc2xpZGVyLmNsb25lT2Zmc2V0ID0gMDtcbiAgICAgICAgICAvLyBSRVZFUlNFOlxuICAgICAgICAgIGlmIChyZXZlcnNlKSB7XG4gICAgICAgICAgICBhcnIgPSAkLm1ha2VBcnJheShzbGlkZXIuc2xpZGVzKS5yZXZlcnNlKCk7XG4gICAgICAgICAgICBzbGlkZXIuc2xpZGVzID0gJChhcnIpO1xuICAgICAgICAgICAgc2xpZGVyLmNvbnRhaW5lci5lbXB0eSgpLmFwcGVuZChzbGlkZXIuc2xpZGVzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gSU5GSU5JVEUgTE9PUCAmJiAhQ0FST1VTRUw6XG4gICAgICAgIGlmIChzbGlkZXIudmFycy5hbmltYXRpb25Mb29wICYmICFjYXJvdXNlbCkge1xuICAgICAgICAgIHNsaWRlci5jbG9uZUNvdW50ID0gMjtcbiAgICAgICAgICBzbGlkZXIuY2xvbmVPZmZzZXQgPSAxO1xuICAgICAgICAgIC8vIGNsZWFyIG91dCBvbGQgY2xvbmVzXG4gICAgICAgICAgaWYgKHR5cGUgIT09IFwiaW5pdFwiKSB7IHNsaWRlci5jb250YWluZXIuZmluZCgnLmNsb25lJykucmVtb3ZlKCk7IH1cbiAgICAgICAgICBzbGlkZXIuY29udGFpbmVyLmFwcGVuZChtZXRob2RzLnVuaXF1ZUlEKHNsaWRlci5zbGlkZXMuZmlyc3QoKS5jbG9uZSgpLmFkZENsYXNzKCdjbG9uZScpKS5hdHRyKCdhcmlhLWhpZGRlbicsICd0cnVlJykpXG4gICAgICAgICAgICAgICAgICAgICAgICAgIC5wcmVwZW5kKG1ldGhvZHMudW5pcXVlSUQoc2xpZGVyLnNsaWRlcy5sYXN0KCkuY2xvbmUoKS5hZGRDbGFzcygnY2xvbmUnKSkuYXR0cignYXJpYS1oaWRkZW4nLCAndHJ1ZScpKTtcbiAgICAgICAgfVxuICAgICAgICBzbGlkZXIubmV3U2xpZGVzID0gJChzbGlkZXIudmFycy5zZWxlY3Rvciwgc2xpZGVyKTtcblxuICAgICAgICBzbGlkZXJPZmZzZXQgPSAocmV2ZXJzZSkgPyBzbGlkZXIuY291bnQgLSAxIC0gc2xpZGVyLmN1cnJlbnRTbGlkZSArIHNsaWRlci5jbG9uZU9mZnNldCA6IHNsaWRlci5jdXJyZW50U2xpZGUgKyBzbGlkZXIuY2xvbmVPZmZzZXQ7XG4gICAgICAgIC8vIFZFUlRJQ0FMOlxuICAgICAgICBpZiAodmVydGljYWwgJiYgIWNhcm91c2VsKSB7XG4gICAgICAgICAgc2xpZGVyLmNvbnRhaW5lci5oZWlnaHQoKHNsaWRlci5jb3VudCArIHNsaWRlci5jbG9uZUNvdW50KSAqIDIwMCArIFwiJVwiKS5jc3MoXCJwb3NpdGlvblwiLCBcImFic29sdXRlXCIpLndpZHRoKFwiMTAwJVwiKTtcbiAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBzbGlkZXIubmV3U2xpZGVzLmNzcyh7XCJkaXNwbGF5XCI6IFwiYmxvY2tcIn0pO1xuICAgICAgICAgICAgc2xpZGVyLmRvTWF0aCgpO1xuICAgICAgICAgICAgc2xpZGVyLnZpZXdwb3J0LmhlaWdodChzbGlkZXIuaCk7XG4gICAgICAgICAgICBzbGlkZXIuc2V0UHJvcHMoc2xpZGVyT2Zmc2V0ICogc2xpZGVyLmgsIFwiaW5pdFwiKTtcbiAgICAgICAgICB9LCAodHlwZSA9PT0gXCJpbml0XCIpID8gMTAwIDogMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2xpZGVyLmNvbnRhaW5lci53aWR0aCgoc2xpZGVyLmNvdW50ICsgc2xpZGVyLmNsb25lQ291bnQpICogMjAwICsgXCIlXCIpO1xuICAgICAgICAgIHNsaWRlci5zZXRQcm9wcyhzbGlkZXJPZmZzZXQgKiBzbGlkZXIuY29tcHV0ZWRXLCBcImluaXRcIik7XG4gICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgc2xpZGVyLmRvTWF0aCgpO1xuICAgICAgICAgIGlmKHNsaWRlci52YXJzLnJ0bCl7XG4gICAgICAgICAgICAgIHNsaWRlci5uZXdTbGlkZXMuY3NzKHtcIndpZHRoXCI6IHNsaWRlci5jb21wdXRlZFcsIFwibWFyZ2luUmlnaHRcIiA6IHNsaWRlci5jb21wdXRlZE0sIFwiZmxvYXRcIjogXCJsZWZ0XCIsIFwiZGlzcGxheVwiOiBcImJsb2NrXCJ9KTtcbiAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgc2xpZGVyLm5ld1NsaWRlcy5jc3Moe1wid2lkdGhcIjogc2xpZGVyLmNvbXB1dGVkVywgXCJtYXJnaW5SaWdodFwiIDogc2xpZGVyLmNvbXB1dGVkTSwgXCJmbG9hdFwiOiBcImxlZnRcIiwgXCJkaXNwbGF5XCI6IFwiYmxvY2tcIn0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gU01PT1RIIEhFSUdIVDpcbiAgICAgICAgICAgIGlmIChzbGlkZXIudmFycy5zbW9vdGhIZWlnaHQpIHsgbWV0aG9kcy5zbW9vdGhIZWlnaHQoKTsgfVxuICAgICAgICAgIH0sICh0eXBlID09PSBcImluaXRcIikgPyAxMDAgOiAwKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHsgLy8gRkFERTpcbiAgICAgICAgaWYoc2xpZGVyLnZhcnMucnRsKXtcbiAgICAgICAgICBzbGlkZXIuc2xpZGVzLmNzcyh7XCJ3aWR0aFwiOiBcIjEwMCVcIiwgXCJmbG9hdFwiOiAncmlnaHQnLCBcIm1hcmdpbkxlZnRcIjogXCItMTAwJVwiLCBcInBvc2l0aW9uXCI6IFwicmVsYXRpdmVcIn0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2V7XG4gICAgICAgICAgc2xpZGVyLnNsaWRlcy5jc3Moe1wid2lkdGhcIjogXCIxMDAlXCIsIFwiZmxvYXRcIjogJ2xlZnQnLCBcIm1hcmdpblJpZ2h0XCI6IFwiLTEwMCVcIiwgXCJwb3NpdGlvblwiOiBcInJlbGF0aXZlXCJ9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZSA9PT0gXCJpbml0XCIpIHtcbiAgICAgICAgICBpZiAoIXRvdWNoKSB7XG4gICAgICAgICAgICAvL3NsaWRlci5zbGlkZXMuZXEoc2xpZGVyLmN1cnJlbnRTbGlkZSkuZmFkZUluKHNsaWRlci52YXJzLmFuaW1hdGlvblNwZWVkLCBzbGlkZXIudmFycy5lYXNpbmcpO1xuICAgICAgICAgICAgaWYgKHNsaWRlci52YXJzLmZhZGVGaXJzdFNsaWRlID09IGZhbHNlKSB7XG4gICAgICAgICAgICAgIHNsaWRlci5zbGlkZXMuY3NzKHsgXCJvcGFjaXR5XCI6IDAsIFwiZGlzcGxheVwiOiBcImJsb2NrXCIsIFwiekluZGV4XCI6IDEgfSkuZXEoc2xpZGVyLmN1cnJlbnRTbGlkZSkuY3NzKHtcInpJbmRleFwiOiAyfSkuY3NzKHtcIm9wYWNpdHlcIjogMX0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgc2xpZGVyLnNsaWRlcy5jc3MoeyBcIm9wYWNpdHlcIjogMCwgXCJkaXNwbGF5XCI6IFwiYmxvY2tcIiwgXCJ6SW5kZXhcIjogMSB9KS5lcShzbGlkZXIuY3VycmVudFNsaWRlKS5jc3Moe1wiekluZGV4XCI6IDJ9KS5hbmltYXRlKHtcIm9wYWNpdHlcIjogMX0sc2xpZGVyLnZhcnMuYW5pbWF0aW9uU3BlZWQsc2xpZGVyLnZhcnMuZWFzaW5nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2xpZGVyLnNsaWRlcy5jc3MoeyBcIm9wYWNpdHlcIjogMCwgXCJkaXNwbGF5XCI6IFwiYmxvY2tcIiwgXCJ3ZWJraXRUcmFuc2l0aW9uXCI6IFwib3BhY2l0eSBcIiArIHNsaWRlci52YXJzLmFuaW1hdGlvblNwZWVkIC8gMTAwMCArIFwicyBlYXNlXCIsIFwiekluZGV4XCI6IDEgfSkuZXEoc2xpZGVyLmN1cnJlbnRTbGlkZSkuY3NzKHsgXCJvcGFjaXR5XCI6IDEsIFwiekluZGV4XCI6IDJ9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gU01PT1RIIEhFSUdIVDpcbiAgICAgICAgaWYgKHNsaWRlci52YXJzLnNtb290aEhlaWdodCkgeyBtZXRob2RzLnNtb290aEhlaWdodCgpOyB9XG4gICAgICB9XG4gICAgICAvLyAhQ0FST1VTRUw6XG4gICAgICAvLyBDQU5ESURBVEU6IGFjdGl2ZSBzbGlkZVxuICAgICAgaWYgKCFjYXJvdXNlbCkgeyBzbGlkZXIuc2xpZGVzLnJlbW92ZUNsYXNzKG5hbWVzcGFjZSArIFwiYWN0aXZlLXNsaWRlXCIpLmVxKHNsaWRlci5jdXJyZW50U2xpZGUpLmFkZENsYXNzKG5hbWVzcGFjZSArIFwiYWN0aXZlLXNsaWRlXCIpOyB9XG5cbiAgICAgIC8vRmxleFNsaWRlcjogaW5pdCgpIENhbGxiYWNrXG4gICAgICBzbGlkZXIudmFycy5pbml0KHNsaWRlcik7XG4gICAgfTtcblxuICAgIHNsaWRlci5kb01hdGggPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBzbGlkZSA9IHNsaWRlci5zbGlkZXMuZmlyc3QoKSxcbiAgICAgICAgICBzbGlkZU1hcmdpbiA9IHNsaWRlci52YXJzLml0ZW1NYXJnaW4sXG4gICAgICAgICAgbWluSXRlbXMgPSBzbGlkZXIudmFycy5taW5JdGVtcyxcbiAgICAgICAgICBtYXhJdGVtcyA9IHNsaWRlci52YXJzLm1heEl0ZW1zO1xuXG4gICAgICBzbGlkZXIudyA9IChzbGlkZXIudmlld3BvcnQ9PT11bmRlZmluZWQpID8gc2xpZGVyLndpZHRoKCkgOiBzbGlkZXIudmlld3BvcnQud2lkdGgoKTtcbiAgICAgIHNsaWRlci5oID0gc2xpZGUuaGVpZ2h0KCk7XG4gICAgICBzbGlkZXIuYm94UGFkZGluZyA9IHNsaWRlLm91dGVyV2lkdGgoKSAtIHNsaWRlLndpZHRoKCk7XG5cbiAgICAgIC8vIENBUk9VU0VMOlxuICAgICAgaWYgKGNhcm91c2VsKSB7XG4gICAgICAgIHNsaWRlci5pdGVtVCA9IHNsaWRlci52YXJzLml0ZW1XaWR0aCArIHNsaWRlTWFyZ2luO1xuICAgICAgICBzbGlkZXIuaXRlbU0gPSBzbGlkZU1hcmdpbjtcbiAgICAgICAgc2xpZGVyLm1pblcgPSAobWluSXRlbXMpID8gbWluSXRlbXMgKiBzbGlkZXIuaXRlbVQgOiBzbGlkZXIudztcbiAgICAgICAgc2xpZGVyLm1heFcgPSAobWF4SXRlbXMpID8gKG1heEl0ZW1zICogc2xpZGVyLml0ZW1UKSAtIHNsaWRlTWFyZ2luIDogc2xpZGVyLnc7XG4gICAgICAgIHNsaWRlci5pdGVtVyA9IChzbGlkZXIubWluVyA+IHNsaWRlci53KSA/IChzbGlkZXIudyAtIChzbGlkZU1hcmdpbiAqIChtaW5JdGVtcyAtIDEpKSkvbWluSXRlbXMgOlxuICAgICAgICAgICAgICAgICAgICAgICAoc2xpZGVyLm1heFcgPCBzbGlkZXIudykgPyAoc2xpZGVyLncgLSAoc2xpZGVNYXJnaW4gKiAobWF4SXRlbXMgLSAxKSkpL21heEl0ZW1zIDpcbiAgICAgICAgICAgICAgICAgICAgICAgKHNsaWRlci52YXJzLml0ZW1XaWR0aCA+IHNsaWRlci53KSA/IHNsaWRlci53IDogc2xpZGVyLnZhcnMuaXRlbVdpZHRoO1xuXG4gICAgICAgIHNsaWRlci52aXNpYmxlID0gTWF0aC5mbG9vcihzbGlkZXIudy8oc2xpZGVyLml0ZW1XKSk7XG4gICAgICAgIHNsaWRlci5tb3ZlID0gKHNsaWRlci52YXJzLm1vdmUgPiAwICYmIHNsaWRlci52YXJzLm1vdmUgPCBzbGlkZXIudmlzaWJsZSApID8gc2xpZGVyLnZhcnMubW92ZSA6IHNsaWRlci52aXNpYmxlO1xuICAgICAgICBzbGlkZXIucGFnaW5nQ291bnQgPSBNYXRoLmNlaWwoKChzbGlkZXIuY291bnQgLSBzbGlkZXIudmlzaWJsZSkvc2xpZGVyLm1vdmUpICsgMSk7XG4gICAgICAgIHNsaWRlci5sYXN0ID0gIHNsaWRlci5wYWdpbmdDb3VudCAtIDE7XG4gICAgICAgIHNsaWRlci5saW1pdCA9IChzbGlkZXIucGFnaW5nQ291bnQgPT09IDEpID8gMCA6XG4gICAgICAgICAgICAgICAgICAgICAgIChzbGlkZXIudmFycy5pdGVtV2lkdGggPiBzbGlkZXIudykgPyAoc2xpZGVyLml0ZW1XICogKHNsaWRlci5jb3VudCAtIDEpKSArIChzbGlkZU1hcmdpbiAqIChzbGlkZXIuY291bnQgLSAxKSkgOiAoKHNsaWRlci5pdGVtVyArIHNsaWRlTWFyZ2luKSAqIHNsaWRlci5jb3VudCkgLSBzbGlkZXIudyAtIHNsaWRlTWFyZ2luO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2xpZGVyLml0ZW1XID0gc2xpZGVyLnc7XG4gICAgICAgIHNsaWRlci5pdGVtTSA9IHNsaWRlTWFyZ2luO1xuICAgICAgICBzbGlkZXIucGFnaW5nQ291bnQgPSBzbGlkZXIuY291bnQ7XG4gICAgICAgIHNsaWRlci5sYXN0ID0gc2xpZGVyLmNvdW50IC0gMTtcbiAgICAgIH1cbiAgICAgIHNsaWRlci5jb21wdXRlZFcgPSBzbGlkZXIuaXRlbVcgLSBzbGlkZXIuYm94UGFkZGluZztcbiAgICAgIHNsaWRlci5jb21wdXRlZE0gPSBzbGlkZXIuaXRlbU07XG4gICAgfTtcblxuICAgIHNsaWRlci51cGRhdGUgPSBmdW5jdGlvbihwb3MsIGFjdGlvbikge1xuICAgICAgc2xpZGVyLmRvTWF0aCgpO1xuXG4gICAgICAvLyB1cGRhdGUgY3VycmVudFNsaWRlIGFuZCBzbGlkZXIuYW5pbWF0aW5nVG8gaWYgbmVjZXNzYXJ5XG4gICAgICBpZiAoIWNhcm91c2VsKSB7XG4gICAgICAgIGlmIChwb3MgPCBzbGlkZXIuY3VycmVudFNsaWRlKSB7XG4gICAgICAgICAgc2xpZGVyLmN1cnJlbnRTbGlkZSArPSAxO1xuICAgICAgICB9IGVsc2UgaWYgKHBvcyA8PSBzbGlkZXIuY3VycmVudFNsaWRlICYmIHBvcyAhPT0gMCkge1xuICAgICAgICAgIHNsaWRlci5jdXJyZW50U2xpZGUgLT0gMTtcbiAgICAgICAgfVxuICAgICAgICBzbGlkZXIuYW5pbWF0aW5nVG8gPSBzbGlkZXIuY3VycmVudFNsaWRlO1xuICAgICAgfVxuXG4gICAgICAvLyB1cGRhdGUgY29udHJvbE5hdlxuICAgICAgaWYgKHNsaWRlci52YXJzLmNvbnRyb2xOYXYgJiYgIXNsaWRlci5tYW51YWxDb250cm9scykge1xuICAgICAgICBpZiAoKGFjdGlvbiA9PT0gXCJhZGRcIiAmJiAhY2Fyb3VzZWwpIHx8IHNsaWRlci5wYWdpbmdDb3VudCA+IHNsaWRlci5jb250cm9sTmF2Lmxlbmd0aCkge1xuICAgICAgICAgIG1ldGhvZHMuY29udHJvbE5hdi51cGRhdGUoXCJhZGRcIik7XG4gICAgICAgIH0gZWxzZSBpZiAoKGFjdGlvbiA9PT0gXCJyZW1vdmVcIiAmJiAhY2Fyb3VzZWwpIHx8IHNsaWRlci5wYWdpbmdDb3VudCA8IHNsaWRlci5jb250cm9sTmF2Lmxlbmd0aCkge1xuICAgICAgICAgIGlmIChjYXJvdXNlbCAmJiBzbGlkZXIuY3VycmVudFNsaWRlID4gc2xpZGVyLmxhc3QpIHtcbiAgICAgICAgICAgIHNsaWRlci5jdXJyZW50U2xpZGUgLT0gMTtcbiAgICAgICAgICAgIHNsaWRlci5hbmltYXRpbmdUbyAtPSAxO1xuICAgICAgICAgIH1cbiAgICAgICAgICBtZXRob2RzLmNvbnRyb2xOYXYudXBkYXRlKFwicmVtb3ZlXCIsIHNsaWRlci5sYXN0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gdXBkYXRlIGRpcmVjdGlvbk5hdlxuICAgICAgaWYgKHNsaWRlci52YXJzLmRpcmVjdGlvbk5hdikgeyBtZXRob2RzLmRpcmVjdGlvbk5hdi51cGRhdGUoKTsgfVxuXG4gICAgfTtcblxuICAgIHNsaWRlci5hZGRTbGlkZSA9IGZ1bmN0aW9uKG9iaiwgcG9zKSB7XG4gICAgICB2YXIgJG9iaiA9ICQob2JqKTtcblxuICAgICAgc2xpZGVyLmNvdW50ICs9IDE7XG4gICAgICBzbGlkZXIubGFzdCA9IHNsaWRlci5jb3VudCAtIDE7XG5cbiAgICAgIC8vIGFwcGVuZCBuZXcgc2xpZGVcbiAgICAgIGlmICh2ZXJ0aWNhbCAmJiByZXZlcnNlKSB7XG4gICAgICAgIChwb3MgIT09IHVuZGVmaW5lZCkgPyBzbGlkZXIuc2xpZGVzLmVxKHNsaWRlci5jb3VudCAtIHBvcykuYWZ0ZXIoJG9iaikgOiBzbGlkZXIuY29udGFpbmVyLnByZXBlbmQoJG9iaik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAocG9zICE9PSB1bmRlZmluZWQpID8gc2xpZGVyLnNsaWRlcy5lcShwb3MpLmJlZm9yZSgkb2JqKSA6IHNsaWRlci5jb250YWluZXIuYXBwZW5kKCRvYmopO1xuICAgICAgfVxuXG4gICAgICAvLyB1cGRhdGUgY3VycmVudFNsaWRlLCBhbmltYXRpbmdUbywgY29udHJvbE5hdiwgYW5kIGRpcmVjdGlvbk5hdlxuICAgICAgc2xpZGVyLnVwZGF0ZShwb3MsIFwiYWRkXCIpO1xuXG4gICAgICAvLyB1cGRhdGUgc2xpZGVyLnNsaWRlc1xuICAgICAgc2xpZGVyLnNsaWRlcyA9ICQoc2xpZGVyLnZhcnMuc2VsZWN0b3IgKyAnOm5vdCguY2xvbmUpJywgc2xpZGVyKTtcbiAgICAgIC8vIHJlLXNldHVwIHRoZSBzbGlkZXIgdG8gYWNjb21kYXRlIG5ldyBzbGlkZVxuICAgICAgc2xpZGVyLnNldHVwKCk7XG5cbiAgICAgIC8vRmxleFNsaWRlcjogYWRkZWQoKSBDYWxsYmFja1xuICAgICAgc2xpZGVyLnZhcnMuYWRkZWQoc2xpZGVyKTtcbiAgICB9O1xuICAgIHNsaWRlci5yZW1vdmVTbGlkZSA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgdmFyIHBvcyA9IChpc05hTihvYmopKSA/IHNsaWRlci5zbGlkZXMuaW5kZXgoJChvYmopKSA6IG9iajtcblxuICAgICAgLy8gdXBkYXRlIGNvdW50XG4gICAgICBzbGlkZXIuY291bnQgLT0gMTtcbiAgICAgIHNsaWRlci5sYXN0ID0gc2xpZGVyLmNvdW50IC0gMTtcblxuICAgICAgLy8gcmVtb3ZlIHNsaWRlXG4gICAgICBpZiAoaXNOYU4ob2JqKSkge1xuICAgICAgICAkKG9iaiwgc2xpZGVyLnNsaWRlcykucmVtb3ZlKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAodmVydGljYWwgJiYgcmV2ZXJzZSkgPyBzbGlkZXIuc2xpZGVzLmVxKHNsaWRlci5sYXN0KS5yZW1vdmUoKSA6IHNsaWRlci5zbGlkZXMuZXEob2JqKS5yZW1vdmUoKTtcbiAgICAgIH1cblxuICAgICAgLy8gdXBkYXRlIGN1cnJlbnRTbGlkZSwgYW5pbWF0aW5nVG8sIGNvbnRyb2xOYXYsIGFuZCBkaXJlY3Rpb25OYXZcbiAgICAgIHNsaWRlci5kb01hdGgoKTtcbiAgICAgIHNsaWRlci51cGRhdGUocG9zLCBcInJlbW92ZVwiKTtcblxuICAgICAgLy8gdXBkYXRlIHNsaWRlci5zbGlkZXNcbiAgICAgIHNsaWRlci5zbGlkZXMgPSAkKHNsaWRlci52YXJzLnNlbGVjdG9yICsgJzpub3QoLmNsb25lKScsIHNsaWRlcik7XG4gICAgICAvLyByZS1zZXR1cCB0aGUgc2xpZGVyIHRvIGFjY29tZGF0ZSBuZXcgc2xpZGVcbiAgICAgIHNsaWRlci5zZXR1cCgpO1xuXG4gICAgICAvLyBGbGV4U2xpZGVyOiByZW1vdmVkKCkgQ2FsbGJhY2tcbiAgICAgIHNsaWRlci52YXJzLnJlbW92ZWQoc2xpZGVyKTtcbiAgICB9O1xuXG4gICAgLy9GbGV4U2xpZGVyOiBJbml0aWFsaXplXG4gICAgbWV0aG9kcy5pbml0KCk7XG4gIH07XG5cbiAgLy8gRW5zdXJlIHRoZSBzbGlkZXIgaXNuJ3QgZm9jdXNzZWQgaWYgdGhlIHdpbmRvdyBsb3NlcyBmb2N1cy5cbiAgJCggd2luZG93ICkuYmx1ciggZnVuY3Rpb24gKCBlICkge1xuICAgIGZvY3VzZWQgPSBmYWxzZTtcbiAgfSkuZm9jdXMoIGZ1bmN0aW9uICggZSApIHtcbiAgICBmb2N1c2VkID0gdHJ1ZTtcbiAgfSk7XG5cbiAgLy9GbGV4U2xpZGVyOiBEZWZhdWx0IFNldHRpbmdzXG4gICQuZmxleHNsaWRlci5kZWZhdWx0cyA9IHtcbiAgICBuYW1lc3BhY2U6IFwiZmxleC1cIiwgICAgICAgICAgICAgLy97TkVXfSBTdHJpbmc6IFByZWZpeCBzdHJpbmcgYXR0YWNoZWQgdG8gdGhlIGNsYXNzIG9mIGV2ZXJ5IGVsZW1lbnQgZ2VuZXJhdGVkIGJ5IHRoZSBwbHVnaW5cbiAgICBzZWxlY3RvcjogXCIuc2xpZGVzID4gbGlcIiwgICAgICAgLy97TkVXfSBTZWxlY3RvcjogTXVzdCBtYXRjaCBhIHNpbXBsZSBwYXR0ZXJuLiAne2NvbnRhaW5lcn0gPiB7c2xpZGV9JyAtLSBJZ25vcmUgcGF0dGVybiBhdCB5b3VyIG93biBwZXJpbFxuICAgIGFuaW1hdGlvbjogXCJmYWRlXCIsICAgICAgICAgICAgICAvL1N0cmluZzogU2VsZWN0IHlvdXIgYW5pbWF0aW9uIHR5cGUsIFwiZmFkZVwiIG9yIFwic2xpZGVcIlxuICAgIGVhc2luZzogXCJzd2luZ1wiLCAgICAgICAgICAgICAgICAvL3tORVd9IFN0cmluZzogRGV0ZXJtaW5lcyB0aGUgZWFzaW5nIG1ldGhvZCB1c2VkIGluIGpRdWVyeSB0cmFuc2l0aW9ucy4galF1ZXJ5IGVhc2luZyBwbHVnaW4gaXMgc3VwcG9ydGVkIVxuICAgIGRpcmVjdGlvbjogXCJob3Jpem9udGFsXCIsICAgICAgICAvL1N0cmluZzogU2VsZWN0IHRoZSBzbGlkaW5nIGRpcmVjdGlvbiwgXCJob3Jpem9udGFsXCIgb3IgXCJ2ZXJ0aWNhbFwiXG4gICAgcmV2ZXJzZTogZmFsc2UsICAgICAgICAgICAgICAgICAvL3tORVd9IEJvb2xlYW46IFJldmVyc2UgdGhlIGFuaW1hdGlvbiBkaXJlY3Rpb25cbiAgICBhbmltYXRpb25Mb29wOiB0cnVlLCAgICAgICAgICAgIC8vQm9vbGVhbjogU2hvdWxkIHRoZSBhbmltYXRpb24gbG9vcD8gSWYgZmFsc2UsIGRpcmVjdGlvbk5hdiB3aWxsIHJlY2VpdmVkIFwiZGlzYWJsZVwiIGNsYXNzZXMgYXQgZWl0aGVyIGVuZFxuICAgIHNtb290aEhlaWdodDogZmFsc2UsICAgICAgICAgICAgLy97TkVXfSBCb29sZWFuOiBBbGxvdyBoZWlnaHQgb2YgdGhlIHNsaWRlciB0byBhbmltYXRlIHNtb290aGx5IGluIGhvcml6b250YWwgbW9kZVxuICAgIHN0YXJ0QXQ6IDAsICAgICAgICAgICAgICAgICAgICAgLy9JbnRlZ2VyOiBUaGUgc2xpZGUgdGhhdCB0aGUgc2xpZGVyIHNob3VsZCBzdGFydCBvbi4gQXJyYXkgbm90YXRpb24gKDAgPSBmaXJzdCBzbGlkZSlcbiAgICBzbGlkZXNob3c6IHRydWUsICAgICAgICAgICAgICAgIC8vQm9vbGVhbjogQW5pbWF0ZSBzbGlkZXIgYXV0b21hdGljYWxseVxuICAgIHNsaWRlc2hvd1NwZWVkOiA3MDAwLCAgICAgICAgICAgLy9JbnRlZ2VyOiBTZXQgdGhlIHNwZWVkIG9mIHRoZSBzbGlkZXNob3cgY3ljbGluZywgaW4gbWlsbGlzZWNvbmRzXG4gICAgYW5pbWF0aW9uU3BlZWQ6IDYwMCwgICAgICAgICAgICAvL0ludGVnZXI6IFNldCB0aGUgc3BlZWQgb2YgYW5pbWF0aW9ucywgaW4gbWlsbGlzZWNvbmRzXG4gICAgaW5pdERlbGF5OiAwLCAgICAgICAgICAgICAgICAgICAvL3tORVd9IEludGVnZXI6IFNldCBhbiBpbml0aWFsaXphdGlvbiBkZWxheSwgaW4gbWlsbGlzZWNvbmRzXG4gICAgcmFuZG9taXplOiBmYWxzZSwgICAgICAgICAgICAgICAvL0Jvb2xlYW46IFJhbmRvbWl6ZSBzbGlkZSBvcmRlclxuICAgIGZhZGVGaXJzdFNsaWRlOiB0cnVlLCAgICAgICAgICAgLy9Cb29sZWFuOiBGYWRlIGluIHRoZSBmaXJzdCBzbGlkZSB3aGVuIGFuaW1hdGlvbiB0eXBlIGlzIFwiZmFkZVwiXG4gICAgdGh1bWJDYXB0aW9uczogZmFsc2UsICAgICAgICAgICAvL0Jvb2xlYW46IFdoZXRoZXIgb3Igbm90IHRvIHB1dCBjYXB0aW9ucyBvbiB0aHVtYm5haWxzIHdoZW4gdXNpbmcgdGhlIFwidGh1bWJuYWlsc1wiIGNvbnRyb2xOYXYuXG5cbiAgICAvLyBVc2FiaWxpdHkgZmVhdHVyZXNcbiAgICBwYXVzZU9uQWN0aW9uOiB0cnVlLCAgICAgICAgICAgIC8vQm9vbGVhbjogUGF1c2UgdGhlIHNsaWRlc2hvdyB3aGVuIGludGVyYWN0aW5nIHdpdGggY29udHJvbCBlbGVtZW50cywgaGlnaGx5IHJlY29tbWVuZGVkLlxuICAgIHBhdXNlT25Ib3ZlcjogZmFsc2UsICAgICAgICAgICAgLy9Cb29sZWFuOiBQYXVzZSB0aGUgc2xpZGVzaG93IHdoZW4gaG92ZXJpbmcgb3ZlciBzbGlkZXIsIHRoZW4gcmVzdW1lIHdoZW4gbm8gbG9uZ2VyIGhvdmVyaW5nXG4gICAgcGF1c2VJbnZpc2libGU6IHRydWUsICAgICAgIC8ve05FV30gQm9vbGVhbjogUGF1c2UgdGhlIHNsaWRlc2hvdyB3aGVuIHRhYiBpcyBpbnZpc2libGUsIHJlc3VtZSB3aGVuIHZpc2libGUuIFByb3ZpZGVzIGJldHRlciBVWCwgbG93ZXIgQ1BVIHVzYWdlLlxuICAgIHVzZUNTUzogdHJ1ZSwgICAgICAgICAgICAgICAgICAgLy97TkVXfSBCb29sZWFuOiBTbGlkZXIgd2lsbCB1c2UgQ1NTMyB0cmFuc2l0aW9ucyBpZiBhdmFpbGFibGVcbiAgICB0b3VjaDogdHJ1ZSwgICAgICAgICAgICAgICAgICAgIC8ve05FV30gQm9vbGVhbjogQWxsb3cgdG91Y2ggc3dpcGUgbmF2aWdhdGlvbiBvZiB0aGUgc2xpZGVyIG9uIHRvdWNoLWVuYWJsZWQgZGV2aWNlc1xuICAgIHZpZGVvOiBmYWxzZSwgICAgICAgICAgICAgICAgICAgLy97TkVXfSBCb29sZWFuOiBJZiB1c2luZyB2aWRlbyBpbiB0aGUgc2xpZGVyLCB3aWxsIHByZXZlbnQgQ1NTMyAzRCBUcmFuc2Zvcm1zIHRvIGF2b2lkIGdyYXBoaWNhbCBnbGl0Y2hlc1xuXG4gICAgLy8gUHJpbWFyeSBDb250cm9sc1xuICAgIGNvbnRyb2xOYXY6IHRydWUsICAgICAgICAgICAgICAgLy9Cb29sZWFuOiBDcmVhdGUgbmF2aWdhdGlvbiBmb3IgcGFnaW5nIGNvbnRyb2wgb2YgZWFjaCBzbGlkZT8gTm90ZTogTGVhdmUgdHJ1ZSBmb3IgbWFudWFsQ29udHJvbHMgdXNhZ2VcbiAgICBkaXJlY3Rpb25OYXY6IHRydWUsICAgICAgICAgICAgIC8vQm9vbGVhbjogQ3JlYXRlIG5hdmlnYXRpb24gZm9yIHByZXZpb3VzL25leHQgbmF2aWdhdGlvbj8gKHRydWUvZmFsc2UpXG4gICAgcHJldlRleHQ6IFwiUHJldmlvdXNcIiwgICAgICAgICAgIC8vU3RyaW5nOiBTZXQgdGhlIHRleHQgZm9yIHRoZSBcInByZXZpb3VzXCIgZGlyZWN0aW9uTmF2IGl0ZW1cbiAgICBuZXh0VGV4dDogXCJOZXh0XCIsICAgICAgICAgICAgICAgLy9TdHJpbmc6IFNldCB0aGUgdGV4dCBmb3IgdGhlIFwibmV4dFwiIGRpcmVjdGlvbk5hdiBpdGVtXG5cbiAgICAvLyBTZWNvbmRhcnkgTmF2aWdhdGlvblxuICAgIGtleWJvYXJkOiB0cnVlLCAgICAgICAgICAgICAgICAgLy9Cb29sZWFuOiBBbGxvdyBzbGlkZXIgbmF2aWdhdGluZyB2aWEga2V5Ym9hcmQgbGVmdC9yaWdodCBrZXlzXG4gICAgbXVsdGlwbGVLZXlib2FyZDogZmFsc2UsICAgICAgICAvL3tORVd9IEJvb2xlYW46IEFsbG93IGtleWJvYXJkIG5hdmlnYXRpb24gdG8gYWZmZWN0IG11bHRpcGxlIHNsaWRlcnMuIERlZmF1bHQgYmVoYXZpb3IgY3V0cyBvdXQga2V5Ym9hcmQgbmF2aWdhdGlvbiB3aXRoIG1vcmUgdGhhbiBvbmUgc2xpZGVyIHByZXNlbnQuXG4gICAgbW91c2V3aGVlbDogZmFsc2UsICAgICAgICAgICAgICAvL3tVUERBVEVEfSBCb29sZWFuOiBSZXF1aXJlcyBqcXVlcnkubW91c2V3aGVlbC5qcyAoaHR0cHM6Ly9naXRodWIuY29tL2JyYW5kb25hYXJvbi9qcXVlcnktbW91c2V3aGVlbCkgLSBBbGxvd3Mgc2xpZGVyIG5hdmlnYXRpbmcgdmlhIG1vdXNld2hlZWxcbiAgICBwYXVzZVBsYXk6IGZhbHNlLCAgICAgICAgICAgICAgIC8vQm9vbGVhbjogQ3JlYXRlIHBhdXNlL3BsYXkgZHluYW1pYyBlbGVtZW50XG4gICAgcGF1c2VUZXh0OiBcIlBhdXNlXCIsICAgICAgICAgICAgIC8vU3RyaW5nOiBTZXQgdGhlIHRleHQgZm9yIHRoZSBcInBhdXNlXCIgcGF1c2VQbGF5IGl0ZW1cbiAgICBwbGF5VGV4dDogXCJQbGF5XCIsICAgICAgICAgICAgICAgLy9TdHJpbmc6IFNldCB0aGUgdGV4dCBmb3IgdGhlIFwicGxheVwiIHBhdXNlUGxheSBpdGVtXG5cbiAgICAvLyBTcGVjaWFsIHByb3BlcnRpZXNcbiAgICBjb250cm9sc0NvbnRhaW5lcjogXCJcIiwgICAgICAgICAgLy97VVBEQVRFRH0galF1ZXJ5IE9iamVjdC9TZWxlY3RvcjogRGVjbGFyZSB3aGljaCBjb250YWluZXIgdGhlIG5hdmlnYXRpb24gZWxlbWVudHMgc2hvdWxkIGJlIGFwcGVuZGVkIHRvby4gRGVmYXVsdCBjb250YWluZXIgaXMgdGhlIEZsZXhTbGlkZXIgZWxlbWVudC4gRXhhbXBsZSB1c2Ugd291bGQgYmUgJChcIi5mbGV4c2xpZGVyLWNvbnRhaW5lclwiKS4gUHJvcGVydHkgaXMgaWdub3JlZCBpZiBnaXZlbiBlbGVtZW50IGlzIG5vdCBmb3VuZC5cbiAgICBtYW51YWxDb250cm9sczogXCJcIiwgICAgICAgICAgICAgLy97VVBEQVRFRH0galF1ZXJ5IE9iamVjdC9TZWxlY3RvcjogRGVjbGFyZSBjdXN0b20gY29udHJvbCBuYXZpZ2F0aW9uLiBFeGFtcGxlcyB3b3VsZCBiZSAkKFwiLmZsZXgtY29udHJvbC1uYXYgbGlcIikgb3IgXCIjdGFicy1uYXYgbGkgaW1nXCIsIGV0Yy4gVGhlIG51bWJlciBvZiBlbGVtZW50cyBpbiB5b3VyIGNvbnRyb2xOYXYgc2hvdWxkIG1hdGNoIHRoZSBudW1iZXIgb2Ygc2xpZGVzL3RhYnMuXG4gICAgY3VzdG9tRGlyZWN0aW9uTmF2OiBcIlwiLCAgICAgICAgIC8ve05FV30galF1ZXJ5IE9iamVjdC9TZWxlY3RvcjogQ3VzdG9tIHByZXYgLyBuZXh0IGJ1dHRvbi4gTXVzdCBiZSB0d28galF1ZXJ5IGVsZW1lbnRzLiBJbiBvcmRlciB0byBtYWtlIHRoZSBldmVudHMgd29yayB0aGV5IGhhdmUgdG8gaGF2ZSB0aGUgY2xhc3NlcyBcInByZXZcIiBhbmQgXCJuZXh0XCIgKHBsdXMgbmFtZXNwYWNlKVxuICAgIHN5bmM6IFwiXCIsICAgICAgICAgICAgICAgICAgICAgICAvL3tORVd9IFNlbGVjdG9yOiBNaXJyb3IgdGhlIGFjdGlvbnMgcGVyZm9ybWVkIG9uIHRoaXMgc2xpZGVyIHdpdGggYW5vdGhlciBzbGlkZXIuIFVzZSB3aXRoIGNhcmUuXG4gICAgYXNOYXZGb3I6IFwiXCIsICAgICAgICAgICAgICAgICAgIC8ve05FV30gU2VsZWN0b3I6IEludGVybmFsIHByb3BlcnR5IGV4cG9zZWQgZm9yIHR1cm5pbmcgdGhlIHNsaWRlciBpbnRvIGEgdGh1bWJuYWlsIG5hdmlnYXRpb24gZm9yIGFub3RoZXIgc2xpZGVyXG5cbiAgICAvLyBDYXJvdXNlbCBPcHRpb25zXG4gICAgaXRlbVdpZHRoOiAwLCAgICAgICAgICAgICAgICAgICAvL3tORVd9IEludGVnZXI6IEJveC1tb2RlbCB3aWR0aCBvZiBpbmRpdmlkdWFsIGNhcm91c2VsIGl0ZW1zLCBpbmNsdWRpbmcgaG9yaXpvbnRhbCBib3JkZXJzIGFuZCBwYWRkaW5nLlxuICAgIGl0ZW1NYXJnaW46IDAsICAgICAgICAgICAgICAgICAgLy97TkVXfSBJbnRlZ2VyOiBNYXJnaW4gYmV0d2VlbiBjYXJvdXNlbCBpdGVtcy5cbiAgICBtaW5JdGVtczogMSwgICAgICAgICAgICAgICAgICAgIC8ve05FV30gSW50ZWdlcjogTWluaW11bSBudW1iZXIgb2YgY2Fyb3VzZWwgaXRlbXMgdGhhdCBzaG91bGQgYmUgdmlzaWJsZS4gSXRlbXMgd2lsbCByZXNpemUgZmx1aWRseSB3aGVuIGJlbG93IHRoaXMuXG4gICAgbWF4SXRlbXM6IDAsICAgICAgICAgICAgICAgICAgICAvL3tORVd9IEludGVnZXI6IE1heG1pbXVtIG51bWJlciBvZiBjYXJvdXNlbCBpdGVtcyB0aGF0IHNob3VsZCBiZSB2aXNpYmxlLiBJdGVtcyB3aWxsIHJlc2l6ZSBmbHVpZGx5IHdoZW4gYWJvdmUgdGhpcyBsaW1pdC5cbiAgICBtb3ZlOiAwLCAgICAgICAgICAgICAgICAgICAgICAgIC8ve05FV30gSW50ZWdlcjogTnVtYmVyIG9mIGNhcm91c2VsIGl0ZW1zIHRoYXQgc2hvdWxkIG1vdmUgb24gYW5pbWF0aW9uLiBJZiAwLCBzbGlkZXIgd2lsbCBtb3ZlIGFsbCB2aXNpYmxlIGl0ZW1zLlxuICAgIGFsbG93T25lU2xpZGU6IHRydWUsICAgICAgICAgICAvL3tORVd9IEJvb2xlYW46IFdoZXRoZXIgb3Igbm90IHRvIGFsbG93IGEgc2xpZGVyIGNvbXByaXNlZCBvZiBhIHNpbmdsZSBzbGlkZVxuXG4gICAgLy8gQ2FsbGJhY2sgQVBJXG4gICAgc3RhcnQ6IGZ1bmN0aW9uKCl7fSwgICAgICAgICAgICAvL0NhbGxiYWNrOiBmdW5jdGlvbihzbGlkZXIpIC0gRmlyZXMgd2hlbiB0aGUgc2xpZGVyIGxvYWRzIHRoZSBmaXJzdCBzbGlkZVxuICAgIGJlZm9yZTogZnVuY3Rpb24oKXt9LCAgICAgICAgICAgLy9DYWxsYmFjazogZnVuY3Rpb24oc2xpZGVyKSAtIEZpcmVzIGFzeW5jaHJvbm91c2x5IHdpdGggZWFjaCBzbGlkZXIgYW5pbWF0aW9uXG4gICAgYWZ0ZXI6IGZ1bmN0aW9uKCl7fSwgICAgICAgICAgICAvL0NhbGxiYWNrOiBmdW5jdGlvbihzbGlkZXIpIC0gRmlyZXMgYWZ0ZXIgZWFjaCBzbGlkZXIgYW5pbWF0aW9uIGNvbXBsZXRlc1xuICAgIGVuZDogZnVuY3Rpb24oKXt9LCAgICAgICAgICAgICAgLy9DYWxsYmFjazogZnVuY3Rpb24oc2xpZGVyKSAtIEZpcmVzIHdoZW4gdGhlIHNsaWRlciByZWFjaGVzIHRoZSBsYXN0IHNsaWRlIChhc3luY2hyb25vdXMpXG4gICAgYWRkZWQ6IGZ1bmN0aW9uKCl7fSwgICAgICAgICAgICAvL3tORVd9IENhbGxiYWNrOiBmdW5jdGlvbihzbGlkZXIpIC0gRmlyZXMgYWZ0ZXIgYSBzbGlkZSBpcyBhZGRlZFxuICAgIHJlbW92ZWQ6IGZ1bmN0aW9uKCl7fSwgICAgICAgICAgIC8ve05FV30gQ2FsbGJhY2s6IGZ1bmN0aW9uKHNsaWRlcikgLSBGaXJlcyBhZnRlciBhIHNsaWRlIGlzIHJlbW92ZWRcbiAgICBpbml0OiBmdW5jdGlvbigpIHt9LCAgICAgICAgICAgICAvL3tORVd9IENhbGxiYWNrOiBmdW5jdGlvbihzbGlkZXIpIC0gRmlyZXMgYWZ0ZXIgdGhlIHNsaWRlciBpcyBpbml0aWFsbHkgc2V0dXBcbiAgcnRsOiBmYWxzZSAgICAgICAgICAgICAvL3tORVd9IEJvb2xlYW46IFdoZXRoZXIgb3Igbm90IHRvIGVuYWJsZSBSVEwgbW9kZVxuICB9O1xuXG4gIC8vRmxleFNsaWRlcjogUGx1Z2luIEZ1bmN0aW9uXG4gICQuZm4uZmxleHNsaWRlciA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICBpZiAob3B0aW9ucyA9PT0gdW5kZWZpbmVkKSB7IG9wdGlvbnMgPSB7fTsgfVxuXG4gICAgaWYgKHR5cGVvZiBvcHRpb25zID09PSBcIm9iamVjdFwiKSB7XG4gICAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpLFxuICAgICAgICAgICAgc2VsZWN0b3IgPSAob3B0aW9ucy5zZWxlY3RvcikgPyBvcHRpb25zLnNlbGVjdG9yIDogXCIuc2xpZGVzID4gbGlcIixcbiAgICAgICAgICAgICRzbGlkZXMgPSAkdGhpcy5maW5kKHNlbGVjdG9yKTtcblxuICAgICAgaWYgKCAoICRzbGlkZXMubGVuZ3RoID09PSAxICYmIG9wdGlvbnMuYWxsb3dPbmVTbGlkZSA9PT0gZmFsc2UgKSB8fCAkc2xpZGVzLmxlbmd0aCA9PT0gMCApIHtcbiAgICAgICAgICAkc2xpZGVzLmZhZGVJbig0MDApO1xuICAgICAgICAgIGlmIChvcHRpb25zLnN0YXJ0KSB7IG9wdGlvbnMuc3RhcnQoJHRoaXMpOyB9XG4gICAgICAgIH0gZWxzZSBpZiAoJHRoaXMuZGF0YSgnZmxleHNsaWRlcicpID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBuZXcgJC5mbGV4c2xpZGVyKHRoaXMsIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSGVscGVyIHN0cmluZ3MgdG8gcXVpY2tseSBwZXJmb3JtIGZ1bmN0aW9ucyBvbiB0aGUgc2xpZGVyXG4gICAgICB2YXIgJHNsaWRlciA9ICQodGhpcykuZGF0YSgnZmxleHNsaWRlcicpO1xuICAgICAgc3dpdGNoIChvcHRpb25zKSB7XG4gICAgICAgIGNhc2UgXCJwbGF5XCI6ICRzbGlkZXIucGxheSgpOyBicmVhaztcbiAgICAgICAgY2FzZSBcInBhdXNlXCI6ICRzbGlkZXIucGF1c2UoKTsgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJzdG9wXCI6ICRzbGlkZXIuc3RvcCgpOyBicmVhaztcbiAgICAgICAgY2FzZSBcIm5leHRcIjogJHNsaWRlci5mbGV4QW5pbWF0ZSgkc2xpZGVyLmdldFRhcmdldChcIm5leHRcIiksIHRydWUpOyBicmVhaztcbiAgICAgICAgY2FzZSBcInByZXZcIjpcbiAgICAgICAgY2FzZSBcInByZXZpb3VzXCI6ICRzbGlkZXIuZmxleEFuaW1hdGUoJHNsaWRlci5nZXRUYXJnZXQoXCJwcmV2XCIpLCB0cnVlKTsgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6IGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gXCJudW1iZXJcIikgeyAkc2xpZGVyLmZsZXhBbmltYXRlKG9wdGlvbnMsIHRydWUpOyB9XG4gICAgICB9XG4gICAgfVxuICB9O1xufSkoalF1ZXJ5KTtcbiJdLCJmaWxlIjoianF1ZXJ5LmZsZXhzbGlkZXIuanMifQ==
