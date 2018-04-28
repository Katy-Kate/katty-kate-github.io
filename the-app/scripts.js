(function () {
    var app = angular.module('myApp', ['ngDialog']);

    app.controller('MainController',['$scope', 'ngDialog', function ($scope, ngDialog) {
        this.tab = 1;
        this.setTab = function (tabId) {
            this.tab = tabId;
        };
        this.isSet = function (tabId) {
            return this.tab === tabId;
        };

        $scope.products = [
            {name : "awesome photo 1", src : 'images/img.jpg', category : "graphic", description : "Eum cu tantas legere complectitur, hinc utamu"},
            {name : "awesome photo 3", src : 'images/img2.jpg', category : "web", description : "Eum cu tantas legere complectitur, hinc utamu"},
            {name : "awesome photo 4", src : 'images/img3.jpg', category : "web", description : "Eum cu tantas legere complectitur, hinc utamu"},
            {name : "awesome photo 5", src : 'images/img4.jpg', category : "photo", description : "Eum cu tantas legere complectitur, hinc utamu"},
            {name : "awesome photo 6", src : 'images/img5.jpg', category : "photo", description : "Eum cu tantas legere complectitur, hinc utamu"},
            {name : "awesome photo 7", src : 'images/img6.jpg', category : "photo", description : "Eum cu tantas legere complectitur, hinc utamu"},
            {name : "awesome photo 8", src : 'images/img7.jpg', category : "graphic", description : "Eum cu tantas legere complectitur, hinc utamu"},
            {name : "awesome photo 9", src : 'images/img.jpg', category : "graphic", description : "Eum cu tantas legere complectitur, hinc utamu"},
            {name : "awesome photo 3", src : 'images/img2.jpg', category : "web", description : "Eum cu tantas legere complectitur, hinc utamu"},
            {name : "awesome photo 3", src : 'images/img3.jpg', category : "web", description : "Eum cu tantas legere complectitur, hinc utamu"}
        ];

        $scope.timelineData = [
            {data : "September 2014", title : "We Reach The Top", subtitle : "Kat is new brand", description : "Lorem ipsum dolor sit amet, rebum dolore labores cu pri. Ferri iudico scripta ut eam, diceret euismod gubergren has eu, an quo tale vivendum. Ad quidam gubergren vituperatoribus sit. Ius etiam nemore consulatu ne, at meliore explicari conceptam qui. Agam ceteros forensibus."},
            {data : "May 2014", title : "Close To The Stars", subtitle : "Big thing are happening", description : "Lorem ipsum dolor sit amet, rebum dolore labores cu pri. Ferri iudico scripta ut eam, diceret euismod gubergren has eu, an quo tale vivendum. Ad quidam gubergren vituperatoribus sit. Ius etiam nemore consulatu."},
            {data : "April 2012", title : "New Office", subtitle : "We are moving", description : "Lorem ipsum dolor sit amet, rebum dolore labores cu pri. Ferri iudico scripta ut eam, diceret euismod gubergren has eu, an quo tale vivendum."},
            {data : "March 2012", title : "Ket Is Live", subtitle : "Just started and feel so alive", description : "Lorem ipsum dolor sit amet, rebum dolore labores cu pri. Ferri iudico scripta ut eam, diceret euismod gubergren has eu, an quo tale vivendum. Ad quidam gubergren vituperatoribus sit. Ius etiam nemore consulatu ne, at meliore explicari conceptam qui. Agam ceteros forensibus vix eu, paulo ubique ex eam."}
        ];

        $scope.counters = [
            {value : '3054', description : "completed projects", icon: "images/icon-projects.png"},
            {value : '7234873', description : "click presed", icon: "images/icon-click.png"},
            {value : '4670', description : "mails sended and received", icon: "images/icon-mails.png"},
            {value : '939', description : "jokes tolds", icon: "images/icon-jokes.png"}
        ];

        $scope.filters = {};
        $scope.sort = function (value){
            $scope.filters.category = value;
        };
        //open modal window
        $scope.clickToOpen = function (item) {
            ngDialog.open({ template: ' <div class="popup_wrap"><img class="popup_img" src="'+ item.src +'" alt=""/><span class="popup_name">'+ item.name +'</span>', className: 'ngdialog-theme-default', plain: true, width: '60%' });
        };
    }]);

    function isScrolledIntoView(elem,offset) {
        var $elem = $(elem);
        var $window = $(window);
        var docViewTop = $window.scrollTop();
        var docViewBottom = docViewTop + $window.height();
        var elemTop = $elem.offset().top;
        var elemBottom = elemTop + $elem.height() - offset;
        return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
    }


    $(document).ready(function() {

        $('.portfolio__counter-item_value').counterUp({
            delay: 10, // the delay time in ms
            time: 1000 // the speed time in ms
        });
        //gallery settings
        var slickSettings = {
            centerMode: true,
            centerPadding: '150px',
            slidesToShow: 3,
            responsive: [
                {
                    breakpoint: 768,
                    settings: {
                        arrows: false,
                        centerMode: true,
                        centerPadding: '40px',
                        slidesToShow: 1
                    }
                },
                {
                    breakpoint: 480,
                    settings: {
                        arrows: false,
                        centerMode: true,
                        centerPadding: '40px',
                        slidesToShow: 1
                    }
                }
            ]
        };

        var galleryClass = $('.center');
        var galleryFilters = $(".portfolio__tabs");


        //gallery initialize
        galleryClass.slick(slickSettings);
        galleryFilters.find("div").click(function(){
            galleryClass.slick('unslick');
            galleryClass.slick(slickSettings);
            galleryFilters.find("div").removeClass("portfolio__tabs_item--active");//remove if something was selected
            $(this).addClass("portfolio__tabs_item--active");//add a selected class
        });

        //top-menu for mobile
        var topNav =  $('#nav-tabs');
        function changeMenu() {
            if($(window).width() < 768) {
                topNav.addClass('mobilenav');
                topNav.css('display', 'none');
            }
            else {
                topNav.removeClass('mobilenav');
                topNav.css('display', 'block');
            }
        }
        changeMenu();
        $( window ).resize(function(){
            changeMenu();
        });

        //smooth scroll
        topNav.find("a").click( function(){
            var scroll_el = $(this).attr('href');
            if ($(scroll_el).length !== 0) {
                $('html, body').animate({ scrollTop: $(scroll_el).offset().top }, 500);
            }
        });

        //top-menu behavior
        var nav = $('#nav');
        var navpos = nav.offset();




        $(window).bind('scroll', function() {
            if ($(window).scrollTop() > navpos.top) {
                nav.addClass('fixed');
            }
            else {
                nav.removeClass('fixed');
            }

            $.each(['#home','#services', '#portf', '#contacts' ],function(key, val){
                    if (isScrolledIntoView(val,300)) {
                        var nav_id = '#' + $(val).attr('id');
                        topNav.find("a").removeClass("header__nav_item--active");//remove if something was selected
                        $('a[href="' + nav_id + '"]').addClass("header__nav_item--active");//add a selected class
                    }
                }
            );
            topNav.find("a").click(function(){
                topNav.find("a").removeClass("header__nav_item--active");//remove if something was selected
                $(this).addClass("header__nav_item--active");//add a selected class
            });

            //timeline elements appearance
            $( ".timeline__item" ).each(function() {
                if (isScrolledIntoView(this,0)) {
                    $(this).removeClass('hidden-elem');
                    $(this).addClass('visible-elem');
                }
                else {
                    $(this).addClass('hidden-elem');
                    $(this).removeClass('visible-elem');
                }
            });
        });
    });
})();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJzY3JpcHRzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdteUFwcCcsIFsnbmdEaWFsb2cnXSk7XG5cbiAgICBhcHAuY29udHJvbGxlcignTWFpbkNvbnRyb2xsZXInLFsnJHNjb3BlJywgJ25nRGlhbG9nJywgZnVuY3Rpb24gKCRzY29wZSwgbmdEaWFsb2cpIHtcbiAgICAgICAgdGhpcy50YWIgPSAxO1xuICAgICAgICB0aGlzLnNldFRhYiA9IGZ1bmN0aW9uICh0YWJJZCkge1xuICAgICAgICAgICAgdGhpcy50YWIgPSB0YWJJZDtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5pc1NldCA9IGZ1bmN0aW9uICh0YWJJZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudGFiID09PSB0YWJJZDtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUucHJvZHVjdHMgPSBbXG4gICAgICAgICAgICB7bmFtZSA6IFwiYXdlc29tZSBwaG90byAxXCIsIHNyYyA6ICdpbWFnZXMvaW1nLmpwZycsIGNhdGVnb3J5IDogXCJncmFwaGljXCIsIGRlc2NyaXB0aW9uIDogXCJFdW0gY3UgdGFudGFzIGxlZ2VyZSBjb21wbGVjdGl0dXIsIGhpbmMgdXRhbXVcIn0sXG4gICAgICAgICAgICB7bmFtZSA6IFwiYXdlc29tZSBwaG90byAzXCIsIHNyYyA6ICdpbWFnZXMvaW1nMi5qcGcnLCBjYXRlZ29yeSA6IFwid2ViXCIsIGRlc2NyaXB0aW9uIDogXCJFdW0gY3UgdGFudGFzIGxlZ2VyZSBjb21wbGVjdGl0dXIsIGhpbmMgdXRhbXVcIn0sXG4gICAgICAgICAgICB7bmFtZSA6IFwiYXdlc29tZSBwaG90byA0XCIsIHNyYyA6ICdpbWFnZXMvaW1nMy5qcGcnLCBjYXRlZ29yeSA6IFwid2ViXCIsIGRlc2NyaXB0aW9uIDogXCJFdW0gY3UgdGFudGFzIGxlZ2VyZSBjb21wbGVjdGl0dXIsIGhpbmMgdXRhbXVcIn0sXG4gICAgICAgICAgICB7bmFtZSA6IFwiYXdlc29tZSBwaG90byA1XCIsIHNyYyA6ICdpbWFnZXMvaW1nNC5qcGcnLCBjYXRlZ29yeSA6IFwicGhvdG9cIiwgZGVzY3JpcHRpb24gOiBcIkV1bSBjdSB0YW50YXMgbGVnZXJlIGNvbXBsZWN0aXR1ciwgaGluYyB1dGFtdVwifSxcbiAgICAgICAgICAgIHtuYW1lIDogXCJhd2Vzb21lIHBob3RvIDZcIiwgc3JjIDogJ2ltYWdlcy9pbWc1LmpwZycsIGNhdGVnb3J5IDogXCJwaG90b1wiLCBkZXNjcmlwdGlvbiA6IFwiRXVtIGN1IHRhbnRhcyBsZWdlcmUgY29tcGxlY3RpdHVyLCBoaW5jIHV0YW11XCJ9LFxuICAgICAgICAgICAge25hbWUgOiBcImF3ZXNvbWUgcGhvdG8gN1wiLCBzcmMgOiAnaW1hZ2VzL2ltZzYuanBnJywgY2F0ZWdvcnkgOiBcInBob3RvXCIsIGRlc2NyaXB0aW9uIDogXCJFdW0gY3UgdGFudGFzIGxlZ2VyZSBjb21wbGVjdGl0dXIsIGhpbmMgdXRhbXVcIn0sXG4gICAgICAgICAgICB7bmFtZSA6IFwiYXdlc29tZSBwaG90byA4XCIsIHNyYyA6ICdpbWFnZXMvaW1nNy5qcGcnLCBjYXRlZ29yeSA6IFwiZ3JhcGhpY1wiLCBkZXNjcmlwdGlvbiA6IFwiRXVtIGN1IHRhbnRhcyBsZWdlcmUgY29tcGxlY3RpdHVyLCBoaW5jIHV0YW11XCJ9LFxuICAgICAgICAgICAge25hbWUgOiBcImF3ZXNvbWUgcGhvdG8gOVwiLCBzcmMgOiAnaW1hZ2VzL2ltZy5qcGcnLCBjYXRlZ29yeSA6IFwiZ3JhcGhpY1wiLCBkZXNjcmlwdGlvbiA6IFwiRXVtIGN1IHRhbnRhcyBsZWdlcmUgY29tcGxlY3RpdHVyLCBoaW5jIHV0YW11XCJ9LFxuICAgICAgICAgICAge25hbWUgOiBcImF3ZXNvbWUgcGhvdG8gM1wiLCBzcmMgOiAnaW1hZ2VzL2ltZzIuanBnJywgY2F0ZWdvcnkgOiBcIndlYlwiLCBkZXNjcmlwdGlvbiA6IFwiRXVtIGN1IHRhbnRhcyBsZWdlcmUgY29tcGxlY3RpdHVyLCBoaW5jIHV0YW11XCJ9LFxuICAgICAgICAgICAge25hbWUgOiBcImF3ZXNvbWUgcGhvdG8gM1wiLCBzcmMgOiAnaW1hZ2VzL2ltZzMuanBnJywgY2F0ZWdvcnkgOiBcIndlYlwiLCBkZXNjcmlwdGlvbiA6IFwiRXVtIGN1IHRhbnRhcyBsZWdlcmUgY29tcGxlY3RpdHVyLCBoaW5jIHV0YW11XCJ9XG4gICAgICAgIF07XG5cbiAgICAgICAgJHNjb3BlLnRpbWVsaW5lRGF0YSA9IFtcbiAgICAgICAgICAgIHtkYXRhIDogXCJTZXB0ZW1iZXIgMjAxNFwiLCB0aXRsZSA6IFwiV2UgUmVhY2ggVGhlIFRvcFwiLCBzdWJ0aXRsZSA6IFwiS2F0IGlzIG5ldyBicmFuZFwiLCBkZXNjcmlwdGlvbiA6IFwiTG9yZW0gaXBzdW0gZG9sb3Igc2l0IGFtZXQsIHJlYnVtIGRvbG9yZSBsYWJvcmVzIGN1IHByaS4gRmVycmkgaXVkaWNvIHNjcmlwdGEgdXQgZWFtLCBkaWNlcmV0IGV1aXNtb2QgZ3ViZXJncmVuIGhhcyBldSwgYW4gcXVvIHRhbGUgdml2ZW5kdW0uIEFkIHF1aWRhbSBndWJlcmdyZW4gdml0dXBlcmF0b3JpYnVzIHNpdC4gSXVzIGV0aWFtIG5lbW9yZSBjb25zdWxhdHUgbmUsIGF0IG1lbGlvcmUgZXhwbGljYXJpIGNvbmNlcHRhbSBxdWkuIEFnYW0gY2V0ZXJvcyBmb3JlbnNpYnVzLlwifSxcbiAgICAgICAgICAgIHtkYXRhIDogXCJNYXkgMjAxNFwiLCB0aXRsZSA6IFwiQ2xvc2UgVG8gVGhlIFN0YXJzXCIsIHN1YnRpdGxlIDogXCJCaWcgdGhpbmcgYXJlIGhhcHBlbmluZ1wiLCBkZXNjcmlwdGlvbiA6IFwiTG9yZW0gaXBzdW0gZG9sb3Igc2l0IGFtZXQsIHJlYnVtIGRvbG9yZSBsYWJvcmVzIGN1IHByaS4gRmVycmkgaXVkaWNvIHNjcmlwdGEgdXQgZWFtLCBkaWNlcmV0IGV1aXNtb2QgZ3ViZXJncmVuIGhhcyBldSwgYW4gcXVvIHRhbGUgdml2ZW5kdW0uIEFkIHF1aWRhbSBndWJlcmdyZW4gdml0dXBlcmF0b3JpYnVzIHNpdC4gSXVzIGV0aWFtIG5lbW9yZSBjb25zdWxhdHUuXCJ9LFxuICAgICAgICAgICAge2RhdGEgOiBcIkFwcmlsIDIwMTJcIiwgdGl0bGUgOiBcIk5ldyBPZmZpY2VcIiwgc3VidGl0bGUgOiBcIldlIGFyZSBtb3ZpbmdcIiwgZGVzY3JpcHRpb24gOiBcIkxvcmVtIGlwc3VtIGRvbG9yIHNpdCBhbWV0LCByZWJ1bSBkb2xvcmUgbGFib3JlcyBjdSBwcmkuIEZlcnJpIGl1ZGljbyBzY3JpcHRhIHV0IGVhbSwgZGljZXJldCBldWlzbW9kIGd1YmVyZ3JlbiBoYXMgZXUsIGFuIHF1byB0YWxlIHZpdmVuZHVtLlwifSxcbiAgICAgICAgICAgIHtkYXRhIDogXCJNYXJjaCAyMDEyXCIsIHRpdGxlIDogXCJLZXQgSXMgTGl2ZVwiLCBzdWJ0aXRsZSA6IFwiSnVzdCBzdGFydGVkIGFuZCBmZWVsIHNvIGFsaXZlXCIsIGRlc2NyaXB0aW9uIDogXCJMb3JlbSBpcHN1bSBkb2xvciBzaXQgYW1ldCwgcmVidW0gZG9sb3JlIGxhYm9yZXMgY3UgcHJpLiBGZXJyaSBpdWRpY28gc2NyaXB0YSB1dCBlYW0sIGRpY2VyZXQgZXVpc21vZCBndWJlcmdyZW4gaGFzIGV1LCBhbiBxdW8gdGFsZSB2aXZlbmR1bS4gQWQgcXVpZGFtIGd1YmVyZ3JlbiB2aXR1cGVyYXRvcmlidXMgc2l0LiBJdXMgZXRpYW0gbmVtb3JlIGNvbnN1bGF0dSBuZSwgYXQgbWVsaW9yZSBleHBsaWNhcmkgY29uY2VwdGFtIHF1aS4gQWdhbSBjZXRlcm9zIGZvcmVuc2lidXMgdml4IGV1LCBwYXVsbyB1YmlxdWUgZXggZWFtLlwifVxuICAgICAgICBdO1xuXG4gICAgICAgICRzY29wZS5jb3VudGVycyA9IFtcbiAgICAgICAgICAgIHt2YWx1ZSA6ICczMDU0JywgZGVzY3JpcHRpb24gOiBcImNvbXBsZXRlZCBwcm9qZWN0c1wiLCBpY29uOiBcImltYWdlcy9pY29uLXByb2plY3RzLnBuZ1wifSxcbiAgICAgICAgICAgIHt2YWx1ZSA6ICc3MjM0ODczJywgZGVzY3JpcHRpb24gOiBcImNsaWNrIHByZXNlZFwiLCBpY29uOiBcImltYWdlcy9pY29uLWNsaWNrLnBuZ1wifSxcbiAgICAgICAgICAgIHt2YWx1ZSA6ICc0NjcwJywgZGVzY3JpcHRpb24gOiBcIm1haWxzIHNlbmRlZCBhbmQgcmVjZWl2ZWRcIiwgaWNvbjogXCJpbWFnZXMvaWNvbi1tYWlscy5wbmdcIn0sXG4gICAgICAgICAgICB7dmFsdWUgOiAnOTM5JywgZGVzY3JpcHRpb24gOiBcImpva2VzIHRvbGRzXCIsIGljb246IFwiaW1hZ2VzL2ljb24tam9rZXMucG5nXCJ9XG4gICAgICAgIF07XG5cbiAgICAgICAgJHNjb3BlLmZpbHRlcnMgPSB7fTtcbiAgICAgICAgJHNjb3BlLnNvcnQgPSBmdW5jdGlvbiAodmFsdWUpe1xuICAgICAgICAgICAgJHNjb3BlLmZpbHRlcnMuY2F0ZWdvcnkgPSB2YWx1ZTtcbiAgICAgICAgfTtcbiAgICAgICAgLy9vcGVuIG1vZGFsIHdpbmRvd1xuICAgICAgICAkc2NvcGUuY2xpY2tUb09wZW4gPSBmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgbmdEaWFsb2cub3Blbih7IHRlbXBsYXRlOiAnIDxkaXYgY2xhc3M9XCJwb3B1cF93cmFwXCI+PGltZyBjbGFzcz1cInBvcHVwX2ltZ1wiIHNyYz1cIicrIGl0ZW0uc3JjICsnXCIgYWx0PVwiXCIvPjxzcGFuIGNsYXNzPVwicG9wdXBfbmFtZVwiPicrIGl0ZW0ubmFtZSArJzwvc3Bhbj4nLCBjbGFzc05hbWU6ICduZ2RpYWxvZy10aGVtZS1kZWZhdWx0JywgcGxhaW46IHRydWUsIHdpZHRoOiAnNjAlJyB9KTtcbiAgICAgICAgfTtcbiAgICB9XSk7XG5cbiAgICBmdW5jdGlvbiBpc1Njcm9sbGVkSW50b1ZpZXcoZWxlbSxvZmZzZXQpIHtcbiAgICAgICAgdmFyICRlbGVtID0gJChlbGVtKTtcbiAgICAgICAgdmFyICR3aW5kb3cgPSAkKHdpbmRvdyk7XG4gICAgICAgIHZhciBkb2NWaWV3VG9wID0gJHdpbmRvdy5zY3JvbGxUb3AoKTtcbiAgICAgICAgdmFyIGRvY1ZpZXdCb3R0b20gPSBkb2NWaWV3VG9wICsgJHdpbmRvdy5oZWlnaHQoKTtcbiAgICAgICAgdmFyIGVsZW1Ub3AgPSAkZWxlbS5vZmZzZXQoKS50b3A7XG4gICAgICAgIHZhciBlbGVtQm90dG9tID0gZWxlbVRvcCArICRlbGVtLmhlaWdodCgpIC0gb2Zmc2V0O1xuICAgICAgICByZXR1cm4gKChlbGVtQm90dG9tIDw9IGRvY1ZpZXdCb3R0b20pICYmIChlbGVtVG9wID49IGRvY1ZpZXdUb3ApKTtcbiAgICB9XG5cblxuICAgICQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICQoJy5wb3J0Zm9saW9fX2NvdW50ZXItaXRlbV92YWx1ZScpLmNvdW50ZXJVcCh7XG4gICAgICAgICAgICBkZWxheTogMTAsIC8vIHRoZSBkZWxheSB0aW1lIGluIG1zXG4gICAgICAgICAgICB0aW1lOiAxMDAwIC8vIHRoZSBzcGVlZCB0aW1lIGluIG1zXG4gICAgICAgIH0pO1xuICAgICAgICAvL2dhbGxlcnkgc2V0dGluZ3NcbiAgICAgICAgdmFyIHNsaWNrU2V0dGluZ3MgPSB7XG4gICAgICAgICAgICBjZW50ZXJNb2RlOiB0cnVlLFxuICAgICAgICAgICAgY2VudGVyUGFkZGluZzogJzE1MHB4JyxcbiAgICAgICAgICAgIHNsaWRlc1RvU2hvdzogMyxcbiAgICAgICAgICAgIHJlc3BvbnNpdmU6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrcG9pbnQ6IDc2OCxcbiAgICAgICAgICAgICAgICAgICAgc2V0dGluZ3M6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFycm93czogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBjZW50ZXJNb2RlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2VudGVyUGFkZGluZzogJzQwcHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2xpZGVzVG9TaG93OiAxXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtwb2ludDogNDgwLFxuICAgICAgICAgICAgICAgICAgICBzZXR0aW5nczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXJyb3dzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNlbnRlck1vZGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBjZW50ZXJQYWRkaW5nOiAnNDBweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBzbGlkZXNUb1Nob3c6IDFcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgZ2FsbGVyeUNsYXNzID0gJCgnLmNlbnRlcicpO1xuICAgICAgICB2YXIgZ2FsbGVyeUZpbHRlcnMgPSAkKFwiLnBvcnRmb2xpb19fdGFic1wiKTtcblxuXG4gICAgICAgIC8vZ2FsbGVyeSBpbml0aWFsaXplXG4gICAgICAgIGdhbGxlcnlDbGFzcy5zbGljayhzbGlja1NldHRpbmdzKTtcbiAgICAgICAgZ2FsbGVyeUZpbHRlcnMuZmluZChcImRpdlwiKS5jbGljayhmdW5jdGlvbigpe1xuICAgICAgICAgICAgZ2FsbGVyeUNsYXNzLnNsaWNrKCd1bnNsaWNrJyk7XG4gICAgICAgICAgICBnYWxsZXJ5Q2xhc3Muc2xpY2soc2xpY2tTZXR0aW5ncyk7XG4gICAgICAgICAgICBnYWxsZXJ5RmlsdGVycy5maW5kKFwiZGl2XCIpLnJlbW92ZUNsYXNzKFwicG9ydGZvbGlvX190YWJzX2l0ZW0tLWFjdGl2ZVwiKTsvL3JlbW92ZSBpZiBzb21ldGhpbmcgd2FzIHNlbGVjdGVkXG4gICAgICAgICAgICAkKHRoaXMpLmFkZENsYXNzKFwicG9ydGZvbGlvX190YWJzX2l0ZW0tLWFjdGl2ZVwiKTsvL2FkZCBhIHNlbGVjdGVkIGNsYXNzXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vdG9wLW1lbnUgZm9yIG1vYmlsZVxuICAgICAgICB2YXIgdG9wTmF2ID0gICQoJyNuYXYtdGFicycpO1xuICAgICAgICBmdW5jdGlvbiBjaGFuZ2VNZW51KCkge1xuICAgICAgICAgICAgaWYoJCh3aW5kb3cpLndpZHRoKCkgPCA3NjgpIHtcbiAgICAgICAgICAgICAgICB0b3BOYXYuYWRkQ2xhc3MoJ21vYmlsZW5hdicpO1xuICAgICAgICAgICAgICAgIHRvcE5hdi5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdG9wTmF2LnJlbW92ZUNsYXNzKCdtb2JpbGVuYXYnKTtcbiAgICAgICAgICAgICAgICB0b3BOYXYuY3NzKCdkaXNwbGF5JywgJ2Jsb2NrJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2hhbmdlTWVudSgpO1xuICAgICAgICAkKCB3aW5kb3cgKS5yZXNpemUoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGNoYW5nZU1lbnUoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy9zbW9vdGggc2Nyb2xsXG4gICAgICAgIHRvcE5hdi5maW5kKFwiYVwiKS5jbGljayggZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciBzY3JvbGxfZWwgPSAkKHRoaXMpLmF0dHIoJ2hyZWYnKTtcbiAgICAgICAgICAgIGlmICgkKHNjcm9sbF9lbCkubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgJCgnaHRtbCwgYm9keScpLmFuaW1hdGUoeyBzY3JvbGxUb3A6ICQoc2Nyb2xsX2VsKS5vZmZzZXQoKS50b3AgfSwgNTAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy90b3AtbWVudSBiZWhhdmlvclxuICAgICAgICB2YXIgbmF2ID0gJCgnI25hdicpO1xuICAgICAgICB2YXIgbmF2cG9zID0gbmF2Lm9mZnNldCgpO1xuXG5cblxuXG4gICAgICAgICQod2luZG93KS5iaW5kKCdzY3JvbGwnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICgkKHdpbmRvdykuc2Nyb2xsVG9wKCkgPiBuYXZwb3MudG9wKSB7XG4gICAgICAgICAgICAgICAgbmF2LmFkZENsYXNzKCdmaXhlZCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbmF2LnJlbW92ZUNsYXNzKCdmaXhlZCcpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAkLmVhY2goWycjaG9tZScsJyNzZXJ2aWNlcycsICcjcG9ydGYnLCAnI2NvbnRhY3RzJyBdLGZ1bmN0aW9uKGtleSwgdmFsKXtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzU2Nyb2xsZWRJbnRvVmlldyh2YWwsMzAwKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5hdl9pZCA9ICcjJyArICQodmFsKS5hdHRyKCdpZCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdG9wTmF2LmZpbmQoXCJhXCIpLnJlbW92ZUNsYXNzKFwiaGVhZGVyX19uYXZfaXRlbS0tYWN0aXZlXCIpOy8vcmVtb3ZlIGlmIHNvbWV0aGluZyB3YXMgc2VsZWN0ZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICQoJ2FbaHJlZj1cIicgKyBuYXZfaWQgKyAnXCJdJykuYWRkQ2xhc3MoXCJoZWFkZXJfX25hdl9pdGVtLS1hY3RpdmVcIik7Ly9hZGQgYSBzZWxlY3RlZCBjbGFzc1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHRvcE5hdi5maW5kKFwiYVwiKS5jbGljayhmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIHRvcE5hdi5maW5kKFwiYVwiKS5yZW1vdmVDbGFzcyhcImhlYWRlcl9fbmF2X2l0ZW0tLWFjdGl2ZVwiKTsvL3JlbW92ZSBpZiBzb21ldGhpbmcgd2FzIHNlbGVjdGVkXG4gICAgICAgICAgICAgICAgJCh0aGlzKS5hZGRDbGFzcyhcImhlYWRlcl9fbmF2X2l0ZW0tLWFjdGl2ZVwiKTsvL2FkZCBhIHNlbGVjdGVkIGNsYXNzXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy90aW1lbGluZSBlbGVtZW50cyBhcHBlYXJhbmNlXG4gICAgICAgICAgICAkKCBcIi50aW1lbGluZV9faXRlbVwiICkuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNTY3JvbGxlZEludG9WaWV3KHRoaXMsMCkpIHtcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmVDbGFzcygnaGlkZGVuLWVsZW0nKTtcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5hZGRDbGFzcygndmlzaWJsZS1lbGVtJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLmFkZENsYXNzKCdoaWRkZW4tZWxlbScpO1xuICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZUNsYXNzKCd2aXNpYmxlLWVsZW0nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59KSgpOyJdLCJmaWxlIjoic2NyaXB0cy5qcyJ9
