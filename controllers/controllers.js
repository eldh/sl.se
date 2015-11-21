'use strict';

/* Controllers */

var controllerProvider = null;
angular.module('slapp.controllers', ['ngResource', 'typeahead', 'slapp.shoppingcart'], function ($controllerProvider) {
    controllerProvider = $controllerProvider;
}).controller('siteHeader', ['$rootScope', '$scope', '$window', 'shoppingCartModel', '$location', '$route', '$timeout', function ($rootScope, $scope, $window, shoppingCartModel, $location, $route, $timeout) {
    var hasViewedShoppingCart = false;
    $scope.display = {
        search: false,
        shopping_cart: false,
        navX: false
    };
    $scope.setVersion = function (version) {
        $rootScope.version = {
            current: version
        };
    };
    $scope.scrollToTop = false;
    $scope.toggleSiteMenu = function (self, target) {
        //console.log('siteHeader', self);
        $scope.$broadcast('toggleMenu', target);
    };
    $scope.shopping_cart = shoppingCartModel;
    $scope.$watch("shopping_cart.data.isAddingProduct", function (newVal, oldVal) {
        if (newVal === false && oldVal) {
            $scope.display.shopping_cart = true;
            $scope.$parent.display.shopping_cart = true;
            $scope.display.navX = false;
            $scope.display.search = false;
        }
    });
    $scope.$watch("display.shopping_cart", function (newVal) {
        $scope.$parent.display.shopping_cart = newVal;
    });
    $scope.cartView = function () {
        if (!hasViewedShoppingCart && $scope.display.shopping_cart) {
            hasViewedShoppingCart = true;
            window.SiteCatalyst.TrackClient("CartView", $scope.shopping_cart.data.ProductsView);
        }
    };
    $scope.goToStartPage = function (href) {
        $window.location.href = href;
    };
    $rootScope.$on("scrollToTop", function (e) {
        if (e) {
            $scope.scrollToTop = true;
            $timeout(function () {
                $scope.scrollToTop = false;
            }, 100);
        }
    });
    //console.log("$scope.numberOfProducts", $scope.numberOfProducts);
} ])
    .controller('NavBarCtrl', ['$scope', function ($scope) {

        var data = {
            "projectTitle": "SL",
            "links": [{
                "name": "Resegaranti",
                "url": "/",
                "className": ""
            }, {
                "name": "route1",
                "url": "/route1",
                "className": ""
            }, {
                "name": "route2",
                "url": "/route2",
                "className": ""
            }, {
                "name": "Categories",
                "url": "/categories",
                "className": "dropdown",
                "sub": [{
                    "name": "Tech Stuff",
                    "url": "/techStuff"
                }, {
                    "name": "AngularJS",
                    "url": "/angularJS"
                }, {
                    "name": "HTML5",
                    "url": "/html5"
                }, {
                    "name": "Javascript",
                    "url": "/javascript"
                }, {
                    "name": "jQuery",
                    "url": "/jquery"
                }]
            }]
        };

        $scope.nav = data;
        $scope.links = data.links;

        $scope.layoutToggle = function () {
            //console.log('layoutToggle controller');
        };
    } ])
    .controller('siteFooter', ['$scope', function ($scope) {
        //console.log('siteFooter');
        var data = {
            "projectTitle": "SL",
            "links": [{
                "name": "Facebook",
                "url": "/Facebook",
                "className": "facebook"
            }, {
                "name": "Twitter",
                "url": "/Twitter",
                "className": "twitter"
            }, {
                "name": "YouTube",
                "url": "/YouTube",
                "className": "youtube"
            }]
        };

        $scope.nav = data;
        $scope.links = data.links;
    } ])
    .controller('SiteSearchCtrl', ['$scope', 'providedValue', function ($scope, providedValue) {
        $scope.searchTerm = "";
        $scope.error = providedValue.invalidSearchTerm;
        $scope.resetField = function () {
            $scope.searchTerm = "";
        };
        $scope.submitForm = function (formName, invalid) {
            if (!invalid) {
                document.forms[formName].submit();
            }
        };
    } ])
    .controller('TypeAheadCtrl', ['$scope', 'typeahead', function ($scope, typeahead) {
        $scope.selectedItem = {
            value: 0,
            label: ''
        };
        $scope.Weeee = typeahead;
    } ])
    .controller('geoLocation', ['$scope', function ($scope) {

        $scope.getPosition = function (field) {
            if (geo_position_js.init()) {
                geo_position_js.getCurrentPosition(successCallback, errorCallback, { enableHighAccuracy: true });
            } else {
                alert("Functionality not available");
            }

            function successCallback(p) {
                $scope.$emit("setGeoPosition", p.coords.latitude, p.coords.longitude, p.coords.accuracy, field);

                $scope.$apply(); //Because geo_position_js aint angular, we need to tell angular that we are back from the non angular work.


                //alert('lat=' + p.coords.latitude.toFixed(2) + ';lon=' + p.coords.longitude.toFixed(2));

                //                $http.get('/api/hafas/getgeoname/' + p.coords.latitude + "/" + p.coords.longitude).
                //                success(function (data, status, headers, config) {
                //                    if (data.status == "error") {
                //                        console.log(data.mesasge);
                //                    } else {
                //                        console.log(data);
                //                        $scope.geoPosition = data.data; //Ska stå typ "Nuvarande position(65m)"
                //                    }
                //                }).
                //                error(function (data, status, headers, config) {

                //                });
            }

            function errorCallback(p) {
                alert('error=' + p.code);
            }
        };

    } ])
    .controller('searchTime', ['$scope', '$rootScope', '$http', function ($scope, $rootScope, $http) {
        $scope.getTimeData = function () {
            var config = {
                url: '/api/TravelPlanner/GetTravellingDates/sv'
            };
            $http.get(config.url).
                success(function (data, status, headers, config) {
                    //console.log(data);
                }).
                error(function (data, status, headers, config) {
                    //response([]);
                    //console.log('error');
                });

            $scope.padTimeZero = function (time) {
                if ((time + '').length == 1) {
                    return '0' + time;
                }

                return time;
            };

            $scope.GetTravellingTimes = function () {
                var array = [];
                array.push('Tid');
                var date = new Date();

                date.setHours(0, 0, 0, 0);
                for (var i = 0; i < 288; i++) {
                    array.push($scope.padTimeZero(date.getHours()) + ':' + $scope.padTimeZero(date.getMinutes()));
                    date = new Date(date.getTime() + 5 * 60 * 1000); // 5 minutes in millisecondates
                }
                //console.log(array);
            };
        };
        $scope.getTimeData();
    } ]);

