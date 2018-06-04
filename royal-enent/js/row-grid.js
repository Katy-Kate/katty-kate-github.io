var rowGrid = function(container, options) {
    if (container === null || container === undefined) {
        return;
    }

    if (options === 'appended') {
        options = JSON.parse(container.getAttribute('data-row-grid'));
        var lastRow = container.getElementsByClassName(options.lastRowClass)[0];
        var items = nextAll(lastRow);
        layout(container, options, items);
    } else {
        if (!options) {
            options = JSON.parse(container.getAttribute('data-row-grid'));
        } else {
            if (options.resize === undefined) options.resize = true;
            if (options.minWidth === undefined) options.minWidth = 0;
            if (options.lastRowClass === undefined) options.lastRowClass = 'last-row';
        }

        layout(container, options);

        container.setAttribute('data-row-grid', JSON.stringify(options));

        if (options.resize) {
            window.addEventListener('resize', function(event) {
                layout(container, options);
            });
        }
    }

    /* Get elem and all following siblings of elem */
    function nextAll(elem) {
        var matched = [elem];

        while ((elem = elem['nextSibling']) && elem.nodeType !== 9) {
            if (elem.nodeType === 1) {
                matched.push(elem);
            }
        }
        return matched;
    }

    function layout(container, options, items) {
        var rowWidth = 0,
            rowElems = [],
            items = Array.prototype.slice.call(items || container.querySelectorAll(options.itemSelector)),
            itemsSize = items.length
        singleImagePerRow = !!window.matchMedia && !window.matchMedia('(min-width:' + options.minWidth + 'px)').matches;

        // read
        var containerStyle = getComputedStyle(container);
        var containerWidth = Math.floor(container.getBoundingClientRect().width) - parseFloat(containerStyle.getPropertyValue('padding-left')) - parseFloat(containerStyle.getPropertyValue('padding-right'));
        var itemAttrs = [];
        var theImage, w, h;
        for (var i = 0; i < itemsSize; ++i) {
            theImage = items[i].getElementsByTagName('img')[0];
            if (!theImage) {
                items.splice(i, 1);
                --i;
                --itemsSize;
                continue;
            }
            // get width and height via attribute or js value
            if (!(w = parseInt(theImage.getAttribute('width')))) {
                theImage.setAttribute('width', w = theImage.offsetWidth);
            }
            if (!(h = parseInt(theImage.getAttribute('height')))) {
                theImage.setAttribute('height', h = theImage.offsetHeight);
            }

            itemAttrs[i] = {
                width: w,
                height: h
            };
        }

        // write
        for (var index = 0; index < itemsSize; ++index) {
            if (items[index].classList) {
                items[index].classList.remove(options.firstItemClass);
                items[index].classList.remove(options.lastRowClass);
            } else {
                // IE <10
                items[index].className = items[index].className.replace(new RegExp('(^|\\b)' + options.firstItemClass + '|' + options.lastRowClass + '(\\b|$)', 'gi'), ' ');
            }

            // add element to row
            rowWidth += itemAttrs[index].width;
            rowElems.push(items[index]);

            // check if it is the last element
            if (index === itemsSize - 1) {
                for (var rowElemIndex = 0; rowElemIndex < rowElems.length; rowElemIndex++) {
                    // if first element in row
                    if (rowElemIndex === 0) {
                        rowElems[rowElemIndex].className += ' ' + options.lastRowClass;
                    }

                    var css = 'width: ' + itemAttrs[index + parseInt(rowElemIndex) - rowElems.length + 1].width + 'px;' +
                        'height: ' + itemAttrs[index + parseInt(rowElemIndex) - rowElems.length + 1].height + 'px;';

                    if (rowElemIndex < rowElems.length - 1) {
                        css += 'margin-right:' + options.minMargin + 'px';
                    }

                    rowElems[rowElemIndex].style.cssText = css;
                }
            }

            // check whether width of row is too high
            if (rowWidth + options.maxMargin * (rowElems.length - 1) > containerWidth || singleImagePerRow) {
                var diff = rowWidth + options.maxMargin * (rowElems.length - 1) - containerWidth;
                var nrOfElems = rowElems.length;

                // change margin
                var maxSave = (options.maxMargin - options.minMargin) * (nrOfElems - 1);
                if (maxSave < diff) {
                    var rowMargin = options.minMargin;
                    diff -= (options.maxMargin - options.minMargin) * (nrOfElems - 1);
                } else {
                    var rowMargin = options.maxMargin - diff / (nrOfElems - 1);
                    diff = 0;
                }

                var rowElem,
                    newHeight = null,
                    widthDiff = 0;
                for (var rowElemIndex = 0; rowElemIndex < rowElems.length; rowElemIndex++) {
                    rowElem = rowElems[rowElemIndex];

                    var rowElemWidth = itemAttrs[index + parseInt(rowElemIndex) - rowElems.length + 1].width;
                    var newWidth = rowElemWidth - (rowElemWidth / rowWidth) * diff;
                    newHeight = newHeight || Math.round(itemAttrs[index + parseInt(rowElemIndex) - rowElems.length + 1].height * (newWidth / rowElemWidth));

                    if (widthDiff + 1 - newWidth % 1 >= 0.5) {
                        widthDiff -= newWidth % 1;
                        newWidth = Math.floor(newWidth);
                    } else {
                        widthDiff += 1 - newWidth % 1;
                        newWidth = Math.ceil(newWidth);
                    }

                    var css = 'width: ' + newWidth + 'px;' +
                        'height: ' + newHeight + 'px;';

                    if (rowElemIndex < rowElems.length - 1) {
                        css += 'margin-right: ' + rowMargin + 'px';
                    }

                    rowElem.style.cssText = css;

                    if (rowElemIndex === 0 && !!options.firstItemClass) {
                        rowElem.className += ' ' + options.firstItemClass;
                    }
                }

                rowElems = [],
                    rowWidth = 0;
            }
        }
    }
};

