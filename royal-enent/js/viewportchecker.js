/*
    The MIT License (MIT)

    Copyright (c) 2014 Dirk Groenen

    Permission is hereby granted, free of charge, to any person obtaining a copy of
    this software and associated documentation files (the "Software"), to deal in
    the Software without restriction, including without limitation the rights to
    use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
    the Software, and to permit persons to whom the Software is furnished to do so,
    subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.
*/

(function($){
    $.fn.viewportChecker = function(useroptions){
        // Define options and extend with user
        var options = {
            classToAdd: 'visible',
            classToRemove : 'invisible',
            classToAddForFullView : 'full-visible',
            removeClassAfterAnimation: false,
            offset: 100,
            repeat: false,
            invertBottomOffset: true,
            callbackFunction: function(elem, action){},
            scrollHorizontal: false,
            scrollBox: window
        };
        $.extend(options, useroptions);

        // Cache the given element and height of the browser
        var $elem = this,
            boxSize = {height: $(options.scrollBox).height(), width: $(options.scrollBox).width()};

        /*
         * Main method that checks the elements and adds or removes the class(es)
         */
        this.checkElements = function(){
            var viewportStart, viewportEnd;

            // Set some vars to check with
            if (!options.scrollHorizontal){
                viewportStart = Math.max(
                    $('html').scrollTop(),
                    $('body').scrollTop(),
                    $(window).scrollTop()
                );
                viewportEnd = (viewportStart + boxSize.height);
            }
            else{
                viewportStart = Math.max(
                    $('html').scrollLeft(),
                    $('body').scrollLeft(),
                    $(window).scrollLeft()
                );
                viewportEnd = (viewportStart + boxSize.width);
            }

            // Loop through all given dom elements
            $elem.each(function(){
                var $obj = $(this),
                    objOptions = {},
                    attrOptions = {};

                //  Get any individual attribution data
                if ($obj.data('vp-add-class'))
                    attrOptions.classToAdd = $obj.data('vp-add-class');
                if ($obj.data('vp-remove-class'))
                    attrOptions.classToRemove = $obj.data('vp-remove-class');
                if ($obj.data('vp-add-class-full-view'))
                    attrOptions.classToAddForFullView = $obj.data('vp-add-class-full-view');
                if ($obj.data('vp-keep-add-class'))
                    attrOptions.removeClassAfterAnimation = $obj.data('vp-remove-after-animation');
                if ($obj.data('vp-offset'))
                    attrOptions.offset = $obj.data('vp-offset');
                if ($obj.data('vp-repeat'))
                    attrOptions.repeat = $obj.data('vp-repeat');
                if ($obj.data('vp-scrollHorizontal'))
                    attrOptions.scrollHorizontal = $obj.data('vp-scrollHorizontal');
                if ($obj.data('vp-invertBottomOffset'))
                    attrOptions.scrollHorizontal = $obj.data('vp-invertBottomOffset');

                // Extend objOptions with data attributes and default options
                $.extend(objOptions, options);
                $.extend(objOptions, attrOptions);

                // If class already exists; quit
                if ($obj.data('vp-animated') && !objOptions.repeat){
                    return;
                }

                // Check if the offset is percentage based
                if (String(objOptions.offset).indexOf("%") > 0)
                    objOptions.offset = (parseInt(objOptions.offset) / 100) * boxSize.height;

                // Get the raw start and end positions
                var rawStart = (!objOptions.scrollHorizontal) ? $obj.offset().top : $obj.offset().left,
                    rawEnd = (!objOptions.scrollHorizontal) ? rawStart + $obj.height() : rawStart + $obj.width();

                // Add the defined offset
                var elemStart = Math.round( rawStart ) + objOptions.offset,
                    elemEnd = (!objOptions.scrollHorizontal) ? elemStart + $obj.height() : elemStart + $obj.width();

                if (objOptions.invertBottomOffset)
                    elemEnd -= (objOptions.offset * 2);

                // Add class if in viewport
                if ((elemStart < viewportEnd) && (elemEnd > viewportStart)){

                    // Remove class
                    $obj.removeClass(objOptions.classToRemove);
                    $obj.addClass(objOptions.classToAdd);

                    // Do the callback function. Callback wil send the jQuery object as parameter
                    objOptions.callbackFunction($obj, "add");

                    // Check if full element is in view
                    if (rawEnd <= viewportEnd && rawStart >= viewportStart)
                        $obj.addClass(objOptions.classToAddForFullView);
                    else
                        $obj.removeClass(objOptions.classToAddForFullView);

                    // Set element as already animated
                    $obj.data('vp-animated', true);

                    if (objOptions.removeClassAfterAnimation) {
                        $obj.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
                            $obj.removeClass(objOptions.classToAdd);
                        });
                    }

                    // Remove class if not in viewport and repeat is true
                } else if ($obj.hasClass(objOptions.classToAdd) && (objOptions.repeat)){
                    $obj.removeClass(objOptions.classToAdd + " " + objOptions.classToAddForFullView);

                    // Do the callback function.
                    objOptions.callbackFunction($obj, "remove");

                    // Remove already-animated-flag
                    $obj.data('vp-animated', false);
                }
            });

        };

        /**
         * Binding the correct event listener is still a tricky thing.
         * People have expierenced sloppy scrolling when both scroll and touch
         * events are added, but to make sure devices with both scroll and touch
         * are handles too we always have to add the window.scroll event
         *
         * @see  https://github.com/dirkgroenen/jQuery-viewport-checker/issues/25
         * @see  https://github.com/dirkgroenen/jQuery-viewport-checker/issues/27
         */

        // Select the correct events
        if( 'ontouchstart' in window || 'onmsgesturechange' in window ){
            // Device with touchscreen
            $(document).bind("touchmove MSPointerMove pointermove", this.checkElements);
        }

        // Always load on window load
        $(options.scrollBox).bind("load scroll", this.checkElements);

        // On resize change the height var
        $(window).resize(function(e){
            boxSize = {height: $(options.scrollBox).height(), width: $(options.scrollBox).width()};
            $elem.checkElements();
        });

        // trigger inital check if elements already visible
        this.checkElements();

        // Default jquery plugin behaviour
        return this;
    };
})(jQuery);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJ2aWV3cG9ydGNoZWNrZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLypcclxuICAgIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxyXG5cclxuICAgIENvcHlyaWdodCAoYykgMjAxNCBEaXJrIEdyb2VuZW5cclxuXHJcbiAgICBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5IG9mXHJcbiAgICB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluXHJcbiAgICB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvXHJcbiAgICB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZlxyXG4gICAgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLFxyXG4gICAgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XHJcblxyXG4gICAgVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsXHJcbiAgICBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxyXG4qL1xyXG5cclxuKGZ1bmN0aW9uKCQpe1xyXG4gICAgJC5mbi52aWV3cG9ydENoZWNrZXIgPSBmdW5jdGlvbih1c2Vyb3B0aW9ucyl7XHJcbiAgICAgICAgLy8gRGVmaW5lIG9wdGlvbnMgYW5kIGV4dGVuZCB3aXRoIHVzZXJcclxuICAgICAgICB2YXIgb3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgY2xhc3NUb0FkZDogJ3Zpc2libGUnLFxyXG4gICAgICAgICAgICBjbGFzc1RvUmVtb3ZlIDogJ2ludmlzaWJsZScsXHJcbiAgICAgICAgICAgIGNsYXNzVG9BZGRGb3JGdWxsVmlldyA6ICdmdWxsLXZpc2libGUnLFxyXG4gICAgICAgICAgICByZW1vdmVDbGFzc0FmdGVyQW5pbWF0aW9uOiBmYWxzZSxcclxuICAgICAgICAgICAgb2Zmc2V0OiAxMDAsXHJcbiAgICAgICAgICAgIHJlcGVhdDogZmFsc2UsXHJcbiAgICAgICAgICAgIGludmVydEJvdHRvbU9mZnNldDogdHJ1ZSxcclxuICAgICAgICAgICAgY2FsbGJhY2tGdW5jdGlvbjogZnVuY3Rpb24oZWxlbSwgYWN0aW9uKXt9LFxyXG4gICAgICAgICAgICBzY3JvbGxIb3Jpem9udGFsOiBmYWxzZSxcclxuICAgICAgICAgICAgc2Nyb2xsQm94OiB3aW5kb3dcclxuICAgICAgICB9O1xyXG4gICAgICAgICQuZXh0ZW5kKG9wdGlvbnMsIHVzZXJvcHRpb25zKTtcclxuXHJcbiAgICAgICAgLy8gQ2FjaGUgdGhlIGdpdmVuIGVsZW1lbnQgYW5kIGhlaWdodCBvZiB0aGUgYnJvd3NlclxyXG4gICAgICAgIHZhciAkZWxlbSA9IHRoaXMsXHJcbiAgICAgICAgICAgIGJveFNpemUgPSB7aGVpZ2h0OiAkKG9wdGlvbnMuc2Nyb2xsQm94KS5oZWlnaHQoKSwgd2lkdGg6ICQob3B0aW9ucy5zY3JvbGxCb3gpLndpZHRoKCl9O1xyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIE1haW4gbWV0aG9kIHRoYXQgY2hlY2tzIHRoZSBlbGVtZW50cyBhbmQgYWRkcyBvciByZW1vdmVzIHRoZSBjbGFzcyhlcylcclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmNoZWNrRWxlbWVudHMgPSBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICB2YXIgdmlld3BvcnRTdGFydCwgdmlld3BvcnRFbmQ7XHJcblxyXG4gICAgICAgICAgICAvLyBTZXQgc29tZSB2YXJzIHRvIGNoZWNrIHdpdGhcclxuICAgICAgICAgICAgaWYgKCFvcHRpb25zLnNjcm9sbEhvcml6b250YWwpe1xyXG4gICAgICAgICAgICAgICAgdmlld3BvcnRTdGFydCA9IE1hdGgubWF4KFxyXG4gICAgICAgICAgICAgICAgICAgICQoJ2h0bWwnKS5zY3JvbGxUb3AoKSxcclxuICAgICAgICAgICAgICAgICAgICAkKCdib2R5Jykuc2Nyb2xsVG9wKCksXHJcbiAgICAgICAgICAgICAgICAgICAgJCh3aW5kb3cpLnNjcm9sbFRvcCgpXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgdmlld3BvcnRFbmQgPSAodmlld3BvcnRTdGFydCArIGJveFNpemUuaGVpZ2h0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICAgICAgdmlld3BvcnRTdGFydCA9IE1hdGgubWF4KFxyXG4gICAgICAgICAgICAgICAgICAgICQoJ2h0bWwnKS5zY3JvbGxMZWZ0KCksXHJcbiAgICAgICAgICAgICAgICAgICAgJCgnYm9keScpLnNjcm9sbExlZnQoKSxcclxuICAgICAgICAgICAgICAgICAgICAkKHdpbmRvdykuc2Nyb2xsTGVmdCgpXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgdmlld3BvcnRFbmQgPSAodmlld3BvcnRTdGFydCArIGJveFNpemUud2lkdGgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBMb29wIHRocm91Z2ggYWxsIGdpdmVuIGRvbSBlbGVtZW50c1xyXG4gICAgICAgICAgICAkZWxlbS5lYWNoKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICB2YXIgJG9iaiA9ICQodGhpcyksXHJcbiAgICAgICAgICAgICAgICAgICAgb2JqT3B0aW9ucyA9IHt9LFxyXG4gICAgICAgICAgICAgICAgICAgIGF0dHJPcHRpb25zID0ge307XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gIEdldCBhbnkgaW5kaXZpZHVhbCBhdHRyaWJ1dGlvbiBkYXRhXHJcbiAgICAgICAgICAgICAgICBpZiAoJG9iai5kYXRhKCd2cC1hZGQtY2xhc3MnKSlcclxuICAgICAgICAgICAgICAgICAgICBhdHRyT3B0aW9ucy5jbGFzc1RvQWRkID0gJG9iai5kYXRhKCd2cC1hZGQtY2xhc3MnKTtcclxuICAgICAgICAgICAgICAgIGlmICgkb2JqLmRhdGEoJ3ZwLXJlbW92ZS1jbGFzcycpKVxyXG4gICAgICAgICAgICAgICAgICAgIGF0dHJPcHRpb25zLmNsYXNzVG9SZW1vdmUgPSAkb2JqLmRhdGEoJ3ZwLXJlbW92ZS1jbGFzcycpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCRvYmouZGF0YSgndnAtYWRkLWNsYXNzLWZ1bGwtdmlldycpKVxyXG4gICAgICAgICAgICAgICAgICAgIGF0dHJPcHRpb25zLmNsYXNzVG9BZGRGb3JGdWxsVmlldyA9ICRvYmouZGF0YSgndnAtYWRkLWNsYXNzLWZ1bGwtdmlldycpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCRvYmouZGF0YSgndnAta2VlcC1hZGQtY2xhc3MnKSlcclxuICAgICAgICAgICAgICAgICAgICBhdHRyT3B0aW9ucy5yZW1vdmVDbGFzc0FmdGVyQW5pbWF0aW9uID0gJG9iai5kYXRhKCd2cC1yZW1vdmUtYWZ0ZXItYW5pbWF0aW9uJyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoJG9iai5kYXRhKCd2cC1vZmZzZXQnKSlcclxuICAgICAgICAgICAgICAgICAgICBhdHRyT3B0aW9ucy5vZmZzZXQgPSAkb2JqLmRhdGEoJ3ZwLW9mZnNldCcpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCRvYmouZGF0YSgndnAtcmVwZWF0JykpXHJcbiAgICAgICAgICAgICAgICAgICAgYXR0ck9wdGlvbnMucmVwZWF0ID0gJG9iai5kYXRhKCd2cC1yZXBlYXQnKTtcclxuICAgICAgICAgICAgICAgIGlmICgkb2JqLmRhdGEoJ3ZwLXNjcm9sbEhvcml6b250YWwnKSlcclxuICAgICAgICAgICAgICAgICAgICBhdHRyT3B0aW9ucy5zY3JvbGxIb3Jpem9udGFsID0gJG9iai5kYXRhKCd2cC1zY3JvbGxIb3Jpem9udGFsJyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoJG9iai5kYXRhKCd2cC1pbnZlcnRCb3R0b21PZmZzZXQnKSlcclxuICAgICAgICAgICAgICAgICAgICBhdHRyT3B0aW9ucy5zY3JvbGxIb3Jpem9udGFsID0gJG9iai5kYXRhKCd2cC1pbnZlcnRCb3R0b21PZmZzZXQnKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBFeHRlbmQgb2JqT3B0aW9ucyB3aXRoIGRhdGEgYXR0cmlidXRlcyBhbmQgZGVmYXVsdCBvcHRpb25zXHJcbiAgICAgICAgICAgICAgICAkLmV4dGVuZChvYmpPcHRpb25zLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICQuZXh0ZW5kKG9iak9wdGlvbnMsIGF0dHJPcHRpb25zKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBJZiBjbGFzcyBhbHJlYWR5IGV4aXN0czsgcXVpdFxyXG4gICAgICAgICAgICAgICAgaWYgKCRvYmouZGF0YSgndnAtYW5pbWF0ZWQnKSAmJiAhb2JqT3B0aW9ucy5yZXBlYXQpe1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBDaGVjayBpZiB0aGUgb2Zmc2V0IGlzIHBlcmNlbnRhZ2UgYmFzZWRcclxuICAgICAgICAgICAgICAgIGlmIChTdHJpbmcob2JqT3B0aW9ucy5vZmZzZXQpLmluZGV4T2YoXCIlXCIpID4gMClcclxuICAgICAgICAgICAgICAgICAgICBvYmpPcHRpb25zLm9mZnNldCA9IChwYXJzZUludChvYmpPcHRpb25zLm9mZnNldCkgLyAxMDApICogYm94U2l6ZS5oZWlnaHQ7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gR2V0IHRoZSByYXcgc3RhcnQgYW5kIGVuZCBwb3NpdGlvbnNcclxuICAgICAgICAgICAgICAgIHZhciByYXdTdGFydCA9ICghb2JqT3B0aW9ucy5zY3JvbGxIb3Jpem9udGFsKSA/ICRvYmoub2Zmc2V0KCkudG9wIDogJG9iai5vZmZzZXQoKS5sZWZ0LFxyXG4gICAgICAgICAgICAgICAgICAgIHJhd0VuZCA9ICghb2JqT3B0aW9ucy5zY3JvbGxIb3Jpem9udGFsKSA/IHJhd1N0YXJ0ICsgJG9iai5oZWlnaHQoKSA6IHJhd1N0YXJ0ICsgJG9iai53aWR0aCgpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIEFkZCB0aGUgZGVmaW5lZCBvZmZzZXRcclxuICAgICAgICAgICAgICAgIHZhciBlbGVtU3RhcnQgPSBNYXRoLnJvdW5kKCByYXdTdGFydCApICsgb2JqT3B0aW9ucy5vZmZzZXQsXHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbUVuZCA9ICghb2JqT3B0aW9ucy5zY3JvbGxIb3Jpem9udGFsKSA/IGVsZW1TdGFydCArICRvYmouaGVpZ2h0KCkgOiBlbGVtU3RhcnQgKyAkb2JqLndpZHRoKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKG9iak9wdGlvbnMuaW52ZXJ0Qm90dG9tT2Zmc2V0KVxyXG4gICAgICAgICAgICAgICAgICAgIGVsZW1FbmQgLT0gKG9iak9wdGlvbnMub2Zmc2V0ICogMik7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQWRkIGNsYXNzIGlmIGluIHZpZXdwb3J0XHJcbiAgICAgICAgICAgICAgICBpZiAoKGVsZW1TdGFydCA8IHZpZXdwb3J0RW5kKSAmJiAoZWxlbUVuZCA+IHZpZXdwb3J0U3RhcnQpKXtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUmVtb3ZlIGNsYXNzXHJcbiAgICAgICAgICAgICAgICAgICAgJG9iai5yZW1vdmVDbGFzcyhvYmpPcHRpb25zLmNsYXNzVG9SZW1vdmUpO1xyXG4gICAgICAgICAgICAgICAgICAgICRvYmouYWRkQ2xhc3Mob2JqT3B0aW9ucy5jbGFzc1RvQWRkKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRG8gdGhlIGNhbGxiYWNrIGZ1bmN0aW9uLiBDYWxsYmFjayB3aWwgc2VuZCB0aGUgalF1ZXJ5IG9iamVjdCBhcyBwYXJhbWV0ZXJcclxuICAgICAgICAgICAgICAgICAgICBvYmpPcHRpb25zLmNhbGxiYWNrRnVuY3Rpb24oJG9iaiwgXCJhZGRcIik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIGlmIGZ1bGwgZWxlbWVudCBpcyBpbiB2aWV3XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJhd0VuZCA8PSB2aWV3cG9ydEVuZCAmJiByYXdTdGFydCA+PSB2aWV3cG9ydFN0YXJ0KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAkb2JqLmFkZENsYXNzKG9iak9wdGlvbnMuY2xhc3NUb0FkZEZvckZ1bGxWaWV3KTtcclxuICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRvYmoucmVtb3ZlQ2xhc3Mob2JqT3B0aW9ucy5jbGFzc1RvQWRkRm9yRnVsbFZpZXcpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBTZXQgZWxlbWVudCBhcyBhbHJlYWR5IGFuaW1hdGVkXHJcbiAgICAgICAgICAgICAgICAgICAgJG9iai5kYXRhKCd2cC1hbmltYXRlZCcsIHRydWUpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAob2JqT3B0aW9ucy5yZW1vdmVDbGFzc0FmdGVyQW5pbWF0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRvYmoub25lKCd3ZWJraXRBbmltYXRpb25FbmQgbW96QW5pbWF0aW9uRW5kIE1TQW5pbWF0aW9uRW5kIG9hbmltYXRpb25lbmQgYW5pbWF0aW9uZW5kJywgZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRvYmoucmVtb3ZlQ2xhc3Mob2JqT3B0aW9ucy5jbGFzc1RvQWRkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBSZW1vdmUgY2xhc3MgaWYgbm90IGluIHZpZXdwb3J0IGFuZCByZXBlYXQgaXMgdHJ1ZVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICgkb2JqLmhhc0NsYXNzKG9iak9wdGlvbnMuY2xhc3NUb0FkZCkgJiYgKG9iak9wdGlvbnMucmVwZWF0KSl7XHJcbiAgICAgICAgICAgICAgICAgICAgJG9iai5yZW1vdmVDbGFzcyhvYmpPcHRpb25zLmNsYXNzVG9BZGQgKyBcIiBcIiArIG9iak9wdGlvbnMuY2xhc3NUb0FkZEZvckZ1bGxWaWV3KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRG8gdGhlIGNhbGxiYWNrIGZ1bmN0aW9uLlxyXG4gICAgICAgICAgICAgICAgICAgIG9iak9wdGlvbnMuY2FsbGJhY2tGdW5jdGlvbigkb2JqLCBcInJlbW92ZVwiKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUmVtb3ZlIGFscmVhZHktYW5pbWF0ZWQtZmxhZ1xyXG4gICAgICAgICAgICAgICAgICAgICRvYmouZGF0YSgndnAtYW5pbWF0ZWQnLCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBCaW5kaW5nIHRoZSBjb3JyZWN0IGV2ZW50IGxpc3RlbmVyIGlzIHN0aWxsIGEgdHJpY2t5IHRoaW5nLlxyXG4gICAgICAgICAqIFBlb3BsZSBoYXZlIGV4cGllcmVuY2VkIHNsb3BweSBzY3JvbGxpbmcgd2hlbiBib3RoIHNjcm9sbCBhbmQgdG91Y2hcclxuICAgICAgICAgKiBldmVudHMgYXJlIGFkZGVkLCBidXQgdG8gbWFrZSBzdXJlIGRldmljZXMgd2l0aCBib3RoIHNjcm9sbCBhbmQgdG91Y2hcclxuICAgICAgICAgKiBhcmUgaGFuZGxlcyB0b28gd2UgYWx3YXlzIGhhdmUgdG8gYWRkIHRoZSB3aW5kb3cuc2Nyb2xsIGV2ZW50XHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBAc2VlICBodHRwczovL2dpdGh1Yi5jb20vZGlya2dyb2VuZW4valF1ZXJ5LXZpZXdwb3J0LWNoZWNrZXIvaXNzdWVzLzI1XHJcbiAgICAgICAgICogQHNlZSAgaHR0cHM6Ly9naXRodWIuY29tL2Rpcmtncm9lbmVuL2pRdWVyeS12aWV3cG9ydC1jaGVja2VyL2lzc3Vlcy8yN1xyXG4gICAgICAgICAqL1xyXG5cclxuICAgICAgICAvLyBTZWxlY3QgdGhlIGNvcnJlY3QgZXZlbnRzXHJcbiAgICAgICAgaWYoICdvbnRvdWNoc3RhcnQnIGluIHdpbmRvdyB8fCAnb25tc2dlc3R1cmVjaGFuZ2UnIGluIHdpbmRvdyApe1xyXG4gICAgICAgICAgICAvLyBEZXZpY2Ugd2l0aCB0b3VjaHNjcmVlblxyXG4gICAgICAgICAgICAkKGRvY3VtZW50KS5iaW5kKFwidG91Y2htb3ZlIE1TUG9pbnRlck1vdmUgcG9pbnRlcm1vdmVcIiwgdGhpcy5jaGVja0VsZW1lbnRzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEFsd2F5cyBsb2FkIG9uIHdpbmRvdyBsb2FkXHJcbiAgICAgICAgJChvcHRpb25zLnNjcm9sbEJveCkuYmluZChcImxvYWQgc2Nyb2xsXCIsIHRoaXMuY2hlY2tFbGVtZW50cyk7XHJcblxyXG4gICAgICAgIC8vIE9uIHJlc2l6ZSBjaGFuZ2UgdGhlIGhlaWdodCB2YXJcclxuICAgICAgICAkKHdpbmRvdykucmVzaXplKGZ1bmN0aW9uKGUpe1xyXG4gICAgICAgICAgICBib3hTaXplID0ge2hlaWdodDogJChvcHRpb25zLnNjcm9sbEJveCkuaGVpZ2h0KCksIHdpZHRoOiAkKG9wdGlvbnMuc2Nyb2xsQm94KS53aWR0aCgpfTtcclxuICAgICAgICAgICAgJGVsZW0uY2hlY2tFbGVtZW50cygpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyB0cmlnZ2VyIGluaXRhbCBjaGVjayBpZiBlbGVtZW50cyBhbHJlYWR5IHZpc2libGVcclxuICAgICAgICB0aGlzLmNoZWNrRWxlbWVudHMoKTtcclxuXHJcbiAgICAgICAgLy8gRGVmYXVsdCBqcXVlcnkgcGx1Z2luIGJlaGF2aW91clxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxufSkoalF1ZXJ5KTsiXSwiZmlsZSI6InZpZXdwb3J0Y2hlY2tlci5qcyJ9
