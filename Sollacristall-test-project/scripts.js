//------------------------------- open aside-right and left blocks START

$('.header_nav__item--aside-left').click(function() {
    $('.aside-left').addClass('aside-left--open');

});
$('.header_nav__item--aside-right').click(function() {
    $('.aside-right').addClass('aside-right--open');

});

$('.aside_close--left').click(function() {
    $('.aside-left').removeClass('aside-left--open');

});

$('.aside_close--right').click(function() {
    $('.aside-right').removeClass('aside-right--open');

});
// ---------------------------------open aside-right and left blocks END


// ----------------------------------fixing right block  START
$(document).ready(function() {
    var isDesktop = (function() {
        return !('ontouchstart' in window) // works on most browsers
            || !('onmsgesturechange' in window); // works on ie10
    })();

    window.isDesktop = isDesktop;
    if( isDesktop ){
        var $menu = $(".header");
        $(window).scroll(function(){
            if ( $(this).scrollTop() > 140  ) {
                $(".main_right__wrapper").addClass("fixed");
            }
            else if($(this).scrollTop() <= 140 ) {
                $(".main_right__wrapper").removeClass("fixed");
            }
        });
    }
});
// ----------------------------------fixing right block  END
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJzY3JpcHRzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBvcGVuIGFzaWRlLXJpZ2h0IGFuZCBsZWZ0IGJsb2NrcyBTVEFSVFxyXG5cclxuJCgnLmhlYWRlcl9uYXZfX2l0ZW0tLWFzaWRlLWxlZnQnKS5jbGljayhmdW5jdGlvbigpIHtcclxuICAgICQoJy5hc2lkZS1sZWZ0JykuYWRkQ2xhc3MoJ2FzaWRlLWxlZnQtLW9wZW4nKTtcclxuXHJcbn0pO1xyXG4kKCcuaGVhZGVyX25hdl9faXRlbS0tYXNpZGUtcmlnaHQnKS5jbGljayhmdW5jdGlvbigpIHtcclxuICAgICQoJy5hc2lkZS1yaWdodCcpLmFkZENsYXNzKCdhc2lkZS1yaWdodC0tb3BlbicpO1xyXG5cclxufSk7XHJcblxyXG4kKCcuYXNpZGVfY2xvc2UtLWxlZnQnKS5jbGljayhmdW5jdGlvbigpIHtcclxuICAgICQoJy5hc2lkZS1sZWZ0JykucmVtb3ZlQ2xhc3MoJ2FzaWRlLWxlZnQtLW9wZW4nKTtcclxuXHJcbn0pO1xyXG5cclxuJCgnLmFzaWRlX2Nsb3NlLS1yaWdodCcpLmNsaWNrKGZ1bmN0aW9uKCkge1xyXG4gICAgJCgnLmFzaWRlLXJpZ2h0JykucmVtb3ZlQ2xhc3MoJ2FzaWRlLXJpZ2h0LS1vcGVuJyk7XHJcblxyXG59KTtcclxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tb3BlbiBhc2lkZS1yaWdodCBhbmQgbGVmdCBibG9ja3MgRU5EXHJcblxyXG5cclxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLWZpeGluZyByaWdodCBibG9jayAgU1RBUlRcclxuJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgaXNEZXNrdG9wID0gKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiAhKCdvbnRvdWNoc3RhcnQnIGluIHdpbmRvdykgLy8gd29ya3Mgb24gbW9zdCBicm93c2Vyc1xyXG4gICAgICAgICAgICB8fCAhKCdvbm1zZ2VzdHVyZWNoYW5nZScgaW4gd2luZG93KTsgLy8gd29ya3Mgb24gaWUxMFxyXG4gICAgfSkoKTtcclxuXHJcbiAgICB3aW5kb3cuaXNEZXNrdG9wID0gaXNEZXNrdG9wO1xyXG4gICAgaWYoIGlzRGVza3RvcCApe1xyXG4gICAgICAgIHZhciAkbWVudSA9ICQoXCIuaGVhZGVyXCIpO1xyXG4gICAgICAgICQod2luZG93KS5zY3JvbGwoZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgaWYgKCAkKHRoaXMpLnNjcm9sbFRvcCgpID4gMTQwICApIHtcclxuICAgICAgICAgICAgICAgICQoXCIubWFpbl9yaWdodF9fd3JhcHBlclwiKS5hZGRDbGFzcyhcImZpeGVkXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYoJCh0aGlzKS5zY3JvbGxUb3AoKSA8PSAxNDAgKSB7XHJcbiAgICAgICAgICAgICAgICAkKFwiLm1haW5fcmlnaHRfX3dyYXBwZXJcIikucmVtb3ZlQ2xhc3MoXCJmaXhlZFwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59KTtcclxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLWZpeGluZyByaWdodCBibG9jayAgRU5EIl0sImZpbGUiOiJzY3JpcHRzLmpzIn0=
