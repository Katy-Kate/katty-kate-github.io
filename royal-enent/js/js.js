

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
    $("body").on("click","a", function (event) {
        event.preventDefault();
        var id  = $(this).attr('href'),
            top = $(id).offset().top;
        $('html').animate({scrollTop: top}, 1500);
    });
};
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJqcy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJcclxuXHJcbiQoZG9jdW1lbnQpLnJlYWR5KClcclxue1xyXG5cclxuXHJcbiAgIC8vLS0tLS1tb2JpbGVtZW51LS0tLS1cclxuICAgICQoJy5tb2JpbGUtbmF2LWJ1dHRvbicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICQoIFwiLm1vYmlsZS1uYXYtYnV0dG9uIC5tb2JpbGUtbmF2LWJ1dHRvbl9fbGluZTpudGgtb2YtdHlwZSgxKVwiICkudG9nZ2xlQ2xhc3MoIFwibW9iaWxlLW5hdi1idXR0b25fX2xpbmUtLTFcIik7XHJcbiAgICAgICAgJCggXCIubW9iaWxlLW5hdi1idXR0b24gLm1vYmlsZS1uYXYtYnV0dG9uX19saW5lOm50aC1vZi10eXBlKDIpXCIgKS50b2dnbGVDbGFzcyggXCJtb2JpbGUtbmF2LWJ1dHRvbl9fbGluZS0tMlwiKTtcclxuICAgICAgICAkKCBcIi5tb2JpbGUtbmF2LWJ1dHRvbiAubW9iaWxlLW5hdi1idXR0b25fX2xpbmU6bnRoLW9mLXR5cGUoMylcIiApLnRvZ2dsZUNsYXNzKCBcIm1vYmlsZS1uYXYtYnV0dG9uX19saW5lLS0zXCIpO1xyXG4gICAgICAgICQoJy5tb2JpbGUtbWVudScpLnRvZ2dsZUNsYXNzKCdtb2JpbGUtbWVudS0tb3BlbicpO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG4gICAgLy8tLS0tLS1TbGlkZXIgLS0tLS0tLVxyXG4gICAgJCh3aW5kb3cpLmxvYWQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICQoJy5mbGV4c2xpZGVyJykuZmxleHNsaWRlcih7XHJcbiAgICAgICAgICAgIGFuaW1hdGlvbjogXCJzbGlkZVwiXHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuICAgICQoJy5jYXJvdXNlbCcpLnNsaWNrKCApO1xyXG5cclxuICAgICAvLy0tLS1nYWxsZXJ5IC0gIFNUQVJULS0tLS0tLS0tLS0tXHJcblxyXG4gICAgZnVuY3Rpb24gb3Blbk1vZGFsKCkge1xyXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdteU1vZGFsJykuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBjbG9zZU1vZGFsKCkge1xyXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdteU1vZGFsJykuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBzbGlkZUluZGV4ID0gMTtcclxuICAgIHNob3dTbGlkZXMoc2xpZGVJbmRleCk7XHJcblxyXG4gICAgZnVuY3Rpb24gcGx1c1NsaWRlcyhuKSB7XHJcbiAgICAgICAgc2hvd1NsaWRlcyhzbGlkZUluZGV4ICs9IG4pO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGN1cnJlbnRTbGlkZShuKSB7XHJcbiAgICAgICAgc2hvd1NsaWRlcyhzbGlkZUluZGV4ID0gbik7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gc2hvd1NsaWRlcyhuKSB7XHJcbiAgICAgICAgdmFyIGk7XHJcbiAgICAgICAgdmFyIHNsaWRlcyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJteVNsaWRlc1wiKTtcclxuICAgICAgICB2YXIgZG90cyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJkZW1vXCIpO1xyXG4gICAgICAgIHZhciBjYXB0aW9uVGV4dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2FwdGlvblwiKTtcclxuICAgICAgICBpZiAobiA+IHNsaWRlcy5sZW5ndGgpIHtzbGlkZUluZGV4ID0gMX1cclxuICAgICAgICBpZiAobiA8IDEpIHtzbGlkZUluZGV4ID0gc2xpZGVzLmxlbmd0aH1cclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgc2xpZGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHNsaWRlc1tpXS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBkb3RzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGRvdHNbaV0uY2xhc3NOYW1lID0gZG90c1tpXS5jbGFzc05hbWUucmVwbGFjZShcIiBhY3RpdmVcIiwgXCJcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHNsaWRlc1tzbGlkZUluZGV4LTFdLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XHJcbiAgICAgICAgZG90c1tzbGlkZUluZGV4LTFdLmNsYXNzTmFtZSArPSBcIiBhY3RpdmVcIjtcclxuICAgICAgICAvLyBjYXB0aW9uVGV4dC5pbm5lckhUTUwgPSBkb3RzW3NsaWRlSW5kZXgtMV0uYWx0O1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvLy0tLS1nYWxsZXJ5IC0gIEFORC0tLS0tLS0tLS0tLVxyXG4gICAgJChcImJvZHlcIikub24oXCJjbGlja1wiLFwiYVwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIHZhciBpZCAgPSAkKHRoaXMpLmF0dHIoJ2hyZWYnKSxcclxuICAgICAgICAgICAgdG9wID0gJChpZCkub2Zmc2V0KCkudG9wO1xyXG4gICAgICAgICQoJ2h0bWwnKS5hbmltYXRlKHtzY3JvbGxUb3A6IHRvcH0sIDE1MDApO1xyXG4gICAgfSk7XHJcbn07Il0sImZpbGUiOiJqcy5qcyJ9
