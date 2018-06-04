/*!
	jQuery ColorBox v1.4.3 - 2013-02-18
	(c) 2013 Jack Moore - jacklmoore.com/colorbox
	license: http://www.opensource.org/licenses/mit-license.php
*/
(function ($, document, window) {
    var
        // Default settings object.
        // See http://jacklmoore.com/colorbox for details.
        defaults = {
            transition: "elastic",
            speed: 300,
            width: false,
            initialWidth: "600",
            innerWidth: false,
            maxWidth: false,
            height: false,
            initialHeight: "450",
            innerHeight: false,
            maxHeight: false,
            scalePhotos: true,
            scrolling: true,
            inline: false,
            html: false,
            iframe: false,
            fastIframe: true,
            photo: false,
            href: false,
            title: false,
            rel: false,
            opacity: 0.9,
            preloading: true,
            className: false,

            // alternate image paths for high-res displays
            retinaImage: false,
            retinaUrl: false,
            retinaSuffix: '@2x.$1',

            // internationalization
            current: "image {current} of {total}",
            previous: "previous",
            next: "next",
            close: "close",
            xhrError: "This content failed to load.",
            imgError: "This image failed to load.",

            open: false,
            returnFocus: true,
            reposition: true,
            loop: true,
            slideshow: false,
            slideshowAuto: true,
            slideshowSpeed: 2500,
            slideshowStart: "start slideshow",
            slideshowStop: "stop slideshow",
            photoRegex: /\.(gif|png|jp(e|g|eg)|bmp|ico)((#|\?).*)?$/i,

            onOpen: false,
            onLoad: false,
            onComplete: false,
            onCleanup: false,
            onClosed: false,
            overlayClose: true,
            escKey: true,
            arrowKey: true,
            top: false,
            bottom: false,
            left: false,
            right: false,
            fixed: false,
            data: undefined
        },

        // Abstracting the HTML and event identifiers for easy rebranding
        colorbox = 'colorbox',
        prefix = 'cbox',
        boxElement = prefix + 'Element',

        // Events
        event_open = prefix + '_open',
        event_load = prefix + '_load',
        event_complete = prefix + '_complete',
        event_cleanup = prefix + '_cleanup',
        event_closed = prefix + '_closed',
        event_purge = prefix + '_purge',

        // Special Handling for IE
        isIE = !$.support.leadingWhitespace, // IE6 to IE8
        isIE6 = isIE && !window.XMLHttpRequest, // IE6
        event_ie6 = prefix + '_IE6',

        // Cached jQuery Object Variables
        $overlay,
        $box,
        $wrap,
        $content,
        $topBorder,
        $leftBorder,
        $rightBorder,
        $bottomBorder,
        $related,
        $window,
        $loaded,
        $loadingBay,
        $loadingOverlay,
        $title,
        $current,
        $slideshow,
        $next,
        $prev,
        $close,
        $groupControls,
        $events = $({}),

        // Variables for cached values or use across multiple functions
        settings,
        interfaceHeight,
        interfaceWidth,
        loadedHeight,
        loadedWidth,
        element,
        index,
        photo,
        open,
        active,
        closing,
        loadingTimer,
        publicMethod,
        div = "div",
        className,
        init;

    // ****************
    // HELPER FUNCTIONS
    // ****************

    // Convience function for creating new jQuery objects
    function $tag(tag, id, css) {
        var element = document.createElement(tag);

        if (id) {
            element.id = prefix + id;
        }

        if (css) {
            element.style.cssText = css;
        }

        return $(element);
    }

    // Determine the next and previous members in a group.
    function getIndex(increment) {
        var
            max = $related.length,
            newIndex = (index + increment) % max;

        return (newIndex < 0) ? max + newIndex : newIndex;
    }

    // Convert '%' and 'px' values to integers
    function setSize(size, dimension) {
        return Math.round((/%/.test(size) ? ((dimension === 'x' ? $window.width() : $window.height()) / 100) : 1) * parseInt(size, 10));
    }

    // Checks an href to see if it is a photo.
    // There is a force photo option (photo: true) for hrefs that cannot be matched by the regex.
    function isImage(settings, url) {
        return settings.photo || settings.photoRegex.test(url);
    }

    function retinaUrl(settings, url) {
        return settings.retinaUrl && window.devicePixelRatio > 1 ? url.replace(settings.photoRegex, settings.retinaSuffix) : url;
    }

    function trapFocus(e) {
        if ('contains' in $box[0] && !$box[0].contains(e.target)) {
            e.stopPropagation();
            $box.focus();
        }
    }

    // Assigns function results to their respective properties
    function makeSettings() {
        var i,
            data = $.data(element, colorbox);

        if (data == null) {
            settings = $.extend({}, defaults);
            if (console && console.log) {
                console.log('Error: cboxElement missing settings object');
            }
        } else {
            settings = $.extend({}, data);
        }

        for (i in settings) {
            if ($.isFunction(settings[i]) && i.slice(0, 2) !== 'on') { // checks to make sure the function isn't one of the callbacks, they will be handled at the appropriate time.
                settings[i] = settings[i].call(element);
            }
        }

        settings.rel = settings.rel || element.rel || $(element).data('rel') || 'nofollow';
        settings.href = settings.href || $(element).attr('href');
        settings.title = settings.title || element.title;

        if (typeof settings.href === "string") {
            settings.href = $.trim(settings.href);
        }
    }

    function trigger(event, callback) {
        // for external use
        $(document).trigger(event);

        // for internal use
        $events.trigger(event);

        if ($.isFunction(callback)) {
            callback.call(element);
        }
    }

    // Slideshow functionality
    function slideshow() {
        var
            timeOut,
            className = prefix + "Slideshow_",
            click = "click." + prefix,
            clear,
            set,
            start,
            stop;

        if (settings.slideshow && $related[1]) {
            clear = function () {
                clearTimeout(timeOut);
            };

            set = function () {
                if (settings.loop || $related[index + 1]) {
                    timeOut = setTimeout(publicMethod.next, settings.slideshowSpeed);
                }
            };

            start = function () {
                $slideshow
                    .html(settings.slideshowStop)
                    .unbind(click)
                    .one(click, stop);

                $events
                    .bind(event_complete, set)
                    .bind(event_load, clear)
                    .bind(event_cleanup, stop);

                $box.removeClass(className + "off").addClass(className + "on");
            };

            stop = function () {
                clear();

                $events
                    .unbind(event_complete, set)
                    .unbind(event_load, clear)
                    .unbind(event_cleanup, stop);

                $slideshow
                    .html(settings.slideshowStart)
                    .unbind(click)
                    .one(click, function () {
                        publicMethod.next();
                        start();
                    });

                $box.removeClass(className + "on").addClass(className + "off");
            };

            if (settings.slideshowAuto) {
                start();
            } else {
                stop();
            }
        } else {
            $box.removeClass(className + "off " + className + "on");
        }
    }

    function launch(target) {
        if (!closing) {

            element = target;

            makeSettings();

            $related = $(element);

            index = 0;

            if (settings.rel !== 'nofollow') {
                $related = $('.' + boxElement).filter(function () {
                    var data = $.data(this, colorbox),
                        relRelated;

                    if (data) {
                        relRelated =  $(this).data('rel') || data.rel || this.rel;
                    }

                    return (relRelated === settings.rel);
                });
                index = $related.index(element);

                // Check direct calls to ColorBox.
                if (index === -1) {
                    $related = $related.add(element);
                    index = $related.length - 1;
                }
            }

            $overlay.css({
                opacity: parseFloat(settings.opacity),
                cursor: settings.overlayClose ? "pointer" : "auto",
                visibility: 'visible'
            }).show();

            if (!open) {
                open = active = true; // Prevents the page-change action from queuing up if the visitor holds down the left or right keys.

                // Show colorbox so the sizes can be calculated in older versions of jQuery
                $box.css({visibility:'hidden', display:'block'});

                $loaded = $tag(div, 'LoadedContent', 'width:0; height:0; overflow:hidden').appendTo($content);

                // Cache values needed for size calculations
                interfaceHeight = $topBorder.height() + $bottomBorder.height() + $content.outerHeight(true) - $content.height();//Subtraction needed for IE6
                interfaceWidth = $leftBorder.width() + $rightBorder.width() + $content.outerWidth(true) - $content.width();
                loadedHeight = $loaded.outerHeight(true);
                loadedWidth = $loaded.outerWidth(true);


                // Opens inital empty ColorBox prior to content being loaded.
                settings.w = setSize(settings.initialWidth, 'x');
                settings.h = setSize(settings.initialHeight, 'y');
                publicMethod.position();

                if (isIE6) {
                    $window.bind('resize.' + event_ie6 + ' scroll.' + event_ie6, function () {
                        $overlay.css({width: $window.width(), height: $window.height(), top: $window.scrollTop(), left: $window.scrollLeft()});
                    }).trigger('resize.' + event_ie6);
                }

                slideshow();

                trigger(event_open, settings.onOpen);

                $groupControls.add($title).hide();

                $close.html(settings.close).show();

                $box.focus();

                // Confine focus to the modal
                // Uses event capturing that is not supported in IE8-
                if (document.addEventListener) {

                    document.addEventListener('focus', trapFocus, true);

                    $events.one(event_closed, function () {
                        document.removeEventListener('focus', trapFocus, true);
                    });
                }

                // Return focus on closing
                if (settings.returnFocus) {
                    $events.one(event_closed, function () {
                        $(element).focus();
                    });
                }
            }

            publicMethod.load(true);
        }
    }

    // ColorBox's markup needs to be added to the DOM prior to being called
    // so that the browser will go ahead and load the CSS background images.
    function appendHTML() {
        if (!$box && document.body) {
            init = false;

            $window = $(window);
            $box = $tag(div).attr({
                id: colorbox,
                'class': isIE ? prefix + (isIE6 ? 'IE6' : 'IE') : '',
                role: 'dialog',
                tabindex: '-1'
            }).hide();
            $overlay = $tag(div, "Overlay", isIE6 ? 'position:absolute' : '').hide();
            $loadingOverlay = $tag(div, "LoadingOverlay").add($tag(div, "LoadingGraphic"));
            $wrap = $tag(div, "Wrapper");
            $content = $tag(div, "Content").append(
                $title = $tag(div, "Title"),
                $current = $tag(div, "Current"),
                $prev = $tag('button', "Previous"),
                $next = $tag('button', "Next"),
                $slideshow = $tag('button', "Slideshow"),
                $loadingOverlay,
                $close = $tag('button', "Close")
            );

            $wrap.append( // The 3x3 Grid that makes up ColorBox
                $tag(div).append(
                    $tag(div, "TopLeft"),
                    $topBorder = $tag(div, "TopCenter"),
                    $tag(div, "TopRight")
                ),
                $tag(div, false, 'clear:left').append(
                    $leftBorder = $tag(div, "MiddleLeft"),
                    $content,
                    $rightBorder = $tag(div, "MiddleRight")
                ),
                $tag(div, false, 'clear:left').append(
                    $tag(div, "BottomLeft"),
                    $bottomBorder = $tag(div, "BottomCenter"),
                    $tag(div, "BottomRight")
                )
            ).find('div div').css({'float': 'left'});

            $loadingBay = $tag(div, false, 'position:absolute; width:9999px; visibility:hidden; display:none');

            $groupControls = $next.add($prev).add($current).add($slideshow);

            $(document.body).append($overlay, $box.append($wrap, $loadingBay));
        }
    }

    // Add ColorBox's event bindings
    function addBindings() {
        function clickHandler(e) {
            // ignore non-left-mouse-clicks and clicks modified with ctrl / command, shift, or alt.
            // See: http://jacklmoore.com/notes/click-events/
            if (!(e.which > 1 || e.shiftKey || e.altKey || e.metaKey)) {
                e.preventDefault();
                launch(this);
            }
        }

        if ($box) {
            if (!init) {
                init = true;

                // Anonymous functions here keep the public method from being cached, thereby allowing them to be redefined on the fly.
                $next.click(function () {
                    publicMethod.next();
                });
                $prev.click(function () {
                    publicMethod.prev();
                });
                $close.click(function () {
                    publicMethod.close();
                });
                $overlay.click(function () {
                    if (settings.overlayClose) {
                        publicMethod.close();
                    }
                });

                // Key Bindings
                $(document).bind('keydown.' + prefix, function (e) {
                    var key = e.keyCode;
                    if (open && settings.escKey && key === 27) {
                        e.preventDefault();
                        publicMethod.close();
                    }
                    if (open && settings.arrowKey && $related[1] && !e.altKey) {
                        if (key === 37) {
                            e.preventDefault();
                            $prev.click();
                        } else if (key === 39) {
                            e.preventDefault();
                            $next.click();
                        }
                    }
                });

                if ($.isFunction($.fn.on)) {
                    // For jQuery 1.7+
                    $(document).on('click.'+prefix, '.'+boxElement, clickHandler);
                } else {
                    // For jQuery 1.3.x -> 1.6.x
                    // This code is never reached in jQuery 1.9, so do not contact me about 'live' being removed.
                    // This is not here for jQuery 1.9, it's here for legacy users.
                    $('.'+boxElement).live('click.'+prefix, clickHandler);
                }
            }
            return true;
        }
        return false;
    }

    // Don't do anything if ColorBox already exists.
    if ($.colorbox) {
        return;
    }

    // Append the HTML when the DOM loads
    $(appendHTML);


    // ****************
    // PUBLIC FUNCTIONS
    // Usage format: $.fn.colorbox.close();
    // Usage from within an iframe: parent.$.fn.colorbox.close();
    // ****************

    publicMethod = $.fn[colorbox] = $[colorbox] = function (options, callback) {
        var $this = this;

        options = options || {};

        appendHTML();

        if (addBindings()) {
            if ($.isFunction($this)) { // assume a call to $.colorbox
                $this = $('<a/>');
                options.open = true;
            } else if (!$this[0]) { // colorbox being applied to empty collection
                return $this;
            }

            if (callback) {
                options.onComplete = callback;
            }

            $this.each(function () {
                $.data(this, colorbox, $.extend({}, $.data(this, colorbox) || defaults, options));
            }).addClass(boxElement);

            if (($.isFunction(options.open) && options.open.call($this)) || options.open) {
                launch($this[0]);
            }
        }

        return $this;
    };

    publicMethod.position = function (speed, loadedCallback) {
        var
            css,
            top = 0,
            left = 0,
            offset = $box.offset(),
            scrollTop,
            scrollLeft;

        $window.unbind('resize.' + prefix);

        // remove the modal so that it doesn't influence the document width/height
        $box.css({top: -9e4, left: -9e4});

        scrollTop = $window.scrollTop();
        scrollLeft = $window.scrollLeft();

        if (settings.fixed && !isIE6) {
            offset.top -= scrollTop;
            offset.left -= scrollLeft;
            $box.css({position: 'fixed'});
        } else {
            top = scrollTop;
            left = scrollLeft;
            $box.css({position: 'absolute'});
        }

        // keeps the top and left positions within the browser's viewport.
        if (settings.right !== false) {
            left += Math.max($window.width() - settings.w - loadedWidth - interfaceWidth - setSize(settings.right, 'x'), 0);
        } else if (settings.left !== false) {
            left += setSize(settings.left, 'x');
        } else {
            left += Math.round(Math.max($window.width() - settings.w - loadedWidth - interfaceWidth, 0) / 2);
        }

        if (settings.bottom !== false) {
            top += Math.max($window.height() - settings.h - loadedHeight - interfaceHeight - setSize(settings.bottom, 'y'), 0);
        } else if (settings.top !== false) {
            top += setSize(settings.top, 'y');
        } else {
            top += Math.round(Math.max($window.height() - settings.h - loadedHeight - interfaceHeight, 0) / 2);
        }

        $box.css({top: offset.top, left: offset.left, visibility:'visible'});

        // setting the speed to 0 to reduce the delay between same-sized content.
        speed = ($box.width() === settings.w + loadedWidth && $box.height() === settings.h + loadedHeight) ? 0 : speed || 0;

        // this gives the wrapper plenty of breathing room so it's floated contents can move around smoothly,
        // but it has to be shrank down around the size of div#colorbox when it's done.  If not,
        // it can invoke an obscure IE bug when using iframes.
        $wrap[0].style.width = $wrap[0].style.height = "9999px";

        function modalDimensions(that) {
            $topBorder[0].style.width = $bottomBorder[0].style.width = $content[0].style.width = (parseInt(that.style.width,10) - interfaceWidth)+'px';
            $content[0].style.height = $leftBorder[0].style.height = $rightBorder[0].style.height = (parseInt(that.style.height,10) - interfaceHeight)+'px';
        }

        css = {width: settings.w + loadedWidth + interfaceWidth, height: settings.h + loadedHeight + interfaceHeight, top: top, left: left};

        if(speed===0){ // temporary workaround to side-step jQuery-UI 1.8 bug (http://bugs.jquery.com/ticket/12273)
            $box.css(css);
        }
        $box.dequeue().animate(css, {
            duration: speed,
            complete: function () {
                modalDimensions(this);

                active = false;

                // shrink the wrapper down to exactly the size of colorbox to avoid a bug in IE's iframe implementation.
                $wrap[0].style.width = (settings.w + loadedWidth + interfaceWidth) + "px";
                $wrap[0].style.height = (settings.h + loadedHeight + interfaceHeight) + "px";

                if (settings.reposition) {
                    setTimeout(function () {  // small delay before binding onresize due to an IE8 bug.
                        $window.bind('resize.' + prefix, publicMethod.position);
                    }, 1);
                }

                if (loadedCallback) {
                    loadedCallback();
                }
            },
            step: function () {
                modalDimensions(this);
            }
        });
    };

    publicMethod.resize = function (options) {
        if (open) {
            options = options || {};

            if (options.width) {
                settings.w = setSize(options.width, 'x') - loadedWidth - interfaceWidth;
            }
            if (options.innerWidth) {
                settings.w = setSize(options.innerWidth, 'x');
            }
            $loaded.css({width: settings.w});

            if (options.height) {
                settings.h = setSize(options.height, 'y') - loadedHeight - interfaceHeight;
            }
            if (options.innerHeight) {
                settings.h = setSize(options.innerHeight, 'y');
            }
            if (!options.innerHeight && !options.height) {
                $loaded.css({height: "auto"});
                settings.h = $loaded.height();
            }
            $loaded.css({height: settings.h});

            publicMethod.position(settings.transition === "none" ? 0 : settings.speed);
        }
    };

    publicMethod.prep = function (object) {
        if (!open) {
            return;
        }

        var callback, speed = settings.transition === "none" ? 0 : settings.speed;

        $loaded.empty().remove(); // Using empty first may prevent some IE7 issues.

        $loaded = $tag(div, 'LoadedContent').append(object);

        function getWidth() {
            settings.w = settings.w || $loaded.width();
            settings.w = settings.mw && settings.mw < settings.w ? settings.mw : settings.w;
            return settings.w;
        }
        function getHeight() {
            settings.h = settings.h || $loaded.height();
            settings.h = settings.mh && settings.mh < settings.h ? settings.mh : settings.h;
            return settings.h;
        }

        $loaded.hide()
            .appendTo($loadingBay.show())// content has to be appended to the DOM for accurate size calculations.
            .css({width: getWidth(), overflow: settings.scrolling ? 'auto' : 'hidden'})
            .css({height: getHeight()})// sets the height independently from the width in case the new width influences the value of height.
            .prependTo($content);

        $loadingBay.hide();

        // floating the IMG removes the bottom line-height and fixed a problem where IE miscalculates the width of the parent element as 100% of the document width.

        $(photo).css({'float': 'none'});

        callback = function () {
            var total = $related.length,
                iframe,
                frameBorder = 'frameBorder',
                allowTransparency = 'allowTransparency',
                complete;

            if (!open) {
                return;
            }

            function removeFilter() {
                if (isIE) {
                    $box[0].style.removeAttribute('filter');
                }
            }

            complete = function () {
                clearTimeout(loadingTimer);
                $loadingOverlay.hide();
                trigger(event_complete, settings.onComplete);
            };

            if (isIE) {
                //This fadeIn helps the bicubic resampling to kick-in.
                if (photo) {
                    $loaded.fadeIn(100);
                }
            }

            $title.html(settings.title).add($loaded).show();

            if (total > 1) { // handle grouping
                if (typeof settings.current === "string") {
                    $current.html(settings.current.replace('{current}', index + 1).replace('{total}', total)).show();
                }

                $next[(settings.loop || index < total - 1) ? "show" : "hide"]().html(settings.next);
                $prev[(settings.loop || index) ? "show" : "hide"]().html(settings.previous);

                if (settings.slideshow) {
                    $slideshow.show();
                }

                // Preloads images within a rel group
                if (settings.preloading) {
                    $.each([getIndex(-1), getIndex(1)], function(){
                        var src,
                            img,
                            i = $related[this],
                            data = $.data(i, colorbox);

                        if (data && data.href) {
                            src = data.href;
                            if ($.isFunction(src)) {
                                src = src.call(i);
                            }
                        } else {
                            src = $(i).attr('href');
                        }

                        if (src && isImage(data, src)) {
                            src = retinaUrl(data, src);
                            img = new Image();
                            img.src = src;
                        }
                    });
                }
            } else {
                $groupControls.hide();
            }

            if (settings.iframe) {
                iframe = $tag('iframe')[0];

                if (frameBorder in iframe) {
                    iframe[frameBorder] = 0;
                }

                if (allowTransparency in iframe) {
                    iframe[allowTransparency] = "true";
                }

                if (!settings.scrolling) {
                    iframe.scrolling = "no";
                }

                $(iframe)
                    .attr({
                        src: settings.href,
                        name: (new Date()).getTime(), // give the iframe a unique name to prevent caching
                        'class': prefix + 'Iframe',
                        allowFullScreen : true, // allow HTML5 video to go fullscreen
                        webkitAllowFullScreen : true,
                        mozallowfullscreen : true
                    })
                    .one('load', complete)
                    .appendTo($loaded);

                $events.one(event_purge, function () {
                    iframe.src = "//about:blank";
                });

                if (settings.fastIframe) {
                    $(iframe).trigger('load');
                }
            } else {
                complete();
            }

            if (settings.transition === 'fade') {
                $box.fadeTo(speed, 1, removeFilter);
            } else {
                removeFilter();
            }
        };

        if (settings.transition === 'fade') {
            $box.fadeTo(speed, 0, function () {
                publicMethod.position(0, callback);
            });
        } else {
            publicMethod.position(speed, callback);
        }
    };

    publicMethod.load = function (launched) {
        var href, setResize, prep = publicMethod.prep, $inline;

        active = true;

        photo = false;

        element = $related[index];

        if (!launched) {
            makeSettings();
        }

        if (className) {
            $box.add($overlay).removeClass(className);
        }
        if (settings.className) {
            $box.add($overlay).addClass(settings.className);
        }
        className = settings.className;

        trigger(event_purge);

        trigger(event_load, settings.onLoad);

        settings.h = settings.height ?
            setSize(settings.height, 'y') - loadedHeight - interfaceHeight :
            settings.innerHeight && setSize(settings.innerHeight, 'y');

        settings.w = settings.width ?
            setSize(settings.width, 'x') - loadedWidth - interfaceWidth :
            settings.innerWidth && setSize(settings.innerWidth, 'x');

        // Sets the minimum dimensions for use in image scaling
        settings.mw = settings.w;
        settings.mh = settings.h;

        // Re-evaluate the minimum width and height based on maxWidth and maxHeight values.
        // If the width or height exceed the maxWidth or maxHeight, use the maximum values instead.
        if (settings.maxWidth) {
            settings.mw = setSize(settings.maxWidth, 'x') - loadedWidth - interfaceWidth;
            settings.mw = settings.w && settings.w < settings.mw ? settings.w : settings.mw;
        }
        if (settings.maxHeight) {
            settings.mh = setSize(settings.maxHeight, 'y') - loadedHeight - interfaceHeight;
            settings.mh = settings.h && settings.h < settings.mh ? settings.h : settings.mh;
        }

        href = settings.href;

        loadingTimer = setTimeout(function () {
            $loadingOverlay.show();
        }, 100);

        if (settings.inline) {
            // Inserts an empty placeholder where inline content is being pulled from.
            // An event is bound to put inline content back when ColorBox closes or loads new content.
            $inline = $tag(div).hide().insertBefore($(href)[0]);

            $events.one(event_purge, function () {
                $inline.replaceWith($loaded.children());
            });

            prep($(href));
        } else if (settings.iframe) {
            // IFrame element won't be added to the DOM until it is ready to be displayed,
            // to avoid problems with DOM-ready JS that might be trying to run in that iframe.
            prep(" ");
        } else if (settings.html) {
            prep(settings.html);
        } else if (isImage(settings, href)) {

            href = retinaUrl(settings, href);

            $(photo = new Image())
                .addClass(prefix + 'Photo')
                .bind('error',function () {
                    settings.title = false;
                    prep($tag(div, 'Error').html(settings.imgError));
                })
                .one('load', function () {
                    var percent;

                    if (settings.retinaImage && window.devicePixelRatio > 1) {
                        photo.height = photo.height / window.devicePixelRatio;
                        photo.width = photo.width / window.devicePixelRatio;
                    }

                    if (settings.scalePhotos) {
                        setResize = function () {
                            photo.height -= photo.height * percent;
                            photo.width -= photo.width * percent;
                        };
                        if (settings.mw && photo.width > settings.mw) {
                            percent = (photo.width - settings.mw) / photo.width;
                            setResize();
                        }
                        if (settings.mh && photo.height > settings.mh) {
                            percent = (photo.height - settings.mh) / photo.height;
                            setResize();
                        }
                    }

                    if (settings.h) {
                        photo.style.marginTop = Math.max(settings.mh - photo.height, 0) / 2 + 'px';
                    }

                    if ($related[1] && (settings.loop || $related[index + 1])) {
                        photo.style.cursor = 'pointer';
                        photo.onclick = function () {
                            publicMethod.next();
                        };
                    }

                    if (isIE) {
                        photo.style.msInterpolationMode = 'bicubic';
                    }

                    setTimeout(function () { // A pause because Chrome will sometimes report a 0 by 0 size otherwise.
                        prep(photo);
                    }, 1);
                });

            setTimeout(function () { // A pause because Opera 10.6+ will sometimes not run the onload function otherwise.
                photo.src = href;
            }, 1);
        } else if (href) {
            $loadingBay.load(href, settings.data, function (data, status) {
                prep(status === 'error' ? $tag(div, 'Error').html(settings.xhrError) : $(this).contents());
            });
        }
    };

    // Navigates to the next page/image in a set.
    publicMethod.next = function () {
        if (!active && $related[1] && (settings.loop || $related[index + 1])) {
            index = getIndex(1);
            publicMethod.load();
        }
    };

    publicMethod.prev = function () {
        if (!active && $related[1] && (settings.loop || index)) {
            index = getIndex(-1);
            publicMethod.load();
        }
    };

    // Note: to use this within an iframe use the following format: parent.$.fn.colorbox.close();
    publicMethod.close = function () {
        if (open && !closing) {

            closing = true;

            open = false;

            trigger(event_cleanup, settings.onCleanup);

            $window.unbind('.' + prefix + ' .' + event_ie6);

            $overlay.fadeTo(200, 0);

            $box.stop().fadeTo(300, 0, function () {

                $box.add($overlay).css({'opacity': 1, cursor: 'auto'}).hide();

                trigger(event_purge);

                $loaded.empty().remove(); // Using empty first may prevent some IE7 issues.

                setTimeout(function () {
                    closing = false;
                    trigger(event_closed, settings.onClosed);
                }, 1);
            });
        }
    };

    // Removes changes ColorBox made to the document, but does not remove the plugin
    // from jQuery.
    publicMethod.remove = function () {
        $([]).add($box).add($overlay).remove();
        $box = null;
        $('.' + boxElement)
            .removeData(colorbox)
            .removeClass(boxElement);

        $(document).unbind('click.'+prefix);
    };

    // A method for fetching the current element ColorBox is referencing.
    // returns a jQuery object.
    publicMethod.element = function () {
        return $(element);
    };

    publicMethod.settings = defaults;

}(jQuery, document, window));
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJqcXVlcnkuY29sb3Jib3guanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyohXHJcblx0alF1ZXJ5IENvbG9yQm94IHYxLjQuMyAtIDIwMTMtMDItMThcclxuXHQoYykgMjAxMyBKYWNrIE1vb3JlIC0gamFja2xtb29yZS5jb20vY29sb3Jib3hcclxuXHRsaWNlbnNlOiBodHRwOi8vd3d3Lm9wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL21pdC1saWNlbnNlLnBocFxyXG4qL1xyXG4oZnVuY3Rpb24gKCQsIGRvY3VtZW50LCB3aW5kb3cpIHtcclxuICAgIHZhclxyXG4gICAgICAgIC8vIERlZmF1bHQgc2V0dGluZ3Mgb2JqZWN0LlxyXG4gICAgICAgIC8vIFNlZSBodHRwOi8vamFja2xtb29yZS5jb20vY29sb3Jib3ggZm9yIGRldGFpbHMuXHJcbiAgICAgICAgZGVmYXVsdHMgPSB7XHJcbiAgICAgICAgICAgIHRyYW5zaXRpb246IFwiZWxhc3RpY1wiLFxyXG4gICAgICAgICAgICBzcGVlZDogMzAwLFxyXG4gICAgICAgICAgICB3aWR0aDogZmFsc2UsXHJcbiAgICAgICAgICAgIGluaXRpYWxXaWR0aDogXCI2MDBcIixcclxuICAgICAgICAgICAgaW5uZXJXaWR0aDogZmFsc2UsXHJcbiAgICAgICAgICAgIG1heFdpZHRoOiBmYWxzZSxcclxuICAgICAgICAgICAgaGVpZ2h0OiBmYWxzZSxcclxuICAgICAgICAgICAgaW5pdGlhbEhlaWdodDogXCI0NTBcIixcclxuICAgICAgICAgICAgaW5uZXJIZWlnaHQ6IGZhbHNlLFxyXG4gICAgICAgICAgICBtYXhIZWlnaHQ6IGZhbHNlLFxyXG4gICAgICAgICAgICBzY2FsZVBob3RvczogdHJ1ZSxcclxuICAgICAgICAgICAgc2Nyb2xsaW5nOiB0cnVlLFxyXG4gICAgICAgICAgICBpbmxpbmU6IGZhbHNlLFxyXG4gICAgICAgICAgICBodG1sOiBmYWxzZSxcclxuICAgICAgICAgICAgaWZyYW1lOiBmYWxzZSxcclxuICAgICAgICAgICAgZmFzdElmcmFtZTogdHJ1ZSxcclxuICAgICAgICAgICAgcGhvdG86IGZhbHNlLFxyXG4gICAgICAgICAgICBocmVmOiBmYWxzZSxcclxuICAgICAgICAgICAgdGl0bGU6IGZhbHNlLFxyXG4gICAgICAgICAgICByZWw6IGZhbHNlLFxyXG4gICAgICAgICAgICBvcGFjaXR5OiAwLjksXHJcbiAgICAgICAgICAgIHByZWxvYWRpbmc6IHRydWUsXHJcbiAgICAgICAgICAgIGNsYXNzTmFtZTogZmFsc2UsXHJcblxyXG4gICAgICAgICAgICAvLyBhbHRlcm5hdGUgaW1hZ2UgcGF0aHMgZm9yIGhpZ2gtcmVzIGRpc3BsYXlzXHJcbiAgICAgICAgICAgIHJldGluYUltYWdlOiBmYWxzZSxcclxuICAgICAgICAgICAgcmV0aW5hVXJsOiBmYWxzZSxcclxuICAgICAgICAgICAgcmV0aW5hU3VmZml4OiAnQDJ4LiQxJyxcclxuXHJcbiAgICAgICAgICAgIC8vIGludGVybmF0aW9uYWxpemF0aW9uXHJcbiAgICAgICAgICAgIGN1cnJlbnQ6IFwiaW1hZ2Uge2N1cnJlbnR9IG9mIHt0b3RhbH1cIixcclxuICAgICAgICAgICAgcHJldmlvdXM6IFwicHJldmlvdXNcIixcclxuICAgICAgICAgICAgbmV4dDogXCJuZXh0XCIsXHJcbiAgICAgICAgICAgIGNsb3NlOiBcImNsb3NlXCIsXHJcbiAgICAgICAgICAgIHhockVycm9yOiBcIlRoaXMgY29udGVudCBmYWlsZWQgdG8gbG9hZC5cIixcclxuICAgICAgICAgICAgaW1nRXJyb3I6IFwiVGhpcyBpbWFnZSBmYWlsZWQgdG8gbG9hZC5cIixcclxuXHJcbiAgICAgICAgICAgIG9wZW46IGZhbHNlLFxyXG4gICAgICAgICAgICByZXR1cm5Gb2N1czogdHJ1ZSxcclxuICAgICAgICAgICAgcmVwb3NpdGlvbjogdHJ1ZSxcclxuICAgICAgICAgICAgbG9vcDogdHJ1ZSxcclxuICAgICAgICAgICAgc2xpZGVzaG93OiBmYWxzZSxcclxuICAgICAgICAgICAgc2xpZGVzaG93QXV0bzogdHJ1ZSxcclxuICAgICAgICAgICAgc2xpZGVzaG93U3BlZWQ6IDI1MDAsXHJcbiAgICAgICAgICAgIHNsaWRlc2hvd1N0YXJ0OiBcInN0YXJ0IHNsaWRlc2hvd1wiLFxyXG4gICAgICAgICAgICBzbGlkZXNob3dTdG9wOiBcInN0b3Agc2xpZGVzaG93XCIsXHJcbiAgICAgICAgICAgIHBob3RvUmVnZXg6IC9cXC4oZ2lmfHBuZ3xqcChlfGd8ZWcpfGJtcHxpY28pKCgjfFxcPykuKik/JC9pLFxyXG5cclxuICAgICAgICAgICAgb25PcGVuOiBmYWxzZSxcclxuICAgICAgICAgICAgb25Mb2FkOiBmYWxzZSxcclxuICAgICAgICAgICAgb25Db21wbGV0ZTogZmFsc2UsXHJcbiAgICAgICAgICAgIG9uQ2xlYW51cDogZmFsc2UsXHJcbiAgICAgICAgICAgIG9uQ2xvc2VkOiBmYWxzZSxcclxuICAgICAgICAgICAgb3ZlcmxheUNsb3NlOiB0cnVlLFxyXG4gICAgICAgICAgICBlc2NLZXk6IHRydWUsXHJcbiAgICAgICAgICAgIGFycm93S2V5OiB0cnVlLFxyXG4gICAgICAgICAgICB0b3A6IGZhbHNlLFxyXG4gICAgICAgICAgICBib3R0b206IGZhbHNlLFxyXG4gICAgICAgICAgICBsZWZ0OiBmYWxzZSxcclxuICAgICAgICAgICAgcmlnaHQ6IGZhbHNlLFxyXG4gICAgICAgICAgICBmaXhlZDogZmFsc2UsXHJcbiAgICAgICAgICAgIGRhdGE6IHVuZGVmaW5lZFxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vIEFic3RyYWN0aW5nIHRoZSBIVE1MIGFuZCBldmVudCBpZGVudGlmaWVycyBmb3IgZWFzeSByZWJyYW5kaW5nXHJcbiAgICAgICAgY29sb3Jib3ggPSAnY29sb3Jib3gnLFxyXG4gICAgICAgIHByZWZpeCA9ICdjYm94JyxcclxuICAgICAgICBib3hFbGVtZW50ID0gcHJlZml4ICsgJ0VsZW1lbnQnLFxyXG5cclxuICAgICAgICAvLyBFdmVudHNcclxuICAgICAgICBldmVudF9vcGVuID0gcHJlZml4ICsgJ19vcGVuJyxcclxuICAgICAgICBldmVudF9sb2FkID0gcHJlZml4ICsgJ19sb2FkJyxcclxuICAgICAgICBldmVudF9jb21wbGV0ZSA9IHByZWZpeCArICdfY29tcGxldGUnLFxyXG4gICAgICAgIGV2ZW50X2NsZWFudXAgPSBwcmVmaXggKyAnX2NsZWFudXAnLFxyXG4gICAgICAgIGV2ZW50X2Nsb3NlZCA9IHByZWZpeCArICdfY2xvc2VkJyxcclxuICAgICAgICBldmVudF9wdXJnZSA9IHByZWZpeCArICdfcHVyZ2UnLFxyXG5cclxuICAgICAgICAvLyBTcGVjaWFsIEhhbmRsaW5nIGZvciBJRVxyXG4gICAgICAgIGlzSUUgPSAhJC5zdXBwb3J0LmxlYWRpbmdXaGl0ZXNwYWNlLCAvLyBJRTYgdG8gSUU4XHJcbiAgICAgICAgaXNJRTYgPSBpc0lFICYmICF3aW5kb3cuWE1MSHR0cFJlcXVlc3QsIC8vIElFNlxyXG4gICAgICAgIGV2ZW50X2llNiA9IHByZWZpeCArICdfSUU2JyxcclxuXHJcbiAgICAgICAgLy8gQ2FjaGVkIGpRdWVyeSBPYmplY3QgVmFyaWFibGVzXHJcbiAgICAgICAgJG92ZXJsYXksXHJcbiAgICAgICAgJGJveCxcclxuICAgICAgICAkd3JhcCxcclxuICAgICAgICAkY29udGVudCxcclxuICAgICAgICAkdG9wQm9yZGVyLFxyXG4gICAgICAgICRsZWZ0Qm9yZGVyLFxyXG4gICAgICAgICRyaWdodEJvcmRlcixcclxuICAgICAgICAkYm90dG9tQm9yZGVyLFxyXG4gICAgICAgICRyZWxhdGVkLFxyXG4gICAgICAgICR3aW5kb3csXHJcbiAgICAgICAgJGxvYWRlZCxcclxuICAgICAgICAkbG9hZGluZ0JheSxcclxuICAgICAgICAkbG9hZGluZ092ZXJsYXksXHJcbiAgICAgICAgJHRpdGxlLFxyXG4gICAgICAgICRjdXJyZW50LFxyXG4gICAgICAgICRzbGlkZXNob3csXHJcbiAgICAgICAgJG5leHQsXHJcbiAgICAgICAgJHByZXYsXHJcbiAgICAgICAgJGNsb3NlLFxyXG4gICAgICAgICRncm91cENvbnRyb2xzLFxyXG4gICAgICAgICRldmVudHMgPSAkKHt9KSxcclxuXHJcbiAgICAgICAgLy8gVmFyaWFibGVzIGZvciBjYWNoZWQgdmFsdWVzIG9yIHVzZSBhY3Jvc3MgbXVsdGlwbGUgZnVuY3Rpb25zXHJcbiAgICAgICAgc2V0dGluZ3MsXHJcbiAgICAgICAgaW50ZXJmYWNlSGVpZ2h0LFxyXG4gICAgICAgIGludGVyZmFjZVdpZHRoLFxyXG4gICAgICAgIGxvYWRlZEhlaWdodCxcclxuICAgICAgICBsb2FkZWRXaWR0aCxcclxuICAgICAgICBlbGVtZW50LFxyXG4gICAgICAgIGluZGV4LFxyXG4gICAgICAgIHBob3RvLFxyXG4gICAgICAgIG9wZW4sXHJcbiAgICAgICAgYWN0aXZlLFxyXG4gICAgICAgIGNsb3NpbmcsXHJcbiAgICAgICAgbG9hZGluZ1RpbWVyLFxyXG4gICAgICAgIHB1YmxpY01ldGhvZCxcclxuICAgICAgICBkaXYgPSBcImRpdlwiLFxyXG4gICAgICAgIGNsYXNzTmFtZSxcclxuICAgICAgICBpbml0O1xyXG5cclxuICAgIC8vICoqKioqKioqKioqKioqKipcclxuICAgIC8vIEhFTFBFUiBGVU5DVElPTlNcclxuICAgIC8vICoqKioqKioqKioqKioqKipcclxuXHJcbiAgICAvLyBDb252aWVuY2UgZnVuY3Rpb24gZm9yIGNyZWF0aW5nIG5ldyBqUXVlcnkgb2JqZWN0c1xyXG4gICAgZnVuY3Rpb24gJHRhZyh0YWcsIGlkLCBjc3MpIHtcclxuICAgICAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnKTtcclxuXHJcbiAgICAgICAgaWYgKGlkKSB7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuaWQgPSBwcmVmaXggKyBpZDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChjc3MpIHtcclxuICAgICAgICAgICAgZWxlbWVudC5zdHlsZS5jc3NUZXh0ID0gY3NzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuICQoZWxlbWVudCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRGV0ZXJtaW5lIHRoZSBuZXh0IGFuZCBwcmV2aW91cyBtZW1iZXJzIGluIGEgZ3JvdXAuXHJcbiAgICBmdW5jdGlvbiBnZXRJbmRleChpbmNyZW1lbnQpIHtcclxuICAgICAgICB2YXJcclxuICAgICAgICAgICAgbWF4ID0gJHJlbGF0ZWQubGVuZ3RoLFxyXG4gICAgICAgICAgICBuZXdJbmRleCA9IChpbmRleCArIGluY3JlbWVudCkgJSBtYXg7XHJcblxyXG4gICAgICAgIHJldHVybiAobmV3SW5kZXggPCAwKSA/IG1heCArIG5ld0luZGV4IDogbmV3SW5kZXg7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ29udmVydCAnJScgYW5kICdweCcgdmFsdWVzIHRvIGludGVnZXJzXHJcbiAgICBmdW5jdGlvbiBzZXRTaXplKHNpemUsIGRpbWVuc2lvbikge1xyXG4gICAgICAgIHJldHVybiBNYXRoLnJvdW5kKCgvJS8udGVzdChzaXplKSA/ICgoZGltZW5zaW9uID09PSAneCcgPyAkd2luZG93LndpZHRoKCkgOiAkd2luZG93LmhlaWdodCgpKSAvIDEwMCkgOiAxKSAqIHBhcnNlSW50KHNpemUsIDEwKSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ2hlY2tzIGFuIGhyZWYgdG8gc2VlIGlmIGl0IGlzIGEgcGhvdG8uXHJcbiAgICAvLyBUaGVyZSBpcyBhIGZvcmNlIHBob3RvIG9wdGlvbiAocGhvdG86IHRydWUpIGZvciBocmVmcyB0aGF0IGNhbm5vdCBiZSBtYXRjaGVkIGJ5IHRoZSByZWdleC5cclxuICAgIGZ1bmN0aW9uIGlzSW1hZ2Uoc2V0dGluZ3MsIHVybCkge1xyXG4gICAgICAgIHJldHVybiBzZXR0aW5ncy5waG90byB8fCBzZXR0aW5ncy5waG90b1JlZ2V4LnRlc3QodXJsKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiByZXRpbmFVcmwoc2V0dGluZ3MsIHVybCkge1xyXG4gICAgICAgIHJldHVybiBzZXR0aW5ncy5yZXRpbmFVcmwgJiYgd2luZG93LmRldmljZVBpeGVsUmF0aW8gPiAxID8gdXJsLnJlcGxhY2Uoc2V0dGluZ3MucGhvdG9SZWdleCwgc2V0dGluZ3MucmV0aW5hU3VmZml4KSA6IHVybDtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiB0cmFwRm9jdXMoZSkge1xyXG4gICAgICAgIGlmICgnY29udGFpbnMnIGluICRib3hbMF0gJiYgISRib3hbMF0uY29udGFpbnMoZS50YXJnZXQpKSB7XHJcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgICRib3guZm9jdXMoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQXNzaWducyBmdW5jdGlvbiByZXN1bHRzIHRvIHRoZWlyIHJlc3BlY3RpdmUgcHJvcGVydGllc1xyXG4gICAgZnVuY3Rpb24gbWFrZVNldHRpbmdzKCkge1xyXG4gICAgICAgIHZhciBpLFxyXG4gICAgICAgICAgICBkYXRhID0gJC5kYXRhKGVsZW1lbnQsIGNvbG9yYm94KTtcclxuXHJcbiAgICAgICAgaWYgKGRhdGEgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICBzZXR0aW5ncyA9ICQuZXh0ZW5kKHt9LCBkZWZhdWx0cyk7XHJcbiAgICAgICAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUubG9nKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnRXJyb3I6IGNib3hFbGVtZW50IG1pc3Npbmcgc2V0dGluZ3Mgb2JqZWN0Jyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBzZXR0aW5ncyA9ICQuZXh0ZW5kKHt9LCBkYXRhKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAoaSBpbiBzZXR0aW5ncykge1xyXG4gICAgICAgICAgICBpZiAoJC5pc0Z1bmN0aW9uKHNldHRpbmdzW2ldKSAmJiBpLnNsaWNlKDAsIDIpICE9PSAnb24nKSB7IC8vIGNoZWNrcyB0byBtYWtlIHN1cmUgdGhlIGZ1bmN0aW9uIGlzbid0IG9uZSBvZiB0aGUgY2FsbGJhY2tzLCB0aGV5IHdpbGwgYmUgaGFuZGxlZCBhdCB0aGUgYXBwcm9wcmlhdGUgdGltZS5cclxuICAgICAgICAgICAgICAgIHNldHRpbmdzW2ldID0gc2V0dGluZ3NbaV0uY2FsbChlbGVtZW50KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2V0dGluZ3MucmVsID0gc2V0dGluZ3MucmVsIHx8IGVsZW1lbnQucmVsIHx8ICQoZWxlbWVudCkuZGF0YSgncmVsJykgfHwgJ25vZm9sbG93JztcclxuICAgICAgICBzZXR0aW5ncy5ocmVmID0gc2V0dGluZ3MuaHJlZiB8fCAkKGVsZW1lbnQpLmF0dHIoJ2hyZWYnKTtcclxuICAgICAgICBzZXR0aW5ncy50aXRsZSA9IHNldHRpbmdzLnRpdGxlIHx8IGVsZW1lbnQudGl0bGU7XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2Ygc2V0dGluZ3MuaHJlZiA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICBzZXR0aW5ncy5ocmVmID0gJC50cmltKHNldHRpbmdzLmhyZWYpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiB0cmlnZ2VyKGV2ZW50LCBjYWxsYmFjaykge1xyXG4gICAgICAgIC8vIGZvciBleHRlcm5hbCB1c2VcclxuICAgICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKGV2ZW50KTtcclxuXHJcbiAgICAgICAgLy8gZm9yIGludGVybmFsIHVzZVxyXG4gICAgICAgICRldmVudHMudHJpZ2dlcihldmVudCk7XHJcblxyXG4gICAgICAgIGlmICgkLmlzRnVuY3Rpb24oY2FsbGJhY2spKSB7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrLmNhbGwoZWxlbWVudCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIFNsaWRlc2hvdyBmdW5jdGlvbmFsaXR5XHJcbiAgICBmdW5jdGlvbiBzbGlkZXNob3coKSB7XHJcbiAgICAgICAgdmFyXHJcbiAgICAgICAgICAgIHRpbWVPdXQsXHJcbiAgICAgICAgICAgIGNsYXNzTmFtZSA9IHByZWZpeCArIFwiU2xpZGVzaG93X1wiLFxyXG4gICAgICAgICAgICBjbGljayA9IFwiY2xpY2suXCIgKyBwcmVmaXgsXHJcbiAgICAgICAgICAgIGNsZWFyLFxyXG4gICAgICAgICAgICBzZXQsXHJcbiAgICAgICAgICAgIHN0YXJ0LFxyXG4gICAgICAgICAgICBzdG9wO1xyXG5cclxuICAgICAgICBpZiAoc2V0dGluZ3Muc2xpZGVzaG93ICYmICRyZWxhdGVkWzFdKSB7XHJcbiAgICAgICAgICAgIGNsZWFyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVPdXQpO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgc2V0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHNldHRpbmdzLmxvb3AgfHwgJHJlbGF0ZWRbaW5kZXggKyAxXSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRpbWVPdXQgPSBzZXRUaW1lb3V0KHB1YmxpY01ldGhvZC5uZXh0LCBzZXR0aW5ncy5zbGlkZXNob3dTcGVlZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBzdGFydCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICRzbGlkZXNob3dcclxuICAgICAgICAgICAgICAgICAgICAuaHRtbChzZXR0aW5ncy5zbGlkZXNob3dTdG9wKVxyXG4gICAgICAgICAgICAgICAgICAgIC51bmJpbmQoY2xpY2spXHJcbiAgICAgICAgICAgICAgICAgICAgLm9uZShjbGljaywgc3RvcCk7XHJcblxyXG4gICAgICAgICAgICAgICAgJGV2ZW50c1xyXG4gICAgICAgICAgICAgICAgICAgIC5iaW5kKGV2ZW50X2NvbXBsZXRlLCBzZXQpXHJcbiAgICAgICAgICAgICAgICAgICAgLmJpbmQoZXZlbnRfbG9hZCwgY2xlYXIpXHJcbiAgICAgICAgICAgICAgICAgICAgLmJpbmQoZXZlbnRfY2xlYW51cCwgc3RvcCk7XHJcblxyXG4gICAgICAgICAgICAgICAgJGJveC5yZW1vdmVDbGFzcyhjbGFzc05hbWUgKyBcIm9mZlwiKS5hZGRDbGFzcyhjbGFzc05hbWUgKyBcIm9uXCIpO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgc3RvcCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGNsZWFyKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgJGV2ZW50c1xyXG4gICAgICAgICAgICAgICAgICAgIC51bmJpbmQoZXZlbnRfY29tcGxldGUsIHNldClcclxuICAgICAgICAgICAgICAgICAgICAudW5iaW5kKGV2ZW50X2xvYWQsIGNsZWFyKVxyXG4gICAgICAgICAgICAgICAgICAgIC51bmJpbmQoZXZlbnRfY2xlYW51cCwgc3RvcCk7XHJcblxyXG4gICAgICAgICAgICAgICAgJHNsaWRlc2hvd1xyXG4gICAgICAgICAgICAgICAgICAgIC5odG1sKHNldHRpbmdzLnNsaWRlc2hvd1N0YXJ0KVxyXG4gICAgICAgICAgICAgICAgICAgIC51bmJpbmQoY2xpY2spXHJcbiAgICAgICAgICAgICAgICAgICAgLm9uZShjbGljaywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwdWJsaWNNZXRob2QubmV4dCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICRib3gucmVtb3ZlQ2xhc3MoY2xhc3NOYW1lICsgXCJvblwiKS5hZGRDbGFzcyhjbGFzc05hbWUgKyBcIm9mZlwiKTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGlmIChzZXR0aW5ncy5zbGlkZXNob3dBdXRvKSB7XHJcbiAgICAgICAgICAgICAgICBzdGFydCgpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgc3RvcCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgJGJveC5yZW1vdmVDbGFzcyhjbGFzc05hbWUgKyBcIm9mZiBcIiArIGNsYXNzTmFtZSArIFwib25cIik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGxhdW5jaCh0YXJnZXQpIHtcclxuICAgICAgICBpZiAoIWNsb3NpbmcpIHtcclxuXHJcbiAgICAgICAgICAgIGVsZW1lbnQgPSB0YXJnZXQ7XHJcblxyXG4gICAgICAgICAgICBtYWtlU2V0dGluZ3MoKTtcclxuXHJcbiAgICAgICAgICAgICRyZWxhdGVkID0gJChlbGVtZW50KTtcclxuXHJcbiAgICAgICAgICAgIGluZGV4ID0gMDtcclxuXHJcbiAgICAgICAgICAgIGlmIChzZXR0aW5ncy5yZWwgIT09ICdub2ZvbGxvdycpIHtcclxuICAgICAgICAgICAgICAgICRyZWxhdGVkID0gJCgnLicgKyBib3hFbGVtZW50KS5maWx0ZXIoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBkYXRhID0gJC5kYXRhKHRoaXMsIGNvbG9yYm94KSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVsUmVsYXRlZDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVsUmVsYXRlZCA9ICAkKHRoaXMpLmRhdGEoJ3JlbCcpIHx8IGRhdGEucmVsIHx8IHRoaXMucmVsO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChyZWxSZWxhdGVkID09PSBzZXR0aW5ncy5yZWwpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBpbmRleCA9ICRyZWxhdGVkLmluZGV4KGVsZW1lbnQpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIENoZWNrIGRpcmVjdCBjYWxscyB0byBDb2xvckJveC5cclxuICAgICAgICAgICAgICAgIGlmIChpbmRleCA9PT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICAkcmVsYXRlZCA9ICRyZWxhdGVkLmFkZChlbGVtZW50KTtcclxuICAgICAgICAgICAgICAgICAgICBpbmRleCA9ICRyZWxhdGVkLmxlbmd0aCAtIDE7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICRvdmVybGF5LmNzcyh7XHJcbiAgICAgICAgICAgICAgICBvcGFjaXR5OiBwYXJzZUZsb2F0KHNldHRpbmdzLm9wYWNpdHkpLFxyXG4gICAgICAgICAgICAgICAgY3Vyc29yOiBzZXR0aW5ncy5vdmVybGF5Q2xvc2UgPyBcInBvaW50ZXJcIiA6IFwiYXV0b1wiLFxyXG4gICAgICAgICAgICAgICAgdmlzaWJpbGl0eTogJ3Zpc2libGUnXHJcbiAgICAgICAgICAgIH0pLnNob3coKTtcclxuXHJcbiAgICAgICAgICAgIGlmICghb3Blbikge1xyXG4gICAgICAgICAgICAgICAgb3BlbiA9IGFjdGl2ZSA9IHRydWU7IC8vIFByZXZlbnRzIHRoZSBwYWdlLWNoYW5nZSBhY3Rpb24gZnJvbSBxdWV1aW5nIHVwIGlmIHRoZSB2aXNpdG9yIGhvbGRzIGRvd24gdGhlIGxlZnQgb3IgcmlnaHQga2V5cy5cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBTaG93IGNvbG9yYm94IHNvIHRoZSBzaXplcyBjYW4gYmUgY2FsY3VsYXRlZCBpbiBvbGRlciB2ZXJzaW9ucyBvZiBqUXVlcnlcclxuICAgICAgICAgICAgICAgICRib3guY3NzKHt2aXNpYmlsaXR5OidoaWRkZW4nLCBkaXNwbGF5OidibG9jayd9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAkbG9hZGVkID0gJHRhZyhkaXYsICdMb2FkZWRDb250ZW50JywgJ3dpZHRoOjA7IGhlaWdodDowOyBvdmVyZmxvdzpoaWRkZW4nKS5hcHBlbmRUbygkY29udGVudCk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQ2FjaGUgdmFsdWVzIG5lZWRlZCBmb3Igc2l6ZSBjYWxjdWxhdGlvbnNcclxuICAgICAgICAgICAgICAgIGludGVyZmFjZUhlaWdodCA9ICR0b3BCb3JkZXIuaGVpZ2h0KCkgKyAkYm90dG9tQm9yZGVyLmhlaWdodCgpICsgJGNvbnRlbnQub3V0ZXJIZWlnaHQodHJ1ZSkgLSAkY29udGVudC5oZWlnaHQoKTsvL1N1YnRyYWN0aW9uIG5lZWRlZCBmb3IgSUU2XHJcbiAgICAgICAgICAgICAgICBpbnRlcmZhY2VXaWR0aCA9ICRsZWZ0Qm9yZGVyLndpZHRoKCkgKyAkcmlnaHRCb3JkZXIud2lkdGgoKSArICRjb250ZW50Lm91dGVyV2lkdGgodHJ1ZSkgLSAkY29udGVudC53aWR0aCgpO1xyXG4gICAgICAgICAgICAgICAgbG9hZGVkSGVpZ2h0ID0gJGxvYWRlZC5vdXRlckhlaWdodCh0cnVlKTtcclxuICAgICAgICAgICAgICAgIGxvYWRlZFdpZHRoID0gJGxvYWRlZC5vdXRlcldpZHRoKHRydWUpO1xyXG5cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBPcGVucyBpbml0YWwgZW1wdHkgQ29sb3JCb3ggcHJpb3IgdG8gY29udGVudCBiZWluZyBsb2FkZWQuXHJcbiAgICAgICAgICAgICAgICBzZXR0aW5ncy53ID0gc2V0U2l6ZShzZXR0aW5ncy5pbml0aWFsV2lkdGgsICd4Jyk7XHJcbiAgICAgICAgICAgICAgICBzZXR0aW5ncy5oID0gc2V0U2l6ZShzZXR0aW5ncy5pbml0aWFsSGVpZ2h0LCAneScpO1xyXG4gICAgICAgICAgICAgICAgcHVibGljTWV0aG9kLnBvc2l0aW9uKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGlzSUU2KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJHdpbmRvdy5iaW5kKCdyZXNpemUuJyArIGV2ZW50X2llNiArICcgc2Nyb2xsLicgKyBldmVudF9pZTYsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJG92ZXJsYXkuY3NzKHt3aWR0aDogJHdpbmRvdy53aWR0aCgpLCBoZWlnaHQ6ICR3aW5kb3cuaGVpZ2h0KCksIHRvcDogJHdpbmRvdy5zY3JvbGxUb3AoKSwgbGVmdDogJHdpbmRvdy5zY3JvbGxMZWZ0KCl9KTtcclxuICAgICAgICAgICAgICAgICAgICB9KS50cmlnZ2VyKCdyZXNpemUuJyArIGV2ZW50X2llNik7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgc2xpZGVzaG93KCk7XHJcblxyXG4gICAgICAgICAgICAgICAgdHJpZ2dlcihldmVudF9vcGVuLCBzZXR0aW5ncy5vbk9wZW4pO1xyXG5cclxuICAgICAgICAgICAgICAgICRncm91cENvbnRyb2xzLmFkZCgkdGl0bGUpLmhpZGUoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAkY2xvc2UuaHRtbChzZXR0aW5ncy5jbG9zZSkuc2hvdygpO1xyXG5cclxuICAgICAgICAgICAgICAgICRib3guZm9jdXMoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBDb25maW5lIGZvY3VzIHRvIHRoZSBtb2RhbFxyXG4gICAgICAgICAgICAgICAgLy8gVXNlcyBldmVudCBjYXB0dXJpbmcgdGhhdCBpcyBub3Qgc3VwcG9ydGVkIGluIElFOC1cclxuICAgICAgICAgICAgICAgIGlmIChkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgdHJhcEZvY3VzLCB0cnVlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgJGV2ZW50cy5vbmUoZXZlbnRfY2xvc2VkLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgdHJhcEZvY3VzLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBSZXR1cm4gZm9jdXMgb24gY2xvc2luZ1xyXG4gICAgICAgICAgICAgICAgaWYgKHNldHRpbmdzLnJldHVybkZvY3VzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJGV2ZW50cy5vbmUoZXZlbnRfY2xvc2VkLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQoZWxlbWVudCkuZm9jdXMoKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcHVibGljTWV0aG9kLmxvYWQodHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIENvbG9yQm94J3MgbWFya3VwIG5lZWRzIHRvIGJlIGFkZGVkIHRvIHRoZSBET00gcHJpb3IgdG8gYmVpbmcgY2FsbGVkXHJcbiAgICAvLyBzbyB0aGF0IHRoZSBicm93c2VyIHdpbGwgZ28gYWhlYWQgYW5kIGxvYWQgdGhlIENTUyBiYWNrZ3JvdW5kIGltYWdlcy5cclxuICAgIGZ1bmN0aW9uIGFwcGVuZEhUTUwoKSB7XHJcbiAgICAgICAgaWYgKCEkYm94ICYmIGRvY3VtZW50LmJvZHkpIHtcclxuICAgICAgICAgICAgaW5pdCA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgJHdpbmRvdyA9ICQod2luZG93KTtcclxuICAgICAgICAgICAgJGJveCA9ICR0YWcoZGl2KS5hdHRyKHtcclxuICAgICAgICAgICAgICAgIGlkOiBjb2xvcmJveCxcclxuICAgICAgICAgICAgICAgICdjbGFzcyc6IGlzSUUgPyBwcmVmaXggKyAoaXNJRTYgPyAnSUU2JyA6ICdJRScpIDogJycsXHJcbiAgICAgICAgICAgICAgICByb2xlOiAnZGlhbG9nJyxcclxuICAgICAgICAgICAgICAgIHRhYmluZGV4OiAnLTEnXHJcbiAgICAgICAgICAgIH0pLmhpZGUoKTtcclxuICAgICAgICAgICAgJG92ZXJsYXkgPSAkdGFnKGRpdiwgXCJPdmVybGF5XCIsIGlzSUU2ID8gJ3Bvc2l0aW9uOmFic29sdXRlJyA6ICcnKS5oaWRlKCk7XHJcbiAgICAgICAgICAgICRsb2FkaW5nT3ZlcmxheSA9ICR0YWcoZGl2LCBcIkxvYWRpbmdPdmVybGF5XCIpLmFkZCgkdGFnKGRpdiwgXCJMb2FkaW5nR3JhcGhpY1wiKSk7XHJcbiAgICAgICAgICAgICR3cmFwID0gJHRhZyhkaXYsIFwiV3JhcHBlclwiKTtcclxuICAgICAgICAgICAgJGNvbnRlbnQgPSAkdGFnKGRpdiwgXCJDb250ZW50XCIpLmFwcGVuZChcclxuICAgICAgICAgICAgICAgICR0aXRsZSA9ICR0YWcoZGl2LCBcIlRpdGxlXCIpLFxyXG4gICAgICAgICAgICAgICAgJGN1cnJlbnQgPSAkdGFnKGRpdiwgXCJDdXJyZW50XCIpLFxyXG4gICAgICAgICAgICAgICAgJHByZXYgPSAkdGFnKCdidXR0b24nLCBcIlByZXZpb3VzXCIpLFxyXG4gICAgICAgICAgICAgICAgJG5leHQgPSAkdGFnKCdidXR0b24nLCBcIk5leHRcIiksXHJcbiAgICAgICAgICAgICAgICAkc2xpZGVzaG93ID0gJHRhZygnYnV0dG9uJywgXCJTbGlkZXNob3dcIiksXHJcbiAgICAgICAgICAgICAgICAkbG9hZGluZ092ZXJsYXksXHJcbiAgICAgICAgICAgICAgICAkY2xvc2UgPSAkdGFnKCdidXR0b24nLCBcIkNsb3NlXCIpXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAkd3JhcC5hcHBlbmQoIC8vIFRoZSAzeDMgR3JpZCB0aGF0IG1ha2VzIHVwIENvbG9yQm94XHJcbiAgICAgICAgICAgICAgICAkdGFnKGRpdikuYXBwZW5kKFxyXG4gICAgICAgICAgICAgICAgICAgICR0YWcoZGl2LCBcIlRvcExlZnRcIiksXHJcbiAgICAgICAgICAgICAgICAgICAgJHRvcEJvcmRlciA9ICR0YWcoZGl2LCBcIlRvcENlbnRlclwiKSxcclxuICAgICAgICAgICAgICAgICAgICAkdGFnKGRpdiwgXCJUb3BSaWdodFwiKVxyXG4gICAgICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgICAgICR0YWcoZGl2LCBmYWxzZSwgJ2NsZWFyOmxlZnQnKS5hcHBlbmQoXHJcbiAgICAgICAgICAgICAgICAgICAgJGxlZnRCb3JkZXIgPSAkdGFnKGRpdiwgXCJNaWRkbGVMZWZ0XCIpLFxyXG4gICAgICAgICAgICAgICAgICAgICRjb250ZW50LFxyXG4gICAgICAgICAgICAgICAgICAgICRyaWdodEJvcmRlciA9ICR0YWcoZGl2LCBcIk1pZGRsZVJpZ2h0XCIpXHJcbiAgICAgICAgICAgICAgICApLFxyXG4gICAgICAgICAgICAgICAgJHRhZyhkaXYsIGZhbHNlLCAnY2xlYXI6bGVmdCcpLmFwcGVuZChcclxuICAgICAgICAgICAgICAgICAgICAkdGFnKGRpdiwgXCJCb3R0b21MZWZ0XCIpLFxyXG4gICAgICAgICAgICAgICAgICAgICRib3R0b21Cb3JkZXIgPSAkdGFnKGRpdiwgXCJCb3R0b21DZW50ZXJcIiksXHJcbiAgICAgICAgICAgICAgICAgICAgJHRhZyhkaXYsIFwiQm90dG9tUmlnaHRcIilcclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgKS5maW5kKCdkaXYgZGl2JykuY3NzKHsnZmxvYXQnOiAnbGVmdCd9KTtcclxuXHJcbiAgICAgICAgICAgICRsb2FkaW5nQmF5ID0gJHRhZyhkaXYsIGZhbHNlLCAncG9zaXRpb246YWJzb2x1dGU7IHdpZHRoOjk5OTlweDsgdmlzaWJpbGl0eTpoaWRkZW47IGRpc3BsYXk6bm9uZScpO1xyXG5cclxuICAgICAgICAgICAgJGdyb3VwQ29udHJvbHMgPSAkbmV4dC5hZGQoJHByZXYpLmFkZCgkY3VycmVudCkuYWRkKCRzbGlkZXNob3cpO1xyXG5cclxuICAgICAgICAgICAgJChkb2N1bWVudC5ib2R5KS5hcHBlbmQoJG92ZXJsYXksICRib3guYXBwZW5kKCR3cmFwLCAkbG9hZGluZ0JheSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBBZGQgQ29sb3JCb3gncyBldmVudCBiaW5kaW5nc1xyXG4gICAgZnVuY3Rpb24gYWRkQmluZGluZ3MoKSB7XHJcbiAgICAgICAgZnVuY3Rpb24gY2xpY2tIYW5kbGVyKGUpIHtcclxuICAgICAgICAgICAgLy8gaWdub3JlIG5vbi1sZWZ0LW1vdXNlLWNsaWNrcyBhbmQgY2xpY2tzIG1vZGlmaWVkIHdpdGggY3RybCAvIGNvbW1hbmQsIHNoaWZ0LCBvciBhbHQuXHJcbiAgICAgICAgICAgIC8vIFNlZTogaHR0cDovL2phY2tsbW9vcmUuY29tL25vdGVzL2NsaWNrLWV2ZW50cy9cclxuICAgICAgICAgICAgaWYgKCEoZS53aGljaCA+IDEgfHwgZS5zaGlmdEtleSB8fCBlLmFsdEtleSB8fCBlLm1ldGFLZXkpKSB7XHJcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgICBsYXVuY2godGhpcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICgkYm94KSB7XHJcbiAgICAgICAgICAgIGlmICghaW5pdCkge1xyXG4gICAgICAgICAgICAgICAgaW5pdCA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQW5vbnltb3VzIGZ1bmN0aW9ucyBoZXJlIGtlZXAgdGhlIHB1YmxpYyBtZXRob2QgZnJvbSBiZWluZyBjYWNoZWQsIHRoZXJlYnkgYWxsb3dpbmcgdGhlbSB0byBiZSByZWRlZmluZWQgb24gdGhlIGZseS5cclxuICAgICAgICAgICAgICAgICRuZXh0LmNsaWNrKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBwdWJsaWNNZXRob2QubmV4dCgpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAkcHJldi5jbGljayhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcHVibGljTWV0aG9kLnByZXYoKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgJGNsb3NlLmNsaWNrKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBwdWJsaWNNZXRob2QuY2xvc2UoKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgJG92ZXJsYXkuY2xpY2soZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzZXR0aW5ncy5vdmVybGF5Q2xvc2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHVibGljTWV0aG9kLmNsb3NlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gS2V5IEJpbmRpbmdzXHJcbiAgICAgICAgICAgICAgICAkKGRvY3VtZW50KS5iaW5kKCdrZXlkb3duLicgKyBwcmVmaXgsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGtleSA9IGUua2V5Q29kZTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAob3BlbiAmJiBzZXR0aW5ncy5lc2NLZXkgJiYga2V5ID09PSAyNykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHB1YmxpY01ldGhvZC5jbG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAob3BlbiAmJiBzZXR0aW5ncy5hcnJvd0tleSAmJiAkcmVsYXRlZFsxXSAmJiAhZS5hbHRLZXkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGtleSA9PT0gMzcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRwcmV2LmNsaWNrKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoa2V5ID09PSAzOSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJG5leHQuY2xpY2soKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICgkLmlzRnVuY3Rpb24oJC5mbi5vbikpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBGb3IgalF1ZXJ5IDEuNytcclxuICAgICAgICAgICAgICAgICAgICAkKGRvY3VtZW50KS5vbignY2xpY2suJytwcmVmaXgsICcuJytib3hFbGVtZW50LCBjbGlja0hhbmRsZXIpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBGb3IgalF1ZXJ5IDEuMy54IC0+IDEuNi54XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyBjb2RlIGlzIG5ldmVyIHJlYWNoZWQgaW4galF1ZXJ5IDEuOSwgc28gZG8gbm90IGNvbnRhY3QgbWUgYWJvdXQgJ2xpdmUnIGJlaW5nIHJlbW92ZWQuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyBpcyBub3QgaGVyZSBmb3IgalF1ZXJ5IDEuOSwgaXQncyBoZXJlIGZvciBsZWdhY3kgdXNlcnMuXHJcbiAgICAgICAgICAgICAgICAgICAgJCgnLicrYm94RWxlbWVudCkubGl2ZSgnY2xpY2suJytwcmVmaXgsIGNsaWNrSGFuZGxlcik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiBDb2xvckJveCBhbHJlYWR5IGV4aXN0cy5cclxuICAgIGlmICgkLmNvbG9yYm94KSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEFwcGVuZCB0aGUgSFRNTCB3aGVuIHRoZSBET00gbG9hZHNcclxuICAgICQoYXBwZW5kSFRNTCk7XHJcblxyXG5cclxuICAgIC8vICoqKioqKioqKioqKioqKipcclxuICAgIC8vIFBVQkxJQyBGVU5DVElPTlNcclxuICAgIC8vIFVzYWdlIGZvcm1hdDogJC5mbi5jb2xvcmJveC5jbG9zZSgpO1xyXG4gICAgLy8gVXNhZ2UgZnJvbSB3aXRoaW4gYW4gaWZyYW1lOiBwYXJlbnQuJC5mbi5jb2xvcmJveC5jbG9zZSgpO1xyXG4gICAgLy8gKioqKioqKioqKioqKioqKlxyXG5cclxuICAgIHB1YmxpY01ldGhvZCA9ICQuZm5bY29sb3Jib3hdID0gJFtjb2xvcmJveF0gPSBmdW5jdGlvbiAob3B0aW9ucywgY2FsbGJhY2spIHtcclxuICAgICAgICB2YXIgJHRoaXMgPSB0aGlzO1xyXG5cclxuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuXHJcbiAgICAgICAgYXBwZW5kSFRNTCgpO1xyXG5cclxuICAgICAgICBpZiAoYWRkQmluZGluZ3MoKSkge1xyXG4gICAgICAgICAgICBpZiAoJC5pc0Z1bmN0aW9uKCR0aGlzKSkgeyAvLyBhc3N1bWUgYSBjYWxsIHRvICQuY29sb3Jib3hcclxuICAgICAgICAgICAgICAgICR0aGlzID0gJCgnPGEvPicpO1xyXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5vcGVuID0gdHJ1ZTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmICghJHRoaXNbMF0pIHsgLy8gY29sb3Jib3ggYmVpbmcgYXBwbGllZCB0byBlbXB0eSBjb2xsZWN0aW9uXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gJHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5vbkNvbXBsZXRlID0gY2FsbGJhY2s7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICR0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgJC5kYXRhKHRoaXMsIGNvbG9yYm94LCAkLmV4dGVuZCh7fSwgJC5kYXRhKHRoaXMsIGNvbG9yYm94KSB8fCBkZWZhdWx0cywgb3B0aW9ucykpO1xyXG4gICAgICAgICAgICB9KS5hZGRDbGFzcyhib3hFbGVtZW50KTtcclxuXHJcbiAgICAgICAgICAgIGlmICgoJC5pc0Z1bmN0aW9uKG9wdGlvbnMub3BlbikgJiYgb3B0aW9ucy5vcGVuLmNhbGwoJHRoaXMpKSB8fCBvcHRpb25zLm9wZW4pIHtcclxuICAgICAgICAgICAgICAgIGxhdW5jaCgkdGhpc1swXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiAkdGhpcztcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljTWV0aG9kLnBvc2l0aW9uID0gZnVuY3Rpb24gKHNwZWVkLCBsb2FkZWRDYWxsYmFjaykge1xyXG4gICAgICAgIHZhclxyXG4gICAgICAgICAgICBjc3MsXHJcbiAgICAgICAgICAgIHRvcCA9IDAsXHJcbiAgICAgICAgICAgIGxlZnQgPSAwLFxyXG4gICAgICAgICAgICBvZmZzZXQgPSAkYm94Lm9mZnNldCgpLFxyXG4gICAgICAgICAgICBzY3JvbGxUb3AsXHJcbiAgICAgICAgICAgIHNjcm9sbExlZnQ7XHJcblxyXG4gICAgICAgICR3aW5kb3cudW5iaW5kKCdyZXNpemUuJyArIHByZWZpeCk7XHJcblxyXG4gICAgICAgIC8vIHJlbW92ZSB0aGUgbW9kYWwgc28gdGhhdCBpdCBkb2Vzbid0IGluZmx1ZW5jZSB0aGUgZG9jdW1lbnQgd2lkdGgvaGVpZ2h0XHJcbiAgICAgICAgJGJveC5jc3Moe3RvcDogLTllNCwgbGVmdDogLTllNH0pO1xyXG5cclxuICAgICAgICBzY3JvbGxUb3AgPSAkd2luZG93LnNjcm9sbFRvcCgpO1xyXG4gICAgICAgIHNjcm9sbExlZnQgPSAkd2luZG93LnNjcm9sbExlZnQoKTtcclxuXHJcbiAgICAgICAgaWYgKHNldHRpbmdzLmZpeGVkICYmICFpc0lFNikge1xyXG4gICAgICAgICAgICBvZmZzZXQudG9wIC09IHNjcm9sbFRvcDtcclxuICAgICAgICAgICAgb2Zmc2V0LmxlZnQgLT0gc2Nyb2xsTGVmdDtcclxuICAgICAgICAgICAgJGJveC5jc3Moe3Bvc2l0aW9uOiAnZml4ZWQnfSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdG9wID0gc2Nyb2xsVG9wO1xyXG4gICAgICAgICAgICBsZWZ0ID0gc2Nyb2xsTGVmdDtcclxuICAgICAgICAgICAgJGJveC5jc3Moe3Bvc2l0aW9uOiAnYWJzb2x1dGUnfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBrZWVwcyB0aGUgdG9wIGFuZCBsZWZ0IHBvc2l0aW9ucyB3aXRoaW4gdGhlIGJyb3dzZXIncyB2aWV3cG9ydC5cclxuICAgICAgICBpZiAoc2V0dGluZ3MucmlnaHQgIT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgIGxlZnQgKz0gTWF0aC5tYXgoJHdpbmRvdy53aWR0aCgpIC0gc2V0dGluZ3MudyAtIGxvYWRlZFdpZHRoIC0gaW50ZXJmYWNlV2lkdGggLSBzZXRTaXplKHNldHRpbmdzLnJpZ2h0LCAneCcpLCAwKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHNldHRpbmdzLmxlZnQgIT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgIGxlZnQgKz0gc2V0U2l6ZShzZXR0aW5ncy5sZWZ0LCAneCcpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGxlZnQgKz0gTWF0aC5yb3VuZChNYXRoLm1heCgkd2luZG93LndpZHRoKCkgLSBzZXR0aW5ncy53IC0gbG9hZGVkV2lkdGggLSBpbnRlcmZhY2VXaWR0aCwgMCkgLyAyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzZXR0aW5ncy5ib3R0b20gIT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgIHRvcCArPSBNYXRoLm1heCgkd2luZG93LmhlaWdodCgpIC0gc2V0dGluZ3MuaCAtIGxvYWRlZEhlaWdodCAtIGludGVyZmFjZUhlaWdodCAtIHNldFNpemUoc2V0dGluZ3MuYm90dG9tLCAneScpLCAwKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHNldHRpbmdzLnRvcCAhPT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgdG9wICs9IHNldFNpemUoc2V0dGluZ3MudG9wLCAneScpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRvcCArPSBNYXRoLnJvdW5kKE1hdGgubWF4KCR3aW5kb3cuaGVpZ2h0KCkgLSBzZXR0aW5ncy5oIC0gbG9hZGVkSGVpZ2h0IC0gaW50ZXJmYWNlSGVpZ2h0LCAwKSAvIDIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgJGJveC5jc3Moe3RvcDogb2Zmc2V0LnRvcCwgbGVmdDogb2Zmc2V0LmxlZnQsIHZpc2liaWxpdHk6J3Zpc2libGUnfSk7XHJcblxyXG4gICAgICAgIC8vIHNldHRpbmcgdGhlIHNwZWVkIHRvIDAgdG8gcmVkdWNlIHRoZSBkZWxheSBiZXR3ZWVuIHNhbWUtc2l6ZWQgY29udGVudC5cclxuICAgICAgICBzcGVlZCA9ICgkYm94LndpZHRoKCkgPT09IHNldHRpbmdzLncgKyBsb2FkZWRXaWR0aCAmJiAkYm94LmhlaWdodCgpID09PSBzZXR0aW5ncy5oICsgbG9hZGVkSGVpZ2h0KSA/IDAgOiBzcGVlZCB8fCAwO1xyXG5cclxuICAgICAgICAvLyB0aGlzIGdpdmVzIHRoZSB3cmFwcGVyIHBsZW50eSBvZiBicmVhdGhpbmcgcm9vbSBzbyBpdCdzIGZsb2F0ZWQgY29udGVudHMgY2FuIG1vdmUgYXJvdW5kIHNtb290aGx5LFxyXG4gICAgICAgIC8vIGJ1dCBpdCBoYXMgdG8gYmUgc2hyYW5rIGRvd24gYXJvdW5kIHRoZSBzaXplIG9mIGRpdiNjb2xvcmJveCB3aGVuIGl0J3MgZG9uZS4gIElmIG5vdCxcclxuICAgICAgICAvLyBpdCBjYW4gaW52b2tlIGFuIG9ic2N1cmUgSUUgYnVnIHdoZW4gdXNpbmcgaWZyYW1lcy5cclxuICAgICAgICAkd3JhcFswXS5zdHlsZS53aWR0aCA9ICR3cmFwWzBdLnN0eWxlLmhlaWdodCA9IFwiOTk5OXB4XCI7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIG1vZGFsRGltZW5zaW9ucyh0aGF0KSB7XHJcbiAgICAgICAgICAgICR0b3BCb3JkZXJbMF0uc3R5bGUud2lkdGggPSAkYm90dG9tQm9yZGVyWzBdLnN0eWxlLndpZHRoID0gJGNvbnRlbnRbMF0uc3R5bGUud2lkdGggPSAocGFyc2VJbnQodGhhdC5zdHlsZS53aWR0aCwxMCkgLSBpbnRlcmZhY2VXaWR0aCkrJ3B4JztcclxuICAgICAgICAgICAgJGNvbnRlbnRbMF0uc3R5bGUuaGVpZ2h0ID0gJGxlZnRCb3JkZXJbMF0uc3R5bGUuaGVpZ2h0ID0gJHJpZ2h0Qm9yZGVyWzBdLnN0eWxlLmhlaWdodCA9IChwYXJzZUludCh0aGF0LnN0eWxlLmhlaWdodCwxMCkgLSBpbnRlcmZhY2VIZWlnaHQpKydweCc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjc3MgPSB7d2lkdGg6IHNldHRpbmdzLncgKyBsb2FkZWRXaWR0aCArIGludGVyZmFjZVdpZHRoLCBoZWlnaHQ6IHNldHRpbmdzLmggKyBsb2FkZWRIZWlnaHQgKyBpbnRlcmZhY2VIZWlnaHQsIHRvcDogdG9wLCBsZWZ0OiBsZWZ0fTtcclxuXHJcbiAgICAgICAgaWYoc3BlZWQ9PT0wKXsgLy8gdGVtcG9yYXJ5IHdvcmthcm91bmQgdG8gc2lkZS1zdGVwIGpRdWVyeS1VSSAxLjggYnVnIChodHRwOi8vYnVncy5qcXVlcnkuY29tL3RpY2tldC8xMjI3MylcclxuICAgICAgICAgICAgJGJveC5jc3MoY3NzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgJGJveC5kZXF1ZXVlKCkuYW5pbWF0ZShjc3MsIHtcclxuICAgICAgICAgICAgZHVyYXRpb246IHNwZWVkLFxyXG4gICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgbW9kYWxEaW1lbnNpb25zKHRoaXMpO1xyXG5cclxuICAgICAgICAgICAgICAgIGFjdGl2ZSA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIHNocmluayB0aGUgd3JhcHBlciBkb3duIHRvIGV4YWN0bHkgdGhlIHNpemUgb2YgY29sb3Jib3ggdG8gYXZvaWQgYSBidWcgaW4gSUUncyBpZnJhbWUgaW1wbGVtZW50YXRpb24uXHJcbiAgICAgICAgICAgICAgICAkd3JhcFswXS5zdHlsZS53aWR0aCA9IChzZXR0aW5ncy53ICsgbG9hZGVkV2lkdGggKyBpbnRlcmZhY2VXaWR0aCkgKyBcInB4XCI7XHJcbiAgICAgICAgICAgICAgICAkd3JhcFswXS5zdHlsZS5oZWlnaHQgPSAoc2V0dGluZ3MuaCArIGxvYWRlZEhlaWdodCArIGludGVyZmFjZUhlaWdodCkgKyBcInB4XCI7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHNldHRpbmdzLnJlcG9zaXRpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHsgIC8vIHNtYWxsIGRlbGF5IGJlZm9yZSBiaW5kaW5nIG9ucmVzaXplIGR1ZSB0byBhbiBJRTggYnVnLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAkd2luZG93LmJpbmQoJ3Jlc2l6ZS4nICsgcHJlZml4LCBwdWJsaWNNZXRob2QucG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgIH0sIDEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChsb2FkZWRDYWxsYmFjaykge1xyXG4gICAgICAgICAgICAgICAgICAgIGxvYWRlZENhbGxiYWNrKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHN0ZXA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIG1vZGFsRGltZW5zaW9ucyh0aGlzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWNNZXRob2QucmVzaXplID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuICAgICAgICBpZiAob3Blbikge1xyXG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuXHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLndpZHRoKSB7XHJcbiAgICAgICAgICAgICAgICBzZXR0aW5ncy53ID0gc2V0U2l6ZShvcHRpb25zLndpZHRoLCAneCcpIC0gbG9hZGVkV2lkdGggLSBpbnRlcmZhY2VXaWR0aDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5pbm5lcldpZHRoKSB7XHJcbiAgICAgICAgICAgICAgICBzZXR0aW5ncy53ID0gc2V0U2l6ZShvcHRpb25zLmlubmVyV2lkdGgsICd4Jyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgJGxvYWRlZC5jc3Moe3dpZHRoOiBzZXR0aW5ncy53fSk7XHJcblxyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5oZWlnaHQpIHtcclxuICAgICAgICAgICAgICAgIHNldHRpbmdzLmggPSBzZXRTaXplKG9wdGlvbnMuaGVpZ2h0LCAneScpIC0gbG9hZGVkSGVpZ2h0IC0gaW50ZXJmYWNlSGVpZ2h0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmlubmVySGVpZ2h0KSB7XHJcbiAgICAgICAgICAgICAgICBzZXR0aW5ncy5oID0gc2V0U2l6ZShvcHRpb25zLmlubmVySGVpZ2h0LCAneScpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICghb3B0aW9ucy5pbm5lckhlaWdodCAmJiAhb3B0aW9ucy5oZWlnaHQpIHtcclxuICAgICAgICAgICAgICAgICRsb2FkZWQuY3NzKHtoZWlnaHQ6IFwiYXV0b1wifSk7XHJcbiAgICAgICAgICAgICAgICBzZXR0aW5ncy5oID0gJGxvYWRlZC5oZWlnaHQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAkbG9hZGVkLmNzcyh7aGVpZ2h0OiBzZXR0aW5ncy5ofSk7XHJcblxyXG4gICAgICAgICAgICBwdWJsaWNNZXRob2QucG9zaXRpb24oc2V0dGluZ3MudHJhbnNpdGlvbiA9PT0gXCJub25lXCIgPyAwIDogc2V0dGluZ3Muc3BlZWQpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgcHVibGljTWV0aG9kLnByZXAgPSBmdW5jdGlvbiAob2JqZWN0KSB7XHJcbiAgICAgICAgaWYgKCFvcGVuKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBjYWxsYmFjaywgc3BlZWQgPSBzZXR0aW5ncy50cmFuc2l0aW9uID09PSBcIm5vbmVcIiA/IDAgOiBzZXR0aW5ncy5zcGVlZDtcclxuXHJcbiAgICAgICAgJGxvYWRlZC5lbXB0eSgpLnJlbW92ZSgpOyAvLyBVc2luZyBlbXB0eSBmaXJzdCBtYXkgcHJldmVudCBzb21lIElFNyBpc3N1ZXMuXHJcblxyXG4gICAgICAgICRsb2FkZWQgPSAkdGFnKGRpdiwgJ0xvYWRlZENvbnRlbnQnKS5hcHBlbmQob2JqZWN0KTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0V2lkdGgoKSB7XHJcbiAgICAgICAgICAgIHNldHRpbmdzLncgPSBzZXR0aW5ncy53IHx8ICRsb2FkZWQud2lkdGgoKTtcclxuICAgICAgICAgICAgc2V0dGluZ3MudyA9IHNldHRpbmdzLm13ICYmIHNldHRpbmdzLm13IDwgc2V0dGluZ3MudyA/IHNldHRpbmdzLm13IDogc2V0dGluZ3MudztcclxuICAgICAgICAgICAgcmV0dXJuIHNldHRpbmdzLnc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIGdldEhlaWdodCgpIHtcclxuICAgICAgICAgICAgc2V0dGluZ3MuaCA9IHNldHRpbmdzLmggfHwgJGxvYWRlZC5oZWlnaHQoKTtcclxuICAgICAgICAgICAgc2V0dGluZ3MuaCA9IHNldHRpbmdzLm1oICYmIHNldHRpbmdzLm1oIDwgc2V0dGluZ3MuaCA/IHNldHRpbmdzLm1oIDogc2V0dGluZ3MuaDtcclxuICAgICAgICAgICAgcmV0dXJuIHNldHRpbmdzLmg7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAkbG9hZGVkLmhpZGUoKVxyXG4gICAgICAgICAgICAuYXBwZW5kVG8oJGxvYWRpbmdCYXkuc2hvdygpKS8vIGNvbnRlbnQgaGFzIHRvIGJlIGFwcGVuZGVkIHRvIHRoZSBET00gZm9yIGFjY3VyYXRlIHNpemUgY2FsY3VsYXRpb25zLlxyXG4gICAgICAgICAgICAuY3NzKHt3aWR0aDogZ2V0V2lkdGgoKSwgb3ZlcmZsb3c6IHNldHRpbmdzLnNjcm9sbGluZyA/ICdhdXRvJyA6ICdoaWRkZW4nfSlcclxuICAgICAgICAgICAgLmNzcyh7aGVpZ2h0OiBnZXRIZWlnaHQoKX0pLy8gc2V0cyB0aGUgaGVpZ2h0IGluZGVwZW5kZW50bHkgZnJvbSB0aGUgd2lkdGggaW4gY2FzZSB0aGUgbmV3IHdpZHRoIGluZmx1ZW5jZXMgdGhlIHZhbHVlIG9mIGhlaWdodC5cclxuICAgICAgICAgICAgLnByZXBlbmRUbygkY29udGVudCk7XHJcblxyXG4gICAgICAgICRsb2FkaW5nQmF5LmhpZGUoKTtcclxuXHJcbiAgICAgICAgLy8gZmxvYXRpbmcgdGhlIElNRyByZW1vdmVzIHRoZSBib3R0b20gbGluZS1oZWlnaHQgYW5kIGZpeGVkIGEgcHJvYmxlbSB3aGVyZSBJRSBtaXNjYWxjdWxhdGVzIHRoZSB3aWR0aCBvZiB0aGUgcGFyZW50IGVsZW1lbnQgYXMgMTAwJSBvZiB0aGUgZG9jdW1lbnQgd2lkdGguXHJcblxyXG4gICAgICAgICQocGhvdG8pLmNzcyh7J2Zsb2F0JzogJ25vbmUnfSk7XHJcblxyXG4gICAgICAgIGNhbGxiYWNrID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgdG90YWwgPSAkcmVsYXRlZC5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICBpZnJhbWUsXHJcbiAgICAgICAgICAgICAgICBmcmFtZUJvcmRlciA9ICdmcmFtZUJvcmRlcicsXHJcbiAgICAgICAgICAgICAgICBhbGxvd1RyYW5zcGFyZW5jeSA9ICdhbGxvd1RyYW5zcGFyZW5jeScsXHJcbiAgICAgICAgICAgICAgICBjb21wbGV0ZTtcclxuXHJcbiAgICAgICAgICAgIGlmICghb3Blbikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmdW5jdGlvbiByZW1vdmVGaWx0ZXIoKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNJRSkge1xyXG4gICAgICAgICAgICAgICAgICAgICRib3hbMF0uc3R5bGUucmVtb3ZlQXR0cmlidXRlKCdmaWx0ZXInKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY29tcGxldGUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQobG9hZGluZ1RpbWVyKTtcclxuICAgICAgICAgICAgICAgICRsb2FkaW5nT3ZlcmxheS5oaWRlKCk7XHJcbiAgICAgICAgICAgICAgICB0cmlnZ2VyKGV2ZW50X2NvbXBsZXRlLCBzZXR0aW5ncy5vbkNvbXBsZXRlKTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGlmIChpc0lFKSB7XHJcbiAgICAgICAgICAgICAgICAvL1RoaXMgZmFkZUluIGhlbHBzIHRoZSBiaWN1YmljIHJlc2FtcGxpbmcgdG8ga2ljay1pbi5cclxuICAgICAgICAgICAgICAgIGlmIChwaG90bykge1xyXG4gICAgICAgICAgICAgICAgICAgICRsb2FkZWQuZmFkZUluKDEwMCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICR0aXRsZS5odG1sKHNldHRpbmdzLnRpdGxlKS5hZGQoJGxvYWRlZCkuc2hvdygpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRvdGFsID4gMSkgeyAvLyBoYW5kbGUgZ3JvdXBpbmdcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygc2V0dGluZ3MuY3VycmVudCA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICRjdXJyZW50Lmh0bWwoc2V0dGluZ3MuY3VycmVudC5yZXBsYWNlKCd7Y3VycmVudH0nLCBpbmRleCArIDEpLnJlcGxhY2UoJ3t0b3RhbH0nLCB0b3RhbCkpLnNob3coKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAkbmV4dFsoc2V0dGluZ3MubG9vcCB8fCBpbmRleCA8IHRvdGFsIC0gMSkgPyBcInNob3dcIiA6IFwiaGlkZVwiXSgpLmh0bWwoc2V0dGluZ3MubmV4dCk7XHJcbiAgICAgICAgICAgICAgICAkcHJldlsoc2V0dGluZ3MubG9vcCB8fCBpbmRleCkgPyBcInNob3dcIiA6IFwiaGlkZVwiXSgpLmh0bWwoc2V0dGluZ3MucHJldmlvdXMpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChzZXR0aW5ncy5zbGlkZXNob3cpIHtcclxuICAgICAgICAgICAgICAgICAgICAkc2xpZGVzaG93LnNob3coKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBQcmVsb2FkcyBpbWFnZXMgd2l0aGluIGEgcmVsIGdyb3VwXHJcbiAgICAgICAgICAgICAgICBpZiAoc2V0dGluZ3MucHJlbG9hZGluZykge1xyXG4gICAgICAgICAgICAgICAgICAgICQuZWFjaChbZ2V0SW5kZXgoLTEpLCBnZXRJbmRleCgxKV0sIGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzcmMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbWcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpID0gJHJlbGF0ZWRbdGhpc10sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhID0gJC5kYXRhKGksIGNvbG9yYm94KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkYXRhICYmIGRhdGEuaHJlZikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3JjID0gZGF0YS5ocmVmO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCQuaXNGdW5jdGlvbihzcmMpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3JjID0gc3JjLmNhbGwoaSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmMgPSAkKGkpLmF0dHIoJ2hyZWYnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNyYyAmJiBpc0ltYWdlKGRhdGEsIHNyYykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyYyA9IHJldGluYVVybChkYXRhLCBzcmMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW1nID0gbmV3IEltYWdlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbWcuc3JjID0gc3JjO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAkZ3JvdXBDb250cm9scy5oaWRlKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChzZXR0aW5ncy5pZnJhbWUpIHtcclxuICAgICAgICAgICAgICAgIGlmcmFtZSA9ICR0YWcoJ2lmcmFtZScpWzBdO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChmcmFtZUJvcmRlciBpbiBpZnJhbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZnJhbWVbZnJhbWVCb3JkZXJdID0gMDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoYWxsb3dUcmFuc3BhcmVuY3kgaW4gaWZyYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWZyYW1lW2FsbG93VHJhbnNwYXJlbmN5XSA9IFwidHJ1ZVwiO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmICghc2V0dGluZ3Muc2Nyb2xsaW5nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWZyYW1lLnNjcm9sbGluZyA9IFwibm9cIjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAkKGlmcmFtZSlcclxuICAgICAgICAgICAgICAgICAgICAuYXR0cih7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNyYzogc2V0dGluZ3MuaHJlZixcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogKG5ldyBEYXRlKCkpLmdldFRpbWUoKSwgLy8gZ2l2ZSB0aGUgaWZyYW1lIGEgdW5pcXVlIG5hbWUgdG8gcHJldmVudCBjYWNoaW5nXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdjbGFzcyc6IHByZWZpeCArICdJZnJhbWUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhbGxvd0Z1bGxTY3JlZW4gOiB0cnVlLCAvLyBhbGxvdyBIVE1MNSB2aWRlbyB0byBnbyBmdWxsc2NyZWVuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdlYmtpdEFsbG93RnVsbFNjcmVlbiA6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vemFsbG93ZnVsbHNjcmVlbiA6IHRydWVcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgIC5vbmUoJ2xvYWQnLCBjb21wbGV0ZSlcclxuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kVG8oJGxvYWRlZCk7XHJcblxyXG4gICAgICAgICAgICAgICAgJGV2ZW50cy5vbmUoZXZlbnRfcHVyZ2UsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZnJhbWUuc3JjID0gXCIvL2Fib3V0OmJsYW5rXCI7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoc2V0dGluZ3MuZmFzdElmcmFtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICQoaWZyYW1lKS50cmlnZ2VyKCdsb2FkJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb21wbGV0ZSgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoc2V0dGluZ3MudHJhbnNpdGlvbiA9PT0gJ2ZhZGUnKSB7XHJcbiAgICAgICAgICAgICAgICAkYm94LmZhZGVUbyhzcGVlZCwgMSwgcmVtb3ZlRmlsdGVyKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJlbW92ZUZpbHRlcigpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKHNldHRpbmdzLnRyYW5zaXRpb24gPT09ICdmYWRlJykge1xyXG4gICAgICAgICAgICAkYm94LmZhZGVUbyhzcGVlZCwgMCwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcHVibGljTWV0aG9kLnBvc2l0aW9uKDAsIGNhbGxiYWNrKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcHVibGljTWV0aG9kLnBvc2l0aW9uKHNwZWVkLCBjYWxsYmFjayk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWNNZXRob2QubG9hZCA9IGZ1bmN0aW9uIChsYXVuY2hlZCkge1xyXG4gICAgICAgIHZhciBocmVmLCBzZXRSZXNpemUsIHByZXAgPSBwdWJsaWNNZXRob2QucHJlcCwgJGlubGluZTtcclxuXHJcbiAgICAgICAgYWN0aXZlID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgcGhvdG8gPSBmYWxzZTtcclxuXHJcbiAgICAgICAgZWxlbWVudCA9ICRyZWxhdGVkW2luZGV4XTtcclxuXHJcbiAgICAgICAgaWYgKCFsYXVuY2hlZCkge1xyXG4gICAgICAgICAgICBtYWtlU2V0dGluZ3MoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChjbGFzc05hbWUpIHtcclxuICAgICAgICAgICAgJGJveC5hZGQoJG92ZXJsYXkpLnJlbW92ZUNsYXNzKGNsYXNzTmFtZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChzZXR0aW5ncy5jbGFzc05hbWUpIHtcclxuICAgICAgICAgICAgJGJveC5hZGQoJG92ZXJsYXkpLmFkZENsYXNzKHNldHRpbmdzLmNsYXNzTmFtZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNsYXNzTmFtZSA9IHNldHRpbmdzLmNsYXNzTmFtZTtcclxuXHJcbiAgICAgICAgdHJpZ2dlcihldmVudF9wdXJnZSk7XHJcblxyXG4gICAgICAgIHRyaWdnZXIoZXZlbnRfbG9hZCwgc2V0dGluZ3Mub25Mb2FkKTtcclxuXHJcbiAgICAgICAgc2V0dGluZ3MuaCA9IHNldHRpbmdzLmhlaWdodCA/XHJcbiAgICAgICAgICAgIHNldFNpemUoc2V0dGluZ3MuaGVpZ2h0LCAneScpIC0gbG9hZGVkSGVpZ2h0IC0gaW50ZXJmYWNlSGVpZ2h0IDpcclxuICAgICAgICAgICAgc2V0dGluZ3MuaW5uZXJIZWlnaHQgJiYgc2V0U2l6ZShzZXR0aW5ncy5pbm5lckhlaWdodCwgJ3knKTtcclxuXHJcbiAgICAgICAgc2V0dGluZ3MudyA9IHNldHRpbmdzLndpZHRoID9cclxuICAgICAgICAgICAgc2V0U2l6ZShzZXR0aW5ncy53aWR0aCwgJ3gnKSAtIGxvYWRlZFdpZHRoIC0gaW50ZXJmYWNlV2lkdGggOlxyXG4gICAgICAgICAgICBzZXR0aW5ncy5pbm5lcldpZHRoICYmIHNldFNpemUoc2V0dGluZ3MuaW5uZXJXaWR0aCwgJ3gnKTtcclxuXHJcbiAgICAgICAgLy8gU2V0cyB0aGUgbWluaW11bSBkaW1lbnNpb25zIGZvciB1c2UgaW4gaW1hZ2Ugc2NhbGluZ1xyXG4gICAgICAgIHNldHRpbmdzLm13ID0gc2V0dGluZ3MudztcclxuICAgICAgICBzZXR0aW5ncy5taCA9IHNldHRpbmdzLmg7XHJcblxyXG4gICAgICAgIC8vIFJlLWV2YWx1YXRlIHRoZSBtaW5pbXVtIHdpZHRoIGFuZCBoZWlnaHQgYmFzZWQgb24gbWF4V2lkdGggYW5kIG1heEhlaWdodCB2YWx1ZXMuXHJcbiAgICAgICAgLy8gSWYgdGhlIHdpZHRoIG9yIGhlaWdodCBleGNlZWQgdGhlIG1heFdpZHRoIG9yIG1heEhlaWdodCwgdXNlIHRoZSBtYXhpbXVtIHZhbHVlcyBpbnN0ZWFkLlxyXG4gICAgICAgIGlmIChzZXR0aW5ncy5tYXhXaWR0aCkge1xyXG4gICAgICAgICAgICBzZXR0aW5ncy5tdyA9IHNldFNpemUoc2V0dGluZ3MubWF4V2lkdGgsICd4JykgLSBsb2FkZWRXaWR0aCAtIGludGVyZmFjZVdpZHRoO1xyXG4gICAgICAgICAgICBzZXR0aW5ncy5tdyA9IHNldHRpbmdzLncgJiYgc2V0dGluZ3MudyA8IHNldHRpbmdzLm13ID8gc2V0dGluZ3MudyA6IHNldHRpbmdzLm13O1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoc2V0dGluZ3MubWF4SGVpZ2h0KSB7XHJcbiAgICAgICAgICAgIHNldHRpbmdzLm1oID0gc2V0U2l6ZShzZXR0aW5ncy5tYXhIZWlnaHQsICd5JykgLSBsb2FkZWRIZWlnaHQgLSBpbnRlcmZhY2VIZWlnaHQ7XHJcbiAgICAgICAgICAgIHNldHRpbmdzLm1oID0gc2V0dGluZ3MuaCAmJiBzZXR0aW5ncy5oIDwgc2V0dGluZ3MubWggPyBzZXR0aW5ncy5oIDogc2V0dGluZ3MubWg7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBocmVmID0gc2V0dGluZ3MuaHJlZjtcclxuXHJcbiAgICAgICAgbG9hZGluZ1RpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICRsb2FkaW5nT3ZlcmxheS5zaG93KCk7XHJcbiAgICAgICAgfSwgMTAwKTtcclxuXHJcbiAgICAgICAgaWYgKHNldHRpbmdzLmlubGluZSkge1xyXG4gICAgICAgICAgICAvLyBJbnNlcnRzIGFuIGVtcHR5IHBsYWNlaG9sZGVyIHdoZXJlIGlubGluZSBjb250ZW50IGlzIGJlaW5nIHB1bGxlZCBmcm9tLlxyXG4gICAgICAgICAgICAvLyBBbiBldmVudCBpcyBib3VuZCB0byBwdXQgaW5saW5lIGNvbnRlbnQgYmFjayB3aGVuIENvbG9yQm94IGNsb3NlcyBvciBsb2FkcyBuZXcgY29udGVudC5cclxuICAgICAgICAgICAgJGlubGluZSA9ICR0YWcoZGl2KS5oaWRlKCkuaW5zZXJ0QmVmb3JlKCQoaHJlZilbMF0pO1xyXG5cclxuICAgICAgICAgICAgJGV2ZW50cy5vbmUoZXZlbnRfcHVyZ2UsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICRpbmxpbmUucmVwbGFjZVdpdGgoJGxvYWRlZC5jaGlsZHJlbigpKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBwcmVwKCQoaHJlZikpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoc2V0dGluZ3MuaWZyYW1lKSB7XHJcbiAgICAgICAgICAgIC8vIElGcmFtZSBlbGVtZW50IHdvbid0IGJlIGFkZGVkIHRvIHRoZSBET00gdW50aWwgaXQgaXMgcmVhZHkgdG8gYmUgZGlzcGxheWVkLFxyXG4gICAgICAgICAgICAvLyB0byBhdm9pZCBwcm9ibGVtcyB3aXRoIERPTS1yZWFkeSBKUyB0aGF0IG1pZ2h0IGJlIHRyeWluZyB0byBydW4gaW4gdGhhdCBpZnJhbWUuXHJcbiAgICAgICAgICAgIHByZXAoXCIgXCIpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoc2V0dGluZ3MuaHRtbCkge1xyXG4gICAgICAgICAgICBwcmVwKHNldHRpbmdzLmh0bWwpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoaXNJbWFnZShzZXR0aW5ncywgaHJlZikpIHtcclxuXHJcbiAgICAgICAgICAgIGhyZWYgPSByZXRpbmFVcmwoc2V0dGluZ3MsIGhyZWYpO1xyXG5cclxuICAgICAgICAgICAgJChwaG90byA9IG5ldyBJbWFnZSgpKVxyXG4gICAgICAgICAgICAgICAgLmFkZENsYXNzKHByZWZpeCArICdQaG90bycpXHJcbiAgICAgICAgICAgICAgICAuYmluZCgnZXJyb3InLGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBzZXR0aW5ncy50aXRsZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIHByZXAoJHRhZyhkaXYsICdFcnJvcicpLmh0bWwoc2V0dGluZ3MuaW1nRXJyb3IpKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAub25lKCdsb2FkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwZXJjZW50O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2V0dGluZ3MucmV0aW5hSW1hZ2UgJiYgd2luZG93LmRldmljZVBpeGVsUmF0aW8gPiAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBob3RvLmhlaWdodCA9IHBob3RvLmhlaWdodCAvIHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwaG90by53aWR0aCA9IHBob3RvLndpZHRoIC8gd2luZG93LmRldmljZVBpeGVsUmF0aW87XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2V0dGluZ3Muc2NhbGVQaG90b3MpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2V0UmVzaXplID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGhvdG8uaGVpZ2h0IC09IHBob3RvLmhlaWdodCAqIHBlcmNlbnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwaG90by53aWR0aCAtPSBwaG90by53aWR0aCAqIHBlcmNlbnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZXR0aW5ncy5tdyAmJiBwaG90by53aWR0aCA+IHNldHRpbmdzLm13KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZXJjZW50ID0gKHBob3RvLndpZHRoIC0gc2V0dGluZ3MubXcpIC8gcGhvdG8ud2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRSZXNpemUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2V0dGluZ3MubWggJiYgcGhvdG8uaGVpZ2h0ID4gc2V0dGluZ3MubWgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlcmNlbnQgPSAocGhvdG8uaGVpZ2h0IC0gc2V0dGluZ3MubWgpIC8gcGhvdG8uaGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0UmVzaXplKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzZXR0aW5ncy5oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBob3RvLnN0eWxlLm1hcmdpblRvcCA9IE1hdGgubWF4KHNldHRpbmdzLm1oIC0gcGhvdG8uaGVpZ2h0LCAwKSAvIDIgKyAncHgnO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCRyZWxhdGVkWzFdICYmIChzZXR0aW5ncy5sb29wIHx8ICRyZWxhdGVkW2luZGV4ICsgMV0pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBob3RvLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGhvdG8ub25jbGljayA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHB1YmxpY01ldGhvZC5uZXh0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoaXNJRSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwaG90by5zdHlsZS5tc0ludGVycG9sYXRpb25Nb2RlID0gJ2JpY3ViaWMnO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7IC8vIEEgcGF1c2UgYmVjYXVzZSBDaHJvbWUgd2lsbCBzb21ldGltZXMgcmVwb3J0IGEgMCBieSAwIHNpemUgb3RoZXJ3aXNlLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcmVwKHBob3RvKTtcclxuICAgICAgICAgICAgICAgICAgICB9LCAxKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7IC8vIEEgcGF1c2UgYmVjYXVzZSBPcGVyYSAxMC42KyB3aWxsIHNvbWV0aW1lcyBub3QgcnVuIHRoZSBvbmxvYWQgZnVuY3Rpb24gb3RoZXJ3aXNlLlxyXG4gICAgICAgICAgICAgICAgcGhvdG8uc3JjID0gaHJlZjtcclxuICAgICAgICAgICAgfSwgMSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChocmVmKSB7XHJcbiAgICAgICAgICAgICRsb2FkaW5nQmF5LmxvYWQoaHJlZiwgc2V0dGluZ3MuZGF0YSwgZnVuY3Rpb24gKGRhdGEsIHN0YXR1cykge1xyXG4gICAgICAgICAgICAgICAgcHJlcChzdGF0dXMgPT09ICdlcnJvcicgPyAkdGFnKGRpdiwgJ0Vycm9yJykuaHRtbChzZXR0aW5ncy54aHJFcnJvcikgOiAkKHRoaXMpLmNvbnRlbnRzKCkpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIE5hdmlnYXRlcyB0byB0aGUgbmV4dCBwYWdlL2ltYWdlIGluIGEgc2V0LlxyXG4gICAgcHVibGljTWV0aG9kLm5leHQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKCFhY3RpdmUgJiYgJHJlbGF0ZWRbMV0gJiYgKHNldHRpbmdzLmxvb3AgfHwgJHJlbGF0ZWRbaW5kZXggKyAxXSkpIHtcclxuICAgICAgICAgICAgaW5kZXggPSBnZXRJbmRleCgxKTtcclxuICAgICAgICAgICAgcHVibGljTWV0aG9kLmxvYWQoKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHB1YmxpY01ldGhvZC5wcmV2ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICghYWN0aXZlICYmICRyZWxhdGVkWzFdICYmIChzZXR0aW5ncy5sb29wIHx8IGluZGV4KSkge1xyXG4gICAgICAgICAgICBpbmRleCA9IGdldEluZGV4KC0xKTtcclxuICAgICAgICAgICAgcHVibGljTWV0aG9kLmxvYWQoKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIE5vdGU6IHRvIHVzZSB0aGlzIHdpdGhpbiBhbiBpZnJhbWUgdXNlIHRoZSBmb2xsb3dpbmcgZm9ybWF0OiBwYXJlbnQuJC5mbi5jb2xvcmJveC5jbG9zZSgpO1xyXG4gICAgcHVibGljTWV0aG9kLmNsb3NlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmIChvcGVuICYmICFjbG9zaW5nKSB7XHJcblxyXG4gICAgICAgICAgICBjbG9zaW5nID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgIG9wZW4gPSBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIHRyaWdnZXIoZXZlbnRfY2xlYW51cCwgc2V0dGluZ3Mub25DbGVhbnVwKTtcclxuXHJcbiAgICAgICAgICAgICR3aW5kb3cudW5iaW5kKCcuJyArIHByZWZpeCArICcgLicgKyBldmVudF9pZTYpO1xyXG5cclxuICAgICAgICAgICAgJG92ZXJsYXkuZmFkZVRvKDIwMCwgMCk7XHJcblxyXG4gICAgICAgICAgICAkYm94LnN0b3AoKS5mYWRlVG8oMzAwLCAwLCBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgJGJveC5hZGQoJG92ZXJsYXkpLmNzcyh7J29wYWNpdHknOiAxLCBjdXJzb3I6ICdhdXRvJ30pLmhpZGUoKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0cmlnZ2VyKGV2ZW50X3B1cmdlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAkbG9hZGVkLmVtcHR5KCkucmVtb3ZlKCk7IC8vIFVzaW5nIGVtcHR5IGZpcnN0IG1heSBwcmV2ZW50IHNvbWUgSUU3IGlzc3Vlcy5cclxuXHJcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBjbG9zaW5nID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJpZ2dlcihldmVudF9jbG9zZWQsIHNldHRpbmdzLm9uQ2xvc2VkKTtcclxuICAgICAgICAgICAgICAgIH0sIDEpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIFJlbW92ZXMgY2hhbmdlcyBDb2xvckJveCBtYWRlIHRvIHRoZSBkb2N1bWVudCwgYnV0IGRvZXMgbm90IHJlbW92ZSB0aGUgcGx1Z2luXHJcbiAgICAvLyBmcm9tIGpRdWVyeS5cclxuICAgIHB1YmxpY01ldGhvZC5yZW1vdmUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJChbXSkuYWRkKCRib3gpLmFkZCgkb3ZlcmxheSkucmVtb3ZlKCk7XHJcbiAgICAgICAgJGJveCA9IG51bGw7XHJcbiAgICAgICAgJCgnLicgKyBib3hFbGVtZW50KVxyXG4gICAgICAgICAgICAucmVtb3ZlRGF0YShjb2xvcmJveClcclxuICAgICAgICAgICAgLnJlbW92ZUNsYXNzKGJveEVsZW1lbnQpO1xyXG5cclxuICAgICAgICAkKGRvY3VtZW50KS51bmJpbmQoJ2NsaWNrLicrcHJlZml4KTtcclxuICAgIH07XHJcblxyXG4gICAgLy8gQSBtZXRob2QgZm9yIGZldGNoaW5nIHRoZSBjdXJyZW50IGVsZW1lbnQgQ29sb3JCb3ggaXMgcmVmZXJlbmNpbmcuXHJcbiAgICAvLyByZXR1cm5zIGEgalF1ZXJ5IG9iamVjdC5cclxuICAgIHB1YmxpY01ldGhvZC5lbGVtZW50ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiAkKGVsZW1lbnQpO1xyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWNNZXRob2Quc2V0dGluZ3MgPSBkZWZhdWx0cztcclxuXHJcbn0oalF1ZXJ5LCBkb2N1bWVudCwgd2luZG93KSk7Il0sImZpbGUiOiJqcXVlcnkuY29sb3Jib3guanMifQ==
