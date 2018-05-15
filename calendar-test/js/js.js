

/*jslint white: true, browser: true, undef: true, nomen: true, eqeqeq: true, plusplus: false, bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxerr: 14 */
/*global window: false, REDIPS: true */

/* enable strict mode */
"use strict";

// define redips_init and random color generator
var redipsInit,
    rd,
    rndColor;

// redips initialization
redipsInit = function () {
    // reference to the REDIPS.drag lib
     rd = REDIPS.drag;
    // initialization
    rd.init();
    // dragged elements can be placed to the empty cells only
    rd.dropMode = 'single';
    // every change of current TD will have different background color
    rd.event.changed = function () {
        rd.hover.colorTd = rndColor();
    };
    rd.event.dropped = function () {
       
        $( "#table2 .box-wrapper" ).resizable({
   
        });
        $( "#table1 .ui-resizable" ).removeAttr("style");
        $( "#table1 .ui-resizable" ).resizable( "destroy" );
        $( "#table3 .ui-resizable" ).removeAttr("style");
        $( "#table3 .ui-resizable" ).resizable( "destroy" );


    };
    rd.enableDrag(false, '.redips-drag');
};

// random color generator - http://www.redips.net/javascript/random-color-generator/
function rndColor() {
    var hex = '0123456789ABCDEF'.split(''),
        color = '#', i;
    for (i = 0; i < 6 ; i++) {
        color = color + hex[Math.floor(Math.random() * 16)];
    }
    return color;
}

// add onload event listener
if (window.addEventListener) {
    window.addEventListener('load', redipsInit, false);
}
else if (window.attachEvent) {
    window.attachEvent('onload', redipsInit);
};

function enableDrop(e){

    var parent = e.parentNode;
    rd.enableDrag(true, parent);
};
function disableDrop(e){

    var parent = e.parentNode;
    rd.enableDrag(false, parent);
};
$(document).ready(function(){
    $( "#table2 .box-wrapper" ).resizable();
    $( "#table3 .box-wrapper" ).resizable();
   

});



