/**
 * photoset-grid - v1.0.1
 * 2014-04-08
 * jQuery plugin to arrange images into a flexible grid
 * http://stylehatch.github.com/photoset-grid/
 *
 * Copyright 2014 Jonathan Moore - Style Hatch
 */

/*jshint browser: true, curly: true, eqeqeq: true, forin: false, immed: false, newcap: true, noempty: true, strict: true, undef: true, devel: true */
;(function ( $, window, document, undefined ) {

    'use strict';

    // Plugin name and default settings
    var pluginName = "photosetGrid",
        defaults = {
            // Required
            // set the width of the container
            width         : '100%',
            // the space between the rows / columns
            gutter        : '0px',

            // Optional
            // wrap the images in a vs. div and link to the data-highres images
            highresLinks  : false,
            // threshold for the lowres image, if container is > swap the data-highres
            lowresWidth   : 500,
            // relational attr to apply to the links for lightbox use
            rel           : '',

            // Call back events
            onInit        : function(){},
            onComplete    : function(){}
        };

    // Plugin constructor
    function Plugin( element, options ) {
        this.element = element;
        this.options = $.extend( {}, defaults, options );

        this._defaults = defaults;
        this._name = pluginName;

        this.init();
    }

    Plugin.prototype = {

        init: function() {
            // Call the optional onInit event set when the plugin is called
            this.options.onInit();

            this._setupRows(this.element, this.options);
            this._setupColumns(this.element, this.options);

        },

        _callback: function(elem){
            // Call the optional onComplete event after the plugin has been completed
            this.options.onComplete(elem);
        },

        _setupRows: function(  elem, options ){
            // Convert the layout string into an array to build the DOM structures
            if(options.layout) {
                // Check for layout defined in plugin call
                this.layout = options.layout;
            } else if($(elem).attr('data-layout')) {
                // If not defined in the options, check for the data-layout attr
                this.layout = $(elem).attr('data-layout');
            } else {
                // Otherwise give it a stacked layout (no grids for you)
                // Generate a layout string of all ones based on the number of images
                var stackedLayout = "";
                var defaultColumns = 1;
                for (var imgs=0; imgs<$(elem).find('img').length; imgs++ ) {
                    stackedLayout = stackedLayout + defaultColumns.toString();
                }
                this.layout = stackedLayout;
            }

            // Dump the layout into a rows array
            // Convert the array into all numbers vs. strings
            this.rows = this.layout.split('');
            for (var i in this.rows ) {
                this.rows[i] = parseInt(this.rows[i], 10);
            }

            var $images = $(elem).find('img');
            var imageIndex = 0;

            $.each(this.rows, function(i, val){
                var rowStart = imageIndex;
                var rowEnd = imageIndex + val;

                // Wrap each set of images in a row into a container div
                $images.slice(rowStart, rowEnd).wrapAll('<div class="photoset-row cols-' + val + '"></div>');

                imageIndex = rowEnd;
            });

            $(elem).find('.photoset-row:not(:last-child)').css({
                'margin-bottom': options.gutter
            });
        },

        _setupColumns: function(  elem, options ){

            // Reference to this Plugin
            var $this = this;

            var setupStyles = function(waitForImagesLoaded){
                var $rows = $(elem).find('.photoset-row');
                var $images = $(elem).find('img');

                // Wrap the images in links to the highres or regular image
                // Otherwise wrap in div.photoset-cell
                if(options.highresLinks){
                    $images.each(function(){
                        var highres;
                        // If a highres image exists link it up!
                        if($(this).attr('data-highres')){
                            highres = $(this).attr('data-highres');
                        } else {
                            highres = $(this).attr('src');
                        }
                        $(this).wrapAll('<a href="' + highres + '" class="photoset-cell highres-link" />');
                    });

                    // Apply the optional rel
                    if(options.rel){
                        $images.parent().attr('rel', options.rel);
                    }

                } else {
                    $images.each(function(){
                        $(this).wrapAll('<div class="photoset-cell" />');
                    });
                }

                var $cells = $(elem).find('.photoset-cell');
                var $cols1 = $(elem).find('.cols-1 .photoset-cell');
                var $cols2 = $(elem).find('.cols-2 .photoset-cell');
                var $cols3 = $(elem).find('.cols-3 .photoset-cell');
                var $cols4 = $(elem).find('.cols-4 .photoset-cell');
                var $cols5 = $(elem).find('.cols-5 .photoset-cell');

                // Apply styles initial structure styles to the grid
                $(elem).css({
                    'width': options.width
                });
                $rows.css({
                    'clear': 'left',
                    'display': 'block',
                    'overflow': 'hidden'
                });
                $cells.css({
                    'float': 'left',
                    'display': 'block',
                    'line-height': '0',
                    '-webkit-box-sizing': 'border-box',
                    '-moz-box-sizing': 'border-box',
                    'box-sizing': 'border-box'
                });
                $images.css({
                    'width': '100%',
                    'height': 'auto'
                });

                // if the imaged did not have height/width attr set them
                if (waitForImagesLoaded) {
                    $images.each(function(){
                        $(this).attr('height', $(this).height());
                        $(this).attr('width', $(this).width());
                    });
                }

                // Set the width of the cells based on the number of columns in the row
                $cols1.css({ 'width': '100%' });
                $cols2.css({ 'width': '50%' });
                $cols3.css({ 'width': '33.3%' });
                $cols4.css({ 'width': '25%' });
                $cols5.css({ 'width': '20%' });


                var gutterVal = parseInt(options.gutter, 10);
                // Apply 50% gutter to left and right
                // this provides equal gutters a high values
                $(elem).find('.photoset-cell:not(:last-child)').css({
                    'padding-right': (gutterVal / 2) + 'px'
                });
                $(elem).find('.photoset-cell:not(:first-child)').css({
                    'padding-left': (gutterVal / 2) + 'px'
                });


                function resizePhotosetGrid(){

                    // Give the values a floor to prevent misfires
                    var w = $(elem).width().toString();

                    if( w !== $(elem).attr('data-width') ) {
                        $rows.each(function(){
                            var $shortestImg = $(this).find('img:eq(0)');

                            $(this).find('img').each(function(){
                                var $img = $(this);
                                if( $img.attr('height') < $shortestImg.attr('height') ){
                                    $shortestImg = $(this);
                                }

                                if(parseInt($img.css('width'), 10) > options.lowresWidth && $img.attr('data-highres')){
                                    $img.attr('src', $img.attr('data-highres'));
                                }
                            });

                            // Get the row height from the calculated/real height/width of the shortest image
                            var rowHeight = ( $shortestImg.attr('height') * parseInt($shortestImg.css('width'), 10) ) / $shortestImg.attr('width');
                            // Adding a buffer to shave off a few pixels in height
                            var bufferHeight = Math.floor(rowHeight * 0.025);
                            $(this).height( rowHeight - bufferHeight );

                            $(this).find('img').each(function(){
                                // Get the image height from the calculated/real height/width
                                var imageHeight = ( $(this).attr('height') * parseInt($(this).css('width'), 10) ) / $(this).attr('width');
                                var marginOffset = ( (rowHeight - imageHeight) * 0.5 ) + 'px';
                                $(this).css({
                                    'margin-top' : marginOffset
                                });
                            });

                        });
                        $(elem).attr('data-width', w );
                    }

                }
                resizePhotosetGrid();

                $(window).on("resize", function() {
                    resizePhotosetGrid();
                });

            };

            // By default the plugin will wait until all of the images are loaded to setup the styles
            var waitForImagesLoaded = true;
            var hasDimensions = true;

            // Loops through all of the images in the photoset
            // if the height and width exists for all images set waitForImagesLoaded to false
            $(elem).find('img').each(function(){
                hasDimensions = hasDimensions & ( !!$(this).attr('height') & !!$(this).attr('width') );
            });

            waitForImagesLoaded = !hasDimensions;

            // Only use imagesLoaded() if waitForImagesLoaded
            if(waitForImagesLoaded) {
                $(elem).imagesLoaded(function(){
                    setupStyles(waitForImagesLoaded);
                    $this._callback(elem);
                });
            } else {
                setupStyles(waitForImagesLoaded);
                $this._callback(elem);
            }


        }

    };

    // plugin wrapper around the constructor
    $.fn[pluginName] = function ( options ) {
        return this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName, new Plugin( this, options ));
            }
        });
    };

    /*!
     * jQuery imagesLoaded plugin v2.1.1
     * http://github.com/desandro/imagesloaded
     *
     * MIT License. by Paul Irish et al.
     */

    /*jshint curly: true, eqeqeq: true, noempty: true, strict: true, undef: true, browser: true */
    /*global jQuery: false */

    // blank image data-uri bypasses webkit log warning (thx doug jones)
    var BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

    $.fn.imagesLoaded = function( callback ) {
        var $this = this,
            deferred = $.isFunction($.Deferred) ? $.Deferred() : 0,
            hasNotify = $.isFunction(deferred.notify),
            $images = $this.find('img').add( $this.filter('img') ),
            loaded = [],
            proper = [],
            broken = [];

        // Register deferred callbacks
        if ($.isPlainObject(callback)) {
            $.each(callback, function (key, value) {
                if (key === 'callback') {
                    callback = value;
                } else if (deferred) {
                    deferred[key](value);
                }
            });
        }

        function doneLoading() {
            var $proper = $(proper),
                $broken = $(broken);

            if ( deferred ) {
                if ( broken.length ) {
                    deferred.reject( $images, $proper, $broken );
                } else {
                    deferred.resolve( $images );
                }
            }

            if ( $.isFunction( callback ) ) {
                callback.call( $this, $images, $proper, $broken );
            }
        }

        function imgLoadedHandler( event ) {
            imgLoaded( event.target, event.type === 'error' );
        }

        function imgLoaded( img, isBroken ) {
            // don't proceed if BLANK image, or image is already loaded
            if ( img.src === BLANK || $.inArray( img, loaded ) !== -1 ) {
                return;
            }

            // store element in loaded images array
            loaded.push( img );

            // keep track of broken and properly loaded images
            if ( isBroken ) {
                broken.push( img );
            } else {
                proper.push( img );
            }

            // cache image and its state for future calls
            $.data( img, 'imagesLoaded', { isBroken: isBroken, src: img.src } );

            // trigger deferred progress method if present
            if ( hasNotify ) {
                deferred.notifyWith( $(img), [ isBroken, $images, $(proper), $(broken) ] );
            }

            // call doneLoading and clean listeners if all images are loaded
            if ( $images.length === loaded.length ) {
                setTimeout( doneLoading );
                $images.unbind( '.imagesLoaded', imgLoadedHandler );
            }
        }

        // if no images, trigger immediately
        if ( !$images.length ) {
            doneLoading();
        } else {
            $images.bind( 'load.imagesLoaded error.imagesLoaded', imgLoadedHandler )
                .each( function( i, el ) {
                    var src = el.src;

                    // find out if this image has been already checked for status
                    // if it was, and src has not changed, call imgLoaded on it
                    var cached = $.data( el, 'imagesLoaded' );
                    if ( cached && cached.src === src ) {
                        imgLoaded( el, cached.isBroken );
                        return;
                    }

                    // if complete is true and browser supports natural sizes, try
                    // to check for image status manually
                    if ( el.complete && el.naturalWidth !== undefined ) {
                        imgLoaded( el, el.naturalWidth === 0 || el.naturalHeight === 0 );
                        return;
                    }

                    // cached images don't fire load sometimes, so we reset src, but only when
                    // dealing with IE, or image is complete (loaded) and failed manual check
                    // webkit hack from http://groups.google.com/group/jquery-dev/browse_thread/thread/eee6ab7b2da50e1f
                    if ( el.readyState || el.complete ) {
                        el.src = BLANK;
                        el.src = src;
                    }
                });
        }

        return deferred ? deferred.promise( $this ) : $this;
    };

    /*
     * throttledresize: special jQuery event that happens at a reduced rate compared to "resize"
     *
     * latest version and complete README available on Github:
     * https://github.com/louisremi/jquery-smartresize
     *
     * Copyright 2012 @louis_remi
     * Licensed under the MIT license.
     *
     * This saved you an hour of work?
     * Send me music http://www.amazon.co.uk/wishlist/HNTU0468LQON
     */

    var $event = $.event,
        $special,
        dummy = {_:0},
        frame = 0,
        wasResized, animRunning;

    $special = $event.special.throttledresize = {
        setup: function() {
            $( this ).on( "resize", $special.handler );
        },
        teardown: function() {
            $( this ).off( "resize", $special.handler );
        },
        handler: function( event, execAsap ) {
            // Save the context
            var context = this,
                args = arguments;

            wasResized = true;

            if ( !animRunning ) {
                setInterval(function(){
                    frame++;

                    if ( frame > $special.threshold && wasResized || execAsap ) {
                        // set correct event type
                        event.type = "throttledresize";
                        $event.dispatch.apply( context, args );
                        wasResized = false;
                        frame = 0;
                    }
                    if ( frame > 9 ) {
                        $(dummy).stop();
                        animRunning = false;
                        frame = 0;
                    }
                }, 30);
                animRunning = true;
            }
        },
        threshold: 0
    };


})( jQuery, window, document );
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJqcXVlcnkucGhvdG9zZXQtZ3JpZC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogcGhvdG9zZXQtZ3JpZCAtIHYxLjAuMVxyXG4gKiAyMDE0LTA0LTA4XHJcbiAqIGpRdWVyeSBwbHVnaW4gdG8gYXJyYW5nZSBpbWFnZXMgaW50byBhIGZsZXhpYmxlIGdyaWRcclxuICogaHR0cDovL3N0eWxlaGF0Y2guZ2l0aHViLmNvbS9waG90b3NldC1ncmlkL1xyXG4gKlxyXG4gKiBDb3B5cmlnaHQgMjAxNCBKb25hdGhhbiBNb29yZSAtIFN0eWxlIEhhdGNoXHJcbiAqL1xyXG5cclxuLypqc2hpbnQgYnJvd3NlcjogdHJ1ZSwgY3VybHk6IHRydWUsIGVxZXFlcTogdHJ1ZSwgZm9yaW46IGZhbHNlLCBpbW1lZDogZmFsc2UsIG5ld2NhcDogdHJ1ZSwgbm9lbXB0eTogdHJ1ZSwgc3RyaWN0OiB0cnVlLCB1bmRlZjogdHJ1ZSwgZGV2ZWw6IHRydWUgKi9cclxuOyhmdW5jdGlvbiAoICQsIHdpbmRvdywgZG9jdW1lbnQsIHVuZGVmaW5lZCApIHtcclxuXHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgLy8gUGx1Z2luIG5hbWUgYW5kIGRlZmF1bHQgc2V0dGluZ3NcclxuICAgIHZhciBwbHVnaW5OYW1lID0gXCJwaG90b3NldEdyaWRcIixcclxuICAgICAgICBkZWZhdWx0cyA9IHtcclxuICAgICAgICAgICAgLy8gUmVxdWlyZWRcclxuICAgICAgICAgICAgLy8gc2V0IHRoZSB3aWR0aCBvZiB0aGUgY29udGFpbmVyXHJcbiAgICAgICAgICAgIHdpZHRoICAgICAgICAgOiAnMTAwJScsXHJcbiAgICAgICAgICAgIC8vIHRoZSBzcGFjZSBiZXR3ZWVuIHRoZSByb3dzIC8gY29sdW1uc1xyXG4gICAgICAgICAgICBndXR0ZXIgICAgICAgIDogJzBweCcsXHJcblxyXG4gICAgICAgICAgICAvLyBPcHRpb25hbFxyXG4gICAgICAgICAgICAvLyB3cmFwIHRoZSBpbWFnZXMgaW4gYSB2cy4gZGl2IGFuZCBsaW5rIHRvIHRoZSBkYXRhLWhpZ2hyZXMgaW1hZ2VzXHJcbiAgICAgICAgICAgIGhpZ2hyZXNMaW5rcyAgOiBmYWxzZSxcclxuICAgICAgICAgICAgLy8gdGhyZXNob2xkIGZvciB0aGUgbG93cmVzIGltYWdlLCBpZiBjb250YWluZXIgaXMgPiBzd2FwIHRoZSBkYXRhLWhpZ2hyZXNcclxuICAgICAgICAgICAgbG93cmVzV2lkdGggICA6IDUwMCxcclxuICAgICAgICAgICAgLy8gcmVsYXRpb25hbCBhdHRyIHRvIGFwcGx5IHRvIHRoZSBsaW5rcyBmb3IgbGlnaHRib3ggdXNlXHJcbiAgICAgICAgICAgIHJlbCAgICAgICAgICAgOiAnJyxcclxuXHJcbiAgICAgICAgICAgIC8vIENhbGwgYmFjayBldmVudHNcclxuICAgICAgICAgICAgb25Jbml0ICAgICAgICA6IGZ1bmN0aW9uKCl7fSxcclxuICAgICAgICAgICAgb25Db21wbGV0ZSAgICA6IGZ1bmN0aW9uKCl7fVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgLy8gUGx1Z2luIGNvbnN0cnVjdG9yXHJcbiAgICBmdW5jdGlvbiBQbHVnaW4oIGVsZW1lbnQsIG9wdGlvbnMgKSB7XHJcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcclxuICAgICAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCgge30sIGRlZmF1bHRzLCBvcHRpb25zICk7XHJcblxyXG4gICAgICAgIHRoaXMuX2RlZmF1bHRzID0gZGVmYXVsdHM7XHJcbiAgICAgICAgdGhpcy5fbmFtZSA9IHBsdWdpbk5hbWU7XHJcblxyXG4gICAgICAgIHRoaXMuaW5pdCgpO1xyXG4gICAgfVxyXG5cclxuICAgIFBsdWdpbi5wcm90b3R5cGUgPSB7XHJcblxyXG4gICAgICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAvLyBDYWxsIHRoZSBvcHRpb25hbCBvbkluaXQgZXZlbnQgc2V0IHdoZW4gdGhlIHBsdWdpbiBpcyBjYWxsZWRcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLm9uSW5pdCgpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5fc2V0dXBSb3dzKHRoaXMuZWxlbWVudCwgdGhpcy5vcHRpb25zKTtcclxuICAgICAgICAgICAgdGhpcy5fc2V0dXBDb2x1bW5zKHRoaXMuZWxlbWVudCwgdGhpcy5vcHRpb25zKTtcclxuXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgX2NhbGxiYWNrOiBmdW5jdGlvbihlbGVtKXtcclxuICAgICAgICAgICAgLy8gQ2FsbCB0aGUgb3B0aW9uYWwgb25Db21wbGV0ZSBldmVudCBhZnRlciB0aGUgcGx1Z2luIGhhcyBiZWVuIGNvbXBsZXRlZFxyXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMub25Db21wbGV0ZShlbGVtKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBfc2V0dXBSb3dzOiBmdW5jdGlvbiggIGVsZW0sIG9wdGlvbnMgKXtcclxuICAgICAgICAgICAgLy8gQ29udmVydCB0aGUgbGF5b3V0IHN0cmluZyBpbnRvIGFuIGFycmF5IHRvIGJ1aWxkIHRoZSBET00gc3RydWN0dXJlc1xyXG4gICAgICAgICAgICBpZihvcHRpb25zLmxheW91dCkge1xyXG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIGxheW91dCBkZWZpbmVkIGluIHBsdWdpbiBjYWxsXHJcbiAgICAgICAgICAgICAgICB0aGlzLmxheW91dCA9IG9wdGlvbnMubGF5b3V0O1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYoJChlbGVtKS5hdHRyKCdkYXRhLWxheW91dCcpKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBJZiBub3QgZGVmaW5lZCBpbiB0aGUgb3B0aW9ucywgY2hlY2sgZm9yIHRoZSBkYXRhLWxheW91dCBhdHRyXHJcbiAgICAgICAgICAgICAgICB0aGlzLmxheW91dCA9ICQoZWxlbSkuYXR0cignZGF0YS1sYXlvdXQnKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIE90aGVyd2lzZSBnaXZlIGl0IGEgc3RhY2tlZCBsYXlvdXQgKG5vIGdyaWRzIGZvciB5b3UpXHJcbiAgICAgICAgICAgICAgICAvLyBHZW5lcmF0ZSBhIGxheW91dCBzdHJpbmcgb2YgYWxsIG9uZXMgYmFzZWQgb24gdGhlIG51bWJlciBvZiBpbWFnZXNcclxuICAgICAgICAgICAgICAgIHZhciBzdGFja2VkTGF5b3V0ID0gXCJcIjtcclxuICAgICAgICAgICAgICAgIHZhciBkZWZhdWx0Q29sdW1ucyA9IDE7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpbWdzPTA7IGltZ3M8JChlbGVtKS5maW5kKCdpbWcnKS5sZW5ndGg7IGltZ3MrKyApIHtcclxuICAgICAgICAgICAgICAgICAgICBzdGFja2VkTGF5b3V0ID0gc3RhY2tlZExheW91dCArIGRlZmF1bHRDb2x1bW5zLnRvU3RyaW5nKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLmxheW91dCA9IHN0YWNrZWRMYXlvdXQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIER1bXAgdGhlIGxheW91dCBpbnRvIGEgcm93cyBhcnJheVxyXG4gICAgICAgICAgICAvLyBDb252ZXJ0IHRoZSBhcnJheSBpbnRvIGFsbCBudW1iZXJzIHZzLiBzdHJpbmdzXHJcbiAgICAgICAgICAgIHRoaXMucm93cyA9IHRoaXMubGF5b3V0LnNwbGl0KCcnKTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSBpbiB0aGlzLnJvd3MgKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJvd3NbaV0gPSBwYXJzZUludCh0aGlzLnJvd3NbaV0sIDEwKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyICRpbWFnZXMgPSAkKGVsZW0pLmZpbmQoJ2ltZycpO1xyXG4gICAgICAgICAgICB2YXIgaW1hZ2VJbmRleCA9IDA7XHJcblxyXG4gICAgICAgICAgICAkLmVhY2godGhpcy5yb3dzLCBmdW5jdGlvbihpLCB2YWwpe1xyXG4gICAgICAgICAgICAgICAgdmFyIHJvd1N0YXJ0ID0gaW1hZ2VJbmRleDtcclxuICAgICAgICAgICAgICAgIHZhciByb3dFbmQgPSBpbWFnZUluZGV4ICsgdmFsO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFdyYXAgZWFjaCBzZXQgb2YgaW1hZ2VzIGluIGEgcm93IGludG8gYSBjb250YWluZXIgZGl2XHJcbiAgICAgICAgICAgICAgICAkaW1hZ2VzLnNsaWNlKHJvd1N0YXJ0LCByb3dFbmQpLndyYXBBbGwoJzxkaXYgY2xhc3M9XCJwaG90b3NldC1yb3cgY29scy0nICsgdmFsICsgJ1wiPjwvZGl2PicpO1xyXG5cclxuICAgICAgICAgICAgICAgIGltYWdlSW5kZXggPSByb3dFbmQ7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgJChlbGVtKS5maW5kKCcucGhvdG9zZXQtcm93Om5vdCg6bGFzdC1jaGlsZCknKS5jc3Moe1xyXG4gICAgICAgICAgICAgICAgJ21hcmdpbi1ib3R0b20nOiBvcHRpb25zLmd1dHRlclxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBfc2V0dXBDb2x1bW5zOiBmdW5jdGlvbiggIGVsZW0sIG9wdGlvbnMgKXtcclxuXHJcbiAgICAgICAgICAgIC8vIFJlZmVyZW5jZSB0byB0aGlzIFBsdWdpblxyXG4gICAgICAgICAgICB2YXIgJHRoaXMgPSB0aGlzO1xyXG5cclxuICAgICAgICAgICAgdmFyIHNldHVwU3R5bGVzID0gZnVuY3Rpb24od2FpdEZvckltYWdlc0xvYWRlZCl7XHJcbiAgICAgICAgICAgICAgICB2YXIgJHJvd3MgPSAkKGVsZW0pLmZpbmQoJy5waG90b3NldC1yb3cnKTtcclxuICAgICAgICAgICAgICAgIHZhciAkaW1hZ2VzID0gJChlbGVtKS5maW5kKCdpbWcnKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBXcmFwIHRoZSBpbWFnZXMgaW4gbGlua3MgdG8gdGhlIGhpZ2hyZXMgb3IgcmVndWxhciBpbWFnZVxyXG4gICAgICAgICAgICAgICAgLy8gT3RoZXJ3aXNlIHdyYXAgaW4gZGl2LnBob3Rvc2V0LWNlbGxcclxuICAgICAgICAgICAgICAgIGlmKG9wdGlvbnMuaGlnaHJlc0xpbmtzKXtcclxuICAgICAgICAgICAgICAgICAgICAkaW1hZ2VzLmVhY2goZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGhpZ2hyZXM7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIGEgaGlnaHJlcyBpbWFnZSBleGlzdHMgbGluayBpdCB1cCFcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYoJCh0aGlzKS5hdHRyKCdkYXRhLWhpZ2hyZXMnKSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoaWdocmVzID0gJCh0aGlzKS5hdHRyKCdkYXRhLWhpZ2hyZXMnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhpZ2hyZXMgPSAkKHRoaXMpLmF0dHIoJ3NyYycpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykud3JhcEFsbCgnPGEgaHJlZj1cIicgKyBoaWdocmVzICsgJ1wiIGNsYXNzPVwicGhvdG9zZXQtY2VsbCBoaWdocmVzLWxpbmtcIiAvPicpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBBcHBseSB0aGUgb3B0aW9uYWwgcmVsXHJcbiAgICAgICAgICAgICAgICAgICAgaWYob3B0aW9ucy5yZWwpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkaW1hZ2VzLnBhcmVudCgpLmF0dHIoJ3JlbCcsIG9wdGlvbnMucmVsKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAkaW1hZ2VzLmVhY2goZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS53cmFwQWxsKCc8ZGl2IGNsYXNzPVwicGhvdG9zZXQtY2VsbFwiIC8+Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyICRjZWxscyA9ICQoZWxlbSkuZmluZCgnLnBob3Rvc2V0LWNlbGwnKTtcclxuICAgICAgICAgICAgICAgIHZhciAkY29sczEgPSAkKGVsZW0pLmZpbmQoJy5jb2xzLTEgLnBob3Rvc2V0LWNlbGwnKTtcclxuICAgICAgICAgICAgICAgIHZhciAkY29sczIgPSAkKGVsZW0pLmZpbmQoJy5jb2xzLTIgLnBob3Rvc2V0LWNlbGwnKTtcclxuICAgICAgICAgICAgICAgIHZhciAkY29sczMgPSAkKGVsZW0pLmZpbmQoJy5jb2xzLTMgLnBob3Rvc2V0LWNlbGwnKTtcclxuICAgICAgICAgICAgICAgIHZhciAkY29sczQgPSAkKGVsZW0pLmZpbmQoJy5jb2xzLTQgLnBob3Rvc2V0LWNlbGwnKTtcclxuICAgICAgICAgICAgICAgIHZhciAkY29sczUgPSAkKGVsZW0pLmZpbmQoJy5jb2xzLTUgLnBob3Rvc2V0LWNlbGwnKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBBcHBseSBzdHlsZXMgaW5pdGlhbCBzdHJ1Y3R1cmUgc3R5bGVzIHRvIHRoZSBncmlkXHJcbiAgICAgICAgICAgICAgICAkKGVsZW0pLmNzcyh7XHJcbiAgICAgICAgICAgICAgICAgICAgJ3dpZHRoJzogb3B0aW9ucy53aWR0aFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAkcm93cy5jc3Moe1xyXG4gICAgICAgICAgICAgICAgICAgICdjbGVhcic6ICdsZWZ0JyxcclxuICAgICAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdibG9jaycsXHJcbiAgICAgICAgICAgICAgICAgICAgJ292ZXJmbG93JzogJ2hpZGRlbidcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgJGNlbGxzLmNzcyh7XHJcbiAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0JzogJ2xlZnQnLFxyXG4gICAgICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ2Jsb2NrJyxcclxuICAgICAgICAgICAgICAgICAgICAnbGluZS1oZWlnaHQnOiAnMCcsXHJcbiAgICAgICAgICAgICAgICAgICAgJy13ZWJraXQtYm94LXNpemluZyc6ICdib3JkZXItYm94JyxcclxuICAgICAgICAgICAgICAgICAgICAnLW1vei1ib3gtc2l6aW5nJzogJ2JvcmRlci1ib3gnLFxyXG4gICAgICAgICAgICAgICAgICAgICdib3gtc2l6aW5nJzogJ2JvcmRlci1ib3gnXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICRpbWFnZXMuY3NzKHtcclxuICAgICAgICAgICAgICAgICAgICAnd2lkdGgnOiAnMTAwJScsXHJcbiAgICAgICAgICAgICAgICAgICAgJ2hlaWdodCc6ICdhdXRvJ1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gaWYgdGhlIGltYWdlZCBkaWQgbm90IGhhdmUgaGVpZ2h0L3dpZHRoIGF0dHIgc2V0IHRoZW1cclxuICAgICAgICAgICAgICAgIGlmICh3YWl0Rm9ySW1hZ2VzTG9hZGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJGltYWdlcy5lYWNoKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykuYXR0cignaGVpZ2h0JywgJCh0aGlzKS5oZWlnaHQoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykuYXR0cignd2lkdGgnLCAkKHRoaXMpLndpZHRoKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIFNldCB0aGUgd2lkdGggb2YgdGhlIGNlbGxzIGJhc2VkIG9uIHRoZSBudW1iZXIgb2YgY29sdW1ucyBpbiB0aGUgcm93XHJcbiAgICAgICAgICAgICAgICAkY29sczEuY3NzKHsgJ3dpZHRoJzogJzEwMCUnIH0pO1xyXG4gICAgICAgICAgICAgICAgJGNvbHMyLmNzcyh7ICd3aWR0aCc6ICc1MCUnIH0pO1xyXG4gICAgICAgICAgICAgICAgJGNvbHMzLmNzcyh7ICd3aWR0aCc6ICczMy4zJScgfSk7XHJcbiAgICAgICAgICAgICAgICAkY29sczQuY3NzKHsgJ3dpZHRoJzogJzI1JScgfSk7XHJcbiAgICAgICAgICAgICAgICAkY29sczUuY3NzKHsgJ3dpZHRoJzogJzIwJScgfSk7XHJcblxyXG5cclxuICAgICAgICAgICAgICAgIHZhciBndXR0ZXJWYWwgPSBwYXJzZUludChvcHRpb25zLmd1dHRlciwgMTApO1xyXG4gICAgICAgICAgICAgICAgLy8gQXBwbHkgNTAlIGd1dHRlciB0byBsZWZ0IGFuZCByaWdodFxyXG4gICAgICAgICAgICAgICAgLy8gdGhpcyBwcm92aWRlcyBlcXVhbCBndXR0ZXJzIGEgaGlnaCB2YWx1ZXNcclxuICAgICAgICAgICAgICAgICQoZWxlbSkuZmluZCgnLnBob3Rvc2V0LWNlbGw6bm90KDpsYXN0LWNoaWxkKScpLmNzcyh7XHJcbiAgICAgICAgICAgICAgICAgICAgJ3BhZGRpbmctcmlnaHQnOiAoZ3V0dGVyVmFsIC8gMikgKyAncHgnXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICQoZWxlbSkuZmluZCgnLnBob3Rvc2V0LWNlbGw6bm90KDpmaXJzdC1jaGlsZCknKS5jc3Moe1xyXG4gICAgICAgICAgICAgICAgICAgICdwYWRkaW5nLWxlZnQnOiAoZ3V0dGVyVmFsIC8gMikgKyAncHgnXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcblxyXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gcmVzaXplUGhvdG9zZXRHcmlkKCl7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEdpdmUgdGhlIHZhbHVlcyBhIGZsb29yIHRvIHByZXZlbnQgbWlzZmlyZXNcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdyA9ICQoZWxlbSkud2lkdGgoKS50b1N0cmluZygpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiggdyAhPT0gJChlbGVtKS5hdHRyKCdkYXRhLXdpZHRoJykgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRyb3dzLmVhY2goZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciAkc2hvcnRlc3RJbWcgPSAkKHRoaXMpLmZpbmQoJ2ltZzplcSgwKScpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykuZmluZCgnaW1nJykuZWFjaChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciAkaW1nID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiggJGltZy5hdHRyKCdoZWlnaHQnKSA8ICRzaG9ydGVzdEltZy5hdHRyKCdoZWlnaHQnKSApe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2hvcnRlc3RJbWcgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYocGFyc2VJbnQoJGltZy5jc3MoJ3dpZHRoJyksIDEwKSA+IG9wdGlvbnMubG93cmVzV2lkdGggJiYgJGltZy5hdHRyKCdkYXRhLWhpZ2hyZXMnKSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRpbWcuYXR0cignc3JjJywgJGltZy5hdHRyKCdkYXRhLWhpZ2hyZXMnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2V0IHRoZSByb3cgaGVpZ2h0IGZyb20gdGhlIGNhbGN1bGF0ZWQvcmVhbCBoZWlnaHQvd2lkdGggb2YgdGhlIHNob3J0ZXN0IGltYWdlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcm93SGVpZ2h0ID0gKCAkc2hvcnRlc3RJbWcuYXR0cignaGVpZ2h0JykgKiBwYXJzZUludCgkc2hvcnRlc3RJbWcuY3NzKCd3aWR0aCcpLCAxMCkgKSAvICRzaG9ydGVzdEltZy5hdHRyKCd3aWR0aCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWRkaW5nIGEgYnVmZmVyIHRvIHNoYXZlIG9mZiBhIGZldyBwaXhlbHMgaW4gaGVpZ2h0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYnVmZmVySGVpZ2h0ID0gTWF0aC5mbG9vcihyb3dIZWlnaHQgKiAwLjAyNSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLmhlaWdodCggcm93SGVpZ2h0IC0gYnVmZmVySGVpZ2h0ICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5maW5kKCdpbWcnKS5lYWNoKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2V0IHRoZSBpbWFnZSBoZWlnaHQgZnJvbSB0aGUgY2FsY3VsYXRlZC9yZWFsIGhlaWdodC93aWR0aFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpbWFnZUhlaWdodCA9ICggJCh0aGlzKS5hdHRyKCdoZWlnaHQnKSAqIHBhcnNlSW50KCQodGhpcykuY3NzKCd3aWR0aCcpLCAxMCkgKSAvICQodGhpcykuYXR0cignd2lkdGgnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbWFyZ2luT2Zmc2V0ID0gKCAocm93SGVpZ2h0IC0gaW1hZ2VIZWlnaHQpICogMC41ICkgKyAncHgnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykuY3NzKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ21hcmdpbi10b3AnIDogbWFyZ2luT2Zmc2V0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKGVsZW0pLmF0dHIoJ2RhdGEtd2lkdGgnLCB3ICk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJlc2l6ZVBob3Rvc2V0R3JpZCgpO1xyXG5cclxuICAgICAgICAgICAgICAgICQod2luZG93KS5vbihcInJlc2l6ZVwiLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXNpemVQaG90b3NldEdyaWQoKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIC8vIEJ5IGRlZmF1bHQgdGhlIHBsdWdpbiB3aWxsIHdhaXQgdW50aWwgYWxsIG9mIHRoZSBpbWFnZXMgYXJlIGxvYWRlZCB0byBzZXR1cCB0aGUgc3R5bGVzXHJcbiAgICAgICAgICAgIHZhciB3YWl0Rm9ySW1hZ2VzTG9hZGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgdmFyIGhhc0RpbWVuc2lvbnMgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgLy8gTG9vcHMgdGhyb3VnaCBhbGwgb2YgdGhlIGltYWdlcyBpbiB0aGUgcGhvdG9zZXRcclxuICAgICAgICAgICAgLy8gaWYgdGhlIGhlaWdodCBhbmQgd2lkdGggZXhpc3RzIGZvciBhbGwgaW1hZ2VzIHNldCB3YWl0Rm9ySW1hZ2VzTG9hZGVkIHRvIGZhbHNlXHJcbiAgICAgICAgICAgICQoZWxlbSkuZmluZCgnaW1nJykuZWFjaChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgaGFzRGltZW5zaW9ucyA9IGhhc0RpbWVuc2lvbnMgJiAoICEhJCh0aGlzKS5hdHRyKCdoZWlnaHQnKSAmICEhJCh0aGlzKS5hdHRyKCd3aWR0aCcpICk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgd2FpdEZvckltYWdlc0xvYWRlZCA9ICFoYXNEaW1lbnNpb25zO1xyXG5cclxuICAgICAgICAgICAgLy8gT25seSB1c2UgaW1hZ2VzTG9hZGVkKCkgaWYgd2FpdEZvckltYWdlc0xvYWRlZFxyXG4gICAgICAgICAgICBpZih3YWl0Rm9ySW1hZ2VzTG9hZGVkKSB7XHJcbiAgICAgICAgICAgICAgICAkKGVsZW0pLmltYWdlc0xvYWRlZChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgICAgIHNldHVwU3R5bGVzKHdhaXRGb3JJbWFnZXNMb2FkZWQpO1xyXG4gICAgICAgICAgICAgICAgICAgICR0aGlzLl9jYWxsYmFjayhlbGVtKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgc2V0dXBTdHlsZXMod2FpdEZvckltYWdlc0xvYWRlZCk7XHJcbiAgICAgICAgICAgICAgICAkdGhpcy5fY2FsbGJhY2soZWxlbSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9O1xyXG5cclxuICAgIC8vIHBsdWdpbiB3cmFwcGVyIGFyb3VuZCB0aGUgY29uc3RydWN0b3JcclxuICAgICQuZm5bcGx1Z2luTmFtZV0gPSBmdW5jdGlvbiAoIG9wdGlvbnMgKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmICghJC5kYXRhKHRoaXMsIFwicGx1Z2luX1wiICsgcGx1Z2luTmFtZSkpIHtcclxuICAgICAgICAgICAgICAgICQuZGF0YSh0aGlzLCBcInBsdWdpbl9cIiArIHBsdWdpbk5hbWUsIG5ldyBQbHVnaW4oIHRoaXMsIG9wdGlvbnMgKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgLyohXHJcbiAgICAgKiBqUXVlcnkgaW1hZ2VzTG9hZGVkIHBsdWdpbiB2Mi4xLjFcclxuICAgICAqIGh0dHA6Ly9naXRodWIuY29tL2Rlc2FuZHJvL2ltYWdlc2xvYWRlZFxyXG4gICAgICpcclxuICAgICAqIE1JVCBMaWNlbnNlLiBieSBQYXVsIElyaXNoIGV0IGFsLlxyXG4gICAgICovXHJcblxyXG4gICAgLypqc2hpbnQgY3VybHk6IHRydWUsIGVxZXFlcTogdHJ1ZSwgbm9lbXB0eTogdHJ1ZSwgc3RyaWN0OiB0cnVlLCB1bmRlZjogdHJ1ZSwgYnJvd3NlcjogdHJ1ZSAqL1xyXG4gICAgLypnbG9iYWwgalF1ZXJ5OiBmYWxzZSAqL1xyXG5cclxuICAgIC8vIGJsYW5rIGltYWdlIGRhdGEtdXJpIGJ5cGFzc2VzIHdlYmtpdCBsb2cgd2FybmluZyAodGh4IGRvdWcgam9uZXMpXHJcbiAgICB2YXIgQkxBTksgPSAnZGF0YTppbWFnZS9naWY7YmFzZTY0LFIwbEdPRGxoQVFBQkFJQUFBQUFBQVAvLy95d0FBQUFBQVFBQkFBQUNBVXdBT3c9PSc7XHJcblxyXG4gICAgJC5mbi5pbWFnZXNMb2FkZWQgPSBmdW5jdGlvbiggY2FsbGJhY2sgKSB7XHJcbiAgICAgICAgdmFyICR0aGlzID0gdGhpcyxcclxuICAgICAgICAgICAgZGVmZXJyZWQgPSAkLmlzRnVuY3Rpb24oJC5EZWZlcnJlZCkgPyAkLkRlZmVycmVkKCkgOiAwLFxyXG4gICAgICAgICAgICBoYXNOb3RpZnkgPSAkLmlzRnVuY3Rpb24oZGVmZXJyZWQubm90aWZ5KSxcclxuICAgICAgICAgICAgJGltYWdlcyA9ICR0aGlzLmZpbmQoJ2ltZycpLmFkZCggJHRoaXMuZmlsdGVyKCdpbWcnKSApLFxyXG4gICAgICAgICAgICBsb2FkZWQgPSBbXSxcclxuICAgICAgICAgICAgcHJvcGVyID0gW10sXHJcbiAgICAgICAgICAgIGJyb2tlbiA9IFtdO1xyXG5cclxuICAgICAgICAvLyBSZWdpc3RlciBkZWZlcnJlZCBjYWxsYmFja3NcclxuICAgICAgICBpZiAoJC5pc1BsYWluT2JqZWN0KGNhbGxiYWNrKSkge1xyXG4gICAgICAgICAgICAkLmVhY2goY2FsbGJhY2ssIGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoa2V5ID09PSAnY2FsbGJhY2snKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sgPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZGVmZXJyZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZFtrZXldKHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBkb25lTG9hZGluZygpIHtcclxuICAgICAgICAgICAgdmFyICRwcm9wZXIgPSAkKHByb3BlciksXHJcbiAgICAgICAgICAgICAgICAkYnJva2VuID0gJChicm9rZW4pO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBkZWZlcnJlZCApIHtcclxuICAgICAgICAgICAgICAgIGlmICggYnJva2VuLmxlbmd0aCApIHtcclxuICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoICRpbWFnZXMsICRwcm9wZXIsICRicm9rZW4gKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSggJGltYWdlcyApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoICQuaXNGdW5jdGlvbiggY2FsbGJhY2sgKSApIHtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrLmNhbGwoICR0aGlzLCAkaW1hZ2VzLCAkcHJvcGVyLCAkYnJva2VuICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGltZ0xvYWRlZEhhbmRsZXIoIGV2ZW50ICkge1xyXG4gICAgICAgICAgICBpbWdMb2FkZWQoIGV2ZW50LnRhcmdldCwgZXZlbnQudHlwZSA9PT0gJ2Vycm9yJyApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gaW1nTG9hZGVkKCBpbWcsIGlzQnJva2VuICkge1xyXG4gICAgICAgICAgICAvLyBkb24ndCBwcm9jZWVkIGlmIEJMQU5LIGltYWdlLCBvciBpbWFnZSBpcyBhbHJlYWR5IGxvYWRlZFxyXG4gICAgICAgICAgICBpZiAoIGltZy5zcmMgPT09IEJMQU5LIHx8ICQuaW5BcnJheSggaW1nLCBsb2FkZWQgKSAhPT0gLTEgKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIHN0b3JlIGVsZW1lbnQgaW4gbG9hZGVkIGltYWdlcyBhcnJheVxyXG4gICAgICAgICAgICBsb2FkZWQucHVzaCggaW1nICk7XHJcblxyXG4gICAgICAgICAgICAvLyBrZWVwIHRyYWNrIG9mIGJyb2tlbiBhbmQgcHJvcGVybHkgbG9hZGVkIGltYWdlc1xyXG4gICAgICAgICAgICBpZiAoIGlzQnJva2VuICkge1xyXG4gICAgICAgICAgICAgICAgYnJva2VuLnB1c2goIGltZyApO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcHJvcGVyLnB1c2goIGltZyApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBjYWNoZSBpbWFnZSBhbmQgaXRzIHN0YXRlIGZvciBmdXR1cmUgY2FsbHNcclxuICAgICAgICAgICAgJC5kYXRhKCBpbWcsICdpbWFnZXNMb2FkZWQnLCB7IGlzQnJva2VuOiBpc0Jyb2tlbiwgc3JjOiBpbWcuc3JjIH0gKTtcclxuXHJcbiAgICAgICAgICAgIC8vIHRyaWdnZXIgZGVmZXJyZWQgcHJvZ3Jlc3MgbWV0aG9kIGlmIHByZXNlbnRcclxuICAgICAgICAgICAgaWYgKCBoYXNOb3RpZnkgKSB7XHJcbiAgICAgICAgICAgICAgICBkZWZlcnJlZC5ub3RpZnlXaXRoKCAkKGltZyksIFsgaXNCcm9rZW4sICRpbWFnZXMsICQocHJvcGVyKSwgJChicm9rZW4pIF0gKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gY2FsbCBkb25lTG9hZGluZyBhbmQgY2xlYW4gbGlzdGVuZXJzIGlmIGFsbCBpbWFnZXMgYXJlIGxvYWRlZFxyXG4gICAgICAgICAgICBpZiAoICRpbWFnZXMubGVuZ3RoID09PSBsb2FkZWQubGVuZ3RoICkge1xyXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCggZG9uZUxvYWRpbmcgKTtcclxuICAgICAgICAgICAgICAgICRpbWFnZXMudW5iaW5kKCAnLmltYWdlc0xvYWRlZCcsIGltZ0xvYWRlZEhhbmRsZXIgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gaWYgbm8gaW1hZ2VzLCB0cmlnZ2VyIGltbWVkaWF0ZWx5XHJcbiAgICAgICAgaWYgKCAhJGltYWdlcy5sZW5ndGggKSB7XHJcbiAgICAgICAgICAgIGRvbmVMb2FkaW5nKCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgJGltYWdlcy5iaW5kKCAnbG9hZC5pbWFnZXNMb2FkZWQgZXJyb3IuaW1hZ2VzTG9hZGVkJywgaW1nTG9hZGVkSGFuZGxlciApXHJcbiAgICAgICAgICAgICAgICAuZWFjaCggZnVuY3Rpb24oIGksIGVsICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBzcmMgPSBlbC5zcmM7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGZpbmQgb3V0IGlmIHRoaXMgaW1hZ2UgaGFzIGJlZW4gYWxyZWFkeSBjaGVja2VkIGZvciBzdGF0dXNcclxuICAgICAgICAgICAgICAgICAgICAvLyBpZiBpdCB3YXMsIGFuZCBzcmMgaGFzIG5vdCBjaGFuZ2VkLCBjYWxsIGltZ0xvYWRlZCBvbiBpdFxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjYWNoZWQgPSAkLmRhdGEoIGVsLCAnaW1hZ2VzTG9hZGVkJyApO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggY2FjaGVkICYmIGNhY2hlZC5zcmMgPT09IHNyYyApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW1nTG9hZGVkKCBlbCwgY2FjaGVkLmlzQnJva2VuICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIGNvbXBsZXRlIGlzIHRydWUgYW5kIGJyb3dzZXIgc3VwcG9ydHMgbmF0dXJhbCBzaXplcywgdHJ5XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gdG8gY2hlY2sgZm9yIGltYWdlIHN0YXR1cyBtYW51YWxseVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggZWwuY29tcGxldGUgJiYgZWwubmF0dXJhbFdpZHRoICE9PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGltZ0xvYWRlZCggZWwsIGVsLm5hdHVyYWxXaWR0aCA9PT0gMCB8fCBlbC5uYXR1cmFsSGVpZ2h0ID09PSAwICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNhY2hlZCBpbWFnZXMgZG9uJ3QgZmlyZSBsb2FkIHNvbWV0aW1lcywgc28gd2UgcmVzZXQgc3JjLCBidXQgb25seSB3aGVuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gZGVhbGluZyB3aXRoIElFLCBvciBpbWFnZSBpcyBjb21wbGV0ZSAobG9hZGVkKSBhbmQgZmFpbGVkIG1hbnVhbCBjaGVja1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIHdlYmtpdCBoYWNrIGZyb20gaHR0cDovL2dyb3Vwcy5nb29nbGUuY29tL2dyb3VwL2pxdWVyeS1kZXYvYnJvd3NlX3RocmVhZC90aHJlYWQvZWVlNmFiN2IyZGE1MGUxZlxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggZWwucmVhZHlTdGF0ZSB8fCBlbC5jb21wbGV0ZSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWwuc3JjID0gQkxBTks7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsLnNyYyA9IHNyYztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBkZWZlcnJlZCA/IGRlZmVycmVkLnByb21pc2UoICR0aGlzICkgOiAkdGhpcztcclxuICAgIH07XHJcblxyXG4gICAgLypcclxuICAgICAqIHRocm90dGxlZHJlc2l6ZTogc3BlY2lhbCBqUXVlcnkgZXZlbnQgdGhhdCBoYXBwZW5zIGF0IGEgcmVkdWNlZCByYXRlIGNvbXBhcmVkIHRvIFwicmVzaXplXCJcclxuICAgICAqXHJcbiAgICAgKiBsYXRlc3QgdmVyc2lvbiBhbmQgY29tcGxldGUgUkVBRE1FIGF2YWlsYWJsZSBvbiBHaXRodWI6XHJcbiAgICAgKiBodHRwczovL2dpdGh1Yi5jb20vbG91aXNyZW1pL2pxdWVyeS1zbWFydHJlc2l6ZVxyXG4gICAgICpcclxuICAgICAqIENvcHlyaWdodCAyMDEyIEBsb3Vpc19yZW1pXHJcbiAgICAgKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXHJcbiAgICAgKlxyXG4gICAgICogVGhpcyBzYXZlZCB5b3UgYW4gaG91ciBvZiB3b3JrP1xyXG4gICAgICogU2VuZCBtZSBtdXNpYyBodHRwOi8vd3d3LmFtYXpvbi5jby51ay93aXNobGlzdC9ITlRVMDQ2OExRT05cclxuICAgICAqL1xyXG5cclxuICAgIHZhciAkZXZlbnQgPSAkLmV2ZW50LFxyXG4gICAgICAgICRzcGVjaWFsLFxyXG4gICAgICAgIGR1bW15ID0ge186MH0sXHJcbiAgICAgICAgZnJhbWUgPSAwLFxyXG4gICAgICAgIHdhc1Jlc2l6ZWQsIGFuaW1SdW5uaW5nO1xyXG5cclxuICAgICRzcGVjaWFsID0gJGV2ZW50LnNwZWNpYWwudGhyb3R0bGVkcmVzaXplID0ge1xyXG4gICAgICAgIHNldHVwOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgJCggdGhpcyApLm9uKCBcInJlc2l6ZVwiLCAkc3BlY2lhbC5oYW5kbGVyICk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICQoIHRoaXMgKS5vZmYoIFwicmVzaXplXCIsICRzcGVjaWFsLmhhbmRsZXIgKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uKCBldmVudCwgZXhlY0FzYXAgKSB7XHJcbiAgICAgICAgICAgIC8vIFNhdmUgdGhlIGNvbnRleHRcclxuICAgICAgICAgICAgdmFyIGNvbnRleHQgPSB0aGlzLFxyXG4gICAgICAgICAgICAgICAgYXJncyA9IGFyZ3VtZW50cztcclxuXHJcbiAgICAgICAgICAgIHdhc1Jlc2l6ZWQgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgaWYgKCAhYW5pbVJ1bm5pbmcgKSB7XHJcbiAgICAgICAgICAgICAgICBzZXRJbnRlcnZhbChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgICAgIGZyYW1lKys7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggZnJhbWUgPiAkc3BlY2lhbC50aHJlc2hvbGQgJiYgd2FzUmVzaXplZCB8fCBleGVjQXNhcCApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2V0IGNvcnJlY3QgZXZlbnQgdHlwZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudC50eXBlID0gXCJ0aHJvdHRsZWRyZXNpemVcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJGV2ZW50LmRpc3BhdGNoLmFwcGx5KCBjb250ZXh0LCBhcmdzICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdhc1Jlc2l6ZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZnJhbWUgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIGZyYW1lID4gOSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJChkdW1teSkuc3RvcCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhbmltUnVubmluZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmcmFtZSA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSwgMzApO1xyXG4gICAgICAgICAgICAgICAgYW5pbVJ1bm5pbmcgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICB0aHJlc2hvbGQ6IDBcclxuICAgIH07XHJcblxyXG5cclxufSkoIGpRdWVyeSwgd2luZG93LCBkb2N1bWVudCApOyJdLCJmaWxlIjoianF1ZXJ5LnBob3Rvc2V0LWdyaWQuanMifQ==
