(function (root, factory) {
    "use strict";

    if (typeof define === 'function' && define.amd) {
        // Set up jQuery.Scroolly appropriately for the environment. Start with AMD.
        define(['jquery'], function ($) {
            // Export global even in AMD case in case this script is loaded with
            return factory(root, $, false);
        });

        return;
    }

    // Finally, as a browser global in jquery ns.
    factory(root, (root.jQuery || root.Zepto || root.ender || root.$), true);
}(this, function (root, $, patchJQuery) {
    "use strict";

    var scroolly;

    scroolly = {
        options: {
            timeout: null,
            meter: $('.scroolly'),
            body: document
        },
        theCSSPrefix: '',
        theDashedCSSPrefix: '',
        isMobile: false,
        isInitialized: false,
        //        requestAnimFrame: null,
        //        cancelAnimFrame: null,

        animFrame: null,
        direction: 0,
        scrollTop: 0,
        scrollCenter: 0,
        scrollBottom: 0,
        docHeight: 0,
        docMiddle: 0,
        winHeight: $(window).height()
    };

    scroolly.scrollLayout = {
        //  TSB - top screen border
        //        topbarSearchForm:{
        //            element: searchFormTop,
        //            rules:[
        //                {
        //                    from: 0, // top border of the rule region
        //                    to: 'finish', // bottom border of the rule region
        //                          // if ommited then set to 'from' of the following rule
        //                          // if there is no following rule set to 'bottom'
        //                    minWith: 0, // min viewport width for the rule to apply
        //                    maxWidth: 'infinity', // max viewport width for the rule to apply
        //                    direction: 0, // 0 - ignored, >0 - forward, <0 - backward
        //                    alias: 'top', // region alias
        //                    css: null,//{'display': 'none'}, // css to apply when TSB enters rule region
        //                    cssFrom: {'border': '0px solid #000000'},
        //                    cssTo: {'border': '10px solid #eeeeee'},
        //                    addClass: null,   // $.addClass() param value to add classes when TSB enters rule region
        //                    removeClass: null,    // $.removeClass() param value to remove classes when TSB enters rule region
        //                    onCheckIn: function(element){ // callback on TSB enters rule region
        //                        element
        //                        .hide('fade', 100);
        //                        searchInputMain.val(searchInputTop.val());
        //                    },
        //                    onCheckOut: function(element){} // callback on TSB leaves rule region
        //                    onTopIn: function(element){}  // callback on TSB enters rule region from the top border
        //                    onTopOut: function(element){}  // callback on TSB leaves rule region from the top border
        //                    onBottomIn: function(element){}  // callback on TSB enters rule region from the bottom border
        //                    onBottomOut: function(element){}  // callback on TSB leaves rule region from the bottom border
        //                    onScroll: function(element, offset, length){}  // callback on scroll event while TSB is in the rule region
        //                                      // offset - is the offset (px) of the TSB from the rule region top border
        //                                      // length - is the rule region size (px)
        //                    onDirectionChanged: function(element, direction){}
        //                },
        //                {
        //                    from: searchFormMain.offset().top,
        //                    alias: 'searchform',
        //                    css: null,//{'display': 'block'},
        //                    addClass: null,
        //                    removeClass: null,
        //                    onCheckIn: function(element){
        //                        element.show('fade', 300);
        //                        searchInputTop.val(searchInputMain.val());
        //                    },
        //                    onCheckOut: function(element){}
        //                }
        //            ]
        //        }

    };

    scroolly._isObject = function (val) {
        return typeof val === 'object';
    };

    scroolly._isArray = function (val) {
        return val instanceof Array;
    };

    scroolly._isNumber = function (val) {
        return val instanceof Number || typeof val === 'number';
    };

    scroolly._isString = function (val) {
        return val instanceof String || typeof val === 'string';
    };

    scroolly._default = function (obj, key, defaultValue) {
        if (defaultValue === undefined) {
            defaultValue = null;
        }
        var parts = (key + '').split('.');
        if (obj && (scroolly._isObject(obj) || scroolly._isArray(obj))) {
            var root = obj,
                part;
            for (var i in parts) {
                part = parts[i];
                if ((scroolly._isObject(root) || scroolly._isArray(root)) && root[part] !== undefined) {
                    root = root[part];
                } else {
                    return defaultValue;
                }
            }
            return root;
        }

        return defaultValue;
        //        return _.empty(obj[key])?defaultValue:obj[key];
    };

    /**
     * Parse rule boundry
     * @param {string} boundry - '[anchor] [offset] = [vieport anchor] [offset]'
     * @return {object} - parsed boundry
     */
    scroolly.parseCoords = function (boundry) {
        var strings = boundry.split(/\s*=\s*/),
            coordRel = strings[0] || 'doc-top',
            parsedCoordRel = scroolly.parseCoord(coordRel),
            coordVP = strings[1] || parsedCoordRel.anchor,
            parsedCoordVP = scroolly.parseCoord(coordVP);

        return [parsedCoordRel, parsedCoordVP];
    };

    /**
     * Parse rule coord part
     * @param {string} coord - '[anchor] [offset]'
     * @return {object} - parsed boundry
     */
    scroolly.parseCoord = function (coord) {
        var reAnchor = /((vp|doc|el|con)-)?(top|center|bottom)?/i,
            reOffsetStr = '(\\+|-)?\\s*(\\d+)(\\%|vp|doc|el|con)?',
            reOffset = new RegExp(reOffsetStr, 'gi'),
            mA = coord.match(reAnchor),
            mO = coord.match(reOffset);

        if (!mA && !mO) {
            return false;
        }

        var subject = mA[1] ? mA[2] : 'vp',
            anchor = mA[3] || 'top',
            offsets = [];

        if (mO) {
            reOffset = new RegExp(reOffsetStr, 'i');
            var offsetStr,
                mO2,
                sign,
                offset,
                offsetSubject;

            for (var i = 0; i < mO.length; i++) {
                offsetStr = mO[i];
                mO2 = offsetStr.match(reOffset);
                sign = mO2[1] && mO2[1] === '-' ? -1 : 1;
                offset = mO2[2] && parseInt(mO2[2]) * sign || 0;
                offsetSubject = 'px';

                if (mO2[3]) {
                    offsetSubject = mO2[3] === '%' ? subject : mO2[3];
                }

                offsets.push({
                    offset: offset,
                    subject: offsetSubject
                });
            }
        }
        return {
            original: coord,
            subject: subject,
            anchor: anchor,
            offsets: offsets
        };

    };

    /**
     * Calculate coord position towards top of the document
     * @param {string} coord - '[anchor] [offset]'
     * @param {jQuery(element)} $element
     * @param {jQuery(container)} $container
     * @return {object} - parsed boundry
     */
    scroolly.calculateCoord = function (coord, $element, $container) {
        if (scroolly._isString(coord)) {
            coord = scroolly.parseCoord(coord);
        }

        var subjectCoord = 0;
        if ('vp' === coord.subject) {
            switch (coord.anchor) {
                case 'top':
                    subjectCoord = scroolly.scrollTop;
                    break;
                case 'center':
                    subjectCoord = scroolly.scrollCenter;
                    break;
                case 'bottom':
                    subjectCoord = scroolly.scrollBottom;
                    break
            }
        } else if ('doc' === coord.subject) {
            switch (coord.anchor) {
                case 'top':
                    subjectCoord = 0;
                    break;
                case 'center':
                    subjectCoord = scroolly.docMiddle;
                    break;
                case 'bottom':
                    subjectCoord = scroolly.docHeight;
            }
        } else {
            var $subject = 'con' === coord.subject ? $container : $element,
                subjectHeight = $subject.outerHeight(),
                subjectTop = $subject.offset().top,
                subjectBottom = subjectTop + subjectHeight,
                subjectCenter = subjectTop + Math.floor(subjectHeight / 2);

            switch (coord.anchor) {
                case 'top':
                    subjectCoord = subjectTop;
                    break;
                case 'center':
                    subjectCoord = subjectCenter;
                    break;
                case 'bottom':
                    subjectCoord = subjectBottom;
                    break;
            }
        }

        var i, o, subjectOffset, relativeHeight;
        for (i = 0; i < coord.offsets.length; i++) {
            o = coord.offsets[i];
            subjectOffset = o.offset;

            if ('px' !== o.subject) {
                relativeHeight = 0;
                switch (o.subject) {
                    case 'vp':
                        relativeHeight = scroolly.winHeight;
                        break;
                    case 'doc':
                        relativeHeight = scroolly.docHeight;
                        break;
                    case 'el':
                        relativeHeight = $element.outerHeight();
                        break;
                    case 'con':
                        relativeHeight = $container.outerHeight();
                        break;
                }

                subjectOffset = Math.ceil(o.offset / 100 * relativeHeight);
                //                console.log(subjectOffset);
            }
            subjectCoord += subjectOffset;
        }

//        console.dir({'computed':{ags: arguments, res: subjectCoord}});

        return subjectCoord;
    };

    /**
     * Calculate how much we should scroll down till boundry
     * @param {Object} coords
     * @param {$(DOMnode)} $element
     * @param {$(DOMnode)} $container
     * @returns {integer} how much we should scroll down till boundry
     */
    scroolly.cmpCoords = function (coords, $element, $container) {
        return scroolly.calculateCoord(coords[0], $element, $container) - scroolly.calculateCoord(coords[1], $element, $container);
    };

    /**
     * Check if rule is active
     * @param {object} rule
     * @return {boolean}
     */
    scroolly.isRuleInActiveWidthRange = function (rule) {
        var fromX = scroolly._default(rule, 'minWidth', 0),
            toX = scroolly._default(rule, 'maxWidth', 'infinity'),
            meter = scroolly._default(scroolly.options, 'meter'),
            width = $(window).width(),
            minWidthScrolly,
            maxWidthScrolly,
            checkinWidth;

        if (meter.length) {
            minWidthScrolly = meter.length ? parseInt(meter.css('min-width')) : 0;
            maxWidthScrolly = meter.length ? meter.css('max-width') : 'none';
            maxWidthScrolly = maxWidthScrolly === 'none' ? 'infinity' : parseInt(maxWidthScrolly);
            checkinWidth = fromX <= minWidthScrolly && (toX === 'infinity' || toX >= maxWidthScrolly);

            return checkinWidth;
        }

        return fromX < width && (toX === 'infinity' || toX >= width);
    };

    /**
     * Check if rule is active
     *
     * @param {object} rule
     * @param {$(DOMnode)} $element
     * @param {$(DOMnode)|String} $container description
     * @returns {boolean|object} false if rule is not active or scrolling params instead
     * {
	 *      offset: how many pixels since top boundry were scrolled
	 *      length: total length of the region in pisels
	 * }
     */
    scroolly.isRuleActive = function (rule, $element, $container) {
        var checkinWidth = scroolly.isRuleInActiveWidthRange(rule);
        if (!checkinWidth) {
            return false;
        }

        var ruleDirection = scroolly._default(rule, 'direction', 0),
            scrollDirection = scroolly.direction;

        if (ruleDirection && (ruleDirection > 0 && scrollDirection < 0 || ruleDirection < 0 && scrollDirection >= 0)) {
            return false;
        }

        var fromY = scroolly._default(rule, 'from', '0'),
            toY = scroolly._default(rule, 'to', 'finish');

        var toTop = scroolly.cmpCoords(fromY, $element, $container);
        if (toTop > 0) {
            return false;
        }

        var toBottom = scroolly.cmpCoords(toY, $element, $container);
        if (toBottom <= 0) {
            return false;
        }

        return {
            offset: -toTop,
            length: toBottom - toTop
        };
    };

    /**
     * Add ellement with its rules to scroll layout
     * See the commented sample above for the rules syntax
     *
     * @param {string} id
     * @param {$(DOMnode)} $element
     * @param {array} rules
     * @param {$(DOMnode)} $container description
     */
    scroolly.addItem = function (id, $element, rules, $container) {
        if (!$element.length) {
            return false;
        }

        $container = $container || 'self';

        var rule,
            isAbsolute,
            fromY,
            toY,
            fromCss,
            toCss,
            cssOnScroll

        for (var i in rules) {
            rule = rules[i];

            isAbsolute = !$container;//?true:false;

            fromY = scroolly._default(rule, 'from', 'doc-top');

            if (scroolly._isString(fromY) || scroolly._isNumber(fromY)) {
                fromY = scroolly.parseCoords('' + fromY);
                rule.from = fromY;
            }

            toY = scroolly._default(rule, 'to', 'doc-bottom');

            if (scroolly._isString(toY) || scroolly._isNumber(toY)) {
                toY = scroolly.parseCoords('' + toY);

                rule.to = toY;
            }

            fromCss = scroolly._default(rule, 'cssFrom');
            toCss = scroolly._default(rule, 'cssTo');

            if (fromCss && toCss) {
                cssOnScroll = function (element, offset, length, rule) {
                    var progress = offset / length,
                        fromCss = scroolly._default(rule, 'cssFrom'),
                        toCss = scroolly._default(rule, 'cssTo'),
                        css = {},
                        fromProp,
                        toProp;

                    for (var property in fromCss) {
                        fromProp = fromCss[property];
                        toProp = scroolly._default(toCss, property, fromProp);
                        css[property] = scroolly.getTransitionValue(fromProp, toProp, progress);
                    }

                    element.css(scroolly.extendCssWithPrefix(css));
                };

                rule.cssOnScroll = cssOnScroll;
            }
        }
        if ($element.length > 1) {
            $element.each(function (i) {
                var clonedRules = [],
                    rule,
                    clonedRule,
                    $con = null;

                for (var j = 0; j < rules.length; j++) {
                    rule = rules[j];
                    clonedRule = {};
                    $.extend(clonedRule, rule);
                    clonedRules.push(clonedRule);
                }

                if ($container) {
                    if ($container === 'self') {
                        $con = $container;
                    } else {
                        $con = $container.length > 1 && i < $container.length ? $($container[i]) : $container;
                    }
                }

                scroolly.addItem(id + '-' + i, $(this), clonedRules, $con);
            });

            return true;
        }
        var item = scroolly._default(scroolly.scrollLayout, id);
        if (item) {
            item.rules.concat(rules);
        } else {
            scroolly.scrollLayout[id] = {
                element: $element,
                container: $container,
                rules: rules
            };
        }
        return true;
    };

    scroolly.factory = function ($element, rules, $container, id) {
        scroolly.init();

        if (!$element.length) {
            return false;
        }

        if (!rules) {
            return false;
        }

        id = id || $element[0].tagName + '_' + Object.keys(scroolly.scrollLayout).length;
        scroolly.addItem(id, $element, rules, $container, false);
    };

    /**
     * Fix DOM element in NON-Responsive (non viewport width dependent) layout.
     * When applied, DOMnode is fixed when TSB is within
     * (node's top border - offsetTop) and ($bottomContainer's bottom border - offsetBottom)
     * and unfixed when TSB is out of the region
     *
     * @param string id
     * @param $(DOMnode) $element
     * @param object params: {
	 *      $bottomContainer - $(DOMnode) which restricts fix from the bottom,
	 *          '<body>' by default,
	 *          'next' means the next dom sibling $element.next()
	 *          'parent' means $element.parent()
	 *      mode - sets the mode of adding needed white space to $bottomContainer
	 *          when $element is fixed
	 *          'margin' means margin-top=$element.height() wil be added to $bottomContainer
	 *          'padding' means padding-top=$element.height() wil be added to $bottomContainer
	 *      offsetTop - top offset that is left before fixed element when fixed
	 *      offsetBottom - bottom offset left before $bottomContainer
	 *      minWidth, maxWidth - viewport width (px) boundries
	 *          is used within stickItemXY for responsive layouts
	 *          0, 'infinity' by default
	 *      static -
	 * }
     */
    scroolly.stickItem = function (id, $element, params /*$bottomContainer, mode, offsetTop, offsetBottom*/) {
        scroolly.stickItemXY(id, $element, (params instanceof Array) ? params : [params]);
    };

    /**
     * Fix DOM element in NON-Responsive (non viewport width dependent) layout.
     * When applied, DOMnode is fixed when TSB is within
     * (node's top border - offsetTop) and ($bottomContainer's bottom border - offsetBottom)
     * and unfixed when TSB is out of the region
     *
     * @param string id
     * @param $(DOMnode) $element
     * @param array params - array of objects described in stickItem()
     */
    scroolly.stickItemXY = function (id, $element, params /*$bottomContainer, mode, offsetTop, offsetBottom*/) {
        params = params || [];
        var rules = [],
            xRange,
            $bottomContainer,
            mode,
            offsetTop,
            offsetBottom,
            minWidth,
            maxWidth,
            isStatic
        ;
        for (var x in params) {
            xRange = params[x];
            $bottomContainer = scroolly._default(xRange, '$bottomContainer', $('body'));
            mode = scroolly._default(xRange, 'mode');
            offsetTop = scroolly._default(xRange, 'offsetTop', 0);
            offsetBottom = scroolly._default(xRange, 'offsetBottom', 0);
            minWidth = scroolly._default(xRange, 'minWidth', 0);
            maxWidth = scroolly._default(xRange, 'maxWidth', 'infinity');
            isStatic = scroolly._default(xRange, 'static', false);

            if ('next' === $bottomContainer) {
                mode = mode || 'margin';
                $bottomContainer = $($element).next();
            } else if ('parent' === $bottomContainer || !$bottomContainer) {
                mode = mode || 'padding';
                $bottomContainer = $($element).parent();
            }

            if (!isStatic) {
                rules.push({
                    source: 'sticky',
                    alias: 'top',
                    minWidth: minWidth,
                    maxWidth: maxWidth,
                    offsetTop: offsetTop,
                    offsetBottom: offsetBottom,
                    bottomContainer: $bottomContainer,
                    mode: mode
                });
                rules.push({
                    source: 'sticky',
                    alias: 'fixed',
                    minWidth: minWidth,
                    maxWidth: maxWidth,
                    offsetTop: offsetTop,
                    offsetBottom: offsetBottom,
                    bottomContainer: $bottomContainer,
                    mode: mode
                });

                rules.push({
                    source: 'sticky',
                    alias: 'bottom',
                    minWidth: minWidth,
                    maxWidth: maxWidth,
                    offsetTop: offsetTop,
                    offsetBottom: offsetBottom,
                    bottomContainer: $bottomContainer,
                    mode: mode
//                    from: offset_2,
//                    css: {'position': 'absolute', 'top':(offset_2+offsetTop)+'px'}
                });
            } else {
                rules.push({
                    source: 'sticky',
                    alias: 'static',
                    minWidth: minWidth,
                    maxWidth: maxWidth,
                    bottomContainer: $bottomContainer
                });
            }
        }

        scroolly.addItem(id, $($element), rules);
    };

    /**
     * This function calculates all rules boundries when browser is resized and
     * enters new width range. We cannot precalculate all sizes as during window
     * resize some element are resized.
     *
     * @param {$(DOMnode)} $element
     * @param {object} rule - single rule
     * @returns {object} - recalculated rule
     */
    scroolly.processStickyItemRange = function ($element, rule) {
        rule = rule || {};

        var $bottomContainer = scroolly._default(rule, 'bottomContainer', $('body')),
            mode = scroolly._default(rule, 'mode'),
            offsetTop = scroolly._default(rule, 'offsetTop', 0),
            offsetBottom = scroolly._default(rule, 'offsetBottom', 0),
            itemHeight = parseInt($element.css('margin-top')) + $element.height() + parseInt($element.css('margin-bottom'));

        if ($element.css('box-sizing') === 'border-box') {
            itemHeight += parseInt($element.css('padding-top')) + parseInt($element.css('padding-bottom'));
        }

        var bottomContainerHeight = parseInt($bottomContainer.css('margin-top')) + $bottomContainer.height() + parseInt($bottomContainer.css('margin-bottom'));
        if ($bottomContainer.css('box-sizing') === 'border-box') {
            bottomContainerHeight += parseInt($bottomContainer.css('padding-top')) + parseInt($bottomContainer.css('padding-bottom'));
        }

        var offset_1 = Math.round($element.offset().top - parseInt($element.css('margin-top'))),
            offset_2 = Math.round($bottomContainer.offset().top + (bottomContainerHeight - itemHeight - offsetBottom));

        switch (rule.alias) {
            case 'top':
                rule.from = 0;
                rule.to = offset_1 - offsetTop;
                rule.css = {'position': 'absolute', 'top': offset_1 + 'px'};
                rule.itemHeight = itemHeight;
                break;

            case 'fixed':
                rule.from = offset_1 - offsetTop;
                rule.to = offset_2;
                rule.css = {'position': 'fixed', 'top': offsetTop + 'px'};
                rule.itemHeight = itemHeight;
                break;

            case 'bottom':
                rule.from = offset_2;
                rule.css = {'position': 'absolute', 'top': (offset_2 + offsetTop) + 'px'};
                rule.itemHeight = itemHeight;
                break;

            case 'static':
                rule.from = 0;
                rule.css = {'position': '', 'top': ''};
                rule.itemHeight = 0;
                break;
        }

        return rule;
    };

    /**
     * Heads up, this function is called on window resize. However even if window
     * has entered new width range it doesn't mean that new responsive styles were
     * allready applied. So we cannot rely on $( window ).width(). What we can rely
     * on are styles that are applied to some predefined element called 'meter'.
     *
     * Html: (our Meter)
     * <div class="scroolly"></div>
     *
     * CSS:
     *
     * .scroolly{
	 *      display: none;
	 * }
     *
     * media (min-device-width : 320px) and (max-device-width : 480px){
	 *      .scroolly{
	 *          min-width: 320px;
	 *          max-width: 480px;
	 *      }
	 * }
     * media (min-device-width : 481px) and (max-device-width : 800px){
	 *      .scroolly{
	 *          min-width: 481px;
	 *          max-width: 800px;
	 *      }
	 * }
     *
     * JS rules:
     *
     * {
	 *      minWidth: 320,
	 *      maxWidth: 480
	 * },
     * {
	 *      minWidth: 480,
	 *      maxWidth: 800
	 * }
     *
     * @returns {Boolean}
     */
    scroolly.onResize = function () {
        scroolly.winHeight = $(window).height();
        //        scroolly.docHeight = $(document).height();
        scroolly.docHeight = scroolly.body.height();
        scroolly.docMiddle = Math.floor(scroolly.docHeight / 2);

        var needScroll = false;

        for (var id in scroolly.scrollLayout) {
            // cycling through all visual elements that should react
            // to scrolling and resizing
            var item = scroolly.scrollLayout[id],
                rule,
                checkin,
                source
            ;
            for (var i in item.rules) {
                rule = item.rules[i];
                checkin = scroolly.isRuleInActiveWidthRange(rule);
                needScroll |= checkin;
                if (checkin && rule.from === undefined) {
                    $(item.element).css('position', '');
                    $(item.element).css('top', '');
                    if (rule.bottomContainer) {
                        rule.bottomContainer.css('margin-top', '');
                    }
                    // item entered new range and should adapt
                    source = scroolly._default(rule, 'source');
                    if ('sticky' === source) {
                        item.rules[i] = scroolly.processStickyItemRange(item.element, rule);
                    }

                }
            }
        }
        if (needScroll) {
            // dark magick here do not touch this useless string
            scroolly.scrollLayout = scroolly.scrollLayout;
            setTimeout(function () {
                scroolly.onScroll(true);
            }, 0);
            //            scroolly.onScroll();
        }
        return true;
    };

    /**
     * Helper to get progress values for onScroll handlers
     * @param {integer} offset
     * @param {integer} length
     * @returns {object} progress metrics
     */
    scroolly.getProgress = function (offset, length) {
        var relative = offset / length;
        return {
            offset: offset,
            length: length,
            relative: relative,
            left: length - offset,
            leftRelative: 1 - relative
        };
    };

    /**
     * Get transition float value  based on start, stop and progress values
     * @param {number} start
     * @param {number} stop
     * @param {float} progress
     * @returns {Number}
     */
    scroolly.getTransitionFloatValue = function (start, stop, progress) {
        if (progress <= 0) {
            return start;
        }

        if (progress >= 1) {
            return stop;
        }

        return start + (stop - start) * progress;
    };

    /**
     * Get transition integer value  based on start, stop and progress values
     * @param {number} start
     * @param {number} stop
     * @param {float} progress
     * @returns {Number}
     */
    scroolly.getTransitionIntValue = function (start, stop, progress) {
        return Math.round(scroolly.getTransitionFloatValue(start, stop, progress));
    };

    /**
     * Get [R, G, B] array of integers for provided '#RRGGBB' or '#RGB' value
     * @param {type} color
     * @returns {Array}
     */
    scroolly.hashColor2rgb = function (color) {
        var m = color.match(/^#([0-9a-f]{3})$/i);
        if (m) {
            // in three-character format, each value is multiplied by 0x11 to give an
            // even scale from 0x00 to 0xff
            return [
                parseInt(m[1].charAt(0), 16) * 0x11, parseInt(m[1].charAt(1), 16) * 0x11, parseInt(m[1].charAt(2), 16) * 0x11
            ];
        } else {
            m = color.match(/^#([0-9a-f]{6})$/i);
            if (m) {
                return [
                    parseInt(m[1].substr(0, 2), 16), parseInt(m[1].substr(2, 2), 16), parseInt(m[1].substr(4, 2), 16)
                ];
            }
        }
        return [0, 0, 0];
    };

    /**
     * Get '#RRGGBB' value for provided R, G, B integer values
     * @param {integer} r
     * @param {integer} g
     * @param {integer} b
     * @returns {string} #RRGGBB
     */
    scroolly.rgb2HashColor = function (r, g, b) {
        var res = '#', c, hex;
        for (var i in arguments) {
            c = arguments[i];
            hex = c.toString(16);

            if (c < 16) {
                hex = '0' + hex;
            }

            res += hex;
        }

        return res;
    };

    /**
     * Get transition color value  based on start, stop and progress values
     * @param {cssColor} start
     * @param {cssColor} stop
     * @param {float} progress
     * @returns {Number}
     */
    scroolly.getTransitionColorValue = function (start, stop, progress) {
        if (progress <= 0) {
            return start;
        }

        if (progress >= 1) {
            return stop;
        }

        var startRGB = scroolly.hashColor2rgb(start),
            stopRGB = scroolly.hashColor2rgb(stop),
            r = scroolly.getTransitionIntValue(startRGB[0], stopRGB[0], progress),
            g = scroolly.getTransitionIntValue(startRGB[1], stopRGB[1], progress),
            b = scroolly.getTransitionIntValue(startRGB[2], stopRGB[2], progress);

        return scroolly.rgb2HashColor(r, g, b);
    };

    /**
     * Get transition css value  based on start, stop and progress values
     * @param {cssColor} start
     * @param {cssColor} stop
     * @param {float} progress
     * @returns {Number}
     */
    scroolly.getTransitionValue = function (start, stop, progress) {
        if (progress <= 0) {
            return start;
        }

        if (progress >= 1) {
            return stop;
        }

        var called = 0;
        if (scroolly._isNumber(start) && scroolly._isNumber(stop)) {
            return scroolly.getTransitionFloatValue(start, start, progress);
        }

        var re = /(\d*\.\d+)|(\d+)|(#[0-9a-f]{6})|(#[0-9a-f]{3})/gi,
            stops = ('' + stop).match(re);

        return ('' + start).replace(re, function (value, float, int, color6, color3) {
            //            console.dir({'replace callback args':arguments, stops: stops, called: called});
            var currentStop = stops[called];

            called++;
            if (int && int.length) {
                return /\d*\.\d+/.test(currentStop) ? scroolly.getTransitionFloatValue(parseFloat(value), parseFloat(currentStop), progress) : scroolly.getTransitionIntValue(parseInt(value), parseInt(currentStop), progress);
            }

            if (float && float.length) {
                return scroolly.getTransitionFloatValue(parseFloat(value), parseFloat(currentStop), progress);
            }

            if (color6 && color6.length || color3 && color3.length) {
                return scroolly.getTransitionColorValue(value, currentStop, progress);
            }

            return value;
        });
    };

    /**
     * Function that is called while sccrolls.
     * @param {boolean} force description
     * @returns {boolean}
     */
    scroolly.onScroll = function (force) {
        //        var scrollPos = $(document).scrollTop(); // Y-coord that is checked against fromY & toY
        var scrollPos = scroolly.body.scrollTop(); // Y-coord that is checked against fromY & toY

        if (!force && scrollPos === scroolly.scrollTop) {
            return false;
        }

        var prevPos = scroolly.scrollTop,
            prevDirection = scroolly.direction;

        scroolly.scrollTop = scrollPos; // Y-coord that is checked against fromY & toY
        scroolly.scrollBottom = scrollPos + scroolly.winHeight;
        scroolly.scrollCenter = scrollPos + Math.floor(scroolly.winHeight / 2);
        scroolly.direction = scrollPos - prevPos;

        var directionChanged = !(scroolly.direction === prevDirection || scroolly.direction < 0 && prevDirection < 0 || scroolly.direction > 0 && prevDirection > 0),
            item,
            totalRules,
            checkedIn,
            checkedOut,
            active,
            id, i, l, j,
            rule,
            fromX,
            toX,
            container,
            $bottomContainer,
            mode,
            itemHeight;

        for (id in scroolly.scrollLayout) {
            // cycling through all visual elements that should react
            // to scrolling and resizing
            item = scroolly.scrollLayout[id];
            totalRules = item.rules.length;
            checkedIn = [];
            checkedOut = [];
            active = [];

            for (i = 0; i < totalRules; i++) {
                rule = item.rules[i];
                fromX = scroolly._default(rule, 'minWidth', 0);
                toX = scroolly._default(rule, 'maxWidth', 'infinity');

                container = item.container === 'self' ? item.element : item.container;

                rule.checkin = scroolly.isRuleActive(rule, item.element, container);
                rule.class = rule.class || 'scroll-pos-' + (rule.alias) + ' window-width-' + fromX + '-to-' + toX;
                if (rule.checkin) {
                    active.push(i);
                    if (!rule.isActive) {
                        rule.isActive = true;
                        checkedIn.push(i);
                    }
                } else if (rule.isActive) {
                    rule.isActive = false;
                    checkedOut.push(i);
                }
                item.rules[i] = rule;
            }

            for (j = 0; j < checkedOut.length; j++) {
                i = checkedOut[j];
                rule = item.rules[i];
                item.element.removeClass(rule.class);
                if (rule.cssOnScroll) {
                    l = rule.length || 0;
                    rule.cssOnScroll(item.element, scrollPos > prevPos ? l : 0, l, rule);
                }
                if (rule.onScroll) {
                    l = rule.length || 0;
                    rule.onScroll(item.element, scrollPos > prevPos ? l : 0, l, rule);
                }
                if (rule.onCheckOut) {
                    rule.onCheckOut(item.element, rule);
                }
                if (rule.onTopOut && scrollPos < prevPos) {
                    rule.onTopOut(item.element, rule);
                } else if (rule.onBottomOut && scrollPos > prevPos) {
                    rule.onBottomOut(item.element, rule);
                }
            }

            for (j = 0; j < checkedIn.length; j++) {
                i = checkedIn[j];
                rule = item.rules[i];

                if (rule.css) {
                    item.element.css(scroolly.extendCssWithPrefix(rule.css));
                }

                if (rule.addClass) {
                    item.element.addClass(rule.addClass);
                }

                if (rule.removeClass) {
                    item.element.removeClass(rule.removeClass);
                }
                item.element.addClass(rule.class);

                $bottomContainer = scroolly._default(rule, 'bottomContainer');
                mode = scroolly._default(rule, 'mode');
                itemHeight = scroolly._default(rule, 'itemHeight');

                if ($bottomContainer && mode && itemHeight) {
                    $bottomContainer.css(mode + '-top', itemHeight + 'px');
                }

                if (rule.onCheckIn) {
                    rule.onCheckIn(item.element, rule);
                }

                if (rule.onTopIn && scrollPos > prevPos) {
                    rule.onTopIn(item.element, rule);
                } else if (rule.onBottomIn && scrollPos < prevPos) {
                    rule.onBottomIn(item.element, rule);
                }

                rule.length = rule.checkin.length;
            }

            for (j = 0; j < active.length; j++) {
                i = active[j];
                rule = item.rules[i];

                if (rule.cssOnScroll) {
                    rule.cssOnScroll(item.element, rule.checkin.offset, rule.checkin.length, rule);
                }

                if (rule.onScroll) {
                    rule.onScroll(item.element, rule.checkin.offset, rule.checkin.length, rule);
                }

                if (directionChanged && rule.onDirectionChanged) {
                    rule.onDirectionChanged(item.element, scroolly.direction, rule);
                }
            }
            scroolly.scrollLayout[id] = item;
        }

    };

    //Will be called once (when scroolly gets initialized).
    scroolly.detectCSSPrefix = function () {
        //Only relevant prefixes. May be extended.
        //Could be dangerous if there will ever be a CSS property which actually starts with "ms". Don't hope so.
        var rxPrefixes = /^(?:O|Moz|webkit|ms)|(?:-(?:o|moz|webkit|ms)-)/;

        //Detect prefix for current browser by finding the first property using a prefix.
        if (!window.getComputedStyle) {
            return;
        }

        var style = window.getComputedStyle(document.body, null);

        for (var k in style) {
            //We check the key and if the key is a number, we check the value as well, because safari's getComputedStyle returns some weird array-like thingy.
            scroolly.theCSSPrefix = (k.match(rxPrefixes) || (+k === k && style[k].match(rxPrefixes)));

            if (scroolly.theCSSPrefix) {
                break;
            }
        }

        //Did we even detect a prefix?
        if (!scroolly.theCSSPrefix) {
            scroolly.theCSSPrefix = scroolly.theDashedCSSPrefix = '';

            return;
        }

        scroolly.theCSSPrefix = scroolly.theCSSPrefix[0];

        //We could have detected either a dashed prefix or this camelCaseish-inconsistent stuff.
        if (scroolly.theCSSPrefix.slice(0, 1) === '-') {
            scroolly.theDashedCSSPrefix = scroolly.theCSSPrefix;

            //There's no logic behind these. Need a look up.
            scroolly.theCSSPrefix = ({
                '-webkit-': 'webkit',
                '-moz-': 'Moz',
                '-ms-': 'ms',
                '-o-': 'O'
            })[scroolly.theCSSPrefix];
        } else {
            scroolly.theDashedCSSPrefix = '-' + scroolly.theCSSPrefix.toLowerCase() + '-';
        }
    };

    scroolly.cssPrefix = function (key) {
        return scroolly.theDashedCSSPrefix + key;
    };

    scroolly.extendCssWithPrefix = function (cssObj) {
        var cssExt = {}, prop, re, m, newProp, val;

        for (prop in cssObj) {
            re = /^-(moz-|webkit-|o-|ms-)?/i;
            m = prop.match(re);
            newProp = prop.slice(1);
            //            console.dir({m: m});
            if (m && !m[1]) {
                val = cssObj[prop];
                cssExt[newProp] = val;
                cssExt[scroolly.cssPrefix(newProp)] = val;
                delete cssObj[prop];
            }
        }

        $.extend(cssObj, cssExt);

        return cssObj;
    };

    scroolly.now = Date.now || function () {
        return +new Date();
    };

    scroolly.getRAF = function () {
        var requestAnimFrame = window.requestAnimationFrame || window[scroolly.theCSSPrefix.toLowerCase() + 'RequestAnimationFrame'],
            lastTime = scroolly.now();

        if (false && scroolly.isMobile || !requestAnimFrame) {
            requestAnimFrame = function (callback) {
                //How long did it take to render?
                var deltaTime = scroolly.now() - lastTime,
                    delay = Math.max(0, 1000 / 60 - deltaTime);

                return window.setTimeout(function () {
                    lastTime = scroolly.now();
                    //        scroolly.timesCalled++;
                    //        scroolly.x.text(scroolly.timesCalled);
                    callback();
                }, delay);
            };
        }

        return requestAnimFrame;
    };

    scroolly.getCAF = function () {
        var cancelAnimFrame = window.cancelAnimationFrame || window[scroolly.theCSSPrefix.toLowerCase() + 'CancelAnimationFrame'];

        if (scroolly.isMobile || !cancelAnimFrame) {
            cancelAnimFrame = function (timeout) {
                return window.clearTimeout(timeout);
            };
        }

        return cancelAnimFrame;

    };

    scroolly.animLoop = function () {
        scroolly.onScroll();
        scroolly.animFrame = window.requestAnimFrame(scroolly.animLoop);
    };

    scroolly.init = function (options) {
        if (scroolly.isInitialized) {
            return false;
        }
        $.extend(scroolly.options, options);
        scroolly.isMobile = scroolly._default(scroolly.options, 'isMobile', (/Android|iPhone|iPad|iPod|BlackBerry/i).test(navigator.userAgent || navigator.vendor || window.opera));
        scroolly.detectCSSPrefix();
        scroolly.body = $(scroolly.options.body);
        window.requestAnimFrame = scroolly.getRAF();
        window.cancelAnimFrame = scroolly.getCAF();

        scroolly.timesCalled = 0;
        $(document).ready(function () {
            $(window).resize(scroolly.onResize).resize();
            //            scroolly.body.scroll(function(){scroolly.onScroll(true);}).scroll();
            scroolly.animLoop();
        });
        scroolly.isInitialized = true;
    };

    scroolly.destroy = function () {
        window.cancelAnimFrame(scroolly.animFrame);
    };

    scroolly.factorySticky = function ($element, params, id) {
        id = id || $element[0].tagName + '_' + Object.keys(scroolly.scrollLayout).length;
        return scroolly.stickItemXY(id, $element, (params instanceof Array) ? params : [params]) ? id : false;
    };

    if (patchJQuery) {
        $.scroolly = scroolly;

        $.fn.scroolly = function (rules, $container, id) {
            scroolly.factory(this, rules, $container, id);
            return this;
        };

        /**
         * params = [widthRange1, widthRange2, ... , widthRangeN]
         *
         * widthRangeN = {
		 *      $bottomContainer: $(DOMnode),   // - container that defines bottom container
		 *      mode: 'margin'||'padding', // - defines the way element height will be compensated
		 *      minWidth: 0,
		 *      maxWidth: 'infinity',
		 *      static: false // - whether element should be fixed allways for current width range
		 * }
         *
         *
         * @param {type} params
         * @param {type} id
         * @returns {Boolean|String}
         */
        $.fn.scroollySticky = function (params, id) {
            scroolly.init();

            if (!this.length) {
                return false;
            }

            return scroolly.factorySticky(this, params, id);
        };
    }

    return scroolly;
}));


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJqcXVlcnkuc2Nyb29sbHkuanMiXSwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XHJcbiAgICBcInVzZSBzdHJpY3RcIjtcclxuXHJcbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XHJcbiAgICAgICAgLy8gU2V0IHVwIGpRdWVyeS5TY3Jvb2xseSBhcHByb3ByaWF0ZWx5IGZvciB0aGUgZW52aXJvbm1lbnQuIFN0YXJ0IHdpdGggQU1ELlxyXG4gICAgICAgIGRlZmluZShbJ2pxdWVyeSddLCBmdW5jdGlvbiAoJCkge1xyXG4gICAgICAgICAgICAvLyBFeHBvcnQgZ2xvYmFsIGV2ZW4gaW4gQU1EIGNhc2UgaW4gY2FzZSB0aGlzIHNjcmlwdCBpcyBsb2FkZWQgd2l0aFxyXG4gICAgICAgICAgICByZXR1cm4gZmFjdG9yeShyb290LCAkLCBmYWxzZSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBGaW5hbGx5LCBhcyBhIGJyb3dzZXIgZ2xvYmFsIGluIGpxdWVyeSBucy5cclxuICAgIGZhY3Rvcnkocm9vdCwgKHJvb3QualF1ZXJ5IHx8IHJvb3QuWmVwdG8gfHwgcm9vdC5lbmRlciB8fCByb290LiQpLCB0cnVlKTtcclxufSh0aGlzLCBmdW5jdGlvbiAocm9vdCwgJCwgcGF0Y2hKUXVlcnkpIHtcclxuICAgIFwidXNlIHN0cmljdFwiO1xyXG5cclxuICAgIHZhciBzY3Jvb2xseTtcclxuXHJcbiAgICBzY3Jvb2xseSA9IHtcclxuICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgIHRpbWVvdXQ6IG51bGwsXHJcbiAgICAgICAgICAgIG1ldGVyOiAkKCcuc2Nyb29sbHknKSxcclxuICAgICAgICAgICAgYm9keTogZG9jdW1lbnRcclxuICAgICAgICB9LFxyXG4gICAgICAgIHRoZUNTU1ByZWZpeDogJycsXHJcbiAgICAgICAgdGhlRGFzaGVkQ1NTUHJlZml4OiAnJyxcclxuICAgICAgICBpc01vYmlsZTogZmFsc2UsXHJcbiAgICAgICAgaXNJbml0aWFsaXplZDogZmFsc2UsXHJcbiAgICAgICAgLy8gICAgICAgIHJlcXVlc3RBbmltRnJhbWU6IG51bGwsXHJcbiAgICAgICAgLy8gICAgICAgIGNhbmNlbEFuaW1GcmFtZTogbnVsbCxcclxuXHJcbiAgICAgICAgYW5pbUZyYW1lOiBudWxsLFxyXG4gICAgICAgIGRpcmVjdGlvbjogMCxcclxuICAgICAgICBzY3JvbGxUb3A6IDAsXHJcbiAgICAgICAgc2Nyb2xsQ2VudGVyOiAwLFxyXG4gICAgICAgIHNjcm9sbEJvdHRvbTogMCxcclxuICAgICAgICBkb2NIZWlnaHQ6IDAsXHJcbiAgICAgICAgZG9jTWlkZGxlOiAwLFxyXG4gICAgICAgIHdpbkhlaWdodDogJCh3aW5kb3cpLmhlaWdodCgpXHJcbiAgICB9O1xyXG5cclxuICAgIHNjcm9vbGx5LnNjcm9sbExheW91dCA9IHtcclxuICAgICAgICAvLyAgVFNCIC0gdG9wIHNjcmVlbiBib3JkZXJcclxuICAgICAgICAvLyAgICAgICAgdG9wYmFyU2VhcmNoRm9ybTp7XHJcbiAgICAgICAgLy8gICAgICAgICAgICBlbGVtZW50OiBzZWFyY2hGb3JtVG9wLFxyXG4gICAgICAgIC8vICAgICAgICAgICAgcnVsZXM6W1xyXG4gICAgICAgIC8vICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgZnJvbTogMCwgLy8gdG9wIGJvcmRlciBvZiB0aGUgcnVsZSByZWdpb25cclxuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgdG86ICdmaW5pc2gnLCAvLyBib3R0b20gYm9yZGVyIG9mIHRoZSBydWxlIHJlZ2lvblxyXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiBvbW1pdGVkIHRoZW4gc2V0IHRvICdmcm9tJyBvZiB0aGUgZm9sbG93aW5nIHJ1bGVcclxuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgdGhlcmUgaXMgbm8gZm9sbG93aW5nIHJ1bGUgc2V0IHRvICdib3R0b20nXHJcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgICAgIG1pbldpdGg6IDAsIC8vIG1pbiB2aWV3cG9ydCB3aWR0aCBmb3IgdGhlIHJ1bGUgdG8gYXBwbHlcclxuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgbWF4V2lkdGg6ICdpbmZpbml0eScsIC8vIG1heCB2aWV3cG9ydCB3aWR0aCBmb3IgdGhlIHJ1bGUgdG8gYXBwbHlcclxuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uOiAwLCAvLyAwIC0gaWdub3JlZCwgPjAgLSBmb3J3YXJkLCA8MCAtIGJhY2t3YXJkXHJcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgICAgIGFsaWFzOiAndG9wJywgLy8gcmVnaW9uIGFsaWFzXHJcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgICAgIGNzczogbnVsbCwvL3snZGlzcGxheSc6ICdub25lJ30sIC8vIGNzcyB0byBhcHBseSB3aGVuIFRTQiBlbnRlcnMgcnVsZSByZWdpb25cclxuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgY3NzRnJvbTogeydib3JkZXInOiAnMHB4IHNvbGlkICMwMDAwMDAnfSxcclxuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgY3NzVG86IHsnYm9yZGVyJzogJzEwcHggc29saWQgI2VlZWVlZSd9LFxyXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICAgICBhZGRDbGFzczogbnVsbCwgICAvLyAkLmFkZENsYXNzKCkgcGFyYW0gdmFsdWUgdG8gYWRkIGNsYXNzZXMgd2hlbiBUU0IgZW50ZXJzIHJ1bGUgcmVnaW9uXHJcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgICAgIHJlbW92ZUNsYXNzOiBudWxsLCAgICAvLyAkLnJlbW92ZUNsYXNzKCkgcGFyYW0gdmFsdWUgdG8gcmVtb3ZlIGNsYXNzZXMgd2hlbiBUU0IgZW50ZXJzIHJ1bGUgcmVnaW9uXHJcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgICAgIG9uQ2hlY2tJbjogZnVuY3Rpb24oZWxlbWVudCl7IC8vIGNhbGxiYWNrIG9uIFRTQiBlbnRlcnMgcnVsZSByZWdpb25cclxuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnRcclxuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgIC5oaWRlKCdmYWRlJywgMTAwKTtcclxuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgIHNlYXJjaElucHV0TWFpbi52YWwoc2VhcmNoSW5wdXRUb3AudmFsKCkpO1xyXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICAgICBvbkNoZWNrT3V0OiBmdW5jdGlvbihlbGVtZW50KXt9IC8vIGNhbGxiYWNrIG9uIFRTQiBsZWF2ZXMgcnVsZSByZWdpb25cclxuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgb25Ub3BJbjogZnVuY3Rpb24oZWxlbWVudCl7fSAgLy8gY2FsbGJhY2sgb24gVFNCIGVudGVycyBydWxlIHJlZ2lvbiBmcm9tIHRoZSB0b3AgYm9yZGVyXHJcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgICAgIG9uVG9wT3V0OiBmdW5jdGlvbihlbGVtZW50KXt9ICAvLyBjYWxsYmFjayBvbiBUU0IgbGVhdmVzIHJ1bGUgcmVnaW9uIGZyb20gdGhlIHRvcCBib3JkZXJcclxuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgb25Cb3R0b21JbjogZnVuY3Rpb24oZWxlbWVudCl7fSAgLy8gY2FsbGJhY2sgb24gVFNCIGVudGVycyBydWxlIHJlZ2lvbiBmcm9tIHRoZSBib3R0b20gYm9yZGVyXHJcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgICAgIG9uQm90dG9tT3V0OiBmdW5jdGlvbihlbGVtZW50KXt9ICAvLyBjYWxsYmFjayBvbiBUU0IgbGVhdmVzIHJ1bGUgcmVnaW9uIGZyb20gdGhlIGJvdHRvbSBib3JkZXJcclxuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgb25TY3JvbGw6IGZ1bmN0aW9uKGVsZW1lbnQsIG9mZnNldCwgbGVuZ3RoKXt9ICAvLyBjYWxsYmFjayBvbiBzY3JvbGwgZXZlbnQgd2hpbGUgVFNCIGlzIGluIHRoZSBydWxlIHJlZ2lvblxyXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBvZmZzZXQgLSBpcyB0aGUgb2Zmc2V0IChweCkgb2YgdGhlIFRTQiBmcm9tIHRoZSBydWxlIHJlZ2lvbiB0b3AgYm9yZGVyXHJcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGxlbmd0aCAtIGlzIHRoZSBydWxlIHJlZ2lvbiBzaXplIChweClcclxuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgb25EaXJlY3Rpb25DaGFuZ2VkOiBmdW5jdGlvbihlbGVtZW50LCBkaXJlY3Rpb24pe31cclxuICAgICAgICAvLyAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgIC8vICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgZnJvbTogc2VhcmNoRm9ybU1haW4ub2Zmc2V0KCkudG9wLFxyXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICAgICBhbGlhczogJ3NlYXJjaGZvcm0nLFxyXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICAgICBjc3M6IG51bGwsLy97J2Rpc3BsYXknOiAnYmxvY2snfSxcclxuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgYWRkQ2xhc3M6IG51bGwsXHJcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgICAgIHJlbW92ZUNsYXNzOiBudWxsLFxyXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICAgICBvbkNoZWNrSW46IGZ1bmN0aW9uKGVsZW1lbnQpe1xyXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5zaG93KCdmYWRlJywgMzAwKTtcclxuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgIHNlYXJjaElucHV0VG9wLnZhbChzZWFyY2hJbnB1dE1haW4udmFsKCkpO1xyXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICAgICBvbkNoZWNrT3V0OiBmdW5jdGlvbihlbGVtZW50KXt9XHJcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgIC8vICAgICAgICAgICAgXVxyXG4gICAgICAgIC8vICAgICAgICB9XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICBzY3Jvb2xseS5faXNPYmplY3QgPSBmdW5jdGlvbiAodmFsKSB7XHJcbiAgICAgICAgcmV0dXJuIHR5cGVvZiB2YWwgPT09ICdvYmplY3QnO1xyXG4gICAgfTtcclxuXHJcbiAgICBzY3Jvb2xseS5faXNBcnJheSA9IGZ1bmN0aW9uICh2YWwpIHtcclxuICAgICAgICByZXR1cm4gdmFsIGluc3RhbmNlb2YgQXJyYXk7XHJcbiAgICB9O1xyXG5cclxuICAgIHNjcm9vbGx5Ll9pc051bWJlciA9IGZ1bmN0aW9uICh2YWwpIHtcclxuICAgICAgICByZXR1cm4gdmFsIGluc3RhbmNlb2YgTnVtYmVyIHx8IHR5cGVvZiB2YWwgPT09ICdudW1iZXInO1xyXG4gICAgfTtcclxuXHJcbiAgICBzY3Jvb2xseS5faXNTdHJpbmcgPSBmdW5jdGlvbiAodmFsKSB7XHJcbiAgICAgICAgcmV0dXJuIHZhbCBpbnN0YW5jZW9mIFN0cmluZyB8fCB0eXBlb2YgdmFsID09PSAnc3RyaW5nJztcclxuICAgIH07XHJcblxyXG4gICAgc2Nyb29sbHkuX2RlZmF1bHQgPSBmdW5jdGlvbiAob2JqLCBrZXksIGRlZmF1bHRWYWx1ZSkge1xyXG4gICAgICAgIGlmIChkZWZhdWx0VmFsdWUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBkZWZhdWx0VmFsdWUgPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgcGFydHMgPSAoa2V5ICsgJycpLnNwbGl0KCcuJyk7XHJcbiAgICAgICAgaWYgKG9iaiAmJiAoc2Nyb29sbHkuX2lzT2JqZWN0KG9iaikgfHwgc2Nyb29sbHkuX2lzQXJyYXkob2JqKSkpIHtcclxuICAgICAgICAgICAgdmFyIHJvb3QgPSBvYmosXHJcbiAgICAgICAgICAgICAgICBwYXJ0O1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpIGluIHBhcnRzKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJ0ID0gcGFydHNbaV07XHJcbiAgICAgICAgICAgICAgICBpZiAoKHNjcm9vbGx5Ll9pc09iamVjdChyb290KSB8fCBzY3Jvb2xseS5faXNBcnJheShyb290KSkgJiYgcm9vdFtwYXJ0XSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcm9vdCA9IHJvb3RbcGFydF07XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkZWZhdWx0VmFsdWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHJvb3Q7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZGVmYXVsdFZhbHVlO1xyXG4gICAgICAgIC8vICAgICAgICByZXR1cm4gXy5lbXB0eShvYmpba2V5XSk/ZGVmYXVsdFZhbHVlOm9ialtrZXldO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFBhcnNlIHJ1bGUgYm91bmRyeVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGJvdW5kcnkgLSAnW2FuY2hvcl0gW29mZnNldF0gPSBbdmllcG9ydCBhbmNob3JdIFtvZmZzZXRdJ1xyXG4gICAgICogQHJldHVybiB7b2JqZWN0fSAtIHBhcnNlZCBib3VuZHJ5XHJcbiAgICAgKi9cclxuICAgIHNjcm9vbGx5LnBhcnNlQ29vcmRzID0gZnVuY3Rpb24gKGJvdW5kcnkpIHtcclxuICAgICAgICB2YXIgc3RyaW5ncyA9IGJvdW5kcnkuc3BsaXQoL1xccyo9XFxzKi8pLFxyXG4gICAgICAgICAgICBjb29yZFJlbCA9IHN0cmluZ3NbMF0gfHwgJ2RvYy10b3AnLFxyXG4gICAgICAgICAgICBwYXJzZWRDb29yZFJlbCA9IHNjcm9vbGx5LnBhcnNlQ29vcmQoY29vcmRSZWwpLFxyXG4gICAgICAgICAgICBjb29yZFZQID0gc3RyaW5nc1sxXSB8fCBwYXJzZWRDb29yZFJlbC5hbmNob3IsXHJcbiAgICAgICAgICAgIHBhcnNlZENvb3JkVlAgPSBzY3Jvb2xseS5wYXJzZUNvb3JkKGNvb3JkVlApO1xyXG5cclxuICAgICAgICByZXR1cm4gW3BhcnNlZENvb3JkUmVsLCBwYXJzZWRDb29yZFZQXTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBQYXJzZSBydWxlIGNvb3JkIHBhcnRcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb29yZCAtICdbYW5jaG9yXSBbb2Zmc2V0XSdcclxuICAgICAqIEByZXR1cm4ge29iamVjdH0gLSBwYXJzZWQgYm91bmRyeVxyXG4gICAgICovXHJcbiAgICBzY3Jvb2xseS5wYXJzZUNvb3JkID0gZnVuY3Rpb24gKGNvb3JkKSB7XHJcbiAgICAgICAgdmFyIHJlQW5jaG9yID0gLygodnB8ZG9jfGVsfGNvbiktKT8odG9wfGNlbnRlcnxib3R0b20pPy9pLFxyXG4gICAgICAgICAgICByZU9mZnNldFN0ciA9ICcoXFxcXCt8LSk/XFxcXHMqKFxcXFxkKykoXFxcXCV8dnB8ZG9jfGVsfGNvbik/JyxcclxuICAgICAgICAgICAgcmVPZmZzZXQgPSBuZXcgUmVnRXhwKHJlT2Zmc2V0U3RyLCAnZ2knKSxcclxuICAgICAgICAgICAgbUEgPSBjb29yZC5tYXRjaChyZUFuY2hvciksXHJcbiAgICAgICAgICAgIG1PID0gY29vcmQubWF0Y2gocmVPZmZzZXQpO1xyXG5cclxuICAgICAgICBpZiAoIW1BICYmICFtTykge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgc3ViamVjdCA9IG1BWzFdID8gbUFbMl0gOiAndnAnLFxyXG4gICAgICAgICAgICBhbmNob3IgPSBtQVszXSB8fCAndG9wJyxcclxuICAgICAgICAgICAgb2Zmc2V0cyA9IFtdO1xyXG5cclxuICAgICAgICBpZiAobU8pIHtcclxuICAgICAgICAgICAgcmVPZmZzZXQgPSBuZXcgUmVnRXhwKHJlT2Zmc2V0U3RyLCAnaScpO1xyXG4gICAgICAgICAgICB2YXIgb2Zmc2V0U3RyLFxyXG4gICAgICAgICAgICAgICAgbU8yLFxyXG4gICAgICAgICAgICAgICAgc2lnbixcclxuICAgICAgICAgICAgICAgIG9mZnNldCxcclxuICAgICAgICAgICAgICAgIG9mZnNldFN1YmplY3Q7XHJcblxyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1PLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBvZmZzZXRTdHIgPSBtT1tpXTtcclxuICAgICAgICAgICAgICAgIG1PMiA9IG9mZnNldFN0ci5tYXRjaChyZU9mZnNldCk7XHJcbiAgICAgICAgICAgICAgICBzaWduID0gbU8yWzFdICYmIG1PMlsxXSA9PT0gJy0nID8gLTEgOiAxO1xyXG4gICAgICAgICAgICAgICAgb2Zmc2V0ID0gbU8yWzJdICYmIHBhcnNlSW50KG1PMlsyXSkgKiBzaWduIHx8IDA7XHJcbiAgICAgICAgICAgICAgICBvZmZzZXRTdWJqZWN0ID0gJ3B4JztcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAobU8yWzNdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0U3ViamVjdCA9IG1PMlszXSA9PT0gJyUnID8gc3ViamVjdCA6IG1PMlszXTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBvZmZzZXRzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldDogb2Zmc2V0LFxyXG4gICAgICAgICAgICAgICAgICAgIHN1YmplY3Q6IG9mZnNldFN1YmplY3RcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIG9yaWdpbmFsOiBjb29yZCxcclxuICAgICAgICAgICAgc3ViamVjdDogc3ViamVjdCxcclxuICAgICAgICAgICAgYW5jaG9yOiBhbmNob3IsXHJcbiAgICAgICAgICAgIG9mZnNldHM6IG9mZnNldHNcclxuICAgICAgICB9O1xyXG5cclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDYWxjdWxhdGUgY29vcmQgcG9zaXRpb24gdG93YXJkcyB0b3Agb2YgdGhlIGRvY3VtZW50XHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29vcmQgLSAnW2FuY2hvcl0gW29mZnNldF0nXHJcbiAgICAgKiBAcGFyYW0ge2pRdWVyeShlbGVtZW50KX0gJGVsZW1lbnRcclxuICAgICAqIEBwYXJhbSB7alF1ZXJ5KGNvbnRhaW5lcil9ICRjb250YWluZXJcclxuICAgICAqIEByZXR1cm4ge29iamVjdH0gLSBwYXJzZWQgYm91bmRyeVxyXG4gICAgICovXHJcbiAgICBzY3Jvb2xseS5jYWxjdWxhdGVDb29yZCA9IGZ1bmN0aW9uIChjb29yZCwgJGVsZW1lbnQsICRjb250YWluZXIpIHtcclxuICAgICAgICBpZiAoc2Nyb29sbHkuX2lzU3RyaW5nKGNvb3JkKSkge1xyXG4gICAgICAgICAgICBjb29yZCA9IHNjcm9vbGx5LnBhcnNlQ29vcmQoY29vcmQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHN1YmplY3RDb29yZCA9IDA7XHJcbiAgICAgICAgaWYgKCd2cCcgPT09IGNvb3JkLnN1YmplY3QpIHtcclxuICAgICAgICAgICAgc3dpdGNoIChjb29yZC5hbmNob3IpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ3RvcCc6XHJcbiAgICAgICAgICAgICAgICAgICAgc3ViamVjdENvb3JkID0gc2Nyb29sbHkuc2Nyb2xsVG9wO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnY2VudGVyJzpcclxuICAgICAgICAgICAgICAgICAgICBzdWJqZWN0Q29vcmQgPSBzY3Jvb2xseS5zY3JvbGxDZW50ZXI7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdib3R0b20nOlxyXG4gICAgICAgICAgICAgICAgICAgIHN1YmplY3RDb29yZCA9IHNjcm9vbGx5LnNjcm9sbEJvdHRvbTtcclxuICAgICAgICAgICAgICAgICAgICBicmVha1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIGlmICgnZG9jJyA9PT0gY29vcmQuc3ViamVjdCkge1xyXG4gICAgICAgICAgICBzd2l0Y2ggKGNvb3JkLmFuY2hvcikge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAndG9wJzpcclxuICAgICAgICAgICAgICAgICAgICBzdWJqZWN0Q29vcmQgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnY2VudGVyJzpcclxuICAgICAgICAgICAgICAgICAgICBzdWJqZWN0Q29vcmQgPSBzY3Jvb2xseS5kb2NNaWRkbGU7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdib3R0b20nOlxyXG4gICAgICAgICAgICAgICAgICAgIHN1YmplY3RDb29yZCA9IHNjcm9vbGx5LmRvY0hlaWdodDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHZhciAkc3ViamVjdCA9ICdjb24nID09PSBjb29yZC5zdWJqZWN0ID8gJGNvbnRhaW5lciA6ICRlbGVtZW50LFxyXG4gICAgICAgICAgICAgICAgc3ViamVjdEhlaWdodCA9ICRzdWJqZWN0Lm91dGVySGVpZ2h0KCksXHJcbiAgICAgICAgICAgICAgICBzdWJqZWN0VG9wID0gJHN1YmplY3Qub2Zmc2V0KCkudG9wLFxyXG4gICAgICAgICAgICAgICAgc3ViamVjdEJvdHRvbSA9IHN1YmplY3RUb3AgKyBzdWJqZWN0SGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgc3ViamVjdENlbnRlciA9IHN1YmplY3RUb3AgKyBNYXRoLmZsb29yKHN1YmplY3RIZWlnaHQgLyAyKTtcclxuXHJcbiAgICAgICAgICAgIHN3aXRjaCAoY29vcmQuYW5jaG9yKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICd0b3AnOlxyXG4gICAgICAgICAgICAgICAgICAgIHN1YmplY3RDb29yZCA9IHN1YmplY3RUb3A7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdjZW50ZXInOlxyXG4gICAgICAgICAgICAgICAgICAgIHN1YmplY3RDb29yZCA9IHN1YmplY3RDZW50ZXI7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdib3R0b20nOlxyXG4gICAgICAgICAgICAgICAgICAgIHN1YmplY3RDb29yZCA9IHN1YmplY3RCb3R0b207XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBpLCBvLCBzdWJqZWN0T2Zmc2V0LCByZWxhdGl2ZUhlaWdodDtcclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY29vcmQub2Zmc2V0cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBvID0gY29vcmQub2Zmc2V0c1tpXTtcclxuICAgICAgICAgICAgc3ViamVjdE9mZnNldCA9IG8ub2Zmc2V0O1xyXG5cclxuICAgICAgICAgICAgaWYgKCdweCcgIT09IG8uc3ViamVjdCkge1xyXG4gICAgICAgICAgICAgICAgcmVsYXRpdmVIZWlnaHQgPSAwO1xyXG4gICAgICAgICAgICAgICAgc3dpdGNoIChvLnN1YmplY3QpIHtcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICd2cCc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbGF0aXZlSGVpZ2h0ID0gc2Nyb29sbHkud2luSGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdkb2MnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZWxhdGl2ZUhlaWdodCA9IHNjcm9vbGx5LmRvY0hlaWdodDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnZWwnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZWxhdGl2ZUhlaWdodCA9ICRlbGVtZW50Lm91dGVySGVpZ2h0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2Nvbic6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbGF0aXZlSGVpZ2h0ID0gJGNvbnRhaW5lci5vdXRlckhlaWdodCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBzdWJqZWN0T2Zmc2V0ID0gTWF0aC5jZWlsKG8ub2Zmc2V0IC8gMTAwICogcmVsYXRpdmVIZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgLy8gICAgICAgICAgICAgICAgY29uc29sZS5sb2coc3ViamVjdE9mZnNldCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc3ViamVjdENvb3JkICs9IHN1YmplY3RPZmZzZXQ7XHJcbiAgICAgICAgfVxyXG5cclxuLy8gICAgICAgIGNvbnNvbGUuZGlyKHsnY29tcHV0ZWQnOnthZ3M6IGFyZ3VtZW50cywgcmVzOiBzdWJqZWN0Q29vcmR9fSk7XHJcblxyXG4gICAgICAgIHJldHVybiBzdWJqZWN0Q29vcmQ7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2FsY3VsYXRlIGhvdyBtdWNoIHdlIHNob3VsZCBzY3JvbGwgZG93biB0aWxsIGJvdW5kcnlcclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjb29yZHNcclxuICAgICAqIEBwYXJhbSB7JChET01ub2RlKX0gJGVsZW1lbnRcclxuICAgICAqIEBwYXJhbSB7JChET01ub2RlKX0gJGNvbnRhaW5lclxyXG4gICAgICogQHJldHVybnMge2ludGVnZXJ9IGhvdyBtdWNoIHdlIHNob3VsZCBzY3JvbGwgZG93biB0aWxsIGJvdW5kcnlcclxuICAgICAqL1xyXG4gICAgc2Nyb29sbHkuY21wQ29vcmRzID0gZnVuY3Rpb24gKGNvb3JkcywgJGVsZW1lbnQsICRjb250YWluZXIpIHtcclxuICAgICAgICByZXR1cm4gc2Nyb29sbHkuY2FsY3VsYXRlQ29vcmQoY29vcmRzWzBdLCAkZWxlbWVudCwgJGNvbnRhaW5lcikgLSBzY3Jvb2xseS5jYWxjdWxhdGVDb29yZChjb29yZHNbMV0sICRlbGVtZW50LCAkY29udGFpbmVyKTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDaGVjayBpZiBydWxlIGlzIGFjdGl2ZVxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHJ1bGVcclxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59XHJcbiAgICAgKi9cclxuICAgIHNjcm9vbGx5LmlzUnVsZUluQWN0aXZlV2lkdGhSYW5nZSA9IGZ1bmN0aW9uIChydWxlKSB7XHJcbiAgICAgICAgdmFyIGZyb21YID0gc2Nyb29sbHkuX2RlZmF1bHQocnVsZSwgJ21pbldpZHRoJywgMCksXHJcbiAgICAgICAgICAgIHRvWCA9IHNjcm9vbGx5Ll9kZWZhdWx0KHJ1bGUsICdtYXhXaWR0aCcsICdpbmZpbml0eScpLFxyXG4gICAgICAgICAgICBtZXRlciA9IHNjcm9vbGx5Ll9kZWZhdWx0KHNjcm9vbGx5Lm9wdGlvbnMsICdtZXRlcicpLFxyXG4gICAgICAgICAgICB3aWR0aCA9ICQod2luZG93KS53aWR0aCgpLFxyXG4gICAgICAgICAgICBtaW5XaWR0aFNjcm9sbHksXHJcbiAgICAgICAgICAgIG1heFdpZHRoU2Nyb2xseSxcclxuICAgICAgICAgICAgY2hlY2tpbldpZHRoO1xyXG5cclxuICAgICAgICBpZiAobWV0ZXIubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIG1pbldpZHRoU2Nyb2xseSA9IG1ldGVyLmxlbmd0aCA/IHBhcnNlSW50KG1ldGVyLmNzcygnbWluLXdpZHRoJykpIDogMDtcclxuICAgICAgICAgICAgbWF4V2lkdGhTY3JvbGx5ID0gbWV0ZXIubGVuZ3RoID8gbWV0ZXIuY3NzKCdtYXgtd2lkdGgnKSA6ICdub25lJztcclxuICAgICAgICAgICAgbWF4V2lkdGhTY3JvbGx5ID0gbWF4V2lkdGhTY3JvbGx5ID09PSAnbm9uZScgPyAnaW5maW5pdHknIDogcGFyc2VJbnQobWF4V2lkdGhTY3JvbGx5KTtcclxuICAgICAgICAgICAgY2hlY2tpbldpZHRoID0gZnJvbVggPD0gbWluV2lkdGhTY3JvbGx5ICYmICh0b1ggPT09ICdpbmZpbml0eScgfHwgdG9YID49IG1heFdpZHRoU2Nyb2xseSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gY2hlY2tpbldpZHRoO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGZyb21YIDwgd2lkdGggJiYgKHRvWCA9PT0gJ2luZmluaXR5JyB8fCB0b1ggPj0gd2lkdGgpO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIENoZWNrIGlmIHJ1bGUgaXMgYWN0aXZlXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHJ1bGVcclxuICAgICAqIEBwYXJhbSB7JChET01ub2RlKX0gJGVsZW1lbnRcclxuICAgICAqIEBwYXJhbSB7JChET01ub2RlKXxTdHJpbmd9ICRjb250YWluZXIgZGVzY3JpcHRpb25cclxuICAgICAqIEByZXR1cm5zIHtib29sZWFufG9iamVjdH0gZmFsc2UgaWYgcnVsZSBpcyBub3QgYWN0aXZlIG9yIHNjcm9sbGluZyBwYXJhbXMgaW5zdGVhZFxyXG4gICAgICoge1xyXG5cdCAqICAgICAgb2Zmc2V0OiBob3cgbWFueSBwaXhlbHMgc2luY2UgdG9wIGJvdW5kcnkgd2VyZSBzY3JvbGxlZFxyXG5cdCAqICAgICAgbGVuZ3RoOiB0b3RhbCBsZW5ndGggb2YgdGhlIHJlZ2lvbiBpbiBwaXNlbHNcclxuXHQgKiB9XHJcbiAgICAgKi9cclxuICAgIHNjcm9vbGx5LmlzUnVsZUFjdGl2ZSA9IGZ1bmN0aW9uIChydWxlLCAkZWxlbWVudCwgJGNvbnRhaW5lcikge1xyXG4gICAgICAgIHZhciBjaGVja2luV2lkdGggPSBzY3Jvb2xseS5pc1J1bGVJbkFjdGl2ZVdpZHRoUmFuZ2UocnVsZSk7XHJcbiAgICAgICAgaWYgKCFjaGVja2luV2lkdGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHJ1bGVEaXJlY3Rpb24gPSBzY3Jvb2xseS5fZGVmYXVsdChydWxlLCAnZGlyZWN0aW9uJywgMCksXHJcbiAgICAgICAgICAgIHNjcm9sbERpcmVjdGlvbiA9IHNjcm9vbGx5LmRpcmVjdGlvbjtcclxuXHJcbiAgICAgICAgaWYgKHJ1bGVEaXJlY3Rpb24gJiYgKHJ1bGVEaXJlY3Rpb24gPiAwICYmIHNjcm9sbERpcmVjdGlvbiA8IDAgfHwgcnVsZURpcmVjdGlvbiA8IDAgJiYgc2Nyb2xsRGlyZWN0aW9uID49IDApKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBmcm9tWSA9IHNjcm9vbGx5Ll9kZWZhdWx0KHJ1bGUsICdmcm9tJywgJzAnKSxcclxuICAgICAgICAgICAgdG9ZID0gc2Nyb29sbHkuX2RlZmF1bHQocnVsZSwgJ3RvJywgJ2ZpbmlzaCcpO1xyXG5cclxuICAgICAgICB2YXIgdG9Ub3AgPSBzY3Jvb2xseS5jbXBDb29yZHMoZnJvbVksICRlbGVtZW50LCAkY29udGFpbmVyKTtcclxuICAgICAgICBpZiAodG9Ub3AgPiAwKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciB0b0JvdHRvbSA9IHNjcm9vbGx5LmNtcENvb3Jkcyh0b1ksICRlbGVtZW50LCAkY29udGFpbmVyKTtcclxuICAgICAgICBpZiAodG9Cb3R0b20gPD0gMCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBvZmZzZXQ6IC10b1RvcCxcclxuICAgICAgICAgICAgbGVuZ3RoOiB0b0JvdHRvbSAtIHRvVG9wXHJcbiAgICAgICAgfTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBZGQgZWxsZW1lbnQgd2l0aCBpdHMgcnVsZXMgdG8gc2Nyb2xsIGxheW91dFxyXG4gICAgICogU2VlIHRoZSBjb21tZW50ZWQgc2FtcGxlIGFib3ZlIGZvciB0aGUgcnVsZXMgc3ludGF4XHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkXHJcbiAgICAgKiBAcGFyYW0geyQoRE9Nbm9kZSl9ICRlbGVtZW50XHJcbiAgICAgKiBAcGFyYW0ge2FycmF5fSBydWxlc1xyXG4gICAgICogQHBhcmFtIHskKERPTW5vZGUpfSAkY29udGFpbmVyIGRlc2NyaXB0aW9uXHJcbiAgICAgKi9cclxuICAgIHNjcm9vbGx5LmFkZEl0ZW0gPSBmdW5jdGlvbiAoaWQsICRlbGVtZW50LCBydWxlcywgJGNvbnRhaW5lcikge1xyXG4gICAgICAgIGlmICghJGVsZW1lbnQubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgICRjb250YWluZXIgPSAkY29udGFpbmVyIHx8ICdzZWxmJztcclxuXHJcbiAgICAgICAgdmFyIHJ1bGUsXHJcbiAgICAgICAgICAgIGlzQWJzb2x1dGUsXHJcbiAgICAgICAgICAgIGZyb21ZLFxyXG4gICAgICAgICAgICB0b1ksXHJcbiAgICAgICAgICAgIGZyb21Dc3MsXHJcbiAgICAgICAgICAgIHRvQ3NzLFxyXG4gICAgICAgICAgICBjc3NPblNjcm9sbFxyXG5cclxuICAgICAgICBmb3IgKHZhciBpIGluIHJ1bGVzKSB7XHJcbiAgICAgICAgICAgIHJ1bGUgPSBydWxlc1tpXTtcclxuXHJcbiAgICAgICAgICAgIGlzQWJzb2x1dGUgPSAhJGNvbnRhaW5lcjsvLz90cnVlOmZhbHNlO1xyXG5cclxuICAgICAgICAgICAgZnJvbVkgPSBzY3Jvb2xseS5fZGVmYXVsdChydWxlLCAnZnJvbScsICdkb2MtdG9wJyk7XHJcblxyXG4gICAgICAgICAgICBpZiAoc2Nyb29sbHkuX2lzU3RyaW5nKGZyb21ZKSB8fCBzY3Jvb2xseS5faXNOdW1iZXIoZnJvbVkpKSB7XHJcbiAgICAgICAgICAgICAgICBmcm9tWSA9IHNjcm9vbGx5LnBhcnNlQ29vcmRzKCcnICsgZnJvbVkpO1xyXG4gICAgICAgICAgICAgICAgcnVsZS5mcm9tID0gZnJvbVk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRvWSA9IHNjcm9vbGx5Ll9kZWZhdWx0KHJ1bGUsICd0bycsICdkb2MtYm90dG9tJyk7XHJcblxyXG4gICAgICAgICAgICBpZiAoc2Nyb29sbHkuX2lzU3RyaW5nKHRvWSkgfHwgc2Nyb29sbHkuX2lzTnVtYmVyKHRvWSkpIHtcclxuICAgICAgICAgICAgICAgIHRvWSA9IHNjcm9vbGx5LnBhcnNlQ29vcmRzKCcnICsgdG9ZKTtcclxuXHJcbiAgICAgICAgICAgICAgICBydWxlLnRvID0gdG9ZO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmcm9tQ3NzID0gc2Nyb29sbHkuX2RlZmF1bHQocnVsZSwgJ2Nzc0Zyb20nKTtcclxuICAgICAgICAgICAgdG9Dc3MgPSBzY3Jvb2xseS5fZGVmYXVsdChydWxlLCAnY3NzVG8nKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChmcm9tQ3NzICYmIHRvQ3NzKSB7XHJcbiAgICAgICAgICAgICAgICBjc3NPblNjcm9sbCA9IGZ1bmN0aW9uIChlbGVtZW50LCBvZmZzZXQsIGxlbmd0aCwgcnVsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwcm9ncmVzcyA9IG9mZnNldCAvIGxlbmd0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZnJvbUNzcyA9IHNjcm9vbGx5Ll9kZWZhdWx0KHJ1bGUsICdjc3NGcm9tJyksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvQ3NzID0gc2Nyb29sbHkuX2RlZmF1bHQocnVsZSwgJ2Nzc1RvJyksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNzcyA9IHt9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmcm9tUHJvcCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdG9Qcm9wO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBwcm9wZXJ0eSBpbiBmcm9tQ3NzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZyb21Qcm9wID0gZnJvbUNzc1twcm9wZXJ0eV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvUHJvcCA9IHNjcm9vbGx5Ll9kZWZhdWx0KHRvQ3NzLCBwcm9wZXJ0eSwgZnJvbVByb3ApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjc3NbcHJvcGVydHldID0gc2Nyb29sbHkuZ2V0VHJhbnNpdGlvblZhbHVlKGZyb21Qcm9wLCB0b1Byb3AsIHByb2dyZXNzKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuY3NzKHNjcm9vbGx5LmV4dGVuZENzc1dpdGhQcmVmaXgoY3NzKSk7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIHJ1bGUuY3NzT25TY3JvbGwgPSBjc3NPblNjcm9sbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoJGVsZW1lbnQubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICAkZWxlbWVudC5lYWNoKGZ1bmN0aW9uIChpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY2xvbmVkUnVsZXMgPSBbXSxcclxuICAgICAgICAgICAgICAgICAgICBydWxlLFxyXG4gICAgICAgICAgICAgICAgICAgIGNsb25lZFJ1bGUsXHJcbiAgICAgICAgICAgICAgICAgICAgJGNvbiA9IG51bGw7XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBydWxlcy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHJ1bGUgPSBydWxlc1tqXTtcclxuICAgICAgICAgICAgICAgICAgICBjbG9uZWRSdWxlID0ge307XHJcbiAgICAgICAgICAgICAgICAgICAgJC5leHRlbmQoY2xvbmVkUnVsZSwgcnVsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xvbmVkUnVsZXMucHVzaChjbG9uZWRSdWxlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoJGNvbnRhaW5lcikge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICgkY29udGFpbmVyID09PSAnc2VsZicpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJGNvbiA9ICRjb250YWluZXI7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJGNvbiA9ICRjb250YWluZXIubGVuZ3RoID4gMSAmJiBpIDwgJGNvbnRhaW5lci5sZW5ndGggPyAkKCRjb250YWluZXJbaV0pIDogJGNvbnRhaW5lcjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgc2Nyb29sbHkuYWRkSXRlbShpZCArICctJyArIGksICQodGhpcyksIGNsb25lZFJ1bGVzLCAkY29uKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGl0ZW0gPSBzY3Jvb2xseS5fZGVmYXVsdChzY3Jvb2xseS5zY3JvbGxMYXlvdXQsIGlkKTtcclxuICAgICAgICBpZiAoaXRlbSkge1xyXG4gICAgICAgICAgICBpdGVtLnJ1bGVzLmNvbmNhdChydWxlcyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgc2Nyb29sbHkuc2Nyb2xsTGF5b3V0W2lkXSA9IHtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQ6ICRlbGVtZW50LFxyXG4gICAgICAgICAgICAgICAgY29udGFpbmVyOiAkY29udGFpbmVyLFxyXG4gICAgICAgICAgICAgICAgcnVsZXM6IHJ1bGVzXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfTtcclxuXHJcbiAgICBzY3Jvb2xseS5mYWN0b3J5ID0gZnVuY3Rpb24gKCRlbGVtZW50LCBydWxlcywgJGNvbnRhaW5lciwgaWQpIHtcclxuICAgICAgICBzY3Jvb2xseS5pbml0KCk7XHJcblxyXG4gICAgICAgIGlmICghJGVsZW1lbnQubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghcnVsZXMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWQgPSBpZCB8fCAkZWxlbWVudFswXS50YWdOYW1lICsgJ18nICsgT2JqZWN0LmtleXMoc2Nyb29sbHkuc2Nyb2xsTGF5b3V0KS5sZW5ndGg7XHJcbiAgICAgICAgc2Nyb29sbHkuYWRkSXRlbShpZCwgJGVsZW1lbnQsIHJ1bGVzLCAkY29udGFpbmVyLCBmYWxzZSk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRml4IERPTSBlbGVtZW50IGluIE5PTi1SZXNwb25zaXZlIChub24gdmlld3BvcnQgd2lkdGggZGVwZW5kZW50KSBsYXlvdXQuXHJcbiAgICAgKiBXaGVuIGFwcGxpZWQsIERPTW5vZGUgaXMgZml4ZWQgd2hlbiBUU0IgaXMgd2l0aGluXHJcbiAgICAgKiAobm9kZSdzIHRvcCBib3JkZXIgLSBvZmZzZXRUb3ApIGFuZCAoJGJvdHRvbUNvbnRhaW5lcidzIGJvdHRvbSBib3JkZXIgLSBvZmZzZXRCb3R0b20pXHJcbiAgICAgKiBhbmQgdW5maXhlZCB3aGVuIFRTQiBpcyBvdXQgb2YgdGhlIHJlZ2lvblxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSBzdHJpbmcgaWRcclxuICAgICAqIEBwYXJhbSAkKERPTW5vZGUpICRlbGVtZW50XHJcbiAgICAgKiBAcGFyYW0gb2JqZWN0IHBhcmFtczoge1xyXG5cdCAqICAgICAgJGJvdHRvbUNvbnRhaW5lciAtICQoRE9Nbm9kZSkgd2hpY2ggcmVzdHJpY3RzIGZpeCBmcm9tIHRoZSBib3R0b20sXHJcblx0ICogICAgICAgICAgJzxib2R5PicgYnkgZGVmYXVsdCxcclxuXHQgKiAgICAgICAgICAnbmV4dCcgbWVhbnMgdGhlIG5leHQgZG9tIHNpYmxpbmcgJGVsZW1lbnQubmV4dCgpXHJcblx0ICogICAgICAgICAgJ3BhcmVudCcgbWVhbnMgJGVsZW1lbnQucGFyZW50KClcclxuXHQgKiAgICAgIG1vZGUgLSBzZXRzIHRoZSBtb2RlIG9mIGFkZGluZyBuZWVkZWQgd2hpdGUgc3BhY2UgdG8gJGJvdHRvbUNvbnRhaW5lclxyXG5cdCAqICAgICAgICAgIHdoZW4gJGVsZW1lbnQgaXMgZml4ZWRcclxuXHQgKiAgICAgICAgICAnbWFyZ2luJyBtZWFucyBtYXJnaW4tdG9wPSRlbGVtZW50LmhlaWdodCgpIHdpbCBiZSBhZGRlZCB0byAkYm90dG9tQ29udGFpbmVyXHJcblx0ICogICAgICAgICAgJ3BhZGRpbmcnIG1lYW5zIHBhZGRpbmctdG9wPSRlbGVtZW50LmhlaWdodCgpIHdpbCBiZSBhZGRlZCB0byAkYm90dG9tQ29udGFpbmVyXHJcblx0ICogICAgICBvZmZzZXRUb3AgLSB0b3Agb2Zmc2V0IHRoYXQgaXMgbGVmdCBiZWZvcmUgZml4ZWQgZWxlbWVudCB3aGVuIGZpeGVkXHJcblx0ICogICAgICBvZmZzZXRCb3R0b20gLSBib3R0b20gb2Zmc2V0IGxlZnQgYmVmb3JlICRib3R0b21Db250YWluZXJcclxuXHQgKiAgICAgIG1pbldpZHRoLCBtYXhXaWR0aCAtIHZpZXdwb3J0IHdpZHRoIChweCkgYm91bmRyaWVzXHJcblx0ICogICAgICAgICAgaXMgdXNlZCB3aXRoaW4gc3RpY2tJdGVtWFkgZm9yIHJlc3BvbnNpdmUgbGF5b3V0c1xyXG5cdCAqICAgICAgICAgIDAsICdpbmZpbml0eScgYnkgZGVmYXVsdFxyXG5cdCAqICAgICAgc3RhdGljIC1cclxuXHQgKiB9XHJcbiAgICAgKi9cclxuICAgIHNjcm9vbGx5LnN0aWNrSXRlbSA9IGZ1bmN0aW9uIChpZCwgJGVsZW1lbnQsIHBhcmFtcyAvKiRib3R0b21Db250YWluZXIsIG1vZGUsIG9mZnNldFRvcCwgb2Zmc2V0Qm90dG9tKi8pIHtcclxuICAgICAgICBzY3Jvb2xseS5zdGlja0l0ZW1YWShpZCwgJGVsZW1lbnQsIChwYXJhbXMgaW5zdGFuY2VvZiBBcnJheSkgPyBwYXJhbXMgOiBbcGFyYW1zXSk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRml4IERPTSBlbGVtZW50IGluIE5PTi1SZXNwb25zaXZlIChub24gdmlld3BvcnQgd2lkdGggZGVwZW5kZW50KSBsYXlvdXQuXHJcbiAgICAgKiBXaGVuIGFwcGxpZWQsIERPTW5vZGUgaXMgZml4ZWQgd2hlbiBUU0IgaXMgd2l0aGluXHJcbiAgICAgKiAobm9kZSdzIHRvcCBib3JkZXIgLSBvZmZzZXRUb3ApIGFuZCAoJGJvdHRvbUNvbnRhaW5lcidzIGJvdHRvbSBib3JkZXIgLSBvZmZzZXRCb3R0b20pXHJcbiAgICAgKiBhbmQgdW5maXhlZCB3aGVuIFRTQiBpcyBvdXQgb2YgdGhlIHJlZ2lvblxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSBzdHJpbmcgaWRcclxuICAgICAqIEBwYXJhbSAkKERPTW5vZGUpICRlbGVtZW50XHJcbiAgICAgKiBAcGFyYW0gYXJyYXkgcGFyYW1zIC0gYXJyYXkgb2Ygb2JqZWN0cyBkZXNjcmliZWQgaW4gc3RpY2tJdGVtKClcclxuICAgICAqL1xyXG4gICAgc2Nyb29sbHkuc3RpY2tJdGVtWFkgPSBmdW5jdGlvbiAoaWQsICRlbGVtZW50LCBwYXJhbXMgLyokYm90dG9tQ29udGFpbmVyLCBtb2RlLCBvZmZzZXRUb3AsIG9mZnNldEJvdHRvbSovKSB7XHJcbiAgICAgICAgcGFyYW1zID0gcGFyYW1zIHx8IFtdO1xyXG4gICAgICAgIHZhciBydWxlcyA9IFtdLFxyXG4gICAgICAgICAgICB4UmFuZ2UsXHJcbiAgICAgICAgICAgICRib3R0b21Db250YWluZXIsXHJcbiAgICAgICAgICAgIG1vZGUsXHJcbiAgICAgICAgICAgIG9mZnNldFRvcCxcclxuICAgICAgICAgICAgb2Zmc2V0Qm90dG9tLFxyXG4gICAgICAgICAgICBtaW5XaWR0aCxcclxuICAgICAgICAgICAgbWF4V2lkdGgsXHJcbiAgICAgICAgICAgIGlzU3RhdGljXHJcbiAgICAgICAgO1xyXG4gICAgICAgIGZvciAodmFyIHggaW4gcGFyYW1zKSB7XHJcbiAgICAgICAgICAgIHhSYW5nZSA9IHBhcmFtc1t4XTtcclxuICAgICAgICAgICAgJGJvdHRvbUNvbnRhaW5lciA9IHNjcm9vbGx5Ll9kZWZhdWx0KHhSYW5nZSwgJyRib3R0b21Db250YWluZXInLCAkKCdib2R5JykpO1xyXG4gICAgICAgICAgICBtb2RlID0gc2Nyb29sbHkuX2RlZmF1bHQoeFJhbmdlLCAnbW9kZScpO1xyXG4gICAgICAgICAgICBvZmZzZXRUb3AgPSBzY3Jvb2xseS5fZGVmYXVsdCh4UmFuZ2UsICdvZmZzZXRUb3AnLCAwKTtcclxuICAgICAgICAgICAgb2Zmc2V0Qm90dG9tID0gc2Nyb29sbHkuX2RlZmF1bHQoeFJhbmdlLCAnb2Zmc2V0Qm90dG9tJywgMCk7XHJcbiAgICAgICAgICAgIG1pbldpZHRoID0gc2Nyb29sbHkuX2RlZmF1bHQoeFJhbmdlLCAnbWluV2lkdGgnLCAwKTtcclxuICAgICAgICAgICAgbWF4V2lkdGggPSBzY3Jvb2xseS5fZGVmYXVsdCh4UmFuZ2UsICdtYXhXaWR0aCcsICdpbmZpbml0eScpO1xyXG4gICAgICAgICAgICBpc1N0YXRpYyA9IHNjcm9vbGx5Ll9kZWZhdWx0KHhSYW5nZSwgJ3N0YXRpYycsIGZhbHNlKTtcclxuXHJcbiAgICAgICAgICAgIGlmICgnbmV4dCcgPT09ICRib3R0b21Db250YWluZXIpIHtcclxuICAgICAgICAgICAgICAgIG1vZGUgPSBtb2RlIHx8ICdtYXJnaW4nO1xyXG4gICAgICAgICAgICAgICAgJGJvdHRvbUNvbnRhaW5lciA9ICQoJGVsZW1lbnQpLm5leHQoKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmICgncGFyZW50JyA9PT0gJGJvdHRvbUNvbnRhaW5lciB8fCAhJGJvdHRvbUNvbnRhaW5lcikge1xyXG4gICAgICAgICAgICAgICAgbW9kZSA9IG1vZGUgfHwgJ3BhZGRpbmcnO1xyXG4gICAgICAgICAgICAgICAgJGJvdHRvbUNvbnRhaW5lciA9ICQoJGVsZW1lbnQpLnBhcmVudCgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIWlzU3RhdGljKSB7XHJcbiAgICAgICAgICAgICAgICBydWxlcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICBzb3VyY2U6ICdzdGlja3knLFxyXG4gICAgICAgICAgICAgICAgICAgIGFsaWFzOiAndG9wJyxcclxuICAgICAgICAgICAgICAgICAgICBtaW5XaWR0aDogbWluV2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgbWF4V2lkdGg6IG1heFdpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldFRvcDogb2Zmc2V0VG9wLFxyXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldEJvdHRvbTogb2Zmc2V0Qm90dG9tLFxyXG4gICAgICAgICAgICAgICAgICAgIGJvdHRvbUNvbnRhaW5lcjogJGJvdHRvbUNvbnRhaW5lcixcclxuICAgICAgICAgICAgICAgICAgICBtb2RlOiBtb2RlXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHJ1bGVzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIHNvdXJjZTogJ3N0aWNreScsXHJcbiAgICAgICAgICAgICAgICAgICAgYWxpYXM6ICdmaXhlZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgbWluV2lkdGg6IG1pbldpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgIG1heFdpZHRoOiBtYXhXaWR0aCxcclxuICAgICAgICAgICAgICAgICAgICBvZmZzZXRUb3A6IG9mZnNldFRvcCxcclxuICAgICAgICAgICAgICAgICAgICBvZmZzZXRCb3R0b206IG9mZnNldEJvdHRvbSxcclxuICAgICAgICAgICAgICAgICAgICBib3R0b21Db250YWluZXI6ICRib3R0b21Db250YWluZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgbW9kZTogbW9kZVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgcnVsZXMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgc291cmNlOiAnc3RpY2t5JyxcclxuICAgICAgICAgICAgICAgICAgICBhbGlhczogJ2JvdHRvbScsXHJcbiAgICAgICAgICAgICAgICAgICAgbWluV2lkdGg6IG1pbldpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgIG1heFdpZHRoOiBtYXhXaWR0aCxcclxuICAgICAgICAgICAgICAgICAgICBvZmZzZXRUb3A6IG9mZnNldFRvcCxcclxuICAgICAgICAgICAgICAgICAgICBvZmZzZXRCb3R0b206IG9mZnNldEJvdHRvbSxcclxuICAgICAgICAgICAgICAgICAgICBib3R0b21Db250YWluZXI6ICRib3R0b21Db250YWluZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgbW9kZTogbW9kZVxyXG4vLyAgICAgICAgICAgICAgICAgICAgZnJvbTogb2Zmc2V0XzIsXHJcbi8vICAgICAgICAgICAgICAgICAgICBjc3M6IHsncG9zaXRpb24nOiAnYWJzb2x1dGUnLCAndG9wJzoob2Zmc2V0XzIrb2Zmc2V0VG9wKSsncHgnfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBydWxlcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICBzb3VyY2U6ICdzdGlja3knLFxyXG4gICAgICAgICAgICAgICAgICAgIGFsaWFzOiAnc3RhdGljJyxcclxuICAgICAgICAgICAgICAgICAgICBtaW5XaWR0aDogbWluV2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgbWF4V2lkdGg6IG1heFdpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgIGJvdHRvbUNvbnRhaW5lcjogJGJvdHRvbUNvbnRhaW5lclxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNjcm9vbGx5LmFkZEl0ZW0oaWQsICQoJGVsZW1lbnQpLCBydWxlcyk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhpcyBmdW5jdGlvbiBjYWxjdWxhdGVzIGFsbCBydWxlcyBib3VuZHJpZXMgd2hlbiBicm93c2VyIGlzIHJlc2l6ZWQgYW5kXHJcbiAgICAgKiBlbnRlcnMgbmV3IHdpZHRoIHJhbmdlLiBXZSBjYW5ub3QgcHJlY2FsY3VsYXRlIGFsbCBzaXplcyBhcyBkdXJpbmcgd2luZG93XHJcbiAgICAgKiByZXNpemUgc29tZSBlbGVtZW50IGFyZSByZXNpemVkLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7JChET01ub2RlKX0gJGVsZW1lbnRcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBydWxlIC0gc2luZ2xlIHJ1bGVcclxuICAgICAqIEByZXR1cm5zIHtvYmplY3R9IC0gcmVjYWxjdWxhdGVkIHJ1bGVcclxuICAgICAqL1xyXG4gICAgc2Nyb29sbHkucHJvY2Vzc1N0aWNreUl0ZW1SYW5nZSA9IGZ1bmN0aW9uICgkZWxlbWVudCwgcnVsZSkge1xyXG4gICAgICAgIHJ1bGUgPSBydWxlIHx8IHt9O1xyXG5cclxuICAgICAgICB2YXIgJGJvdHRvbUNvbnRhaW5lciA9IHNjcm9vbGx5Ll9kZWZhdWx0KHJ1bGUsICdib3R0b21Db250YWluZXInLCAkKCdib2R5JykpLFxyXG4gICAgICAgICAgICBtb2RlID0gc2Nyb29sbHkuX2RlZmF1bHQocnVsZSwgJ21vZGUnKSxcclxuICAgICAgICAgICAgb2Zmc2V0VG9wID0gc2Nyb29sbHkuX2RlZmF1bHQocnVsZSwgJ29mZnNldFRvcCcsIDApLFxyXG4gICAgICAgICAgICBvZmZzZXRCb3R0b20gPSBzY3Jvb2xseS5fZGVmYXVsdChydWxlLCAnb2Zmc2V0Qm90dG9tJywgMCksXHJcbiAgICAgICAgICAgIGl0ZW1IZWlnaHQgPSBwYXJzZUludCgkZWxlbWVudC5jc3MoJ21hcmdpbi10b3AnKSkgKyAkZWxlbWVudC5oZWlnaHQoKSArIHBhcnNlSW50KCRlbGVtZW50LmNzcygnbWFyZ2luLWJvdHRvbScpKTtcclxuXHJcbiAgICAgICAgaWYgKCRlbGVtZW50LmNzcygnYm94LXNpemluZycpID09PSAnYm9yZGVyLWJveCcpIHtcclxuICAgICAgICAgICAgaXRlbUhlaWdodCArPSBwYXJzZUludCgkZWxlbWVudC5jc3MoJ3BhZGRpbmctdG9wJykpICsgcGFyc2VJbnQoJGVsZW1lbnQuY3NzKCdwYWRkaW5nLWJvdHRvbScpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBib3R0b21Db250YWluZXJIZWlnaHQgPSBwYXJzZUludCgkYm90dG9tQ29udGFpbmVyLmNzcygnbWFyZ2luLXRvcCcpKSArICRib3R0b21Db250YWluZXIuaGVpZ2h0KCkgKyBwYXJzZUludCgkYm90dG9tQ29udGFpbmVyLmNzcygnbWFyZ2luLWJvdHRvbScpKTtcclxuICAgICAgICBpZiAoJGJvdHRvbUNvbnRhaW5lci5jc3MoJ2JveC1zaXppbmcnKSA9PT0gJ2JvcmRlci1ib3gnKSB7XHJcbiAgICAgICAgICAgIGJvdHRvbUNvbnRhaW5lckhlaWdodCArPSBwYXJzZUludCgkYm90dG9tQ29udGFpbmVyLmNzcygncGFkZGluZy10b3AnKSkgKyBwYXJzZUludCgkYm90dG9tQ29udGFpbmVyLmNzcygncGFkZGluZy1ib3R0b20nKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgb2Zmc2V0XzEgPSBNYXRoLnJvdW5kKCRlbGVtZW50Lm9mZnNldCgpLnRvcCAtIHBhcnNlSW50KCRlbGVtZW50LmNzcygnbWFyZ2luLXRvcCcpKSksXHJcbiAgICAgICAgICAgIG9mZnNldF8yID0gTWF0aC5yb3VuZCgkYm90dG9tQ29udGFpbmVyLm9mZnNldCgpLnRvcCArIChib3R0b21Db250YWluZXJIZWlnaHQgLSBpdGVtSGVpZ2h0IC0gb2Zmc2V0Qm90dG9tKSk7XHJcblxyXG4gICAgICAgIHN3aXRjaCAocnVsZS5hbGlhcykge1xyXG4gICAgICAgICAgICBjYXNlICd0b3AnOlxyXG4gICAgICAgICAgICAgICAgcnVsZS5mcm9tID0gMDtcclxuICAgICAgICAgICAgICAgIHJ1bGUudG8gPSBvZmZzZXRfMSAtIG9mZnNldFRvcDtcclxuICAgICAgICAgICAgICAgIHJ1bGUuY3NzID0geydwb3NpdGlvbic6ICdhYnNvbHV0ZScsICd0b3AnOiBvZmZzZXRfMSArICdweCd9O1xyXG4gICAgICAgICAgICAgICAgcnVsZS5pdGVtSGVpZ2h0ID0gaXRlbUhlaWdodDtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnZml4ZWQnOlxyXG4gICAgICAgICAgICAgICAgcnVsZS5mcm9tID0gb2Zmc2V0XzEgLSBvZmZzZXRUb3A7XHJcbiAgICAgICAgICAgICAgICBydWxlLnRvID0gb2Zmc2V0XzI7XHJcbiAgICAgICAgICAgICAgICBydWxlLmNzcyA9IHsncG9zaXRpb24nOiAnZml4ZWQnLCAndG9wJzogb2Zmc2V0VG9wICsgJ3B4J307XHJcbiAgICAgICAgICAgICAgICBydWxlLml0ZW1IZWlnaHQgPSBpdGVtSGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdib3R0b20nOlxyXG4gICAgICAgICAgICAgICAgcnVsZS5mcm9tID0gb2Zmc2V0XzI7XHJcbiAgICAgICAgICAgICAgICBydWxlLmNzcyA9IHsncG9zaXRpb24nOiAnYWJzb2x1dGUnLCAndG9wJzogKG9mZnNldF8yICsgb2Zmc2V0VG9wKSArICdweCd9O1xyXG4gICAgICAgICAgICAgICAgcnVsZS5pdGVtSGVpZ2h0ID0gaXRlbUhlaWdodDtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnc3RhdGljJzpcclxuICAgICAgICAgICAgICAgIHJ1bGUuZnJvbSA9IDA7XHJcbiAgICAgICAgICAgICAgICBydWxlLmNzcyA9IHsncG9zaXRpb24nOiAnJywgJ3RvcCc6ICcnfTtcclxuICAgICAgICAgICAgICAgIHJ1bGUuaXRlbUhlaWdodCA9IDA7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBydWxlO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEhlYWRzIHVwLCB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBvbiB3aW5kb3cgcmVzaXplLiBIb3dldmVyIGV2ZW4gaWYgd2luZG93XHJcbiAgICAgKiBoYXMgZW50ZXJlZCBuZXcgd2lkdGggcmFuZ2UgaXQgZG9lc24ndCBtZWFuIHRoYXQgbmV3IHJlc3BvbnNpdmUgc3R5bGVzIHdlcmVcclxuICAgICAqIGFsbHJlYWR5IGFwcGxpZWQuIFNvIHdlIGNhbm5vdCByZWx5IG9uICQoIHdpbmRvdyApLndpZHRoKCkuIFdoYXQgd2UgY2FuIHJlbHlcclxuICAgICAqIG9uIGFyZSBzdHlsZXMgdGhhdCBhcmUgYXBwbGllZCB0byBzb21lIHByZWRlZmluZWQgZWxlbWVudCBjYWxsZWQgJ21ldGVyJy5cclxuICAgICAqXHJcbiAgICAgKiBIdG1sOiAob3VyIE1ldGVyKVxyXG4gICAgICogPGRpdiBjbGFzcz1cInNjcm9vbGx5XCI+PC9kaXY+XHJcbiAgICAgKlxyXG4gICAgICogQ1NTOlxyXG4gICAgICpcclxuICAgICAqIC5zY3Jvb2xseXtcclxuXHQgKiAgICAgIGRpc3BsYXk6IG5vbmU7XHJcblx0ICogfVxyXG4gICAgICpcclxuICAgICAqIG1lZGlhIChtaW4tZGV2aWNlLXdpZHRoIDogMzIwcHgpIGFuZCAobWF4LWRldmljZS13aWR0aCA6IDQ4MHB4KXtcclxuXHQgKiAgICAgIC5zY3Jvb2xseXtcclxuXHQgKiAgICAgICAgICBtaW4td2lkdGg6IDMyMHB4O1xyXG5cdCAqICAgICAgICAgIG1heC13aWR0aDogNDgwcHg7XHJcblx0ICogICAgICB9XHJcblx0ICogfVxyXG4gICAgICogbWVkaWEgKG1pbi1kZXZpY2Utd2lkdGggOiA0ODFweCkgYW5kIChtYXgtZGV2aWNlLXdpZHRoIDogODAwcHgpe1xyXG5cdCAqICAgICAgLnNjcm9vbGx5e1xyXG5cdCAqICAgICAgICAgIG1pbi13aWR0aDogNDgxcHg7XHJcblx0ICogICAgICAgICAgbWF4LXdpZHRoOiA4MDBweDtcclxuXHQgKiAgICAgIH1cclxuXHQgKiB9XHJcbiAgICAgKlxyXG4gICAgICogSlMgcnVsZXM6XHJcbiAgICAgKlxyXG4gICAgICoge1xyXG5cdCAqICAgICAgbWluV2lkdGg6IDMyMCxcclxuXHQgKiAgICAgIG1heFdpZHRoOiA0ODBcclxuXHQgKiB9LFxyXG4gICAgICoge1xyXG5cdCAqICAgICAgbWluV2lkdGg6IDQ4MCxcclxuXHQgKiAgICAgIG1heFdpZHRoOiA4MDBcclxuXHQgKiB9XHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge0Jvb2xlYW59XHJcbiAgICAgKi9cclxuICAgIHNjcm9vbGx5Lm9uUmVzaXplID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHNjcm9vbGx5LndpbkhlaWdodCA9ICQod2luZG93KS5oZWlnaHQoKTtcclxuICAgICAgICAvLyAgICAgICAgc2Nyb29sbHkuZG9jSGVpZ2h0ID0gJChkb2N1bWVudCkuaGVpZ2h0KCk7XHJcbiAgICAgICAgc2Nyb29sbHkuZG9jSGVpZ2h0ID0gc2Nyb29sbHkuYm9keS5oZWlnaHQoKTtcclxuICAgICAgICBzY3Jvb2xseS5kb2NNaWRkbGUgPSBNYXRoLmZsb29yKHNjcm9vbGx5LmRvY0hlaWdodCAvIDIpO1xyXG5cclxuICAgICAgICB2YXIgbmVlZFNjcm9sbCA9IGZhbHNlO1xyXG5cclxuICAgICAgICBmb3IgKHZhciBpZCBpbiBzY3Jvb2xseS5zY3JvbGxMYXlvdXQpIHtcclxuICAgICAgICAgICAgLy8gY3ljbGluZyB0aHJvdWdoIGFsbCB2aXN1YWwgZWxlbWVudHMgdGhhdCBzaG91bGQgcmVhY3RcclxuICAgICAgICAgICAgLy8gdG8gc2Nyb2xsaW5nIGFuZCByZXNpemluZ1xyXG4gICAgICAgICAgICB2YXIgaXRlbSA9IHNjcm9vbGx5LnNjcm9sbExheW91dFtpZF0sXHJcbiAgICAgICAgICAgICAgICBydWxlLFxyXG4gICAgICAgICAgICAgICAgY2hlY2tpbixcclxuICAgICAgICAgICAgICAgIHNvdXJjZVxyXG4gICAgICAgICAgICA7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgaW4gaXRlbS5ydWxlcykge1xyXG4gICAgICAgICAgICAgICAgcnVsZSA9IGl0ZW0ucnVsZXNbaV07XHJcbiAgICAgICAgICAgICAgICBjaGVja2luID0gc2Nyb29sbHkuaXNSdWxlSW5BY3RpdmVXaWR0aFJhbmdlKHJ1bGUpO1xyXG4gICAgICAgICAgICAgICAgbmVlZFNjcm9sbCB8PSBjaGVja2luO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNoZWNraW4gJiYgcnVsZS5mcm9tID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAkKGl0ZW0uZWxlbWVudCkuY3NzKCdwb3NpdGlvbicsICcnKTtcclxuICAgICAgICAgICAgICAgICAgICAkKGl0ZW0uZWxlbWVudCkuY3NzKCd0b3AnLCAnJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJ1bGUuYm90dG9tQ29udGFpbmVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1bGUuYm90dG9tQ29udGFpbmVyLmNzcygnbWFyZ2luLXRvcCcsICcnKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gaXRlbSBlbnRlcmVkIG5ldyByYW5nZSBhbmQgc2hvdWxkIGFkYXB0XHJcbiAgICAgICAgICAgICAgICAgICAgc291cmNlID0gc2Nyb29sbHkuX2RlZmF1bHQocnVsZSwgJ3NvdXJjZScpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICgnc3RpY2t5JyA9PT0gc291cmNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0ucnVsZXNbaV0gPSBzY3Jvb2xseS5wcm9jZXNzU3RpY2t5SXRlbVJhbmdlKGl0ZW0uZWxlbWVudCwgcnVsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAobmVlZFNjcm9sbCkge1xyXG4gICAgICAgICAgICAvLyBkYXJrIG1hZ2ljayBoZXJlIGRvIG5vdCB0b3VjaCB0aGlzIHVzZWxlc3Mgc3RyaW5nXHJcbiAgICAgICAgICAgIHNjcm9vbGx5LnNjcm9sbExheW91dCA9IHNjcm9vbGx5LnNjcm9sbExheW91dDtcclxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBzY3Jvb2xseS5vblNjcm9sbCh0cnVlKTtcclxuICAgICAgICAgICAgfSwgMCk7XHJcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgc2Nyb29sbHkub25TY3JvbGwoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogSGVscGVyIHRvIGdldCBwcm9ncmVzcyB2YWx1ZXMgZm9yIG9uU2Nyb2xsIGhhbmRsZXJzXHJcbiAgICAgKiBAcGFyYW0ge2ludGVnZXJ9IG9mZnNldFxyXG4gICAgICogQHBhcmFtIHtpbnRlZ2VyfSBsZW5ndGhcclxuICAgICAqIEByZXR1cm5zIHtvYmplY3R9IHByb2dyZXNzIG1ldHJpY3NcclxuICAgICAqL1xyXG4gICAgc2Nyb29sbHkuZ2V0UHJvZ3Jlc3MgPSBmdW5jdGlvbiAob2Zmc2V0LCBsZW5ndGgpIHtcclxuICAgICAgICB2YXIgcmVsYXRpdmUgPSBvZmZzZXQgLyBsZW5ndGg7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgb2Zmc2V0OiBvZmZzZXQsXHJcbiAgICAgICAgICAgIGxlbmd0aDogbGVuZ3RoLFxyXG4gICAgICAgICAgICByZWxhdGl2ZTogcmVsYXRpdmUsXHJcbiAgICAgICAgICAgIGxlZnQ6IGxlbmd0aCAtIG9mZnNldCxcclxuICAgICAgICAgICAgbGVmdFJlbGF0aXZlOiAxIC0gcmVsYXRpdmVcclxuICAgICAgICB9O1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCB0cmFuc2l0aW9uIGZsb2F0IHZhbHVlICBiYXNlZCBvbiBzdGFydCwgc3RvcCBhbmQgcHJvZ3Jlc3MgdmFsdWVzXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gc3RhcnRcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBzdG9wXHJcbiAgICAgKiBAcGFyYW0ge2Zsb2F0fSBwcm9ncmVzc1xyXG4gICAgICogQHJldHVybnMge051bWJlcn1cclxuICAgICAqL1xyXG4gICAgc2Nyb29sbHkuZ2V0VHJhbnNpdGlvbkZsb2F0VmFsdWUgPSBmdW5jdGlvbiAoc3RhcnQsIHN0b3AsIHByb2dyZXNzKSB7XHJcbiAgICAgICAgaWYgKHByb2dyZXNzIDw9IDApIHtcclxuICAgICAgICAgICAgcmV0dXJuIHN0YXJ0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHByb2dyZXNzID49IDEpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHN0b3A7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gc3RhcnQgKyAoc3RvcCAtIHN0YXJ0KSAqIHByb2dyZXNzO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCB0cmFuc2l0aW9uIGludGVnZXIgdmFsdWUgIGJhc2VkIG9uIHN0YXJ0LCBzdG9wIGFuZCBwcm9ncmVzcyB2YWx1ZXNcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBzdGFydFxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHN0b3BcclxuICAgICAqIEBwYXJhbSB7ZmxvYXR9IHByb2dyZXNzXHJcbiAgICAgKiBAcmV0dXJucyB7TnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBzY3Jvb2xseS5nZXRUcmFuc2l0aW9uSW50VmFsdWUgPSBmdW5jdGlvbiAoc3RhcnQsIHN0b3AsIHByb2dyZXNzKSB7XHJcbiAgICAgICAgcmV0dXJuIE1hdGgucm91bmQoc2Nyb29sbHkuZ2V0VHJhbnNpdGlvbkZsb2F0VmFsdWUoc3RhcnQsIHN0b3AsIHByb2dyZXNzKSk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IFtSLCBHLCBCXSBhcnJheSBvZiBpbnRlZ2VycyBmb3IgcHJvdmlkZWQgJyNSUkdHQkInIG9yICcjUkdCJyB2YWx1ZVxyXG4gICAgICogQHBhcmFtIHt0eXBlfSBjb2xvclxyXG4gICAgICogQHJldHVybnMge0FycmF5fVxyXG4gICAgICovXHJcbiAgICBzY3Jvb2xseS5oYXNoQ29sb3IycmdiID0gZnVuY3Rpb24gKGNvbG9yKSB7XHJcbiAgICAgICAgdmFyIG0gPSBjb2xvci5tYXRjaCgvXiMoWzAtOWEtZl17M30pJC9pKTtcclxuICAgICAgICBpZiAobSkge1xyXG4gICAgICAgICAgICAvLyBpbiB0aHJlZS1jaGFyYWN0ZXIgZm9ybWF0LCBlYWNoIHZhbHVlIGlzIG11bHRpcGxpZWQgYnkgMHgxMSB0byBnaXZlIGFuXHJcbiAgICAgICAgICAgIC8vIGV2ZW4gc2NhbGUgZnJvbSAweDAwIHRvIDB4ZmZcclxuICAgICAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAgICAgIHBhcnNlSW50KG1bMV0uY2hhckF0KDApLCAxNikgKiAweDExLCBwYXJzZUludChtWzFdLmNoYXJBdCgxKSwgMTYpICogMHgxMSwgcGFyc2VJbnQobVsxXS5jaGFyQXQoMiksIDE2KSAqIDB4MTFcclxuICAgICAgICAgICAgXTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBtID0gY29sb3IubWF0Y2goL14jKFswLTlhLWZdezZ9KSQvaSk7XHJcbiAgICAgICAgICAgIGlmIChtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgICAgICAgICAgIHBhcnNlSW50KG1bMV0uc3Vic3RyKDAsIDIpLCAxNiksIHBhcnNlSW50KG1bMV0uc3Vic3RyKDIsIDIpLCAxNiksIHBhcnNlSW50KG1bMV0uc3Vic3RyKDQsIDIpLCAxNilcclxuICAgICAgICAgICAgICAgIF07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIFswLCAwLCAwXTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgJyNSUkdHQkInIHZhbHVlIGZvciBwcm92aWRlZCBSLCBHLCBCIGludGVnZXIgdmFsdWVzXHJcbiAgICAgKiBAcGFyYW0ge2ludGVnZXJ9IHJcclxuICAgICAqIEBwYXJhbSB7aW50ZWdlcn0gZ1xyXG4gICAgICogQHBhcmFtIHtpbnRlZ2VyfSBiXHJcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSAjUlJHR0JCXHJcbiAgICAgKi9cclxuICAgIHNjcm9vbGx5LnJnYjJIYXNoQ29sb3IgPSBmdW5jdGlvbiAociwgZywgYikge1xyXG4gICAgICAgIHZhciByZXMgPSAnIycsIGMsIGhleDtcclxuICAgICAgICBmb3IgKHZhciBpIGluIGFyZ3VtZW50cykge1xyXG4gICAgICAgICAgICBjID0gYXJndW1lbnRzW2ldO1xyXG4gICAgICAgICAgICBoZXggPSBjLnRvU3RyaW5nKDE2KTtcclxuXHJcbiAgICAgICAgICAgIGlmIChjIDwgMTYpIHtcclxuICAgICAgICAgICAgICAgIGhleCA9ICcwJyArIGhleDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmVzICs9IGhleDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXM7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IHRyYW5zaXRpb24gY29sb3IgdmFsdWUgIGJhc2VkIG9uIHN0YXJ0LCBzdG9wIGFuZCBwcm9ncmVzcyB2YWx1ZXNcclxuICAgICAqIEBwYXJhbSB7Y3NzQ29sb3J9IHN0YXJ0XHJcbiAgICAgKiBAcGFyYW0ge2Nzc0NvbG9yfSBzdG9wXHJcbiAgICAgKiBAcGFyYW0ge2Zsb2F0fSBwcm9ncmVzc1xyXG4gICAgICogQHJldHVybnMge051bWJlcn1cclxuICAgICAqL1xyXG4gICAgc2Nyb29sbHkuZ2V0VHJhbnNpdGlvbkNvbG9yVmFsdWUgPSBmdW5jdGlvbiAoc3RhcnQsIHN0b3AsIHByb2dyZXNzKSB7XHJcbiAgICAgICAgaWYgKHByb2dyZXNzIDw9IDApIHtcclxuICAgICAgICAgICAgcmV0dXJuIHN0YXJ0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHByb2dyZXNzID49IDEpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHN0b3A7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgc3RhcnRSR0IgPSBzY3Jvb2xseS5oYXNoQ29sb3IycmdiKHN0YXJ0KSxcclxuICAgICAgICAgICAgc3RvcFJHQiA9IHNjcm9vbGx5Lmhhc2hDb2xvcjJyZ2Ioc3RvcCksXHJcbiAgICAgICAgICAgIHIgPSBzY3Jvb2xseS5nZXRUcmFuc2l0aW9uSW50VmFsdWUoc3RhcnRSR0JbMF0sIHN0b3BSR0JbMF0sIHByb2dyZXNzKSxcclxuICAgICAgICAgICAgZyA9IHNjcm9vbGx5LmdldFRyYW5zaXRpb25JbnRWYWx1ZShzdGFydFJHQlsxXSwgc3RvcFJHQlsxXSwgcHJvZ3Jlc3MpLFxyXG4gICAgICAgICAgICBiID0gc2Nyb29sbHkuZ2V0VHJhbnNpdGlvbkludFZhbHVlKHN0YXJ0UkdCWzJdLCBzdG9wUkdCWzJdLCBwcm9ncmVzcyk7XHJcblxyXG4gICAgICAgIHJldHVybiBzY3Jvb2xseS5yZ2IySGFzaENvbG9yKHIsIGcsIGIpO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCB0cmFuc2l0aW9uIGNzcyB2YWx1ZSAgYmFzZWQgb24gc3RhcnQsIHN0b3AgYW5kIHByb2dyZXNzIHZhbHVlc1xyXG4gICAgICogQHBhcmFtIHtjc3NDb2xvcn0gc3RhcnRcclxuICAgICAqIEBwYXJhbSB7Y3NzQ29sb3J9IHN0b3BcclxuICAgICAqIEBwYXJhbSB7ZmxvYXR9IHByb2dyZXNzXHJcbiAgICAgKiBAcmV0dXJucyB7TnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBzY3Jvb2xseS5nZXRUcmFuc2l0aW9uVmFsdWUgPSBmdW5jdGlvbiAoc3RhcnQsIHN0b3AsIHByb2dyZXNzKSB7XHJcbiAgICAgICAgaWYgKHByb2dyZXNzIDw9IDApIHtcclxuICAgICAgICAgICAgcmV0dXJuIHN0YXJ0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHByb2dyZXNzID49IDEpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHN0b3A7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgY2FsbGVkID0gMDtcclxuICAgICAgICBpZiAoc2Nyb29sbHkuX2lzTnVtYmVyKHN0YXJ0KSAmJiBzY3Jvb2xseS5faXNOdW1iZXIoc3RvcCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHNjcm9vbGx5LmdldFRyYW5zaXRpb25GbG9hdFZhbHVlKHN0YXJ0LCBzdGFydCwgcHJvZ3Jlc3MpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHJlID0gLyhcXGQqXFwuXFxkKyl8KFxcZCspfCgjWzAtOWEtZl17Nn0pfCgjWzAtOWEtZl17M30pL2dpLFxyXG4gICAgICAgICAgICBzdG9wcyA9ICgnJyArIHN0b3ApLm1hdGNoKHJlKTtcclxuXHJcbiAgICAgICAgcmV0dXJuICgnJyArIHN0YXJ0KS5yZXBsYWNlKHJlLCBmdW5jdGlvbiAodmFsdWUsIGZsb2F0LCBpbnQsIGNvbG9yNiwgY29sb3IzKSB7XHJcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgY29uc29sZS5kaXIoeydyZXBsYWNlIGNhbGxiYWNrIGFyZ3MnOmFyZ3VtZW50cywgc3RvcHM6IHN0b3BzLCBjYWxsZWQ6IGNhbGxlZH0pO1xyXG4gICAgICAgICAgICB2YXIgY3VycmVudFN0b3AgPSBzdG9wc1tjYWxsZWRdO1xyXG5cclxuICAgICAgICAgICAgY2FsbGVkKys7XHJcbiAgICAgICAgICAgIGlmIChpbnQgJiYgaW50Lmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIC9cXGQqXFwuXFxkKy8udGVzdChjdXJyZW50U3RvcCkgPyBzY3Jvb2xseS5nZXRUcmFuc2l0aW9uRmxvYXRWYWx1ZShwYXJzZUZsb2F0KHZhbHVlKSwgcGFyc2VGbG9hdChjdXJyZW50U3RvcCksIHByb2dyZXNzKSA6IHNjcm9vbGx5LmdldFRyYW5zaXRpb25JbnRWYWx1ZShwYXJzZUludCh2YWx1ZSksIHBhcnNlSW50KGN1cnJlbnRTdG9wKSwgcHJvZ3Jlc3MpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoZmxvYXQgJiYgZmxvYXQubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc2Nyb29sbHkuZ2V0VHJhbnNpdGlvbkZsb2F0VmFsdWUocGFyc2VGbG9hdCh2YWx1ZSksIHBhcnNlRmxvYXQoY3VycmVudFN0b3ApLCBwcm9ncmVzcyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChjb2xvcjYgJiYgY29sb3I2Lmxlbmd0aCB8fCBjb2xvcjMgJiYgY29sb3IzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNjcm9vbGx5LmdldFRyYW5zaXRpb25Db2xvclZhbHVlKHZhbHVlLCBjdXJyZW50U3RvcCwgcHJvZ3Jlc3MpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRnVuY3Rpb24gdGhhdCBpcyBjYWxsZWQgd2hpbGUgc2Njcm9sbHMuXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGZvcmNlIGRlc2NyaXB0aW9uXHJcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuICAgICAqL1xyXG4gICAgc2Nyb29sbHkub25TY3JvbGwgPSBmdW5jdGlvbiAoZm9yY2UpIHtcclxuICAgICAgICAvLyAgICAgICAgdmFyIHNjcm9sbFBvcyA9ICQoZG9jdW1lbnQpLnNjcm9sbFRvcCgpOyAvLyBZLWNvb3JkIHRoYXQgaXMgY2hlY2tlZCBhZ2FpbnN0IGZyb21ZICYgdG9ZXHJcbiAgICAgICAgdmFyIHNjcm9sbFBvcyA9IHNjcm9vbGx5LmJvZHkuc2Nyb2xsVG9wKCk7IC8vIFktY29vcmQgdGhhdCBpcyBjaGVja2VkIGFnYWluc3QgZnJvbVkgJiB0b1lcclxuXHJcbiAgICAgICAgaWYgKCFmb3JjZSAmJiBzY3JvbGxQb3MgPT09IHNjcm9vbGx5LnNjcm9sbFRvcCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgcHJldlBvcyA9IHNjcm9vbGx5LnNjcm9sbFRvcCxcclxuICAgICAgICAgICAgcHJldkRpcmVjdGlvbiA9IHNjcm9vbGx5LmRpcmVjdGlvbjtcclxuXHJcbiAgICAgICAgc2Nyb29sbHkuc2Nyb2xsVG9wID0gc2Nyb2xsUG9zOyAvLyBZLWNvb3JkIHRoYXQgaXMgY2hlY2tlZCBhZ2FpbnN0IGZyb21ZICYgdG9ZXHJcbiAgICAgICAgc2Nyb29sbHkuc2Nyb2xsQm90dG9tID0gc2Nyb2xsUG9zICsgc2Nyb29sbHkud2luSGVpZ2h0O1xyXG4gICAgICAgIHNjcm9vbGx5LnNjcm9sbENlbnRlciA9IHNjcm9sbFBvcyArIE1hdGguZmxvb3Ioc2Nyb29sbHkud2luSGVpZ2h0IC8gMik7XHJcbiAgICAgICAgc2Nyb29sbHkuZGlyZWN0aW9uID0gc2Nyb2xsUG9zIC0gcHJldlBvcztcclxuXHJcbiAgICAgICAgdmFyIGRpcmVjdGlvbkNoYW5nZWQgPSAhKHNjcm9vbGx5LmRpcmVjdGlvbiA9PT0gcHJldkRpcmVjdGlvbiB8fCBzY3Jvb2xseS5kaXJlY3Rpb24gPCAwICYmIHByZXZEaXJlY3Rpb24gPCAwIHx8IHNjcm9vbGx5LmRpcmVjdGlvbiA+IDAgJiYgcHJldkRpcmVjdGlvbiA+IDApLFxyXG4gICAgICAgICAgICBpdGVtLFxyXG4gICAgICAgICAgICB0b3RhbFJ1bGVzLFxyXG4gICAgICAgICAgICBjaGVja2VkSW4sXHJcbiAgICAgICAgICAgIGNoZWNrZWRPdXQsXHJcbiAgICAgICAgICAgIGFjdGl2ZSxcclxuICAgICAgICAgICAgaWQsIGksIGwsIGosXHJcbiAgICAgICAgICAgIHJ1bGUsXHJcbiAgICAgICAgICAgIGZyb21YLFxyXG4gICAgICAgICAgICB0b1gsXHJcbiAgICAgICAgICAgIGNvbnRhaW5lcixcclxuICAgICAgICAgICAgJGJvdHRvbUNvbnRhaW5lcixcclxuICAgICAgICAgICAgbW9kZSxcclxuICAgICAgICAgICAgaXRlbUhlaWdodDtcclxuXHJcbiAgICAgICAgZm9yIChpZCBpbiBzY3Jvb2xseS5zY3JvbGxMYXlvdXQpIHtcclxuICAgICAgICAgICAgLy8gY3ljbGluZyB0aHJvdWdoIGFsbCB2aXN1YWwgZWxlbWVudHMgdGhhdCBzaG91bGQgcmVhY3RcclxuICAgICAgICAgICAgLy8gdG8gc2Nyb2xsaW5nIGFuZCByZXNpemluZ1xyXG4gICAgICAgICAgICBpdGVtID0gc2Nyb29sbHkuc2Nyb2xsTGF5b3V0W2lkXTtcclxuICAgICAgICAgICAgdG90YWxSdWxlcyA9IGl0ZW0ucnVsZXMubGVuZ3RoO1xyXG4gICAgICAgICAgICBjaGVja2VkSW4gPSBbXTtcclxuICAgICAgICAgICAgY2hlY2tlZE91dCA9IFtdO1xyXG4gICAgICAgICAgICBhY3RpdmUgPSBbXTtcclxuXHJcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCB0b3RhbFJ1bGVzOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHJ1bGUgPSBpdGVtLnJ1bGVzW2ldO1xyXG4gICAgICAgICAgICAgICAgZnJvbVggPSBzY3Jvb2xseS5fZGVmYXVsdChydWxlLCAnbWluV2lkdGgnLCAwKTtcclxuICAgICAgICAgICAgICAgIHRvWCA9IHNjcm9vbGx5Ll9kZWZhdWx0KHJ1bGUsICdtYXhXaWR0aCcsICdpbmZpbml0eScpO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnRhaW5lciA9IGl0ZW0uY29udGFpbmVyID09PSAnc2VsZicgPyBpdGVtLmVsZW1lbnQgOiBpdGVtLmNvbnRhaW5lcjtcclxuXHJcbiAgICAgICAgICAgICAgICBydWxlLmNoZWNraW4gPSBzY3Jvb2xseS5pc1J1bGVBY3RpdmUocnVsZSwgaXRlbS5lbGVtZW50LCBjb250YWluZXIpO1xyXG4gICAgICAgICAgICAgICAgcnVsZS5jbGFzcyA9IHJ1bGUuY2xhc3MgfHwgJ3Njcm9sbC1wb3MtJyArIChydWxlLmFsaWFzKSArICcgd2luZG93LXdpZHRoLScgKyBmcm9tWCArICctdG8tJyArIHRvWDtcclxuICAgICAgICAgICAgICAgIGlmIChydWxlLmNoZWNraW4pIHtcclxuICAgICAgICAgICAgICAgICAgICBhY3RpdmUucHVzaChpKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXJ1bGUuaXNBY3RpdmUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcnVsZS5pc0FjdGl2ZSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrZWRJbi5wdXNoKGkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocnVsZS5pc0FjdGl2ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJ1bGUuaXNBY3RpdmUgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICBjaGVja2VkT3V0LnB1c2goaSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpdGVtLnJ1bGVzW2ldID0gcnVsZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IGNoZWNrZWRPdXQubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgIGkgPSBjaGVja2VkT3V0W2pdO1xyXG4gICAgICAgICAgICAgICAgcnVsZSA9IGl0ZW0ucnVsZXNbaV07XHJcbiAgICAgICAgICAgICAgICBpdGVtLmVsZW1lbnQucmVtb3ZlQ2xhc3MocnVsZS5jbGFzcyk7XHJcbiAgICAgICAgICAgICAgICBpZiAocnVsZS5jc3NPblNjcm9sbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGwgPSBydWxlLmxlbmd0aCB8fCAwO1xyXG4gICAgICAgICAgICAgICAgICAgIHJ1bGUuY3NzT25TY3JvbGwoaXRlbS5lbGVtZW50LCBzY3JvbGxQb3MgPiBwcmV2UG9zID8gbCA6IDAsIGwsIHJ1bGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHJ1bGUub25TY3JvbGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBsID0gcnVsZS5sZW5ndGggfHwgMDtcclxuICAgICAgICAgICAgICAgICAgICBydWxlLm9uU2Nyb2xsKGl0ZW0uZWxlbWVudCwgc2Nyb2xsUG9zID4gcHJldlBvcyA/IGwgOiAwLCBsLCBydWxlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChydWxlLm9uQ2hlY2tPdXQpIHtcclxuICAgICAgICAgICAgICAgICAgICBydWxlLm9uQ2hlY2tPdXQoaXRlbS5lbGVtZW50LCBydWxlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChydWxlLm9uVG9wT3V0ICYmIHNjcm9sbFBvcyA8IHByZXZQb3MpIHtcclxuICAgICAgICAgICAgICAgICAgICBydWxlLm9uVG9wT3V0KGl0ZW0uZWxlbWVudCwgcnVsZSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJ1bGUub25Cb3R0b21PdXQgJiYgc2Nyb2xsUG9zID4gcHJldlBvcykge1xyXG4gICAgICAgICAgICAgICAgICAgIHJ1bGUub25Cb3R0b21PdXQoaXRlbS5lbGVtZW50LCBydWxlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IGNoZWNrZWRJbi5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICAgICAgaSA9IGNoZWNrZWRJbltqXTtcclxuICAgICAgICAgICAgICAgIHJ1bGUgPSBpdGVtLnJ1bGVzW2ldO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChydWxlLmNzcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uZWxlbWVudC5jc3Moc2Nyb29sbHkuZXh0ZW5kQ3NzV2l0aFByZWZpeChydWxlLmNzcykpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChydWxlLmFkZENsYXNzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5lbGVtZW50LmFkZENsYXNzKHJ1bGUuYWRkQ2xhc3MpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChydWxlLnJlbW92ZUNsYXNzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5lbGVtZW50LnJlbW92ZUNsYXNzKHJ1bGUucmVtb3ZlQ2xhc3MpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaXRlbS5lbGVtZW50LmFkZENsYXNzKHJ1bGUuY2xhc3MpO1xyXG5cclxuICAgICAgICAgICAgICAgICRib3R0b21Db250YWluZXIgPSBzY3Jvb2xseS5fZGVmYXVsdChydWxlLCAnYm90dG9tQ29udGFpbmVyJyk7XHJcbiAgICAgICAgICAgICAgICBtb2RlID0gc2Nyb29sbHkuX2RlZmF1bHQocnVsZSwgJ21vZGUnKTtcclxuICAgICAgICAgICAgICAgIGl0ZW1IZWlnaHQgPSBzY3Jvb2xseS5fZGVmYXVsdChydWxlLCAnaXRlbUhlaWdodCcpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICgkYm90dG9tQ29udGFpbmVyICYmIG1vZGUgJiYgaXRlbUhlaWdodCkge1xyXG4gICAgICAgICAgICAgICAgICAgICRib3R0b21Db250YWluZXIuY3NzKG1vZGUgKyAnLXRvcCcsIGl0ZW1IZWlnaHQgKyAncHgnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAocnVsZS5vbkNoZWNrSW4pIHtcclxuICAgICAgICAgICAgICAgICAgICBydWxlLm9uQ2hlY2tJbihpdGVtLmVsZW1lbnQsIHJ1bGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChydWxlLm9uVG9wSW4gJiYgc2Nyb2xsUG9zID4gcHJldlBvcykge1xyXG4gICAgICAgICAgICAgICAgICAgIHJ1bGUub25Ub3BJbihpdGVtLmVsZW1lbnQsIHJ1bGUpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChydWxlLm9uQm90dG9tSW4gJiYgc2Nyb2xsUG9zIDwgcHJldlBvcykge1xyXG4gICAgICAgICAgICAgICAgICAgIHJ1bGUub25Cb3R0b21JbihpdGVtLmVsZW1lbnQsIHJ1bGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJ1bGUubGVuZ3RoID0gcnVsZS5jaGVja2luLmxlbmd0aDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IGFjdGl2ZS5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICAgICAgaSA9IGFjdGl2ZVtqXTtcclxuICAgICAgICAgICAgICAgIHJ1bGUgPSBpdGVtLnJ1bGVzW2ldO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChydWxlLmNzc09uU2Nyb2xsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcnVsZS5jc3NPblNjcm9sbChpdGVtLmVsZW1lbnQsIHJ1bGUuY2hlY2tpbi5vZmZzZXQsIHJ1bGUuY2hlY2tpbi5sZW5ndGgsIHJ1bGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChydWxlLm9uU2Nyb2xsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcnVsZS5vblNjcm9sbChpdGVtLmVsZW1lbnQsIHJ1bGUuY2hlY2tpbi5vZmZzZXQsIHJ1bGUuY2hlY2tpbi5sZW5ndGgsIHJ1bGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChkaXJlY3Rpb25DaGFuZ2VkICYmIHJ1bGUub25EaXJlY3Rpb25DaGFuZ2VkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcnVsZS5vbkRpcmVjdGlvbkNoYW5nZWQoaXRlbS5lbGVtZW50LCBzY3Jvb2xseS5kaXJlY3Rpb24sIHJ1bGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHNjcm9vbGx5LnNjcm9sbExheW91dFtpZF0gPSBpdGVtO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9O1xyXG5cclxuICAgIC8vV2lsbCBiZSBjYWxsZWQgb25jZSAod2hlbiBzY3Jvb2xseSBnZXRzIGluaXRpYWxpemVkKS5cclxuICAgIHNjcm9vbGx5LmRldGVjdENTU1ByZWZpeCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvL09ubHkgcmVsZXZhbnQgcHJlZml4ZXMuIE1heSBiZSBleHRlbmRlZC5cclxuICAgICAgICAvL0NvdWxkIGJlIGRhbmdlcm91cyBpZiB0aGVyZSB3aWxsIGV2ZXIgYmUgYSBDU1MgcHJvcGVydHkgd2hpY2ggYWN0dWFsbHkgc3RhcnRzIHdpdGggXCJtc1wiLiBEb24ndCBob3BlIHNvLlxyXG4gICAgICAgIHZhciByeFByZWZpeGVzID0gL14oPzpPfE1venx3ZWJraXR8bXMpfCg/Oi0oPzpvfG1venx3ZWJraXR8bXMpLSkvO1xyXG5cclxuICAgICAgICAvL0RldGVjdCBwcmVmaXggZm9yIGN1cnJlbnQgYnJvd3NlciBieSBmaW5kaW5nIHRoZSBmaXJzdCBwcm9wZXJ0eSB1c2luZyBhIHByZWZpeC5cclxuICAgICAgICBpZiAoIXdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBzdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGRvY3VtZW50LmJvZHksIG51bGwpO1xyXG5cclxuICAgICAgICBmb3IgKHZhciBrIGluIHN0eWxlKSB7XHJcbiAgICAgICAgICAgIC8vV2UgY2hlY2sgdGhlIGtleSBhbmQgaWYgdGhlIGtleSBpcyBhIG51bWJlciwgd2UgY2hlY2sgdGhlIHZhbHVlIGFzIHdlbGwsIGJlY2F1c2Ugc2FmYXJpJ3MgZ2V0Q29tcHV0ZWRTdHlsZSByZXR1cm5zIHNvbWUgd2VpcmQgYXJyYXktbGlrZSB0aGluZ3kuXHJcbiAgICAgICAgICAgIHNjcm9vbGx5LnRoZUNTU1ByZWZpeCA9IChrLm1hdGNoKHJ4UHJlZml4ZXMpIHx8ICgrayA9PT0gayAmJiBzdHlsZVtrXS5tYXRjaChyeFByZWZpeGVzKSkpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHNjcm9vbGx5LnRoZUNTU1ByZWZpeCkge1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vRGlkIHdlIGV2ZW4gZGV0ZWN0IGEgcHJlZml4P1xyXG4gICAgICAgIGlmICghc2Nyb29sbHkudGhlQ1NTUHJlZml4KSB7XHJcbiAgICAgICAgICAgIHNjcm9vbGx5LnRoZUNTU1ByZWZpeCA9IHNjcm9vbGx5LnRoZURhc2hlZENTU1ByZWZpeCA9ICcnO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2Nyb29sbHkudGhlQ1NTUHJlZml4ID0gc2Nyb29sbHkudGhlQ1NTUHJlZml4WzBdO1xyXG5cclxuICAgICAgICAvL1dlIGNvdWxkIGhhdmUgZGV0ZWN0ZWQgZWl0aGVyIGEgZGFzaGVkIHByZWZpeCBvciB0aGlzIGNhbWVsQ2FzZWlzaC1pbmNvbnNpc3RlbnQgc3R1ZmYuXHJcbiAgICAgICAgaWYgKHNjcm9vbGx5LnRoZUNTU1ByZWZpeC5zbGljZSgwLCAxKSA9PT0gJy0nKSB7XHJcbiAgICAgICAgICAgIHNjcm9vbGx5LnRoZURhc2hlZENTU1ByZWZpeCA9IHNjcm9vbGx5LnRoZUNTU1ByZWZpeDtcclxuXHJcbiAgICAgICAgICAgIC8vVGhlcmUncyBubyBsb2dpYyBiZWhpbmQgdGhlc2UuIE5lZWQgYSBsb29rIHVwLlxyXG4gICAgICAgICAgICBzY3Jvb2xseS50aGVDU1NQcmVmaXggPSAoe1xyXG4gICAgICAgICAgICAgICAgJy13ZWJraXQtJzogJ3dlYmtpdCcsXHJcbiAgICAgICAgICAgICAgICAnLW1vei0nOiAnTW96JyxcclxuICAgICAgICAgICAgICAgICctbXMtJzogJ21zJyxcclxuICAgICAgICAgICAgICAgICctby0nOiAnTydcclxuICAgICAgICAgICAgfSlbc2Nyb29sbHkudGhlQ1NTUHJlZml4XTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBzY3Jvb2xseS50aGVEYXNoZWRDU1NQcmVmaXggPSAnLScgKyBzY3Jvb2xseS50aGVDU1NQcmVmaXgudG9Mb3dlckNhc2UoKSArICctJztcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHNjcm9vbGx5LmNzc1ByZWZpeCA9IGZ1bmN0aW9uIChrZXkpIHtcclxuICAgICAgICByZXR1cm4gc2Nyb29sbHkudGhlRGFzaGVkQ1NTUHJlZml4ICsga2V5O1xyXG4gICAgfTtcclxuXHJcbiAgICBzY3Jvb2xseS5leHRlbmRDc3NXaXRoUHJlZml4ID0gZnVuY3Rpb24gKGNzc09iaikge1xyXG4gICAgICAgIHZhciBjc3NFeHQgPSB7fSwgcHJvcCwgcmUsIG0sIG5ld1Byb3AsIHZhbDtcclxuXHJcbiAgICAgICAgZm9yIChwcm9wIGluIGNzc09iaikge1xyXG4gICAgICAgICAgICByZSA9IC9eLShtb3otfHdlYmtpdC18by18bXMtKT8vaTtcclxuICAgICAgICAgICAgbSA9IHByb3AubWF0Y2gocmUpO1xyXG4gICAgICAgICAgICBuZXdQcm9wID0gcHJvcC5zbGljZSgxKTtcclxuICAgICAgICAgICAgLy8gICAgICAgICAgICBjb25zb2xlLmRpcih7bTogbX0pO1xyXG4gICAgICAgICAgICBpZiAobSAmJiAhbVsxXSkge1xyXG4gICAgICAgICAgICAgICAgdmFsID0gY3NzT2JqW3Byb3BdO1xyXG4gICAgICAgICAgICAgICAgY3NzRXh0W25ld1Byb3BdID0gdmFsO1xyXG4gICAgICAgICAgICAgICAgY3NzRXh0W3Njcm9vbGx5LmNzc1ByZWZpeChuZXdQcm9wKV0gPSB2YWw7XHJcbiAgICAgICAgICAgICAgICBkZWxldGUgY3NzT2JqW3Byb3BdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAkLmV4dGVuZChjc3NPYmosIGNzc0V4dCk7XHJcblxyXG4gICAgICAgIHJldHVybiBjc3NPYmo7XHJcbiAgICB9O1xyXG5cclxuICAgIHNjcm9vbGx5Lm5vdyA9IERhdGUubm93IHx8IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gK25ldyBEYXRlKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIHNjcm9vbGx5LmdldFJBRiA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgcmVxdWVzdEFuaW1GcmFtZSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgd2luZG93W3Njcm9vbGx5LnRoZUNTU1ByZWZpeC50b0xvd2VyQ2FzZSgpICsgJ1JlcXVlc3RBbmltYXRpb25GcmFtZSddLFxyXG4gICAgICAgICAgICBsYXN0VGltZSA9IHNjcm9vbGx5Lm5vdygpO1xyXG5cclxuICAgICAgICBpZiAoZmFsc2UgJiYgc2Nyb29sbHkuaXNNb2JpbGUgfHwgIXJlcXVlc3RBbmltRnJhbWUpIHtcclxuICAgICAgICAgICAgcmVxdWVzdEFuaW1GcmFtZSA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgICAgICAgLy9Ib3cgbG9uZyBkaWQgaXQgdGFrZSB0byByZW5kZXI/XHJcbiAgICAgICAgICAgICAgICB2YXIgZGVsdGFUaW1lID0gc2Nyb29sbHkubm93KCkgLSBsYXN0VGltZSxcclxuICAgICAgICAgICAgICAgICAgICBkZWxheSA9IE1hdGgubWF4KDAsIDEwMDAgLyA2MCAtIGRlbHRhVGltZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBsYXN0VGltZSA9IHNjcm9vbGx5Lm5vdygpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vICAgICAgICBzY3Jvb2xseS50aW1lc0NhbGxlZCsrO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vICAgICAgICBzY3Jvb2xseS54LnRleHQoc2Nyb29sbHkudGltZXNDYWxsZWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICAgICAgICB9LCBkZWxheSk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVxdWVzdEFuaW1GcmFtZTtcclxuICAgIH07XHJcblxyXG4gICAgc2Nyb29sbHkuZ2V0Q0FGID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjYW5jZWxBbmltRnJhbWUgPSB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgfHwgd2luZG93W3Njcm9vbGx5LnRoZUNTU1ByZWZpeC50b0xvd2VyQ2FzZSgpICsgJ0NhbmNlbEFuaW1hdGlvbkZyYW1lJ107XHJcblxyXG4gICAgICAgIGlmIChzY3Jvb2xseS5pc01vYmlsZSB8fCAhY2FuY2VsQW5pbUZyYW1lKSB7XHJcbiAgICAgICAgICAgIGNhbmNlbEFuaW1GcmFtZSA9IGZ1bmN0aW9uICh0aW1lb3V0KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gd2luZG93LmNsZWFyVGltZW91dCh0aW1lb3V0KTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBjYW5jZWxBbmltRnJhbWU7XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICBzY3Jvb2xseS5hbmltTG9vcCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBzY3Jvb2xseS5vblNjcm9sbCgpO1xyXG4gICAgICAgIHNjcm9vbGx5LmFuaW1GcmFtZSA9IHdpbmRvdy5yZXF1ZXN0QW5pbUZyYW1lKHNjcm9vbGx5LmFuaW1Mb29wKTtcclxuICAgIH07XHJcblxyXG4gICAgc2Nyb29sbHkuaW5pdCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcbiAgICAgICAgaWYgKHNjcm9vbGx5LmlzSW5pdGlhbGl6ZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICAkLmV4dGVuZChzY3Jvb2xseS5vcHRpb25zLCBvcHRpb25zKTtcclxuICAgICAgICBzY3Jvb2xseS5pc01vYmlsZSA9IHNjcm9vbGx5Ll9kZWZhdWx0KHNjcm9vbGx5Lm9wdGlvbnMsICdpc01vYmlsZScsICgvQW5kcm9pZHxpUGhvbmV8aVBhZHxpUG9kfEJsYWNrQmVycnkvaSkudGVzdChuYXZpZ2F0b3IudXNlckFnZW50IHx8IG5hdmlnYXRvci52ZW5kb3IgfHwgd2luZG93Lm9wZXJhKSk7XHJcbiAgICAgICAgc2Nyb29sbHkuZGV0ZWN0Q1NTUHJlZml4KCk7XHJcbiAgICAgICAgc2Nyb29sbHkuYm9keSA9ICQoc2Nyb29sbHkub3B0aW9ucy5ib2R5KTtcclxuICAgICAgICB3aW5kb3cucmVxdWVzdEFuaW1GcmFtZSA9IHNjcm9vbGx5LmdldFJBRigpO1xyXG4gICAgICAgIHdpbmRvdy5jYW5jZWxBbmltRnJhbWUgPSBzY3Jvb2xseS5nZXRDQUYoKTtcclxuXHJcbiAgICAgICAgc2Nyb29sbHkudGltZXNDYWxsZWQgPSAwO1xyXG4gICAgICAgICQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgJCh3aW5kb3cpLnJlc2l6ZShzY3Jvb2xseS5vblJlc2l6ZSkucmVzaXplKCk7XHJcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgc2Nyb29sbHkuYm9keS5zY3JvbGwoZnVuY3Rpb24oKXtzY3Jvb2xseS5vblNjcm9sbCh0cnVlKTt9KS5zY3JvbGwoKTtcclxuICAgICAgICAgICAgc2Nyb29sbHkuYW5pbUxvb3AoKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBzY3Jvb2xseS5pc0luaXRpYWxpemVkID0gdHJ1ZTtcclxuICAgIH07XHJcblxyXG4gICAgc2Nyb29sbHkuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB3aW5kb3cuY2FuY2VsQW5pbUZyYW1lKHNjcm9vbGx5LmFuaW1GcmFtZSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHNjcm9vbGx5LmZhY3RvcnlTdGlja3kgPSBmdW5jdGlvbiAoJGVsZW1lbnQsIHBhcmFtcywgaWQpIHtcclxuICAgICAgICBpZCA9IGlkIHx8ICRlbGVtZW50WzBdLnRhZ05hbWUgKyAnXycgKyBPYmplY3Qua2V5cyhzY3Jvb2xseS5zY3JvbGxMYXlvdXQpLmxlbmd0aDtcclxuICAgICAgICByZXR1cm4gc2Nyb29sbHkuc3RpY2tJdGVtWFkoaWQsICRlbGVtZW50LCAocGFyYW1zIGluc3RhbmNlb2YgQXJyYXkpID8gcGFyYW1zIDogW3BhcmFtc10pID8gaWQgOiBmYWxzZTtcclxuICAgIH07XHJcblxyXG4gICAgaWYgKHBhdGNoSlF1ZXJ5KSB7XHJcbiAgICAgICAgJC5zY3Jvb2xseSA9IHNjcm9vbGx5O1xyXG5cclxuICAgICAgICAkLmZuLnNjcm9vbGx5ID0gZnVuY3Rpb24gKHJ1bGVzLCAkY29udGFpbmVyLCBpZCkge1xyXG4gICAgICAgICAgICBzY3Jvb2xseS5mYWN0b3J5KHRoaXMsIHJ1bGVzLCAkY29udGFpbmVyLCBpZCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIHBhcmFtcyA9IFt3aWR0aFJhbmdlMSwgd2lkdGhSYW5nZTIsIC4uLiAsIHdpZHRoUmFuZ2VOXVxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogd2lkdGhSYW5nZU4gPSB7XHJcblx0XHQgKiAgICAgICRib3R0b21Db250YWluZXI6ICQoRE9Nbm9kZSksICAgLy8gLSBjb250YWluZXIgdGhhdCBkZWZpbmVzIGJvdHRvbSBjb250YWluZXJcclxuXHRcdCAqICAgICAgbW9kZTogJ21hcmdpbid8fCdwYWRkaW5nJywgLy8gLSBkZWZpbmVzIHRoZSB3YXkgZWxlbWVudCBoZWlnaHQgd2lsbCBiZSBjb21wZW5zYXRlZFxyXG5cdFx0ICogICAgICBtaW5XaWR0aDogMCxcclxuXHRcdCAqICAgICAgbWF4V2lkdGg6ICdpbmZpbml0eScsXHJcblx0XHQgKiAgICAgIHN0YXRpYzogZmFsc2UgLy8gLSB3aGV0aGVyIGVsZW1lbnQgc2hvdWxkIGJlIGZpeGVkIGFsbHdheXMgZm9yIGN1cnJlbnQgd2lkdGggcmFuZ2VcclxuXHRcdCAqIH1cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogQHBhcmFtIHt0eXBlfSBwYXJhbXNcclxuICAgICAgICAgKiBAcGFyYW0ge3R5cGV9IGlkXHJcbiAgICAgICAgICogQHJldHVybnMge0Jvb2xlYW58U3RyaW5nfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgICQuZm4uc2Nyb29sbHlTdGlja3kgPSBmdW5jdGlvbiAocGFyYW1zLCBpZCkge1xyXG4gICAgICAgICAgICBzY3Jvb2xseS5pbml0KCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIXRoaXMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBzY3Jvb2xseS5mYWN0b3J5U3RpY2t5KHRoaXMsIHBhcmFtcywgaWQpO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHNjcm9vbGx5O1xyXG59KSk7XHJcblxyXG4iXSwiZmlsZSI6ImpxdWVyeS5zY3Jvb2xseS5qcyJ9
