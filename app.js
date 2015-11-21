'use strict';

angular.module('slapp', ['ngTouch'
                        , 'ngRoute'
                        , 'ngSanitize'
                        , 'angularFileUpload',
                        , 'slapp.urlprovider'
                        , 'slapp.filters'
                        , 'slapp.services'
                        , 'slapp.directives'
                        , 'slapp.controllers'
                        , 'slapp.factories'
                        , 'slapp.newTravelPlanner'
                        , 'slapp.googleMap'
                        , 'travelPlannerTexts'
                        , 'directives.placeholder'
                        , 'slapp.trafficStatus'
                        , 'slapp.shoppingcart'
                        , 'slapp.errors'
                        , 'slapp.print'])

    .config(['$routeProvider', function ($routeProvider) {
        /*
        HOW TO

        1. template: template or templateUrl has to be set. If no template is wanted then it still must contain a space char.
        2. caseInsensitiveMatch: Enables a match for LinK1 = link1
        3. Parameters are set with : before the name of the parameter and after the url itself, e.g. /Realtime/:param1/:param2
        4. Optional Parameters are the same as normal params but end with ? e.g. /Realtime/:param1?/:param2? . Note that optional
        nonused params(in browser) will not be included in $routeParams.
        5. # is used in the browser, but not in the mapping. Everything after the # is written in the urlmapping below.
        */

      
        //Realtime
        $routeProvider
            .when('/Realtime/:fromName/:fromSiteId', {
                caseInsensitiveMatch: true,
                controller: 'newRealTimeUrlSearch',
                template: ' '
            })
            .when('/Realtid/:fromName/:fromSiteId', {
                caseInsensitiveMatch: true,
                controller: 'newRealTimeUrlSearch',
                template: ' '
            });

        //TravelPlanner
        //var endTravelUrl = "/:time/:timeSelection/:language/:strictTime/:viaStation/:journeyProducts/:filterMode/:filterLine/:maxWalkDistance/:maxChanges/:additionalChangeTime/:unsharpSearch/:serverGeneratedQuery/:advParamsChanged/:singleTrip?";
        var endTravelUrl = "/:time/:timeSelection/:language/:strictTime/:viaStationSiteId/:journeyProducts/:filterMode/:filterLine/:maxWalkDistance/:maxChanges/:additionalChangeTime/:unsharpSearch/:serverGeneratedQuery/:advParamsChanged/:singleTrip?/:viaStation?";
        var v = (typeof (g_pilot) !== "undefined") ? 2 : "";
        $routeProvider
            .when('/Travel/SearchTravelByStartPosition' + v + '/:from/:to/:fromLat/:fromLong/:toSiteId' + endTravelUrl, {
                caseInsensitiveMatch: true,
                controller: 'TravelPlannerUrlSearch',
                template: ' '
            })
            .when('/Travel/SearchTravelByPositions' + v + '/:from/:to/:fromLat/:fromLong/:toLat/:toLong' + endTravelUrl, {
                caseInsensitiveMatch: true,
                controller: 'TravelPlannerUrlSearch',
                template: ' '
            })
            .when('/Travel/SearchTravelByDestinationPosition' + v + '/:from/:to/:toLat/:toLong/:fromSiteId' + endTravelUrl, {
                caseInsensitiveMatch: true,
                controller: 'TravelPlannerUrlSearch',
                template: ' '
            })
            .when('/Travel/SearchTravelById' + v + '/:from/:to/:fromSiteId/:toSiteId' + endTravelUrl, {
                caseInsensitiveMatch: true,
                controller: 'TravelPlannerUrlSearch',
                template: ' '
            });

        //Timetable
        $routeProvider
            .when('/TimeTableSearch/GetLineTimeTables/:fromName/:fromSiteId/:lineNumber/:trafficType/:daysAhead/:skip/:take', {
                caseInsensitiveMatch: true,
                controller: 'TimeTableUrlSearch',
                template: ' '
            })
            .when('/TimeTableSearch/GetStationTimeTables/:fromName/:fromSiteId/:lineNumber/:trafficType/:daysAhead/:validDate', {
                caseInsensitiveMatch: true,
                controller: 'TimeTableUrlSearch',
                template: ' '
            });
    } ])
    .controller('DefaultRouteController', ["$scope", "$routeParams", function ($scope, $routeParams) {

    } ])
    .run(function ($rootScope, $window, stateService) {
        $rootScope.display = { 'test': 'defined' };
        $rootScope.map = {
            locked: true
        };
        $rootScope.isViewLoading = {};
        $rootScope.formParams = {
            'textLimit': 50,
            'textPattern': '/^agnesBerg/'
        };

        if (geo_position_js.init()) {
            $rootScope.hasGeoLocation = true;
        } else {
            $rootScope.hasGeoLocation = false;
        }

        //TODO: Do this with a directive
        $rootScope.toggleMap = function () {
            $rootScope.map.locked = !$rootScope.map.locked;
            $rootScope.$broadcast('initMap');
        };
        
        $rootScope.browser = Browser();

        $rootScope.windowState = stateService.getState();
        angular.element($window).bind('resize', function () {
            var currentState = stateService.getState();
            if ($rootScope.windowState != currentState) {
                $rootScope.windowState = currentState;
                $rootScope.$broadcast('windowStateChanged', currentState);
                $rootScope.$apply();
            }
        });

    });
