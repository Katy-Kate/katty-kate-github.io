//-----preloader-----
$(window).load(function() {
    setTimeout(function() {
        $('.preloader').fadeOut('slow', function() {});
    }, 2000);

});

$(document).ready()
{
   //-----mobilemenu-----
    $('.mobile-nav-button').on('click', function() {
        $( ".mobile-nav-button .mobile-nav-button__line:nth-of-type(1)" ).toggleClass( "mobile-nav-button__line--1");
        $( ".mobile-nav-button .mobile-nav-button__line:nth-of-type(2)" ).toggleClass( "mobile-nav-button__line--2");
        $( ".mobile-nav-button .mobile-nav-button__line:nth-of-type(3)" ).toggleClass( "mobile-nav-button__line--3");
        $('.mobile-menu').toggleClass('mobile-menu--open');
        return false;
    });
    //------Slider -------
    $(window).load(function () {
        $('.flexslider').flexslider({
            animation: "slide"
        });
    });
    $('.carousel').slick( );

     //----gallery -  START------------

    function openModal() {
        document.getElementById('myModal').style.display = "block";
    }

    function closeModal() {
        document.getElementById('myModal').style.display = "none";
    }

    var slideIndex = 1;
    showSlides(slideIndex);

    function plusSlides(n) {
        showSlides(slideIndex += n);
    }

    function currentSlide(n) {
        showSlides(slideIndex = n);
    }
    function showSlides(n) {
        var i;
        var slides = document.getElementsByClassName("mySlides");
        var dots = document.getElementsByClassName("demo");
        var captionText = document.getElementById("caption");
        if (n > slides.length) {slideIndex = 1}
        if (n < 1) {slideIndex = slides.length}
        for (i = 0; i < slides.length; i++) {
            slides[i].style.display = "none";
        }
        for (i = 0; i < dots.length; i++) {
            dots[i].className = dots[i].className.replace(" active", "");
        }
        slides[slideIndex-1].style.display = "block";
        dots[slideIndex-1].className += " active";
        // captionText.innerHTML = dots[slideIndex-1].alt;
    }

    //----gallery -  AND------------

    //---------smooth transition
    $("body").on("click","a", function (event) {
        event.preventDefault();
        var id  = $(this).attr('href'),
            top = $(id).offset().top;
        $('html').animate({scrollTop: top}, 1500);
    });
     //---------appearance of content during page loading

        $('.headline').addClass("fade");
        $('.btn').addClass("fade");
        $('.plan').addClass("fade");
        $('.gallery_photoset').addClass("fade");
        $('input').addClass("fade");
        $('.social-networks_item').addClass("bounce-Right");


        $('.fade').addClass("hidden").viewportChecker({
            classToAdd: 'visible animated fadeIn', // Class to add to the elements when they are visible
            offset: 100
        });
        $('.bounce-Left').addClass("hidden").viewportChecker({
            classToAdd: 'visible animated bounceInLeft', // Class to add to the elements when they are visible
            offset: 100
        });
        $('.bounce-Right').addClass("hidden").viewportChecker({
            classToAdd: 'visible animated bounceInRight', // Class to add to the elements when they are visible
            offset: 100
        });
        $('.bounce-Up').addClass("hidden").viewportChecker({
            classToAdd: 'visible animated bounceInUp', // Class to add to the elements when they are visible
            offset: 100
        });

    //---------
};
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJqcy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLy0tLS0tcHJlbG9hZGVyLS0tLS1cclxuJCh3aW5kb3cpLmxvYWQoZnVuY3Rpb24oKSB7XHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICQoJy5wcmVsb2FkZXInKS5mYWRlT3V0KCdzbG93JywgZnVuY3Rpb24oKSB7fSk7XHJcbiAgICB9LCAyMDAwKTtcclxuXHJcbn0pO1xyXG5cclxuJChkb2N1bWVudCkucmVhZHkoKVxyXG57XHJcbiAgIC8vLS0tLS1tb2JpbGVtZW51LS0tLS1cclxuICAgICQoJy5tb2JpbGUtbmF2LWJ1dHRvbicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICQoIFwiLm1vYmlsZS1uYXYtYnV0dG9uIC5tb2JpbGUtbmF2LWJ1dHRvbl9fbGluZTpudGgtb2YtdHlwZSgxKVwiICkudG9nZ2xlQ2xhc3MoIFwibW9iaWxlLW5hdi1idXR0b25fX2xpbmUtLTFcIik7XHJcbiAgICAgICAgJCggXCIubW9iaWxlLW5hdi1idXR0b24gLm1vYmlsZS1uYXYtYnV0dG9uX19saW5lOm50aC1vZi10eXBlKDIpXCIgKS50b2dnbGVDbGFzcyggXCJtb2JpbGUtbmF2LWJ1dHRvbl9fbGluZS0tMlwiKTtcclxuICAgICAgICAkKCBcIi5tb2JpbGUtbmF2LWJ1dHRvbiAubW9iaWxlLW5hdi1idXR0b25fX2xpbmU6bnRoLW9mLXR5cGUoMylcIiApLnRvZ2dsZUNsYXNzKCBcIm1vYmlsZS1uYXYtYnV0dG9uX19saW5lLS0zXCIpO1xyXG4gICAgICAgICQoJy5tb2JpbGUtbWVudScpLnRvZ2dsZUNsYXNzKCdtb2JpbGUtbWVudS0tb3BlbicpO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG4gICAgLy8tLS0tLS1TbGlkZXIgLS0tLS0tLVxyXG4gICAgJCh3aW5kb3cpLmxvYWQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICQoJy5mbGV4c2xpZGVyJykuZmxleHNsaWRlcih7XHJcbiAgICAgICAgICAgIGFuaW1hdGlvbjogXCJzbGlkZVwiXHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuICAgICQoJy5jYXJvdXNlbCcpLnNsaWNrKCApO1xyXG5cclxuICAgICAvLy0tLS1nYWxsZXJ5IC0gIFNUQVJULS0tLS0tLS0tLS0tXHJcblxyXG4gICAgZnVuY3Rpb24gb3Blbk1vZGFsKCkge1xyXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdteU1vZGFsJykuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBjbG9zZU1vZGFsKCkge1xyXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdteU1vZGFsJykuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBzbGlkZUluZGV4ID0gMTtcclxuICAgIHNob3dTbGlkZXMoc2xpZGVJbmRleCk7XHJcblxyXG4gICAgZnVuY3Rpb24gcGx1c1NsaWRlcyhuKSB7XHJcbiAgICAgICAgc2hvd1NsaWRlcyhzbGlkZUluZGV4ICs9IG4pO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGN1cnJlbnRTbGlkZShuKSB7XHJcbiAgICAgICAgc2hvd1NsaWRlcyhzbGlkZUluZGV4ID0gbik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBzaG93U2xpZGVzKG4pIHtcclxuICAgICAgICB2YXIgaTtcclxuICAgICAgICB2YXIgc2xpZGVzID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcIm15U2xpZGVzXCIpO1xyXG4gICAgICAgIHZhciBkb3RzID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcImRlbW9cIik7XHJcbiAgICAgICAgdmFyIGNhcHRpb25UZXh0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjYXB0aW9uXCIpO1xyXG4gICAgICAgIGlmIChuID4gc2xpZGVzLmxlbmd0aCkge3NsaWRlSW5kZXggPSAxfVxyXG4gICAgICAgIGlmIChuIDwgMSkge3NsaWRlSW5kZXggPSBzbGlkZXMubGVuZ3RofVxyXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBzbGlkZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgc2xpZGVzW2ldLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGRvdHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgZG90c1tpXS5jbGFzc05hbWUgPSBkb3RzW2ldLmNsYXNzTmFtZS5yZXBsYWNlKFwiIGFjdGl2ZVwiLCBcIlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgc2xpZGVzW3NsaWRlSW5kZXgtMV0uc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcclxuICAgICAgICBkb3RzW3NsaWRlSW5kZXgtMV0uY2xhc3NOYW1lICs9IFwiIGFjdGl2ZVwiO1xyXG4gICAgICAgIC8vIGNhcHRpb25UZXh0LmlubmVySFRNTCA9IGRvdHNbc2xpZGVJbmRleC0xXS5hbHQ7XHJcbiAgICB9XHJcblxyXG4gICAgLy8tLS0tZ2FsbGVyeSAtICBBTkQtLS0tLS0tLS0tLS1cclxuXHJcbiAgICAvLy0tLS0tLS0tLXNtb290aCB0cmFuc2l0aW9uXHJcbiAgICAkKFwiYm9keVwiKS5vbihcImNsaWNrXCIsXCJhXCIsIGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgdmFyIGlkICA9ICQodGhpcykuYXR0cignaHJlZicpLFxyXG4gICAgICAgICAgICB0b3AgPSAkKGlkKS5vZmZzZXQoKS50b3A7XHJcbiAgICAgICAgJCgnaHRtbCcpLmFuaW1hdGUoe3Njcm9sbFRvcDogdG9wfSwgMTUwMCk7XHJcbiAgICB9KTtcclxuICAgICAvLy0tLS0tLS0tLWFwcGVhcmFuY2Ugb2YgY29udGVudCBkdXJpbmcgcGFnZSBsb2FkaW5nXHJcblxyXG4gICAgICAgICQoJy5oZWFkbGluZScpLmFkZENsYXNzKFwiZmFkZVwiKTtcclxuICAgICAgICAkKCcuYnRuJykuYWRkQ2xhc3MoXCJmYWRlXCIpO1xyXG4gICAgICAgICQoJy5wbGFuJykuYWRkQ2xhc3MoXCJmYWRlXCIpO1xyXG4gICAgICAgICQoJy5nYWxsZXJ5X3Bob3Rvc2V0JykuYWRkQ2xhc3MoXCJmYWRlXCIpO1xyXG4gICAgICAgICQoJ2lucHV0JykuYWRkQ2xhc3MoXCJmYWRlXCIpO1xyXG4gICAgICAgICQoJy5zb2NpYWwtbmV0d29ya3NfaXRlbScpLmFkZENsYXNzKFwiYm91bmNlLVJpZ2h0XCIpO1xyXG5cclxuXHJcbiAgICAgICAgJCgnLmZhZGUnKS5hZGRDbGFzcyhcImhpZGRlblwiKS52aWV3cG9ydENoZWNrZXIoe1xyXG4gICAgICAgICAgICBjbGFzc1RvQWRkOiAndmlzaWJsZSBhbmltYXRlZCBmYWRlSW4nLCAvLyBDbGFzcyB0byBhZGQgdG8gdGhlIGVsZW1lbnRzIHdoZW4gdGhleSBhcmUgdmlzaWJsZVxyXG4gICAgICAgICAgICBvZmZzZXQ6IDEwMFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgICQoJy5ib3VuY2UtTGVmdCcpLmFkZENsYXNzKFwiaGlkZGVuXCIpLnZpZXdwb3J0Q2hlY2tlcih7XHJcbiAgICAgICAgICAgIGNsYXNzVG9BZGQ6ICd2aXNpYmxlIGFuaW1hdGVkIGJvdW5jZUluTGVmdCcsIC8vIENsYXNzIHRvIGFkZCB0byB0aGUgZWxlbWVudHMgd2hlbiB0aGV5IGFyZSB2aXNpYmxlXHJcbiAgICAgICAgICAgIG9mZnNldDogMTAwXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgJCgnLmJvdW5jZS1SaWdodCcpLmFkZENsYXNzKFwiaGlkZGVuXCIpLnZpZXdwb3J0Q2hlY2tlcih7XHJcbiAgICAgICAgICAgIGNsYXNzVG9BZGQ6ICd2aXNpYmxlIGFuaW1hdGVkIGJvdW5jZUluUmlnaHQnLCAvLyBDbGFzcyB0byBhZGQgdG8gdGhlIGVsZW1lbnRzIHdoZW4gdGhleSBhcmUgdmlzaWJsZVxyXG4gICAgICAgICAgICBvZmZzZXQ6IDEwMFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgICQoJy5ib3VuY2UtVXAnKS5hZGRDbGFzcyhcImhpZGRlblwiKS52aWV3cG9ydENoZWNrZXIoe1xyXG4gICAgICAgICAgICBjbGFzc1RvQWRkOiAndmlzaWJsZSBhbmltYXRlZCBib3VuY2VJblVwJywgLy8gQ2xhc3MgdG8gYWRkIHRvIHRoZSBlbGVtZW50cyB3aGVuIHRoZXkgYXJlIHZpc2libGVcclxuICAgICAgICAgICAgb2Zmc2V0OiAxMDBcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAvLy0tLS0tLS0tLVxyXG59OyJdLCJmaWxlIjoianMuanMifQ==
