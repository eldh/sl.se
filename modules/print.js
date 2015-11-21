var print = angular.module('slapp.print', []);

print.directive('printTarget', ["$rootScope", function ($rootScope) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            element.bind('click', function (evt) {
                evt.preventDefault();
                PrintElem(attrs.printTarget);
            });

            function PrintElem(elem) {
                var content = $(elem).clone().wrap('<p/>').parent().html();
                //console.log('printcontent', content);
                PrintWithIframe(content);
            }

            function PrintWithIframe(data) {
                if ($('iframe#printf').size() == 0) {
                    var iframe = $('<iframe id="printf" name="printf"></iframe>').css({
                        'left': 0,
                        'top': 0,
                        'width': 0,
                        'height': 0
                    });
                    $(iframe).appendTo("html");  // an iFrame is added to the html content, then your div's contents are added to it and the iFrame's content is printed
                    var html = ('<html><head><title></title><style>@page {margin: 25mm 10mm 25mm 10mm}</style>'  // Your styles here, I needed the margins set up like this
                    //+ '<link href="/Resources/styles/output/print.css" rel="stylesheet" type="text/css" />'
                        + "<link href='/Resources/styles/output/print.min.css?v=" + $rootScope.version.current + "' media='print' rel='stylesheet' />"
                        + '</head><body><div class="print"><img src="/Resources/img/sl_logo_print.png" alt="" class="print-logo" />');
                    if (attrs.printTarget == ".internet-purchases") {
                        html += "<h2 class='print-title'>Kvitto</h2>";
                    }
                    html += (data
                        + '</div></body></html>');

                    var mywindow = window.frames["printf"];
                    $(mywindow.document).ready(function () {
                        document.getElementById('printf').contentWindow.document.write(html);
                        // mywindow.document.write(html);
                        mywindow.document.close();
                        mywindow.focus();

                        if (/MSIE (\d+\.\d+);/.test(navigator.userAgent)) {
                            // If IE
                            mywindow.document.execCommand('print', false, null);
                        } else {
                            mywindow.print();
                        }

                        setTimeout(function () {
                            mywindow.close();
                            $('iframe#printf').remove();
                        },
                        2000);  // The iFrame is removed this many milliseconds seconds after print() is executed
                    });
                }

                return true;
            }
        }
    };
}]);