if (typeof exports === 'object') {
    module.exports = rowGrid;
}
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJyb3ctZ3JpZC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgcm93R3JpZCA9IGZ1bmN0aW9uKGNvbnRhaW5lciwgb3B0aW9ucykge1xyXG4gICAgaWYgKGNvbnRhaW5lciA9PT0gbnVsbCB8fCBjb250YWluZXIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBpZiAob3B0aW9ucyA9PT0gJ2FwcGVuZGVkJykge1xyXG4gICAgICAgIG9wdGlvbnMgPSBKU09OLnBhcnNlKGNvbnRhaW5lci5nZXRBdHRyaWJ1dGUoJ2RhdGEtcm93LWdyaWQnKSk7XHJcbiAgICAgICAgdmFyIGxhc3RSb3cgPSBjb250YWluZXIuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShvcHRpb25zLmxhc3RSb3dDbGFzcylbMF07XHJcbiAgICAgICAgdmFyIGl0ZW1zID0gbmV4dEFsbChsYXN0Um93KTtcclxuICAgICAgICBsYXlvdXQoY29udGFpbmVyLCBvcHRpb25zLCBpdGVtcyk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGlmICghb3B0aW9ucykge1xyXG4gICAgICAgICAgICBvcHRpb25zID0gSlNPTi5wYXJzZShjb250YWluZXIuZ2V0QXR0cmlidXRlKCdkYXRhLXJvdy1ncmlkJykpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnJlc2l6ZSA9PT0gdW5kZWZpbmVkKSBvcHRpb25zLnJlc2l6ZSA9IHRydWU7XHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLm1pbldpZHRoID09PSB1bmRlZmluZWQpIG9wdGlvbnMubWluV2lkdGggPSAwO1xyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5sYXN0Um93Q2xhc3MgPT09IHVuZGVmaW5lZCkgb3B0aW9ucy5sYXN0Um93Q2xhc3MgPSAnbGFzdC1yb3cnO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGF5b3V0KGNvbnRhaW5lciwgb3B0aW9ucyk7XHJcblxyXG4gICAgICAgIGNvbnRhaW5lci5zZXRBdHRyaWJ1dGUoJ2RhdGEtcm93LWdyaWQnLCBKU09OLnN0cmluZ2lmeShvcHRpb25zKSk7XHJcblxyXG4gICAgICAgIGlmIChvcHRpb25zLnJlc2l6ZSkge1xyXG4gICAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICAgICAgICAgIGxheW91dChjb250YWluZXIsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyogR2V0IGVsZW0gYW5kIGFsbCBmb2xsb3dpbmcgc2libGluZ3Mgb2YgZWxlbSAqL1xyXG4gICAgZnVuY3Rpb24gbmV4dEFsbChlbGVtKSB7XHJcbiAgICAgICAgdmFyIG1hdGNoZWQgPSBbZWxlbV07XHJcblxyXG4gICAgICAgIHdoaWxlICgoZWxlbSA9IGVsZW1bJ25leHRTaWJsaW5nJ10pICYmIGVsZW0ubm9kZVR5cGUgIT09IDkpIHtcclxuICAgICAgICAgICAgaWYgKGVsZW0ubm9kZVR5cGUgPT09IDEpIHtcclxuICAgICAgICAgICAgICAgIG1hdGNoZWQucHVzaChlbGVtKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbWF0Y2hlZDtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBsYXlvdXQoY29udGFpbmVyLCBvcHRpb25zLCBpdGVtcykge1xyXG4gICAgICAgIHZhciByb3dXaWR0aCA9IDAsXHJcbiAgICAgICAgICAgIHJvd0VsZW1zID0gW10sXHJcbiAgICAgICAgICAgIGl0ZW1zID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoaXRlbXMgfHwgY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwob3B0aW9ucy5pdGVtU2VsZWN0b3IpKSxcclxuICAgICAgICAgICAgaXRlbXNTaXplID0gaXRlbXMubGVuZ3RoXHJcbiAgICAgICAgc2luZ2xlSW1hZ2VQZXJSb3cgPSAhIXdpbmRvdy5tYXRjaE1lZGlhICYmICF3aW5kb3cubWF0Y2hNZWRpYSgnKG1pbi13aWR0aDonICsgb3B0aW9ucy5taW5XaWR0aCArICdweCknKS5tYXRjaGVzO1xyXG5cclxuICAgICAgICAvLyByZWFkXHJcbiAgICAgICAgdmFyIGNvbnRhaW5lclN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShjb250YWluZXIpO1xyXG4gICAgICAgIHZhciBjb250YWluZXJXaWR0aCA9IE1hdGguZmxvb3IoY29udGFpbmVyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLndpZHRoKSAtIHBhcnNlRmxvYXQoY29udGFpbmVyU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgncGFkZGluZy1sZWZ0JykpIC0gcGFyc2VGbG9hdChjb250YWluZXJTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdwYWRkaW5nLXJpZ2h0JykpO1xyXG4gICAgICAgIHZhciBpdGVtQXR0cnMgPSBbXTtcclxuICAgICAgICB2YXIgdGhlSW1hZ2UsIHcsIGg7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpdGVtc1NpemU7ICsraSkge1xyXG4gICAgICAgICAgICB0aGVJbWFnZSA9IGl0ZW1zW2ldLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpbWcnKVswXTtcclxuICAgICAgICAgICAgaWYgKCF0aGVJbWFnZSkge1xyXG4gICAgICAgICAgICAgICAgaXRlbXMuc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICAgICAgLS1pO1xyXG4gICAgICAgICAgICAgICAgLS1pdGVtc1NpemU7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBnZXQgd2lkdGggYW5kIGhlaWdodCB2aWEgYXR0cmlidXRlIG9yIGpzIHZhbHVlXHJcbiAgICAgICAgICAgIGlmICghKHcgPSBwYXJzZUludCh0aGVJbWFnZS5nZXRBdHRyaWJ1dGUoJ3dpZHRoJykpKSkge1xyXG4gICAgICAgICAgICAgICAgdGhlSW1hZ2Uuc2V0QXR0cmlidXRlKCd3aWR0aCcsIHcgPSB0aGVJbWFnZS5vZmZzZXRXaWR0aCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCEoaCA9IHBhcnNlSW50KHRoZUltYWdlLmdldEF0dHJpYnV0ZSgnaGVpZ2h0JykpKSkge1xyXG4gICAgICAgICAgICAgICAgdGhlSW1hZ2Uuc2V0QXR0cmlidXRlKCdoZWlnaHQnLCBoID0gdGhlSW1hZ2Uub2Zmc2V0SGVpZ2h0KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaXRlbUF0dHJzW2ldID0ge1xyXG4gICAgICAgICAgICAgICAgd2lkdGg6IHcsXHJcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IGhcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHdyaXRlXHJcbiAgICAgICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IGl0ZW1zU2l6ZTsgKytpbmRleCkge1xyXG4gICAgICAgICAgICBpZiAoaXRlbXNbaW5kZXhdLmNsYXNzTGlzdCkge1xyXG4gICAgICAgICAgICAgICAgaXRlbXNbaW5kZXhdLmNsYXNzTGlzdC5yZW1vdmUob3B0aW9ucy5maXJzdEl0ZW1DbGFzcyk7XHJcbiAgICAgICAgICAgICAgICBpdGVtc1tpbmRleF0uY2xhc3NMaXN0LnJlbW92ZShvcHRpb25zLmxhc3RSb3dDbGFzcyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBJRSA8MTBcclxuICAgICAgICAgICAgICAgIGl0ZW1zW2luZGV4XS5jbGFzc05hbWUgPSBpdGVtc1tpbmRleF0uY2xhc3NOYW1lLnJlcGxhY2UobmV3IFJlZ0V4cCgnKF58XFxcXGIpJyArIG9wdGlvbnMuZmlyc3RJdGVtQ2xhc3MgKyAnfCcgKyBvcHRpb25zLmxhc3RSb3dDbGFzcyArICcoXFxcXGJ8JCknLCAnZ2knKSwgJyAnKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gYWRkIGVsZW1lbnQgdG8gcm93XHJcbiAgICAgICAgICAgIHJvd1dpZHRoICs9IGl0ZW1BdHRyc1tpbmRleF0ud2lkdGg7XHJcbiAgICAgICAgICAgIHJvd0VsZW1zLnB1c2goaXRlbXNbaW5kZXhdKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGNoZWNrIGlmIGl0IGlzIHRoZSBsYXN0IGVsZW1lbnRcclxuICAgICAgICAgICAgaWYgKGluZGV4ID09PSBpdGVtc1NpemUgLSAxKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciByb3dFbGVtSW5kZXggPSAwOyByb3dFbGVtSW5kZXggPCByb3dFbGVtcy5sZW5ndGg7IHJvd0VsZW1JbmRleCsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgZmlyc3QgZWxlbWVudCBpbiByb3dcclxuICAgICAgICAgICAgICAgICAgICBpZiAocm93RWxlbUluZGV4ID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJvd0VsZW1zW3Jvd0VsZW1JbmRleF0uY2xhc3NOYW1lICs9ICcgJyArIG9wdGlvbnMubGFzdFJvd0NsYXNzO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNzcyA9ICd3aWR0aDogJyArIGl0ZW1BdHRyc1tpbmRleCArIHBhcnNlSW50KHJvd0VsZW1JbmRleCkgLSByb3dFbGVtcy5sZW5ndGggKyAxXS53aWR0aCArICdweDsnICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ2hlaWdodDogJyArIGl0ZW1BdHRyc1tpbmRleCArIHBhcnNlSW50KHJvd0VsZW1JbmRleCkgLSByb3dFbGVtcy5sZW5ndGggKyAxXS5oZWlnaHQgKyAncHg7JztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJvd0VsZW1JbmRleCA8IHJvd0VsZW1zLmxlbmd0aCAtIDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3NzICs9ICdtYXJnaW4tcmlnaHQ6JyArIG9wdGlvbnMubWluTWFyZ2luICsgJ3B4JztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJvd0VsZW1zW3Jvd0VsZW1JbmRleF0uc3R5bGUuY3NzVGV4dCA9IGNzcztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gY2hlY2sgd2hldGhlciB3aWR0aCBvZiByb3cgaXMgdG9vIGhpZ2hcclxuICAgICAgICAgICAgaWYgKHJvd1dpZHRoICsgb3B0aW9ucy5tYXhNYXJnaW4gKiAocm93RWxlbXMubGVuZ3RoIC0gMSkgPiBjb250YWluZXJXaWR0aCB8fCBzaW5nbGVJbWFnZVBlclJvdykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGRpZmYgPSByb3dXaWR0aCArIG9wdGlvbnMubWF4TWFyZ2luICogKHJvd0VsZW1zLmxlbmd0aCAtIDEpIC0gY29udGFpbmVyV2lkdGg7XHJcbiAgICAgICAgICAgICAgICB2YXIgbnJPZkVsZW1zID0gcm93RWxlbXMubGVuZ3RoO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGNoYW5nZSBtYXJnaW5cclxuICAgICAgICAgICAgICAgIHZhciBtYXhTYXZlID0gKG9wdGlvbnMubWF4TWFyZ2luIC0gb3B0aW9ucy5taW5NYXJnaW4pICogKG5yT2ZFbGVtcyAtIDEpO1xyXG4gICAgICAgICAgICAgICAgaWYgKG1heFNhdmUgPCBkaWZmKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJvd01hcmdpbiA9IG9wdGlvbnMubWluTWFyZ2luO1xyXG4gICAgICAgICAgICAgICAgICAgIGRpZmYgLT0gKG9wdGlvbnMubWF4TWFyZ2luIC0gb3B0aW9ucy5taW5NYXJnaW4pICogKG5yT2ZFbGVtcyAtIDEpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcm93TWFyZ2luID0gb3B0aW9ucy5tYXhNYXJnaW4gLSBkaWZmIC8gKG5yT2ZFbGVtcyAtIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgIGRpZmYgPSAwO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhciByb3dFbGVtLFxyXG4gICAgICAgICAgICAgICAgICAgIG5ld0hlaWdodCA9IG51bGwsXHJcbiAgICAgICAgICAgICAgICAgICAgd2lkdGhEaWZmID0gMDtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIHJvd0VsZW1JbmRleCA9IDA7IHJvd0VsZW1JbmRleCA8IHJvd0VsZW1zLmxlbmd0aDsgcm93RWxlbUluZGV4KyspIHtcclxuICAgICAgICAgICAgICAgICAgICByb3dFbGVtID0gcm93RWxlbXNbcm93RWxlbUluZGV4XTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJvd0VsZW1XaWR0aCA9IGl0ZW1BdHRyc1tpbmRleCArIHBhcnNlSW50KHJvd0VsZW1JbmRleCkgLSByb3dFbGVtcy5sZW5ndGggKyAxXS53aWR0aDtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3V2lkdGggPSByb3dFbGVtV2lkdGggLSAocm93RWxlbVdpZHRoIC8gcm93V2lkdGgpICogZGlmZjtcclxuICAgICAgICAgICAgICAgICAgICBuZXdIZWlnaHQgPSBuZXdIZWlnaHQgfHwgTWF0aC5yb3VuZChpdGVtQXR0cnNbaW5kZXggKyBwYXJzZUludChyb3dFbGVtSW5kZXgpIC0gcm93RWxlbXMubGVuZ3RoICsgMV0uaGVpZ2h0ICogKG5ld1dpZHRoIC8gcm93RWxlbVdpZHRoKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh3aWR0aERpZmYgKyAxIC0gbmV3V2lkdGggJSAxID49IDAuNSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aERpZmYgLT0gbmV3V2lkdGggJSAxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdXaWR0aCA9IE1hdGguZmxvb3IobmV3V2lkdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoRGlmZiArPSAxIC0gbmV3V2lkdGggJSAxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdXaWR0aCA9IE1hdGguY2VpbChuZXdXaWR0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgY3NzID0gJ3dpZHRoOiAnICsgbmV3V2lkdGggKyAncHg7JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdoZWlnaHQ6ICcgKyBuZXdIZWlnaHQgKyAncHg7JztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJvd0VsZW1JbmRleCA8IHJvd0VsZW1zLmxlbmd0aCAtIDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3NzICs9ICdtYXJnaW4tcmlnaHQ6ICcgKyByb3dNYXJnaW4gKyAncHgnO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcm93RWxlbS5zdHlsZS5jc3NUZXh0ID0gY3NzO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAocm93RWxlbUluZGV4ID09PSAwICYmICEhb3B0aW9ucy5maXJzdEl0ZW1DbGFzcykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByb3dFbGVtLmNsYXNzTmFtZSArPSAnICcgKyBvcHRpb25zLmZpcnN0SXRlbUNsYXNzO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByb3dFbGVtcyA9IFtdLFxyXG4gICAgICAgICAgICAgICAgICAgIHJvd1dpZHRoID0gMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbmlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gcm93R3JpZDtcclxufSJdLCJmaWxlIjoicm93LWdyaWQuanMifQ==