//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJqcy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJcclxuXHJcbi8qanNsaW50IHdoaXRlOiB0cnVlLCBicm93c2VyOiB0cnVlLCB1bmRlZjogdHJ1ZSwgbm9tZW46IHRydWUsIGVxZXFlcTogdHJ1ZSwgcGx1c3BsdXM6IGZhbHNlLCBiaXR3aXNlOiB0cnVlLCByZWdleHA6IHRydWUsIHN0cmljdDogdHJ1ZSwgbmV3Y2FwOiB0cnVlLCBpbW1lZDogdHJ1ZSwgbWF4ZXJyOiAxNCAqL1xyXG4vKmdsb2JhbCB3aW5kb3c6IGZhbHNlLCBSRURJUFM6IHRydWUgKi9cclxuXHJcbi8qIGVuYWJsZSBzdHJpY3QgbW9kZSAqL1xyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcbi8vIGRlZmluZSByZWRpcHNfaW5pdCBhbmQgcmFuZG9tIGNvbG9yIGdlbmVyYXRvclxyXG52YXIgcmVkaXBzSW5pdCxcclxuICAgIHJkLFxyXG4gICAgcm5kQ29sb3I7XHJcblxyXG4vLyByZWRpcHMgaW5pdGlhbGl6YXRpb25cclxucmVkaXBzSW5pdCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIHJlZmVyZW5jZSB0byB0aGUgUkVESVBTLmRyYWcgbGliXHJcbiAgICAgcmQgPSBSRURJUFMuZHJhZztcclxuICAgIC8vIGluaXRpYWxpemF0aW9uXHJcbiAgICByZC5pbml0KCk7XHJcbiAgICAvLyBkcmFnZ2VkIGVsZW1lbnRzIGNhbiBiZSBwbGFjZWQgdG8gdGhlIGVtcHR5IGNlbGxzIG9ubHlcclxuICAgIHJkLmRyb3BNb2RlID0gJ3NpbmdsZSc7XHJcbiAgICAvLyBldmVyeSBjaGFuZ2Ugb2YgY3VycmVudCBURCB3aWxsIGhhdmUgZGlmZmVyZW50IGJhY2tncm91bmQgY29sb3JcclxuICAgIHJkLmV2ZW50LmNoYW5nZWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmQuaG92ZXIuY29sb3JUZCA9IHJuZENvbG9yKCk7XHJcbiAgICB9O1xyXG4gICAgcmQuZXZlbnQuZHJvcHBlZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgLy9kZWJ1Z2dlcjtcclxuICAgICAgICAvLyB2YXIgZGRmZCA9ICAkKCBcIiN0YWJsZTIgLmJveC13cmFwcGVyXCIgKTtcclxuICAgICAgICAkKCBcIiN0YWJsZTIgLmJveC13cmFwcGVyXCIgKS5yZXNpemFibGUoe1xyXG4gICAgICAgICAgICAvL2NvbnRhaW5tZW50OiBcIiN0YWJsZTJcIlxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgICQoIFwiI3RhYmxlMSAudWktcmVzaXphYmxlXCIgKS5yZW1vdmVBdHRyKFwic3R5bGVcIik7XHJcbiAgICAgICAgJCggXCIjdGFibGUxIC51aS1yZXNpemFibGVcIiApLnJlc2l6YWJsZSggXCJkZXN0cm95XCIgKTtcclxuICAgICAgICAkKCBcIiN0YWJsZTMgLnVpLXJlc2l6YWJsZVwiICkucmVtb3ZlQXR0cihcInN0eWxlXCIpO1xyXG4gICAgICAgICQoIFwiI3RhYmxlMyAudWktcmVzaXphYmxlXCIgKS5yZXNpemFibGUoIFwiZGVzdHJveVwiICk7XHJcblxyXG5cclxuICAgIH07XHJcbiAgICByZC5lbmFibGVEcmFnKGZhbHNlLCAnLnJlZGlwcy1kcmFnJyk7XHJcbn07XHJcblxyXG4vLyByYW5kb20gY29sb3IgZ2VuZXJhdG9yIC0gaHR0cDovL3d3dy5yZWRpcHMubmV0L2phdmFzY3JpcHQvcmFuZG9tLWNvbG9yLWdlbmVyYXRvci9cclxuZnVuY3Rpb24gcm5kQ29sb3IoKSB7XHJcbiAgICB2YXIgaGV4ID0gJzAxMjM0NTY3ODlBQkNERUYnLnNwbGl0KCcnKSxcclxuICAgICAgICBjb2xvciA9ICcjJywgaTtcclxuICAgIGZvciAoaSA9IDA7IGkgPCA2IDsgaSsrKSB7XHJcbiAgICAgICAgY29sb3IgPSBjb2xvciArIGhleFtNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxNildO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGNvbG9yO1xyXG59XHJcblxyXG4vLyBhZGQgb25sb2FkIGV2ZW50IGxpc3RlbmVyXHJcbmlmICh3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcikge1xyXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCByZWRpcHNJbml0LCBmYWxzZSk7XHJcbn1cclxuZWxzZSBpZiAod2luZG93LmF0dGFjaEV2ZW50KSB7XHJcbiAgICB3aW5kb3cuYXR0YWNoRXZlbnQoJ29ubG9hZCcsIHJlZGlwc0luaXQpO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gZW5hYmxlRHJvcChlKXtcclxuXHJcbiAgICB2YXIgcGFyZW50ID0gZS5wYXJlbnROb2RlO1xyXG4gICAgcmQuZW5hYmxlRHJhZyh0cnVlLCBwYXJlbnQpO1xyXG59O1xyXG5mdW5jdGlvbiBkaXNhYmxlRHJvcChlKXtcclxuXHJcbiAgICB2YXIgcGFyZW50ID0gZS5wYXJlbnROb2RlO1xyXG4gICAgcmQuZW5hYmxlRHJhZyhmYWxzZSwgcGFyZW50KTtcclxufTtcclxuJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKXtcclxuICAgICQoIFwiI3RhYmxlMiAuYm94LXdyYXBwZXJcIiApLnJlc2l6YWJsZSgpO1xyXG4gICAgJCggXCIjdGFibGUzIC5ib3gtd3JhcHBlclwiICkucmVzaXphYmxlKCk7XHJcbiAgICAvLyQoIFwiLmJveC13cmFwcGVyXCIgKS5vbiggXCJyZXNpemVzdGFydFwiLCBmdW5jdGlvbiggZXZlbnQsIHVpICkge1xyXG4gICAgICAgIC8vZGVidWdnZXI7XHJcbiAgICAgICAgLy8gdmFyIGRkZj0gdGhpcztcclxuICAgICAgICAvLyB2YXIgd2lkZ2V0ID0gJCggXCIjdGFibGUyIC5ib3gtd3JhcHBlclwiICkucmVzaXphYmxlKCBcIndpZGdldFwiICk7XHJcbiAgICAgICAgLy9cclxuICAgICAgICAvLyBkZGYuc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XHJcbiAgICAgICAgLy9cclxuICAgICAgICAvLyB2YXIgcGFyZW50ID0gIGRkZi5wYXJlbnROb2RlO1xyXG4gICAgICAgIC8vIHBhcmVudC5zdHlsZS5wb3NpdGlvbiA9IFwicmVsYXRpdmVcIjtcclxuXHJcblxyXG4gICAgLy99ICk7XHJcblxyXG59KTtcclxuXHJcblxyXG4iXSwiZmlsZSI6ImpzLmpzIn0=