// Register a dynamically loaded controller
function registerController(moduleName, controllerName) {
    // Here I cannot get the controller function directly so I
    // need to loop through the module's _invokeQueue to get it
    var queue = angular.module(moduleName)._invokeQueue;
    for (var i = 0; i < queue.length; i++) {
        var call = queue[i];
        if (call[0] == "$controllerProvider" &&
        call[1] == "register" &&
        call[2][0] == controllerName) {
            controllerProvider.register(controllerName, call[2][1]);
        }
    }
}

$("body").delegate(".button-primary, .button-secondary, .site-header-button, .switch-directions-icon, .aside-item h3, input[type='checkbox'], input[type='radio'], .tab-item, .tab-item a, .tab-list-item a, .select-overlay, .clickable, .update-search, .active-card-options, .card-chooser, .standard-trip-chooser, .payment-option, .list-header, .share, .leaflet-clickable, .information-block .button", "keyup", function (event) {
    var keyId = event.keyCode || event.which || event.key;
    
    if (keyId === 32 || keyId === 13) { // check for Space or Enter key
        var ff = !(window.mozInnerScreenX == null);

        if (ff && $(this)[0].type == "checkbox") {
            $(this).attr("checked", "checked"); // Firefox fix for checkboxes
        } else if ($(this).hasClass("select-overlay")) {
            open($(this).siblings("select"));
            //console.log("pressing select", $(this).siblings("select"));
        } else if ($(this).hasClass("card-chooser") || $(this).hasClass("standard-trip-chooser") || $(this).hasClass("payment-option")) {
            if(!$(this).hasClass("open")){
                $(this).find("label").trigger("click");
            }
            //console.log("pressing space or enter key", $(this).find("label"));
        } else if (!($(this).is("a") && keyId === 13)) {
            $(this).trigger("click");
            //console.log("pressing space or enter key", $(this));
        }
    }
});

function open(elem) {
    if (document.createEvent) {
        var e = document.createEvent("MouseEvents");
        e.initMouseEvent("mousedown", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        elem[0].dispatchEvent(e);
    } else if (element.fireEvent) {
        elem[0].fireEvent("onmousedown");
    }
}

window.onkeydown = function (e) {
    return !(e.keyCode == 32 && (e.target.type != 'text' && e.target.type != 'textarea' && e.target.type != 'password'));
};