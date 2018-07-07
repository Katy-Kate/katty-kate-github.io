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
            scrolling: false,
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJqcXVlcnkuY29sb3Jib3guanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyohXHJcblx0alF1ZXJ5IENvbG9yQm94IHYxLjQuMyAtIDIwMTMtMDItMThcclxuXHQoYykgMjAxMyBKYWNrIE1vb3JlIC0gamFja2xtb29yZS5jb20vY29sb3Jib3hcclxuXHRsaWNlbnNlOiBodHRwOi8vd3d3Lm9wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL21pdC1saWNlbnNlLnBocFxyXG4qL1xyXG4oZnVuY3Rpb24gKCQsIGRvY3VtZW50LCB3aW5kb3cpIHtcclxuICAgIHZhclxyXG4gICAgICAgIC8vIERlZmF1bHQgc2V0dGluZ3Mgb2JqZWN0LlxyXG4gICAgICAgIC8vIFNlZSBodHRwOi8vamFja2xtb29yZS5jb20vY29sb3Jib3ggZm9yIGRldGFpbHMuXHJcbiAgICAgICAgZGVmYXVsdHMgPSB7XHJcbiAgICAgICAgICAgIHRyYW5zaXRpb246IFwiZWxhc3RpY1wiLFxyXG4gICAgICAgICAgICBzcGVlZDogMzAwLFxyXG4gICAgICAgICAgICB3aWR0aDogZmFsc2UsXHJcbiAgICAgICAgICAgIGluaXRpYWxXaWR0aDogXCI2MDBcIixcclxuICAgICAgICAgICAgaW5uZXJXaWR0aDogZmFsc2UsXHJcbiAgICAgICAgICAgIG1heFdpZHRoOiBmYWxzZSxcclxuICAgICAgICAgICAgaGVpZ2h0OiBmYWxzZSxcclxuICAgICAgICAgICAgaW5pdGlhbEhlaWdodDogXCI0NTBcIixcclxuICAgICAgICAgICAgaW5uZXJIZWlnaHQ6IGZhbHNlLFxyXG4gICAgICAgICAgICBtYXhIZWlnaHQ6IGZhbHNlLFxyXG4gICAgICAgICAgICBzY2FsZVBob3RvczogdHJ1ZSxcclxuICAgICAgICAgICAgc2Nyb2xsaW5nOiBmYWxzZSxcclxuICAgICAgICAgICAgaW5saW5lOiBmYWxzZSxcclxuICAgICAgICAgICAgaHRtbDogZmFsc2UsXHJcbiAgICAgICAgICAgIGlmcmFtZTogZmFsc2UsXHJcbiAgICAgICAgICAgIGZhc3RJZnJhbWU6IHRydWUsXHJcbiAgICAgICAgICAgIHBob3RvOiBmYWxzZSxcclxuICAgICAgICAgICAgaHJlZjogZmFsc2UsXHJcbiAgICAgICAgICAgIHRpdGxlOiBmYWxzZSxcclxuICAgICAgICAgICAgcmVsOiBmYWxzZSxcclxuICAgICAgICAgICAgb3BhY2l0eTogMC45LFxyXG4gICAgICAgICAgICBwcmVsb2FkaW5nOiB0cnVlLFxyXG4gICAgICAgICAgICBjbGFzc05hbWU6IGZhbHNlLFxyXG5cclxuICAgICAgICAgICAgLy8gYWx0ZXJuYXRlIGltYWdlIHBhdGhzIGZvciBoaWdoLXJlcyBkaXNwbGF5c1xyXG4gICAgICAgICAgICByZXRpbmFJbWFnZTogZmFsc2UsXHJcbiAgICAgICAgICAgIHJldGluYVVybDogZmFsc2UsXHJcbiAgICAgICAgICAgIHJldGluYVN1ZmZpeDogJ0AyeC4kMScsXHJcblxyXG4gICAgICAgICAgICAvLyBpbnRlcm5hdGlvbmFsaXphdGlvblxyXG4gICAgICAgICAgICBjdXJyZW50OiBcImltYWdlIHtjdXJyZW50fSBvZiB7dG90YWx9XCIsXHJcbiAgICAgICAgICAgIHByZXZpb3VzOiBcInByZXZpb3VzXCIsXHJcbiAgICAgICAgICAgIG5leHQ6IFwibmV4dFwiLFxyXG4gICAgICAgICAgICBjbG9zZTogXCJjbG9zZVwiLFxyXG4gICAgICAgICAgICB4aHJFcnJvcjogXCJUaGlzIGNvbnRlbnQgZmFpbGVkIHRvIGxvYWQuXCIsXHJcbiAgICAgICAgICAgIGltZ0Vycm9yOiBcIlRoaXMgaW1hZ2UgZmFpbGVkIHRvIGxvYWQuXCIsXHJcblxyXG4gICAgICAgICAgICBvcGVuOiBmYWxzZSxcclxuICAgICAgICAgICAgcmV0dXJuRm9jdXM6IHRydWUsXHJcbiAgICAgICAgICAgIHJlcG9zaXRpb246IHRydWUsXHJcbiAgICAgICAgICAgIGxvb3A6IHRydWUsXHJcbiAgICAgICAgICAgIHNsaWRlc2hvdzogZmFsc2UsXHJcbiAgICAgICAgICAgIHNsaWRlc2hvd0F1dG86IHRydWUsXHJcbiAgICAgICAgICAgIHNsaWRlc2hvd1NwZWVkOiAyNTAwLFxyXG4gICAgICAgICAgICBzbGlkZXNob3dTdGFydDogXCJzdGFydCBzbGlkZXNob3dcIixcclxuICAgICAgICAgICAgc2xpZGVzaG93U3RvcDogXCJzdG9wIHNsaWRlc2hvd1wiLFxyXG4gICAgICAgICAgICBwaG90b1JlZ2V4OiAvXFwuKGdpZnxwbmd8anAoZXxnfGVnKXxibXB8aWNvKSgoI3xcXD8pLiopPyQvaSxcclxuXHJcbiAgICAgICAgICAgIG9uT3BlbjogZmFsc2UsXHJcbiAgICAgICAgICAgIG9uTG9hZDogZmFsc2UsXHJcbiAgICAgICAgICAgIG9uQ29tcGxldGU6IGZhbHNlLFxyXG4gICAgICAgICAgICBvbkNsZWFudXA6IGZhbHNlLFxyXG4gICAgICAgICAgICBvbkNsb3NlZDogZmFsc2UsXHJcbiAgICAgICAgICAgIG92ZXJsYXlDbG9zZTogdHJ1ZSxcclxuICAgICAgICAgICAgZXNjS2V5OiB0cnVlLFxyXG4gICAgICAgICAgICBhcnJvd0tleTogdHJ1ZSxcclxuICAgICAgICAgICAgdG9wOiBmYWxzZSxcclxuICAgICAgICAgICAgYm90dG9tOiBmYWxzZSxcclxuICAgICAgICAgICAgbGVmdDogZmFsc2UsXHJcbiAgICAgICAgICAgIHJpZ2h0OiBmYWxzZSxcclxuICAgICAgICAgICAgZml4ZWQ6IGZhbHNlLFxyXG4gICAgICAgICAgICBkYXRhOiB1bmRlZmluZWRcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLyBBYnN0cmFjdGluZyB0aGUgSFRNTCBhbmQgZXZlbnQgaWRlbnRpZmllcnMgZm9yIGVhc3kgcmVicmFuZGluZ1xyXG4gICAgICAgIGNvbG9yYm94ID0gJ2NvbG9yYm94JyxcclxuICAgICAgICBwcmVmaXggPSAnY2JveCcsXHJcbiAgICAgICAgYm94RWxlbWVudCA9IHByZWZpeCArICdFbGVtZW50JyxcclxuXHJcbiAgICAgICAgLy8gRXZlbnRzXHJcbiAgICAgICAgZXZlbnRfb3BlbiA9IHByZWZpeCArICdfb3BlbicsXHJcbiAgICAgICAgZXZlbnRfbG9hZCA9IHByZWZpeCArICdfbG9hZCcsXHJcbiAgICAgICAgZXZlbnRfY29tcGxldGUgPSBwcmVmaXggKyAnX2NvbXBsZXRlJyxcclxuICAgICAgICBldmVudF9jbGVhbnVwID0gcHJlZml4ICsgJ19jbGVhbnVwJyxcclxuICAgICAgICBldmVudF9jbG9zZWQgPSBwcmVmaXggKyAnX2Nsb3NlZCcsXHJcbiAgICAgICAgZXZlbnRfcHVyZ2UgPSBwcmVmaXggKyAnX3B1cmdlJyxcclxuXHJcbiAgICAgICAgLy8gU3BlY2lhbCBIYW5kbGluZyBmb3IgSUVcclxuICAgICAgICBpc0lFID0gISQuc3VwcG9ydC5sZWFkaW5nV2hpdGVzcGFjZSwgLy8gSUU2IHRvIElFOFxyXG4gICAgICAgIGlzSUU2ID0gaXNJRSAmJiAhd2luZG93LlhNTEh0dHBSZXF1ZXN0LCAvLyBJRTZcclxuICAgICAgICBldmVudF9pZTYgPSBwcmVmaXggKyAnX0lFNicsXHJcblxyXG4gICAgICAgIC8vIENhY2hlZCBqUXVlcnkgT2JqZWN0IFZhcmlhYmxlc1xyXG4gICAgICAgICRvdmVybGF5LFxyXG4gICAgICAgICRib3gsXHJcbiAgICAgICAgJHdyYXAsXHJcbiAgICAgICAgJGNvbnRlbnQsXHJcbiAgICAgICAgJHRvcEJvcmRlcixcclxuICAgICAgICAkbGVmdEJvcmRlcixcclxuICAgICAgICAkcmlnaHRCb3JkZXIsXHJcbiAgICAgICAgJGJvdHRvbUJvcmRlcixcclxuICAgICAgICAkcmVsYXRlZCxcclxuICAgICAgICAkd2luZG93LFxyXG4gICAgICAgICRsb2FkZWQsXHJcbiAgICAgICAgJGxvYWRpbmdCYXksXHJcbiAgICAgICAgJGxvYWRpbmdPdmVybGF5LFxyXG4gICAgICAgICR0aXRsZSxcclxuICAgICAgICAkY3VycmVudCxcclxuICAgICAgICAkc2xpZGVzaG93LFxyXG4gICAgICAgICRuZXh0LFxyXG4gICAgICAgICRwcmV2LFxyXG4gICAgICAgICRjbG9zZSxcclxuICAgICAgICAkZ3JvdXBDb250cm9scyxcclxuICAgICAgICAkZXZlbnRzID0gJCh7fSksXHJcblxyXG4gICAgICAgIC8vIFZhcmlhYmxlcyBmb3IgY2FjaGVkIHZhbHVlcyBvciB1c2UgYWNyb3NzIG11bHRpcGxlIGZ1bmN0aW9uc1xyXG4gICAgICAgIHNldHRpbmdzLFxyXG4gICAgICAgIGludGVyZmFjZUhlaWdodCxcclxuICAgICAgICBpbnRlcmZhY2VXaWR0aCxcclxuICAgICAgICBsb2FkZWRIZWlnaHQsXHJcbiAgICAgICAgbG9hZGVkV2lkdGgsXHJcbiAgICAgICAgZWxlbWVudCxcclxuICAgICAgICBpbmRleCxcclxuICAgICAgICBwaG90byxcclxuICAgICAgICBvcGVuLFxyXG4gICAgICAgIGFjdGl2ZSxcclxuICAgICAgICBjbG9zaW5nLFxyXG4gICAgICAgIGxvYWRpbmdUaW1lcixcclxuICAgICAgICBwdWJsaWNNZXRob2QsXHJcbiAgICAgICAgZGl2ID0gXCJkaXZcIixcclxuICAgICAgICBjbGFzc05hbWUsXHJcbiAgICAgICAgaW5pdDtcclxuXHJcbiAgICAvLyAqKioqKioqKioqKioqKioqXHJcbiAgICAvLyBIRUxQRVIgRlVOQ1RJT05TXHJcbiAgICAvLyAqKioqKioqKioqKioqKioqXHJcblxyXG4gICAgLy8gQ29udmllbmNlIGZ1bmN0aW9uIGZvciBjcmVhdGluZyBuZXcgalF1ZXJ5IG9iamVjdHNcclxuICAgIGZ1bmN0aW9uICR0YWcodGFnLCBpZCwgY3NzKSB7XHJcbiAgICAgICAgdmFyIGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZyk7XHJcblxyXG4gICAgICAgIGlmIChpZCkge1xyXG4gICAgICAgICAgICBlbGVtZW50LmlkID0gcHJlZml4ICsgaWQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoY3NzKSB7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUuY3NzVGV4dCA9IGNzcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiAkKGVsZW1lbnQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIERldGVybWluZSB0aGUgbmV4dCBhbmQgcHJldmlvdXMgbWVtYmVycyBpbiBhIGdyb3VwLlxyXG4gICAgZnVuY3Rpb24gZ2V0SW5kZXgoaW5jcmVtZW50KSB7XHJcbiAgICAgICAgdmFyXHJcbiAgICAgICAgICAgIG1heCA9ICRyZWxhdGVkLmxlbmd0aCxcclxuICAgICAgICAgICAgbmV3SW5kZXggPSAoaW5kZXggKyBpbmNyZW1lbnQpICUgbWF4O1xyXG5cclxuICAgICAgICByZXR1cm4gKG5ld0luZGV4IDwgMCkgPyBtYXggKyBuZXdJbmRleCA6IG5ld0luZGV4O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIENvbnZlcnQgJyUnIGFuZCAncHgnIHZhbHVlcyB0byBpbnRlZ2Vyc1xyXG4gICAgZnVuY3Rpb24gc2V0U2l6ZShzaXplLCBkaW1lbnNpb24pIHtcclxuICAgICAgICByZXR1cm4gTWF0aC5yb3VuZCgoLyUvLnRlc3Qoc2l6ZSkgPyAoKGRpbWVuc2lvbiA9PT0gJ3gnID8gJHdpbmRvdy53aWR0aCgpIDogJHdpbmRvdy5oZWlnaHQoKSkgLyAxMDApIDogMSkgKiBwYXJzZUludChzaXplLCAxMCkpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIENoZWNrcyBhbiBocmVmIHRvIHNlZSBpZiBpdCBpcyBhIHBob3RvLlxyXG4gICAgLy8gVGhlcmUgaXMgYSBmb3JjZSBwaG90byBvcHRpb24gKHBob3RvOiB0cnVlKSBmb3IgaHJlZnMgdGhhdCBjYW5ub3QgYmUgbWF0Y2hlZCBieSB0aGUgcmVnZXguXHJcbiAgICBmdW5jdGlvbiBpc0ltYWdlKHNldHRpbmdzLCB1cmwpIHtcclxuICAgICAgICByZXR1cm4gc2V0dGluZ3MucGhvdG8gfHwgc2V0dGluZ3MucGhvdG9SZWdleC50ZXN0KHVybCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcmV0aW5hVXJsKHNldHRpbmdzLCB1cmwpIHtcclxuICAgICAgICByZXR1cm4gc2V0dGluZ3MucmV0aW5hVXJsICYmIHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvID4gMSA/IHVybC5yZXBsYWNlKHNldHRpbmdzLnBob3RvUmVnZXgsIHNldHRpbmdzLnJldGluYVN1ZmZpeCkgOiB1cmw7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gdHJhcEZvY3VzKGUpIHtcclxuICAgICAgICBpZiAoJ2NvbnRhaW5zJyBpbiAkYm94WzBdICYmICEkYm94WzBdLmNvbnRhaW5zKGUudGFyZ2V0KSkge1xyXG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICAkYm94LmZvY3VzKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIEFzc2lnbnMgZnVuY3Rpb24gcmVzdWx0cyB0byB0aGVpciByZXNwZWN0aXZlIHByb3BlcnRpZXNcclxuICAgIGZ1bmN0aW9uIG1ha2VTZXR0aW5ncygpIHtcclxuICAgICAgICB2YXIgaSxcclxuICAgICAgICAgICAgZGF0YSA9ICQuZGF0YShlbGVtZW50LCBjb2xvcmJveCk7XHJcblxyXG4gICAgICAgIGlmIChkYXRhID09IG51bGwpIHtcclxuICAgICAgICAgICAgc2V0dGluZ3MgPSAkLmV4dGVuZCh7fSwgZGVmYXVsdHMpO1xyXG4gICAgICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmxvZykge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0Vycm9yOiBjYm94RWxlbWVudCBtaXNzaW5nIHNldHRpbmdzIG9iamVjdCcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgc2V0dGluZ3MgPSAkLmV4dGVuZCh7fSwgZGF0YSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGkgaW4gc2V0dGluZ3MpIHtcclxuICAgICAgICAgICAgaWYgKCQuaXNGdW5jdGlvbihzZXR0aW5nc1tpXSkgJiYgaS5zbGljZSgwLCAyKSAhPT0gJ29uJykgeyAvLyBjaGVja3MgdG8gbWFrZSBzdXJlIHRoZSBmdW5jdGlvbiBpc24ndCBvbmUgb2YgdGhlIGNhbGxiYWNrcywgdGhleSB3aWxsIGJlIGhhbmRsZWQgYXQgdGhlIGFwcHJvcHJpYXRlIHRpbWUuXHJcbiAgICAgICAgICAgICAgICBzZXR0aW5nc1tpXSA9IHNldHRpbmdzW2ldLmNhbGwoZWxlbWVudCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNldHRpbmdzLnJlbCA9IHNldHRpbmdzLnJlbCB8fCBlbGVtZW50LnJlbCB8fCAkKGVsZW1lbnQpLmRhdGEoJ3JlbCcpIHx8ICdub2ZvbGxvdyc7XHJcbiAgICAgICAgc2V0dGluZ3MuaHJlZiA9IHNldHRpbmdzLmhyZWYgfHwgJChlbGVtZW50KS5hdHRyKCdocmVmJyk7XHJcbiAgICAgICAgc2V0dGluZ3MudGl0bGUgPSBzZXR0aW5ncy50aXRsZSB8fCBlbGVtZW50LnRpdGxlO1xyXG5cclxuICAgICAgICBpZiAodHlwZW9mIHNldHRpbmdzLmhyZWYgPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgICAgc2V0dGluZ3MuaHJlZiA9ICQudHJpbShzZXR0aW5ncy5ocmVmKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gdHJpZ2dlcihldmVudCwgY2FsbGJhY2spIHtcclxuICAgICAgICAvLyBmb3IgZXh0ZXJuYWwgdXNlXHJcbiAgICAgICAgJChkb2N1bWVudCkudHJpZ2dlcihldmVudCk7XHJcblxyXG4gICAgICAgIC8vIGZvciBpbnRlcm5hbCB1c2VcclxuICAgICAgICAkZXZlbnRzLnRyaWdnZXIoZXZlbnQpO1xyXG5cclxuICAgICAgICBpZiAoJC5pc0Z1bmN0aW9uKGNhbGxiYWNrKSkge1xyXG4gICAgICAgICAgICBjYWxsYmFjay5jYWxsKGVsZW1lbnQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBTbGlkZXNob3cgZnVuY3Rpb25hbGl0eVxyXG4gICAgZnVuY3Rpb24gc2xpZGVzaG93KCkge1xyXG4gICAgICAgIHZhclxyXG4gICAgICAgICAgICB0aW1lT3V0LFxyXG4gICAgICAgICAgICBjbGFzc05hbWUgPSBwcmVmaXggKyBcIlNsaWRlc2hvd19cIixcclxuICAgICAgICAgICAgY2xpY2sgPSBcImNsaWNrLlwiICsgcHJlZml4LFxyXG4gICAgICAgICAgICBjbGVhcixcclxuICAgICAgICAgICAgc2V0LFxyXG4gICAgICAgICAgICBzdGFydCxcclxuICAgICAgICAgICAgc3RvcDtcclxuXHJcbiAgICAgICAgaWYgKHNldHRpbmdzLnNsaWRlc2hvdyAmJiAkcmVsYXRlZFsxXSkge1xyXG4gICAgICAgICAgICBjbGVhciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lT3V0KTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIHNldCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGlmIChzZXR0aW5ncy5sb29wIHx8ICRyZWxhdGVkW2luZGV4ICsgMV0pIHtcclxuICAgICAgICAgICAgICAgICAgICB0aW1lT3V0ID0gc2V0VGltZW91dChwdWJsaWNNZXRob2QubmV4dCwgc2V0dGluZ3Muc2xpZGVzaG93U3BlZWQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgc3RhcnQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAkc2xpZGVzaG93XHJcbiAgICAgICAgICAgICAgICAgICAgLmh0bWwoc2V0dGluZ3Muc2xpZGVzaG93U3RvcClcclxuICAgICAgICAgICAgICAgICAgICAudW5iaW5kKGNsaWNrKVxyXG4gICAgICAgICAgICAgICAgICAgIC5vbmUoY2xpY2ssIHN0b3ApO1xyXG5cclxuICAgICAgICAgICAgICAgICRldmVudHNcclxuICAgICAgICAgICAgICAgICAgICAuYmluZChldmVudF9jb21wbGV0ZSwgc2V0KVxyXG4gICAgICAgICAgICAgICAgICAgIC5iaW5kKGV2ZW50X2xvYWQsIGNsZWFyKVxyXG4gICAgICAgICAgICAgICAgICAgIC5iaW5kKGV2ZW50X2NsZWFudXAsIHN0b3ApO1xyXG5cclxuICAgICAgICAgICAgICAgICRib3gucmVtb3ZlQ2xhc3MoY2xhc3NOYW1lICsgXCJvZmZcIikuYWRkQ2xhc3MoY2xhc3NOYW1lICsgXCJvblwiKTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIHN0b3AgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjbGVhcigpO1xyXG5cclxuICAgICAgICAgICAgICAgICRldmVudHNcclxuICAgICAgICAgICAgICAgICAgICAudW5iaW5kKGV2ZW50X2NvbXBsZXRlLCBzZXQpXHJcbiAgICAgICAgICAgICAgICAgICAgLnVuYmluZChldmVudF9sb2FkLCBjbGVhcilcclxuICAgICAgICAgICAgICAgICAgICAudW5iaW5kKGV2ZW50X2NsZWFudXAsIHN0b3ApO1xyXG5cclxuICAgICAgICAgICAgICAgICRzbGlkZXNob3dcclxuICAgICAgICAgICAgICAgICAgICAuaHRtbChzZXR0aW5ncy5zbGlkZXNob3dTdGFydClcclxuICAgICAgICAgICAgICAgICAgICAudW5iaW5kKGNsaWNrKVxyXG4gICAgICAgICAgICAgICAgICAgIC5vbmUoY2xpY2ssIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHVibGljTWV0aG9kLm5leHQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQoKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAkYm94LnJlbW92ZUNsYXNzKGNsYXNzTmFtZSArIFwib25cIikuYWRkQ2xhc3MoY2xhc3NOYW1lICsgXCJvZmZcIik7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBpZiAoc2V0dGluZ3Muc2xpZGVzaG93QXV0bykge1xyXG4gICAgICAgICAgICAgICAgc3RhcnQoKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHN0b3AoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICRib3gucmVtb3ZlQ2xhc3MoY2xhc3NOYW1lICsgXCJvZmYgXCIgKyBjbGFzc05hbWUgKyBcIm9uXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBsYXVuY2godGFyZ2V0KSB7XHJcbiAgICAgICAgaWYgKCFjbG9zaW5nKSB7XHJcblxyXG4gICAgICAgICAgICBlbGVtZW50ID0gdGFyZ2V0O1xyXG5cclxuICAgICAgICAgICAgbWFrZVNldHRpbmdzKCk7XHJcblxyXG4gICAgICAgICAgICAkcmVsYXRlZCA9ICQoZWxlbWVudCk7XHJcblxyXG4gICAgICAgICAgICBpbmRleCA9IDA7XHJcblxyXG4gICAgICAgICAgICBpZiAoc2V0dGluZ3MucmVsICE9PSAnbm9mb2xsb3cnKSB7XHJcbiAgICAgICAgICAgICAgICAkcmVsYXRlZCA9ICQoJy4nICsgYm94RWxlbWVudCkuZmlsdGVyKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZGF0YSA9ICQuZGF0YSh0aGlzLCBjb2xvcmJveCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbFJlbGF0ZWQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbFJlbGF0ZWQgPSAgJCh0aGlzKS5kYXRhKCdyZWwnKSB8fCBkYXRhLnJlbCB8fCB0aGlzLnJlbDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAocmVsUmVsYXRlZCA9PT0gc2V0dGluZ3MucmVsKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgaW5kZXggPSAkcmVsYXRlZC5pbmRleChlbGVtZW50KTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBDaGVjayBkaXJlY3QgY2FsbHMgdG8gQ29sb3JCb3guXHJcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJHJlbGF0ZWQgPSAkcmVsYXRlZC5hZGQoZWxlbWVudCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggPSAkcmVsYXRlZC5sZW5ndGggLSAxO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAkb3ZlcmxheS5jc3Moe1xyXG4gICAgICAgICAgICAgICAgb3BhY2l0eTogcGFyc2VGbG9hdChzZXR0aW5ncy5vcGFjaXR5KSxcclxuICAgICAgICAgICAgICAgIGN1cnNvcjogc2V0dGluZ3Mub3ZlcmxheUNsb3NlID8gXCJwb2ludGVyXCIgOiBcImF1dG9cIixcclxuICAgICAgICAgICAgICAgIHZpc2liaWxpdHk6ICd2aXNpYmxlJ1xyXG4gICAgICAgICAgICB9KS5zaG93KCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIW9wZW4pIHtcclxuICAgICAgICAgICAgICAgIG9wZW4gPSBhY3RpdmUgPSB0cnVlOyAvLyBQcmV2ZW50cyB0aGUgcGFnZS1jaGFuZ2UgYWN0aW9uIGZyb20gcXVldWluZyB1cCBpZiB0aGUgdmlzaXRvciBob2xkcyBkb3duIHRoZSBsZWZ0IG9yIHJpZ2h0IGtleXMuXHJcblxyXG4gICAgICAgICAgICAgICAgLy8gU2hvdyBjb2xvcmJveCBzbyB0aGUgc2l6ZXMgY2FuIGJlIGNhbGN1bGF0ZWQgaW4gb2xkZXIgdmVyc2lvbnMgb2YgalF1ZXJ5XHJcbiAgICAgICAgICAgICAgICAkYm94LmNzcyh7dmlzaWJpbGl0eTonaGlkZGVuJywgZGlzcGxheTonYmxvY2snfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgJGxvYWRlZCA9ICR0YWcoZGl2LCAnTG9hZGVkQ29udGVudCcsICd3aWR0aDowOyBoZWlnaHQ6MDsgb3ZlcmZsb3c6aGlkZGVuJykuYXBwZW5kVG8oJGNvbnRlbnQpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIENhY2hlIHZhbHVlcyBuZWVkZWQgZm9yIHNpemUgY2FsY3VsYXRpb25zXHJcbiAgICAgICAgICAgICAgICBpbnRlcmZhY2VIZWlnaHQgPSAkdG9wQm9yZGVyLmhlaWdodCgpICsgJGJvdHRvbUJvcmRlci5oZWlnaHQoKSArICRjb250ZW50Lm91dGVySGVpZ2h0KHRydWUpIC0gJGNvbnRlbnQuaGVpZ2h0KCk7Ly9TdWJ0cmFjdGlvbiBuZWVkZWQgZm9yIElFNlxyXG4gICAgICAgICAgICAgICAgaW50ZXJmYWNlV2lkdGggPSAkbGVmdEJvcmRlci53aWR0aCgpICsgJHJpZ2h0Qm9yZGVyLndpZHRoKCkgKyAkY29udGVudC5vdXRlcldpZHRoKHRydWUpIC0gJGNvbnRlbnQud2lkdGgoKTtcclxuICAgICAgICAgICAgICAgIGxvYWRlZEhlaWdodCA9ICRsb2FkZWQub3V0ZXJIZWlnaHQodHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICBsb2FkZWRXaWR0aCA9ICRsb2FkZWQub3V0ZXJXaWR0aCh0cnVlKTtcclxuXHJcblxyXG4gICAgICAgICAgICAgICAgLy8gT3BlbnMgaW5pdGFsIGVtcHR5IENvbG9yQm94IHByaW9yIHRvIGNvbnRlbnQgYmVpbmcgbG9hZGVkLlxyXG4gICAgICAgICAgICAgICAgc2V0dGluZ3MudyA9IHNldFNpemUoc2V0dGluZ3MuaW5pdGlhbFdpZHRoLCAneCcpO1xyXG4gICAgICAgICAgICAgICAgc2V0dGluZ3MuaCA9IHNldFNpemUoc2V0dGluZ3MuaW5pdGlhbEhlaWdodCwgJ3knKTtcclxuICAgICAgICAgICAgICAgIHB1YmxpY01ldGhvZC5wb3NpdGlvbigpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChpc0lFNikge1xyXG4gICAgICAgICAgICAgICAgICAgICR3aW5kb3cuYmluZCgncmVzaXplLicgKyBldmVudF9pZTYgKyAnIHNjcm9sbC4nICsgZXZlbnRfaWU2LCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRvdmVybGF5LmNzcyh7d2lkdGg6ICR3aW5kb3cud2lkdGgoKSwgaGVpZ2h0OiAkd2luZG93LmhlaWdodCgpLCB0b3A6ICR3aW5kb3cuc2Nyb2xsVG9wKCksIGxlZnQ6ICR3aW5kb3cuc2Nyb2xsTGVmdCgpfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSkudHJpZ2dlcigncmVzaXplLicgKyBldmVudF9pZTYpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHNsaWRlc2hvdygpO1xyXG5cclxuICAgICAgICAgICAgICAgIHRyaWdnZXIoZXZlbnRfb3Blbiwgc2V0dGluZ3Mub25PcGVuKTtcclxuXHJcbiAgICAgICAgICAgICAgICAkZ3JvdXBDb250cm9scy5hZGQoJHRpdGxlKS5oaWRlKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgJGNsb3NlLmh0bWwoc2V0dGluZ3MuY2xvc2UpLnNob3coKTtcclxuXHJcbiAgICAgICAgICAgICAgICAkYm94LmZvY3VzKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQ29uZmluZSBmb2N1cyB0byB0aGUgbW9kYWxcclxuICAgICAgICAgICAgICAgIC8vIFVzZXMgZXZlbnQgY2FwdHVyaW5nIHRoYXQgaXMgbm90IHN1cHBvcnRlZCBpbiBJRTgtXHJcbiAgICAgICAgICAgICAgICBpZiAoZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcikge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdmb2N1cycsIHRyYXBGb2N1cywgdHJ1ZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICRldmVudHMub25lKGV2ZW50X2Nsb3NlZCwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdmb2N1cycsIHRyYXBGb2N1cywgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gUmV0dXJuIGZvY3VzIG9uIGNsb3NpbmdcclxuICAgICAgICAgICAgICAgIGlmIChzZXR0aW5ncy5yZXR1cm5Gb2N1cykge1xyXG4gICAgICAgICAgICAgICAgICAgICRldmVudHMub25lKGV2ZW50X2Nsb3NlZCwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKGVsZW1lbnQpLmZvY3VzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHB1YmxpY01ldGhvZC5sb2FkKHRydWUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBDb2xvckJveCdzIG1hcmt1cCBuZWVkcyB0byBiZSBhZGRlZCB0byB0aGUgRE9NIHByaW9yIHRvIGJlaW5nIGNhbGxlZFxyXG4gICAgLy8gc28gdGhhdCB0aGUgYnJvd3NlciB3aWxsIGdvIGFoZWFkIGFuZCBsb2FkIHRoZSBDU1MgYmFja2dyb3VuZCBpbWFnZXMuXHJcbiAgICBmdW5jdGlvbiBhcHBlbmRIVE1MKCkge1xyXG4gICAgICAgIGlmICghJGJveCAmJiBkb2N1bWVudC5ib2R5KSB7XHJcbiAgICAgICAgICAgIGluaXQgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgICR3aW5kb3cgPSAkKHdpbmRvdyk7XHJcbiAgICAgICAgICAgICRib3ggPSAkdGFnKGRpdikuYXR0cih7XHJcbiAgICAgICAgICAgICAgICBpZDogY29sb3Jib3gsXHJcbiAgICAgICAgICAgICAgICAnY2xhc3MnOiBpc0lFID8gcHJlZml4ICsgKGlzSUU2ID8gJ0lFNicgOiAnSUUnKSA6ICcnLFxyXG4gICAgICAgICAgICAgICAgcm9sZTogJ2RpYWxvZycsXHJcbiAgICAgICAgICAgICAgICB0YWJpbmRleDogJy0xJ1xyXG4gICAgICAgICAgICB9KS5oaWRlKCk7XHJcbiAgICAgICAgICAgICRvdmVybGF5ID0gJHRhZyhkaXYsIFwiT3ZlcmxheVwiLCBpc0lFNiA/ICdwb3NpdGlvbjphYnNvbHV0ZScgOiAnJykuaGlkZSgpO1xyXG4gICAgICAgICAgICAkbG9hZGluZ092ZXJsYXkgPSAkdGFnKGRpdiwgXCJMb2FkaW5nT3ZlcmxheVwiKS5hZGQoJHRhZyhkaXYsIFwiTG9hZGluZ0dyYXBoaWNcIikpO1xyXG4gICAgICAgICAgICAkd3JhcCA9ICR0YWcoZGl2LCBcIldyYXBwZXJcIik7XHJcbiAgICAgICAgICAgICRjb250ZW50ID0gJHRhZyhkaXYsIFwiQ29udGVudFwiKS5hcHBlbmQoXHJcbiAgICAgICAgICAgICAgICAkdGl0bGUgPSAkdGFnKGRpdiwgXCJUaXRsZVwiKSxcclxuICAgICAgICAgICAgICAgICRjdXJyZW50ID0gJHRhZyhkaXYsIFwiQ3VycmVudFwiKSxcclxuICAgICAgICAgICAgICAgICRwcmV2ID0gJHRhZygnYnV0dG9uJywgXCJQcmV2aW91c1wiKSxcclxuICAgICAgICAgICAgICAgICRuZXh0ID0gJHRhZygnYnV0dG9uJywgXCJOZXh0XCIpLFxyXG4gICAgICAgICAgICAgICAgJHNsaWRlc2hvdyA9ICR0YWcoJ2J1dHRvbicsIFwiU2xpZGVzaG93XCIpLFxyXG4gICAgICAgICAgICAgICAgJGxvYWRpbmdPdmVybGF5LFxyXG4gICAgICAgICAgICAgICAgJGNsb3NlID0gJHRhZygnYnV0dG9uJywgXCJDbG9zZVwiKVxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgJHdyYXAuYXBwZW5kKCAvLyBUaGUgM3gzIEdyaWQgdGhhdCBtYWtlcyB1cCBDb2xvckJveFxyXG4gICAgICAgICAgICAgICAgJHRhZyhkaXYpLmFwcGVuZChcclxuICAgICAgICAgICAgICAgICAgICAkdGFnKGRpdiwgXCJUb3BMZWZ0XCIpLFxyXG4gICAgICAgICAgICAgICAgICAgICR0b3BCb3JkZXIgPSAkdGFnKGRpdiwgXCJUb3BDZW50ZXJcIiksXHJcbiAgICAgICAgICAgICAgICAgICAgJHRhZyhkaXYsIFwiVG9wUmlnaHRcIilcclxuICAgICAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgICAgICAkdGFnKGRpdiwgZmFsc2UsICdjbGVhcjpsZWZ0JykuYXBwZW5kKFxyXG4gICAgICAgICAgICAgICAgICAgICRsZWZ0Qm9yZGVyID0gJHRhZyhkaXYsIFwiTWlkZGxlTGVmdFwiKSxcclxuICAgICAgICAgICAgICAgICAgICAkY29udGVudCxcclxuICAgICAgICAgICAgICAgICAgICAkcmlnaHRCb3JkZXIgPSAkdGFnKGRpdiwgXCJNaWRkbGVSaWdodFwiKVxyXG4gICAgICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgICAgICR0YWcoZGl2LCBmYWxzZSwgJ2NsZWFyOmxlZnQnKS5hcHBlbmQoXHJcbiAgICAgICAgICAgICAgICAgICAgJHRhZyhkaXYsIFwiQm90dG9tTGVmdFwiKSxcclxuICAgICAgICAgICAgICAgICAgICAkYm90dG9tQm9yZGVyID0gJHRhZyhkaXYsIFwiQm90dG9tQ2VudGVyXCIpLFxyXG4gICAgICAgICAgICAgICAgICAgICR0YWcoZGl2LCBcIkJvdHRvbVJpZ2h0XCIpXHJcbiAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICkuZmluZCgnZGl2IGRpdicpLmNzcyh7J2Zsb2F0JzogJ2xlZnQnfSk7XHJcblxyXG4gICAgICAgICAgICAkbG9hZGluZ0JheSA9ICR0YWcoZGl2LCBmYWxzZSwgJ3Bvc2l0aW9uOmFic29sdXRlOyB3aWR0aDo5OTk5cHg7IHZpc2liaWxpdHk6aGlkZGVuOyBkaXNwbGF5Om5vbmUnKTtcclxuXHJcbiAgICAgICAgICAgICRncm91cENvbnRyb2xzID0gJG5leHQuYWRkKCRwcmV2KS5hZGQoJGN1cnJlbnQpLmFkZCgkc2xpZGVzaG93KTtcclxuXHJcbiAgICAgICAgICAgICQoZG9jdW1lbnQuYm9keSkuYXBwZW5kKCRvdmVybGF5LCAkYm94LmFwcGVuZCgkd3JhcCwgJGxvYWRpbmdCYXkpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQWRkIENvbG9yQm94J3MgZXZlbnQgYmluZGluZ3NcclxuICAgIGZ1bmN0aW9uIGFkZEJpbmRpbmdzKCkge1xyXG4gICAgICAgIGZ1bmN0aW9uIGNsaWNrSGFuZGxlcihlKSB7XHJcbiAgICAgICAgICAgIC8vIGlnbm9yZSBub24tbGVmdC1tb3VzZS1jbGlja3MgYW5kIGNsaWNrcyBtb2RpZmllZCB3aXRoIGN0cmwgLyBjb21tYW5kLCBzaGlmdCwgb3IgYWx0LlxyXG4gICAgICAgICAgICAvLyBTZWU6IGh0dHA6Ly9qYWNrbG1vb3JlLmNvbS9ub3Rlcy9jbGljay1ldmVudHMvXHJcbiAgICAgICAgICAgIGlmICghKGUud2hpY2ggPiAxIHx8IGUuc2hpZnRLZXkgfHwgZS5hbHRLZXkgfHwgZS5tZXRhS2V5KSkge1xyXG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgICAgbGF1bmNoKHRoaXMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoJGJveCkge1xyXG4gICAgICAgICAgICBpZiAoIWluaXQpIHtcclxuICAgICAgICAgICAgICAgIGluaXQgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIEFub255bW91cyBmdW5jdGlvbnMgaGVyZSBrZWVwIHRoZSBwdWJsaWMgbWV0aG9kIGZyb20gYmVpbmcgY2FjaGVkLCB0aGVyZWJ5IGFsbG93aW5nIHRoZW0gdG8gYmUgcmVkZWZpbmVkIG9uIHRoZSBmbHkuXHJcbiAgICAgICAgICAgICAgICAkbmV4dC5jbGljayhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcHVibGljTWV0aG9kLm5leHQoKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgJHByZXYuY2xpY2soZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHB1YmxpY01ldGhvZC5wcmV2KCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICRjbG9zZS5jbGljayhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcHVibGljTWV0aG9kLmNsb3NlKCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICRvdmVybGF5LmNsaWNrKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2V0dGluZ3Mub3ZlcmxheUNsb3NlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHB1YmxpY01ldGhvZC5jbG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIEtleSBCaW5kaW5nc1xyXG4gICAgICAgICAgICAgICAgJChkb2N1bWVudCkuYmluZCgna2V5ZG93bi4nICsgcHJlZml4LCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBrZXkgPSBlLmtleUNvZGU7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wZW4gJiYgc2V0dGluZ3MuZXNjS2V5ICYmIGtleSA9PT0gMjcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwdWJsaWNNZXRob2QuY2xvc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wZW4gJiYgc2V0dGluZ3MuYXJyb3dLZXkgJiYgJHJlbGF0ZWRbMV0gJiYgIWUuYWx0S2V5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChrZXkgPT09IDM3KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkcHJldi5jbGljaygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGtleSA9PT0gMzkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRuZXh0LmNsaWNrKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoJC5pc0Z1bmN0aW9uKCQuZm4ub24pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRm9yIGpRdWVyeSAxLjcrXHJcbiAgICAgICAgICAgICAgICAgICAgJChkb2N1bWVudCkub24oJ2NsaWNrLicrcHJlZml4LCAnLicrYm94RWxlbWVudCwgY2xpY2tIYW5kbGVyKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRm9yIGpRdWVyeSAxLjMueCAtPiAxLjYueFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFRoaXMgY29kZSBpcyBuZXZlciByZWFjaGVkIGluIGpRdWVyeSAxLjksIHNvIGRvIG5vdCBjb250YWN0IG1lIGFib3V0ICdsaXZlJyBiZWluZyByZW1vdmVkLlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgbm90IGhlcmUgZm9yIGpRdWVyeSAxLjksIGl0J3MgaGVyZSBmb3IgbGVnYWN5IHVzZXJzLlxyXG4gICAgICAgICAgICAgICAgICAgICQoJy4nK2JveEVsZW1lbnQpLmxpdmUoJ2NsaWNrLicrcHJlZml4LCBjbGlja0hhbmRsZXIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgQ29sb3JCb3ggYWxyZWFkeSBleGlzdHMuXHJcbiAgICBpZiAoJC5jb2xvcmJveCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBBcHBlbmQgdGhlIEhUTUwgd2hlbiB0aGUgRE9NIGxvYWRzXHJcbiAgICAkKGFwcGVuZEhUTUwpO1xyXG5cclxuXHJcbiAgICAvLyAqKioqKioqKioqKioqKioqXHJcbiAgICAvLyBQVUJMSUMgRlVOQ1RJT05TXHJcbiAgICAvLyBVc2FnZSBmb3JtYXQ6ICQuZm4uY29sb3Jib3guY2xvc2UoKTtcclxuICAgIC8vIFVzYWdlIGZyb20gd2l0aGluIGFuIGlmcmFtZTogcGFyZW50LiQuZm4uY29sb3Jib3guY2xvc2UoKTtcclxuICAgIC8vICoqKioqKioqKioqKioqKipcclxuXHJcbiAgICBwdWJsaWNNZXRob2QgPSAkLmZuW2NvbG9yYm94XSA9ICRbY29sb3Jib3hdID0gZnVuY3Rpb24gKG9wdGlvbnMsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgdmFyICR0aGlzID0gdGhpcztcclxuXHJcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcblxyXG4gICAgICAgIGFwcGVuZEhUTUwoKTtcclxuXHJcbiAgICAgICAgaWYgKGFkZEJpbmRpbmdzKCkpIHtcclxuICAgICAgICAgICAgaWYgKCQuaXNGdW5jdGlvbigkdGhpcykpIHsgLy8gYXNzdW1lIGEgY2FsbCB0byAkLmNvbG9yYm94XHJcbiAgICAgICAgICAgICAgICAkdGhpcyA9ICQoJzxhLz4nKTtcclxuICAgICAgICAgICAgICAgIG9wdGlvbnMub3BlbiA9IHRydWU7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoISR0aGlzWzBdKSB7IC8vIGNvbG9yYm94IGJlaW5nIGFwcGxpZWQgdG8gZW1wdHkgY29sbGVjdGlvblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuICR0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgIG9wdGlvbnMub25Db21wbGV0ZSA9IGNhbGxiYWNrO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAkdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICQuZGF0YSh0aGlzLCBjb2xvcmJveCwgJC5leHRlbmQoe30sICQuZGF0YSh0aGlzLCBjb2xvcmJveCkgfHwgZGVmYXVsdHMsIG9wdGlvbnMpKTtcclxuICAgICAgICAgICAgfSkuYWRkQ2xhc3MoYm94RWxlbWVudCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoKCQuaXNGdW5jdGlvbihvcHRpb25zLm9wZW4pICYmIG9wdGlvbnMub3Blbi5jYWxsKCR0aGlzKSkgfHwgb3B0aW9ucy5vcGVuKSB7XHJcbiAgICAgICAgICAgICAgICBsYXVuY2goJHRoaXNbMF0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gJHRoaXM7XHJcbiAgICB9O1xyXG5cclxuICAgIHB1YmxpY01ldGhvZC5wb3NpdGlvbiA9IGZ1bmN0aW9uIChzcGVlZCwgbG9hZGVkQ2FsbGJhY2spIHtcclxuICAgICAgICB2YXJcclxuICAgICAgICAgICAgY3NzLFxyXG4gICAgICAgICAgICB0b3AgPSAwLFxyXG4gICAgICAgICAgICBsZWZ0ID0gMCxcclxuICAgICAgICAgICAgb2Zmc2V0ID0gJGJveC5vZmZzZXQoKSxcclxuICAgICAgICAgICAgc2Nyb2xsVG9wLFxyXG4gICAgICAgICAgICBzY3JvbGxMZWZ0O1xyXG5cclxuICAgICAgICAkd2luZG93LnVuYmluZCgncmVzaXplLicgKyBwcmVmaXgpO1xyXG5cclxuICAgICAgICAvLyByZW1vdmUgdGhlIG1vZGFsIHNvIHRoYXQgaXQgZG9lc24ndCBpbmZsdWVuY2UgdGhlIGRvY3VtZW50IHdpZHRoL2hlaWdodFxyXG4gICAgICAgICRib3guY3NzKHt0b3A6IC05ZTQsIGxlZnQ6IC05ZTR9KTtcclxuXHJcbiAgICAgICAgc2Nyb2xsVG9wID0gJHdpbmRvdy5zY3JvbGxUb3AoKTtcclxuICAgICAgICBzY3JvbGxMZWZ0ID0gJHdpbmRvdy5zY3JvbGxMZWZ0KCk7XHJcblxyXG4gICAgICAgIGlmIChzZXR0aW5ncy5maXhlZCAmJiAhaXNJRTYpIHtcclxuICAgICAgICAgICAgb2Zmc2V0LnRvcCAtPSBzY3JvbGxUb3A7XHJcbiAgICAgICAgICAgIG9mZnNldC5sZWZ0IC09IHNjcm9sbExlZnQ7XHJcbiAgICAgICAgICAgICRib3guY3NzKHtwb3NpdGlvbjogJ2ZpeGVkJ30pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRvcCA9IHNjcm9sbFRvcDtcclxuICAgICAgICAgICAgbGVmdCA9IHNjcm9sbExlZnQ7XHJcbiAgICAgICAgICAgICRib3guY3NzKHtwb3NpdGlvbjogJ2Fic29sdXRlJ30pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8ga2VlcHMgdGhlIHRvcCBhbmQgbGVmdCBwb3NpdGlvbnMgd2l0aGluIHRoZSBicm93c2VyJ3Mgdmlld3BvcnQuXHJcbiAgICAgICAgaWYgKHNldHRpbmdzLnJpZ2h0ICE9PSBmYWxzZSkge1xyXG4gICAgICAgICAgICBsZWZ0ICs9IE1hdGgubWF4KCR3aW5kb3cud2lkdGgoKSAtIHNldHRpbmdzLncgLSBsb2FkZWRXaWR0aCAtIGludGVyZmFjZVdpZHRoIC0gc2V0U2l6ZShzZXR0aW5ncy5yaWdodCwgJ3gnKSwgMCk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChzZXR0aW5ncy5sZWZ0ICE9PSBmYWxzZSkge1xyXG4gICAgICAgICAgICBsZWZ0ICs9IHNldFNpemUoc2V0dGluZ3MubGVmdCwgJ3gnKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsZWZ0ICs9IE1hdGgucm91bmQoTWF0aC5tYXgoJHdpbmRvdy53aWR0aCgpIC0gc2V0dGluZ3MudyAtIGxvYWRlZFdpZHRoIC0gaW50ZXJmYWNlV2lkdGgsIDApIC8gMik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc2V0dGluZ3MuYm90dG9tICE9PSBmYWxzZSkge1xyXG4gICAgICAgICAgICB0b3AgKz0gTWF0aC5tYXgoJHdpbmRvdy5oZWlnaHQoKSAtIHNldHRpbmdzLmggLSBsb2FkZWRIZWlnaHQgLSBpbnRlcmZhY2VIZWlnaHQgLSBzZXRTaXplKHNldHRpbmdzLmJvdHRvbSwgJ3knKSwgMCk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChzZXR0aW5ncy50b3AgIT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgIHRvcCArPSBzZXRTaXplKHNldHRpbmdzLnRvcCwgJ3knKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0b3AgKz0gTWF0aC5yb3VuZChNYXRoLm1heCgkd2luZG93LmhlaWdodCgpIC0gc2V0dGluZ3MuaCAtIGxvYWRlZEhlaWdodCAtIGludGVyZmFjZUhlaWdodCwgMCkgLyAyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgICRib3guY3NzKHt0b3A6IG9mZnNldC50b3AsIGxlZnQ6IG9mZnNldC5sZWZ0LCB2aXNpYmlsaXR5Oid2aXNpYmxlJ30pO1xyXG5cclxuICAgICAgICAvLyBzZXR0aW5nIHRoZSBzcGVlZCB0byAwIHRvIHJlZHVjZSB0aGUgZGVsYXkgYmV0d2VlbiBzYW1lLXNpemVkIGNvbnRlbnQuXHJcbiAgICAgICAgc3BlZWQgPSAoJGJveC53aWR0aCgpID09PSBzZXR0aW5ncy53ICsgbG9hZGVkV2lkdGggJiYgJGJveC5oZWlnaHQoKSA9PT0gc2V0dGluZ3MuaCArIGxvYWRlZEhlaWdodCkgPyAwIDogc3BlZWQgfHwgMDtcclxuXHJcbiAgICAgICAgLy8gdGhpcyBnaXZlcyB0aGUgd3JhcHBlciBwbGVudHkgb2YgYnJlYXRoaW5nIHJvb20gc28gaXQncyBmbG9hdGVkIGNvbnRlbnRzIGNhbiBtb3ZlIGFyb3VuZCBzbW9vdGhseSxcclxuICAgICAgICAvLyBidXQgaXQgaGFzIHRvIGJlIHNocmFuayBkb3duIGFyb3VuZCB0aGUgc2l6ZSBvZiBkaXYjY29sb3Jib3ggd2hlbiBpdCdzIGRvbmUuICBJZiBub3QsXHJcbiAgICAgICAgLy8gaXQgY2FuIGludm9rZSBhbiBvYnNjdXJlIElFIGJ1ZyB3aGVuIHVzaW5nIGlmcmFtZXMuXHJcbiAgICAgICAgJHdyYXBbMF0uc3R5bGUud2lkdGggPSAkd3JhcFswXS5zdHlsZS5oZWlnaHQgPSBcIjk5OTlweFwiO1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBtb2RhbERpbWVuc2lvbnModGhhdCkge1xyXG4gICAgICAgICAgICAkdG9wQm9yZGVyWzBdLnN0eWxlLndpZHRoID0gJGJvdHRvbUJvcmRlclswXS5zdHlsZS53aWR0aCA9ICRjb250ZW50WzBdLnN0eWxlLndpZHRoID0gKHBhcnNlSW50KHRoYXQuc3R5bGUud2lkdGgsMTApIC0gaW50ZXJmYWNlV2lkdGgpKydweCc7XHJcbiAgICAgICAgICAgICRjb250ZW50WzBdLnN0eWxlLmhlaWdodCA9ICRsZWZ0Qm9yZGVyWzBdLnN0eWxlLmhlaWdodCA9ICRyaWdodEJvcmRlclswXS5zdHlsZS5oZWlnaHQgPSAocGFyc2VJbnQodGhhdC5zdHlsZS5oZWlnaHQsMTApIC0gaW50ZXJmYWNlSGVpZ2h0KSsncHgnO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY3NzID0ge3dpZHRoOiBzZXR0aW5ncy53ICsgbG9hZGVkV2lkdGggKyBpbnRlcmZhY2VXaWR0aCwgaGVpZ2h0OiBzZXR0aW5ncy5oICsgbG9hZGVkSGVpZ2h0ICsgaW50ZXJmYWNlSGVpZ2h0LCB0b3A6IHRvcCwgbGVmdDogbGVmdH07XHJcblxyXG4gICAgICAgIGlmKHNwZWVkPT09MCl7IC8vIHRlbXBvcmFyeSB3b3JrYXJvdW5kIHRvIHNpZGUtc3RlcCBqUXVlcnktVUkgMS44IGJ1ZyAoaHR0cDovL2J1Z3MuanF1ZXJ5LmNvbS90aWNrZXQvMTIyNzMpXHJcbiAgICAgICAgICAgICRib3guY3NzKGNzcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgICRib3guZGVxdWV1ZSgpLmFuaW1hdGUoY3NzLCB7XHJcbiAgICAgICAgICAgIGR1cmF0aW9uOiBzcGVlZCxcclxuICAgICAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIG1vZGFsRGltZW5zaW9ucyh0aGlzKTtcclxuXHJcbiAgICAgICAgICAgICAgICBhY3RpdmUgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBzaHJpbmsgdGhlIHdyYXBwZXIgZG93biB0byBleGFjdGx5IHRoZSBzaXplIG9mIGNvbG9yYm94IHRvIGF2b2lkIGEgYnVnIGluIElFJ3MgaWZyYW1lIGltcGxlbWVudGF0aW9uLlxyXG4gICAgICAgICAgICAgICAgJHdyYXBbMF0uc3R5bGUud2lkdGggPSAoc2V0dGluZ3MudyArIGxvYWRlZFdpZHRoICsgaW50ZXJmYWNlV2lkdGgpICsgXCJweFwiO1xyXG4gICAgICAgICAgICAgICAgJHdyYXBbMF0uc3R5bGUuaGVpZ2h0ID0gKHNldHRpbmdzLmggKyBsb2FkZWRIZWlnaHQgKyBpbnRlcmZhY2VIZWlnaHQpICsgXCJweFwiO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChzZXR0aW5ncy5yZXBvc2l0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7ICAvLyBzbWFsbCBkZWxheSBiZWZvcmUgYmluZGluZyBvbnJlc2l6ZSBkdWUgdG8gYW4gSUU4IGJ1Zy5cclxuICAgICAgICAgICAgICAgICAgICAgICAgJHdpbmRvdy5iaW5kKCdyZXNpemUuJyArIHByZWZpeCwgcHVibGljTWV0aG9kLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgICAgICAgICB9LCAxKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAobG9hZGVkQ2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgICAgICBsb2FkZWRDYWxsYmFjaygpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzdGVwOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBtb2RhbERpbWVuc2lvbnModGhpcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljTWV0aG9kLnJlc2l6ZSA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcbiAgICAgICAgaWYgKG9wZW4pIHtcclxuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcblxyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy53aWR0aCkge1xyXG4gICAgICAgICAgICAgICAgc2V0dGluZ3MudyA9IHNldFNpemUob3B0aW9ucy53aWR0aCwgJ3gnKSAtIGxvYWRlZFdpZHRoIC0gaW50ZXJmYWNlV2lkdGg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuaW5uZXJXaWR0aCkge1xyXG4gICAgICAgICAgICAgICAgc2V0dGluZ3MudyA9IHNldFNpemUob3B0aW9ucy5pbm5lcldpZHRoLCAneCcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICRsb2FkZWQuY3NzKHt3aWR0aDogc2V0dGluZ3Mud30pO1xyXG5cclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuaGVpZ2h0KSB7XHJcbiAgICAgICAgICAgICAgICBzZXR0aW5ncy5oID0gc2V0U2l6ZShvcHRpb25zLmhlaWdodCwgJ3knKSAtIGxvYWRlZEhlaWdodCAtIGludGVyZmFjZUhlaWdodDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5pbm5lckhlaWdodCkge1xyXG4gICAgICAgICAgICAgICAgc2V0dGluZ3MuaCA9IHNldFNpemUob3B0aW9ucy5pbm5lckhlaWdodCwgJ3knKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIW9wdGlvbnMuaW5uZXJIZWlnaHQgJiYgIW9wdGlvbnMuaGVpZ2h0KSB7XHJcbiAgICAgICAgICAgICAgICAkbG9hZGVkLmNzcyh7aGVpZ2h0OiBcImF1dG9cIn0pO1xyXG4gICAgICAgICAgICAgICAgc2V0dGluZ3MuaCA9ICRsb2FkZWQuaGVpZ2h0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgJGxvYWRlZC5jc3Moe2hlaWdodDogc2V0dGluZ3MuaH0pO1xyXG5cclxuICAgICAgICAgICAgcHVibGljTWV0aG9kLnBvc2l0aW9uKHNldHRpbmdzLnRyYW5zaXRpb24gPT09IFwibm9uZVwiID8gMCA6IHNldHRpbmdzLnNwZWVkKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHB1YmxpY01ldGhvZC5wcmVwID0gZnVuY3Rpb24gKG9iamVjdCkge1xyXG4gICAgICAgIGlmICghb3Blbikge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgY2FsbGJhY2ssIHNwZWVkID0gc2V0dGluZ3MudHJhbnNpdGlvbiA9PT0gXCJub25lXCIgPyAwIDogc2V0dGluZ3Muc3BlZWQ7XHJcblxyXG4gICAgICAgICRsb2FkZWQuZW1wdHkoKS5yZW1vdmUoKTsgLy8gVXNpbmcgZW1wdHkgZmlyc3QgbWF5IHByZXZlbnQgc29tZSBJRTcgaXNzdWVzLlxyXG5cclxuICAgICAgICAkbG9hZGVkID0gJHRhZyhkaXYsICdMb2FkZWRDb250ZW50JykuYXBwZW5kKG9iamVjdCk7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGdldFdpZHRoKCkge1xyXG4gICAgICAgICAgICBzZXR0aW5ncy53ID0gc2V0dGluZ3MudyB8fCAkbG9hZGVkLndpZHRoKCk7XHJcbiAgICAgICAgICAgIHNldHRpbmdzLncgPSBzZXR0aW5ncy5tdyAmJiBzZXR0aW5ncy5tdyA8IHNldHRpbmdzLncgPyBzZXR0aW5ncy5tdyA6IHNldHRpbmdzLnc7XHJcbiAgICAgICAgICAgIHJldHVybiBzZXR0aW5ncy53O1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBnZXRIZWlnaHQoKSB7XHJcbiAgICAgICAgICAgIHNldHRpbmdzLmggPSBzZXR0aW5ncy5oIHx8ICRsb2FkZWQuaGVpZ2h0KCk7XHJcbiAgICAgICAgICAgIHNldHRpbmdzLmggPSBzZXR0aW5ncy5taCAmJiBzZXR0aW5ncy5taCA8IHNldHRpbmdzLmggPyBzZXR0aW5ncy5taCA6IHNldHRpbmdzLmg7XHJcbiAgICAgICAgICAgIHJldHVybiBzZXR0aW5ncy5oO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgJGxvYWRlZC5oaWRlKClcclxuICAgICAgICAgICAgLmFwcGVuZFRvKCRsb2FkaW5nQmF5LnNob3coKSkvLyBjb250ZW50IGhhcyB0byBiZSBhcHBlbmRlZCB0byB0aGUgRE9NIGZvciBhY2N1cmF0ZSBzaXplIGNhbGN1bGF0aW9ucy5cclxuICAgICAgICAgICAgLmNzcyh7d2lkdGg6IGdldFdpZHRoKCksIG92ZXJmbG93OiBzZXR0aW5ncy5zY3JvbGxpbmcgPyAnYXV0bycgOiAnaGlkZGVuJ30pXHJcbiAgICAgICAgICAgIC5jc3Moe2hlaWdodDogZ2V0SGVpZ2h0KCl9KS8vIHNldHMgdGhlIGhlaWdodCBpbmRlcGVuZGVudGx5IGZyb20gdGhlIHdpZHRoIGluIGNhc2UgdGhlIG5ldyB3aWR0aCBpbmZsdWVuY2VzIHRoZSB2YWx1ZSBvZiBoZWlnaHQuXHJcbiAgICAgICAgICAgIC5wcmVwZW5kVG8oJGNvbnRlbnQpO1xyXG5cclxuICAgICAgICAkbG9hZGluZ0JheS5oaWRlKCk7XHJcblxyXG4gICAgICAgIC8vIGZsb2F0aW5nIHRoZSBJTUcgcmVtb3ZlcyB0aGUgYm90dG9tIGxpbmUtaGVpZ2h0IGFuZCBmaXhlZCBhIHByb2JsZW0gd2hlcmUgSUUgbWlzY2FsY3VsYXRlcyB0aGUgd2lkdGggb2YgdGhlIHBhcmVudCBlbGVtZW50IGFzIDEwMCUgb2YgdGhlIGRvY3VtZW50IHdpZHRoLlxyXG5cclxuICAgICAgICAkKHBob3RvKS5jc3MoeydmbG9hdCc6ICdub25lJ30pO1xyXG5cclxuICAgICAgICBjYWxsYmFjayA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIHRvdGFsID0gJHJlbGF0ZWQubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgaWZyYW1lLFxyXG4gICAgICAgICAgICAgICAgZnJhbWVCb3JkZXIgPSAnZnJhbWVCb3JkZXInLFxyXG4gICAgICAgICAgICAgICAgYWxsb3dUcmFuc3BhcmVuY3kgPSAnYWxsb3dUcmFuc3BhcmVuY3knLFxyXG4gICAgICAgICAgICAgICAgY29tcGxldGU7XHJcblxyXG4gICAgICAgICAgICBpZiAoIW9wZW4pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZnVuY3Rpb24gcmVtb3ZlRmlsdGVyKCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGlzSUUpIHtcclxuICAgICAgICAgICAgICAgICAgICAkYm94WzBdLnN0eWxlLnJlbW92ZUF0dHJpYnV0ZSgnZmlsdGVyJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNvbXBsZXRlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KGxvYWRpbmdUaW1lcik7XHJcbiAgICAgICAgICAgICAgICAkbG9hZGluZ092ZXJsYXkuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgdHJpZ2dlcihldmVudF9jb21wbGV0ZSwgc2V0dGluZ3Mub25Db21wbGV0ZSk7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNJRSkge1xyXG4gICAgICAgICAgICAgICAgLy9UaGlzIGZhZGVJbiBoZWxwcyB0aGUgYmljdWJpYyByZXNhbXBsaW5nIHRvIGtpY2staW4uXHJcbiAgICAgICAgICAgICAgICBpZiAocGhvdG8pIHtcclxuICAgICAgICAgICAgICAgICAgICAkbG9hZGVkLmZhZGVJbigxMDApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAkdGl0bGUuaHRtbChzZXR0aW5ncy50aXRsZSkuYWRkKCRsb2FkZWQpLnNob3coKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0b3RhbCA+IDEpIHsgLy8gaGFuZGxlIGdyb3VwaW5nXHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHNldHRpbmdzLmN1cnJlbnQgPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAkY3VycmVudC5odG1sKHNldHRpbmdzLmN1cnJlbnQucmVwbGFjZSgne2N1cnJlbnR9JywgaW5kZXggKyAxKS5yZXBsYWNlKCd7dG90YWx9JywgdG90YWwpKS5zaG93KCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgJG5leHRbKHNldHRpbmdzLmxvb3AgfHwgaW5kZXggPCB0b3RhbCAtIDEpID8gXCJzaG93XCIgOiBcImhpZGVcIl0oKS5odG1sKHNldHRpbmdzLm5leHQpO1xyXG4gICAgICAgICAgICAgICAgJHByZXZbKHNldHRpbmdzLmxvb3AgfHwgaW5kZXgpID8gXCJzaG93XCIgOiBcImhpZGVcIl0oKS5odG1sKHNldHRpbmdzLnByZXZpb3VzKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoc2V0dGluZ3Muc2xpZGVzaG93KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJHNsaWRlc2hvdy5zaG93KCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gUHJlbG9hZHMgaW1hZ2VzIHdpdGhpbiBhIHJlbCBncm91cFxyXG4gICAgICAgICAgICAgICAgaWYgKHNldHRpbmdzLnByZWxvYWRpbmcpIHtcclxuICAgICAgICAgICAgICAgICAgICAkLmVhY2goW2dldEluZGV4KC0xKSwgZ2V0SW5kZXgoMSldLCBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc3JjLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW1nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaSA9ICRyZWxhdGVkW3RoaXNdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YSA9ICQuZGF0YShpLCBjb2xvcmJveCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YSAmJiBkYXRhLmhyZWYpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyYyA9IGRhdGEuaHJlZjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkLmlzRnVuY3Rpb24oc3JjKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyYyA9IHNyYy5jYWxsKGkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3JjID0gJChpKS5hdHRyKCdocmVmJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzcmMgJiYgaXNJbWFnZShkYXRhLCBzcmMpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmMgPSByZXRpbmFVcmwoZGF0YSwgc3JjKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltZyA9IG5ldyBJbWFnZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW1nLnNyYyA9IHNyYztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgJGdyb3VwQ29udHJvbHMuaGlkZSgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoc2V0dGluZ3MuaWZyYW1lKSB7XHJcbiAgICAgICAgICAgICAgICBpZnJhbWUgPSAkdGFnKCdpZnJhbWUnKVswXTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZnJhbWVCb3JkZXIgaW4gaWZyYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWZyYW1lW2ZyYW1lQm9yZGVyXSA9IDA7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGFsbG93VHJhbnNwYXJlbmN5IGluIGlmcmFtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmcmFtZVthbGxvd1RyYW5zcGFyZW5jeV0gPSBcInRydWVcIjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIXNldHRpbmdzLnNjcm9sbGluZykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmcmFtZS5zY3JvbGxpbmcgPSBcIm5vXCI7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgJChpZnJhbWUpXHJcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzcmM6IHNldHRpbmdzLmhyZWYsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCksIC8vIGdpdmUgdGhlIGlmcmFtZSBhIHVuaXF1ZSBuYW1lIHRvIHByZXZlbnQgY2FjaGluZ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnY2xhc3MnOiBwcmVmaXggKyAnSWZyYW1lJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWxsb3dGdWxsU2NyZWVuIDogdHJ1ZSwgLy8gYWxsb3cgSFRNTDUgdmlkZW8gdG8gZ28gZnVsbHNjcmVlblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB3ZWJraXRBbGxvd0Z1bGxTY3JlZW4gOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtb3phbGxvd2Z1bGxzY3JlZW4gOiB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICAub25lKCdsb2FkJywgY29tcGxldGUpXHJcbiAgICAgICAgICAgICAgICAgICAgLmFwcGVuZFRvKCRsb2FkZWQpO1xyXG5cclxuICAgICAgICAgICAgICAgICRldmVudHMub25lKGV2ZW50X3B1cmdlLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWZyYW1lLnNyYyA9IFwiLy9hYm91dDpibGFua1wiO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHNldHRpbmdzLmZhc3RJZnJhbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAkKGlmcmFtZSkudHJpZ2dlcignbG9hZCcpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29tcGxldGUoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHNldHRpbmdzLnRyYW5zaXRpb24gPT09ICdmYWRlJykge1xyXG4gICAgICAgICAgICAgICAgJGJveC5mYWRlVG8oc3BlZWQsIDEsIHJlbW92ZUZpbHRlcik7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZW1vdmVGaWx0ZXIoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGlmIChzZXR0aW5ncy50cmFuc2l0aW9uID09PSAnZmFkZScpIHtcclxuICAgICAgICAgICAgJGJveC5mYWRlVG8oc3BlZWQsIDAsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHB1YmxpY01ldGhvZC5wb3NpdGlvbigwLCBjYWxsYmFjayk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHB1YmxpY01ldGhvZC5wb3NpdGlvbihzcGVlZCwgY2FsbGJhY2spO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgcHVibGljTWV0aG9kLmxvYWQgPSBmdW5jdGlvbiAobGF1bmNoZWQpIHtcclxuICAgICAgICB2YXIgaHJlZiwgc2V0UmVzaXplLCBwcmVwID0gcHVibGljTWV0aG9kLnByZXAsICRpbmxpbmU7XHJcblxyXG4gICAgICAgIGFjdGl2ZSA9IHRydWU7XHJcblxyXG4gICAgICAgIHBob3RvID0gZmFsc2U7XHJcblxyXG4gICAgICAgIGVsZW1lbnQgPSAkcmVsYXRlZFtpbmRleF07XHJcblxyXG4gICAgICAgIGlmICghbGF1bmNoZWQpIHtcclxuICAgICAgICAgICAgbWFrZVNldHRpbmdzKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoY2xhc3NOYW1lKSB7XHJcbiAgICAgICAgICAgICRib3guYWRkKCRvdmVybGF5KS5yZW1vdmVDbGFzcyhjbGFzc05hbWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoc2V0dGluZ3MuY2xhc3NOYW1lKSB7XHJcbiAgICAgICAgICAgICRib3guYWRkKCRvdmVybGF5KS5hZGRDbGFzcyhzZXR0aW5ncy5jbGFzc05hbWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjbGFzc05hbWUgPSBzZXR0aW5ncy5jbGFzc05hbWU7XHJcblxyXG4gICAgICAgIHRyaWdnZXIoZXZlbnRfcHVyZ2UpO1xyXG5cclxuICAgICAgICB0cmlnZ2VyKGV2ZW50X2xvYWQsIHNldHRpbmdzLm9uTG9hZCk7XHJcblxyXG4gICAgICAgIHNldHRpbmdzLmggPSBzZXR0aW5ncy5oZWlnaHQgP1xyXG4gICAgICAgICAgICBzZXRTaXplKHNldHRpbmdzLmhlaWdodCwgJ3knKSAtIGxvYWRlZEhlaWdodCAtIGludGVyZmFjZUhlaWdodCA6XHJcbiAgICAgICAgICAgIHNldHRpbmdzLmlubmVySGVpZ2h0ICYmIHNldFNpemUoc2V0dGluZ3MuaW5uZXJIZWlnaHQsICd5Jyk7XHJcblxyXG4gICAgICAgIHNldHRpbmdzLncgPSBzZXR0aW5ncy53aWR0aCA/XHJcbiAgICAgICAgICAgIHNldFNpemUoc2V0dGluZ3Mud2lkdGgsICd4JykgLSBsb2FkZWRXaWR0aCAtIGludGVyZmFjZVdpZHRoIDpcclxuICAgICAgICAgICAgc2V0dGluZ3MuaW5uZXJXaWR0aCAmJiBzZXRTaXplKHNldHRpbmdzLmlubmVyV2lkdGgsICd4Jyk7XHJcblxyXG4gICAgICAgIC8vIFNldHMgdGhlIG1pbmltdW0gZGltZW5zaW9ucyBmb3IgdXNlIGluIGltYWdlIHNjYWxpbmdcclxuICAgICAgICBzZXR0aW5ncy5tdyA9IHNldHRpbmdzLnc7XHJcbiAgICAgICAgc2V0dGluZ3MubWggPSBzZXR0aW5ncy5oO1xyXG5cclxuICAgICAgICAvLyBSZS1ldmFsdWF0ZSB0aGUgbWluaW11bSB3aWR0aCBhbmQgaGVpZ2h0IGJhc2VkIG9uIG1heFdpZHRoIGFuZCBtYXhIZWlnaHQgdmFsdWVzLlxyXG4gICAgICAgIC8vIElmIHRoZSB3aWR0aCBvciBoZWlnaHQgZXhjZWVkIHRoZSBtYXhXaWR0aCBvciBtYXhIZWlnaHQsIHVzZSB0aGUgbWF4aW11bSB2YWx1ZXMgaW5zdGVhZC5cclxuICAgICAgICBpZiAoc2V0dGluZ3MubWF4V2lkdGgpIHtcclxuICAgICAgICAgICAgc2V0dGluZ3MubXcgPSBzZXRTaXplKHNldHRpbmdzLm1heFdpZHRoLCAneCcpIC0gbG9hZGVkV2lkdGggLSBpbnRlcmZhY2VXaWR0aDtcclxuICAgICAgICAgICAgc2V0dGluZ3MubXcgPSBzZXR0aW5ncy53ICYmIHNldHRpbmdzLncgPCBzZXR0aW5ncy5tdyA/IHNldHRpbmdzLncgOiBzZXR0aW5ncy5tdztcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHNldHRpbmdzLm1heEhlaWdodCkge1xyXG4gICAgICAgICAgICBzZXR0aW5ncy5taCA9IHNldFNpemUoc2V0dGluZ3MubWF4SGVpZ2h0LCAneScpIC0gbG9hZGVkSGVpZ2h0IC0gaW50ZXJmYWNlSGVpZ2h0O1xyXG4gICAgICAgICAgICBzZXR0aW5ncy5taCA9IHNldHRpbmdzLmggJiYgc2V0dGluZ3MuaCA8IHNldHRpbmdzLm1oID8gc2V0dGluZ3MuaCA6IHNldHRpbmdzLm1oO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaHJlZiA9IHNldHRpbmdzLmhyZWY7XHJcblxyXG4gICAgICAgIGxvYWRpbmdUaW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAkbG9hZGluZ092ZXJsYXkuc2hvdygpO1xyXG4gICAgICAgIH0sIDEwMCk7XHJcblxyXG4gICAgICAgIGlmIChzZXR0aW5ncy5pbmxpbmUpIHtcclxuICAgICAgICAgICAgLy8gSW5zZXJ0cyBhbiBlbXB0eSBwbGFjZWhvbGRlciB3aGVyZSBpbmxpbmUgY29udGVudCBpcyBiZWluZyBwdWxsZWQgZnJvbS5cclxuICAgICAgICAgICAgLy8gQW4gZXZlbnQgaXMgYm91bmQgdG8gcHV0IGlubGluZSBjb250ZW50IGJhY2sgd2hlbiBDb2xvckJveCBjbG9zZXMgb3IgbG9hZHMgbmV3IGNvbnRlbnQuXHJcbiAgICAgICAgICAgICRpbmxpbmUgPSAkdGFnKGRpdikuaGlkZSgpLmluc2VydEJlZm9yZSgkKGhyZWYpWzBdKTtcclxuXHJcbiAgICAgICAgICAgICRldmVudHMub25lKGV2ZW50X3B1cmdlLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAkaW5saW5lLnJlcGxhY2VXaXRoKCRsb2FkZWQuY2hpbGRyZW4oKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgcHJlcCgkKGhyZWYpKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHNldHRpbmdzLmlmcmFtZSkge1xyXG4gICAgICAgICAgICAvLyBJRnJhbWUgZWxlbWVudCB3b24ndCBiZSBhZGRlZCB0byB0aGUgRE9NIHVudGlsIGl0IGlzIHJlYWR5IHRvIGJlIGRpc3BsYXllZCxcclxuICAgICAgICAgICAgLy8gdG8gYXZvaWQgcHJvYmxlbXMgd2l0aCBET00tcmVhZHkgSlMgdGhhdCBtaWdodCBiZSB0cnlpbmcgdG8gcnVuIGluIHRoYXQgaWZyYW1lLlxyXG4gICAgICAgICAgICBwcmVwKFwiIFwiKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHNldHRpbmdzLmh0bWwpIHtcclxuICAgICAgICAgICAgcHJlcChzZXR0aW5ncy5odG1sKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGlzSW1hZ2Uoc2V0dGluZ3MsIGhyZWYpKSB7XHJcblxyXG4gICAgICAgICAgICBocmVmID0gcmV0aW5hVXJsKHNldHRpbmdzLCBocmVmKTtcclxuXHJcbiAgICAgICAgICAgICQocGhvdG8gPSBuZXcgSW1hZ2UoKSlcclxuICAgICAgICAgICAgICAgIC5hZGRDbGFzcyhwcmVmaXggKyAnUGhvdG8nKVxyXG4gICAgICAgICAgICAgICAgLmJpbmQoJ2Vycm9yJyxmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2V0dGluZ3MudGl0bGUgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICBwcmVwKCR0YWcoZGl2LCAnRXJyb3InKS5odG1sKHNldHRpbmdzLmltZ0Vycm9yKSk7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLm9uZSgnbG9hZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcGVyY2VudDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNldHRpbmdzLnJldGluYUltYWdlICYmIHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvID4gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwaG90by5oZWlnaHQgPSBwaG90by5oZWlnaHQgLyB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbztcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGhvdG8ud2lkdGggPSBwaG90by53aWR0aCAvIHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNldHRpbmdzLnNjYWxlUGhvdG9zKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFJlc2l6ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBob3RvLmhlaWdodCAtPSBwaG90by5oZWlnaHQgKiBwZXJjZW50O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGhvdG8ud2lkdGggLT0gcGhvdG8ud2lkdGggKiBwZXJjZW50O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2V0dGluZ3MubXcgJiYgcGhvdG8ud2lkdGggPiBzZXR0aW5ncy5tdykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVyY2VudCA9IChwaG90by53aWR0aCAtIHNldHRpbmdzLm13KSAvIHBob3RvLndpZHRoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0UmVzaXplKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNldHRpbmdzLm1oICYmIHBob3RvLmhlaWdodCA+IHNldHRpbmdzLm1oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZXJjZW50ID0gKHBob3RvLmhlaWdodCAtIHNldHRpbmdzLm1oKSAvIHBob3RvLmhlaWdodDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFJlc2l6ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2V0dGluZ3MuaCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwaG90by5zdHlsZS5tYXJnaW5Ub3AgPSBNYXRoLm1heChzZXR0aW5ncy5taCAtIHBob3RvLmhlaWdodCwgMCkgLyAyICsgJ3B4JztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICgkcmVsYXRlZFsxXSAmJiAoc2V0dGluZ3MubG9vcCB8fCAkcmVsYXRlZFtpbmRleCArIDFdKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwaG90by5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBob3RvLm9uY2xpY2sgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwdWJsaWNNZXRob2QubmV4dCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzSUUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGhvdG8uc3R5bGUubXNJbnRlcnBvbGF0aW9uTW9kZSA9ICdiaWN1YmljJztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkgeyAvLyBBIHBhdXNlIGJlY2F1c2UgQ2hyb21lIHdpbGwgc29tZXRpbWVzIHJlcG9ydCBhIDAgYnkgMCBzaXplIG90aGVyd2lzZS5cclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJlcChwaG90byk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSwgMSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkgeyAvLyBBIHBhdXNlIGJlY2F1c2UgT3BlcmEgMTAuNisgd2lsbCBzb21ldGltZXMgbm90IHJ1biB0aGUgb25sb2FkIGZ1bmN0aW9uIG90aGVyd2lzZS5cclxuICAgICAgICAgICAgICAgIHBob3RvLnNyYyA9IGhyZWY7XHJcbiAgICAgICAgICAgIH0sIDEpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoaHJlZikge1xyXG4gICAgICAgICAgICAkbG9hZGluZ0JheS5sb2FkKGhyZWYsIHNldHRpbmdzLmRhdGEsIGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMpIHtcclxuICAgICAgICAgICAgICAgIHByZXAoc3RhdHVzID09PSAnZXJyb3InID8gJHRhZyhkaXYsICdFcnJvcicpLmh0bWwoc2V0dGluZ3MueGhyRXJyb3IpIDogJCh0aGlzKS5jb250ZW50cygpKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAvLyBOYXZpZ2F0ZXMgdG8gdGhlIG5leHQgcGFnZS9pbWFnZSBpbiBhIHNldC5cclxuICAgIHB1YmxpY01ldGhvZC5uZXh0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICghYWN0aXZlICYmICRyZWxhdGVkWzFdICYmIChzZXR0aW5ncy5sb29wIHx8ICRyZWxhdGVkW2luZGV4ICsgMV0pKSB7XHJcbiAgICAgICAgICAgIGluZGV4ID0gZ2V0SW5kZXgoMSk7XHJcbiAgICAgICAgICAgIHB1YmxpY01ldGhvZC5sb2FkKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWNNZXRob2QucHJldiA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBpZiAoIWFjdGl2ZSAmJiAkcmVsYXRlZFsxXSAmJiAoc2V0dGluZ3MubG9vcCB8fCBpbmRleCkpIHtcclxuICAgICAgICAgICAgaW5kZXggPSBnZXRJbmRleCgtMSk7XHJcbiAgICAgICAgICAgIHB1YmxpY01ldGhvZC5sb2FkKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAvLyBOb3RlOiB0byB1c2UgdGhpcyB3aXRoaW4gYW4gaWZyYW1lIHVzZSB0aGUgZm9sbG93aW5nIGZvcm1hdDogcGFyZW50LiQuZm4uY29sb3Jib3guY2xvc2UoKTtcclxuICAgIHB1YmxpY01ldGhvZC5jbG9zZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBpZiAob3BlbiAmJiAhY2xvc2luZykge1xyXG5cclxuICAgICAgICAgICAgY2xvc2luZyA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICBvcGVuID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICB0cmlnZ2VyKGV2ZW50X2NsZWFudXAsIHNldHRpbmdzLm9uQ2xlYW51cCk7XHJcblxyXG4gICAgICAgICAgICAkd2luZG93LnVuYmluZCgnLicgKyBwcmVmaXggKyAnIC4nICsgZXZlbnRfaWU2KTtcclxuXHJcbiAgICAgICAgICAgICRvdmVybGF5LmZhZGVUbygyMDAsIDApO1xyXG5cclxuICAgICAgICAgICAgJGJveC5zdG9wKCkuZmFkZVRvKDMwMCwgMCwgZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgICAgICRib3guYWRkKCRvdmVybGF5KS5jc3MoeydvcGFjaXR5JzogMSwgY3Vyc29yOiAnYXV0byd9KS5oaWRlKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgdHJpZ2dlcihldmVudF9wdXJnZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgJGxvYWRlZC5lbXB0eSgpLnJlbW92ZSgpOyAvLyBVc2luZyBlbXB0eSBmaXJzdCBtYXkgcHJldmVudCBzb21lIElFNyBpc3N1ZXMuXHJcblxyXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xvc2luZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIHRyaWdnZXIoZXZlbnRfY2xvc2VkLCBzZXR0aW5ncy5vbkNsb3NlZCk7XHJcbiAgICAgICAgICAgICAgICB9LCAxKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAvLyBSZW1vdmVzIGNoYW5nZXMgQ29sb3JCb3ggbWFkZSB0byB0aGUgZG9jdW1lbnQsIGJ1dCBkb2VzIG5vdCByZW1vdmUgdGhlIHBsdWdpblxyXG4gICAgLy8gZnJvbSBqUXVlcnkuXHJcbiAgICBwdWJsaWNNZXRob2QucmVtb3ZlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICQoW10pLmFkZCgkYm94KS5hZGQoJG92ZXJsYXkpLnJlbW92ZSgpO1xyXG4gICAgICAgICRib3ggPSBudWxsO1xyXG4gICAgICAgICQoJy4nICsgYm94RWxlbWVudClcclxuICAgICAgICAgICAgLnJlbW92ZURhdGEoY29sb3Jib3gpXHJcbiAgICAgICAgICAgIC5yZW1vdmVDbGFzcyhib3hFbGVtZW50KTtcclxuXHJcbiAgICAgICAgJChkb2N1bWVudCkudW5iaW5kKCdjbGljay4nK3ByZWZpeCk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIEEgbWV0aG9kIGZvciBmZXRjaGluZyB0aGUgY3VycmVudCBlbGVtZW50IENvbG9yQm94IGlzIHJlZmVyZW5jaW5nLlxyXG4gICAgLy8gcmV0dXJucyBhIGpRdWVyeSBvYmplY3QuXHJcbiAgICBwdWJsaWNNZXRob2QuZWxlbWVudCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gJChlbGVtZW50KTtcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljTWV0aG9kLnNldHRpbmdzID0gZGVmYXVsdHM7XHJcblxyXG59KGpRdWVyeSwgZG9jdW1lbnQsIHdpbmRvdykpOyJdLCJmaWxlIjoianF1ZXJ5LmNvbG9yYm94LmpzIn0=
