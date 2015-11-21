var newTravelPlannerModule = angular.module('slapp.newTravelPlanner'
        , [
            'ngResource',
            'slapp.urlprovider',
            'slapp.newTravelPlanner.controllers',
            'slapp.newTravelPlanner.directives',
            'slapp.newTravelPlanner.factories',
            'slapp.newTravelPlanner.services',
            'slapp.googleMap'
        ], function ($locationProvider) {
            $locationProvider.hashPrefix('');
        }).run(function ($rootScope) {
        });

        angular.module('slapp.newTravelPlanner.services', [], function ($provide) {
            $provide.service('setTarget', function () {
                var self = this;
                this.setIndex = function (model, target, value) {
                    if (typeof (target) == 'string') {
                        return self.setIndex(model, target.split('.'), value);
                    } else if (target.length == 1 && value !== undefined) {
                        return model[target[0]] = value;
                    } else if (target.length == 0) {
                        return model;
                    } else {
                        return self.setIndex(model[target[0]], target.slice(1), value);
                    }
                };
                this.getIndex = function (model, target) {
                    if (model == undefined) {
                        return undefined;
                    }
                    if (typeof (target) == 'string') {
                        return self.getIndex(model, target.split('.'));
                    } else if (target.length == 1 && model[target[0]] != undefined) {
                        return model[target[0]];
                    } else if (target.length == 0) {
                        return model;
                    } else {
                        return self.getIndex(model[target[0]], target.slice(1));
                    }
                };
            });
            $provide.service('newAjaxService', ["setTarget", "errorHandler", "$http", function (setTarget, errorHandler, $http) {
                var timeStamp = new Date();
                var lastUrlCalled;
                this.autocomplete = function (url, scope, $http, callback) {

                    if (!(scope.model.states.searchType == "timetable" && (scope.isLineNumber() || scope.isTrafficType()))) {
                        var isMyPosition = false;
                        if (typeof (scope.model.from) !== "undefined" && typeof (scope.model.from.Name) !== "undefined" && scope.model.from.Name) {
                            if (scope.model.from.Name.indexOf("min plats") > -1 || scope.model.from.Name.indexOf("my location") > -1) {
                                isMyPosition = true;
                            } else {
                                isMyPosition = false;
                            }
                        }
                        if (url != lastUrlCalled || isMyPosition) {
                            scope.isTypeAheadLoading = true;
                            lastUrlCalled = url;
                            $http.get(url)
                        .success(function (data, status, headers, config) {
                            if (data.status == "error" || lastUrlCalled != url) {

                            } else {
                                callback(data);
                            }
                        })
                        .error(function (data, status, headers, config) {
                            var val = setTarget.getIndex(scope.model, scope.targetString, 'fail');

                            scope.isTypeAheadLoading = false;
                            headers = headers();
                            if (!headers || Object.keys(headers).length == 0) {
                                // aborted by user
                                return;
                            }
                            scope.destination = {
                                Error: errorHandler.getErrorMessage()
                            };
                        }).
                        then(function () {
                            scope.isTypeAheadLoading = false;
                        });
                        }
                    } else {
                        scope.destination = {};
                        scope.states.typeahead = "timetable";
                    }
                };

                this.setTimestamp = function () {
                    timeStamp = new Date();
                };
                this.checkTime = function (delay) {
                    var now = new Date(),
                first = (timeStamp.getTime()),
                second = (now.getTime() - delay);
                    return (first < second);
                };
            } ]);
        });

        angular.module('slapp.newTravelPlanner.directives', ['slapp.googleMap.services'])
    .directive('searchbutton', ['$window', function ($window) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {

                function setWidth() {

                    var wr = $("#Travelplanner");
                    var sb = $(wr).find(".searchButton")[1];
                    var fb = $(wr).find(".searchButton")[0];
                    var scb = $(wr).find(".button-secondary")[1];

                    var windowwidth = window.innerWidth;
                    var wrw = $(wr).width();

                    var paddings = (windowwidth > 665) ? 15 : 10;
                    var margins = 6;
                    var scbsw = $(fb).width() + $(scb).width() + (paddings * 6) + (margins * 3);
                    var rest = wrw - scbsw;

                    $(sb).css({ width: rest });
                }

                $(window).on("resize", setWidth);
                $("document").ready(setWidth);
                
            }
        }
    } ])
    .directive("inputField", ["setTarget", "latestSearch", "stateService", function (setTarget, latestSearch, stateService) {
        return function (scope, element, attrs) {
            scope.targetString = attrs.inputField;
            scope.modelService.set(scope.targetString, { value: "" });

            scope.$on('switchFromTo', function (e, tempmodel) {
                var newTarget = null;
                for (obj in tempmodel) {
                    if (obj != scope.targetString && (scope.targetString == 'to' || scope.targetString == 'from')) {
                        newTarget = tempmodel[obj];
                    }
                }
                if (newTarget != null) {
                    scope.modelService.set(scope.targetString, newTarget);
                }
            });

            function setBase() {
                var presetValues = {
                    from: {
                        Name: undefined,
                        SiteId: undefined,
                        Longitude: undefined,
                        Latitude: undefined,
                        value: undefined
                    },
                    to: {
                        Name: undefined,
                        SiteId: undefined,
                        Longitude: undefined,
                        Latitude: undefined,
                        value: undefined
                    },
                    advancedParams: {
                        viaStation: {
                            data: {
                                Name: undefined,
                                SiteId: undefined,
                                Longitude: undefined,
                                Latitude: undefined,
                                value: undefined
                            }
                        }
                    }
                };

                if (scope.targetString.indexOf('viaStation') > -1) {
                    var split = scope.targetString.split('.');
                    var data2 = setTarget.getIndex(presetValues, split[0] + '.' + split[1]);
                    scope.modelService.set(split[0] + '.' + split[1], data2);
                } else {
                    var data = setTarget.getIndex(presetValues, scope.targetString);
                    if (data != undefined) {
                        scope.modelService.set(scope.targetString, data);
                    }
                }
            };
            scope.$on("resetField", function (e) {
                if (e) {
                    scope.ignoreApply = true;
                    if (scope.states.typeahead == null) {
                        scope.ignoreBlur = true;
                    }
                    element.focus();
                    setTimeout(function () {
                        scope.ignoreBlur = false;
                        scope.$apply();
                    }, 500);
                }
            });
            scope.$on('reset', function (e) {
                if (e) {
                    setBase();
                    scope.reset();
                }
            });
            scope.$on('init', function (e) {
                if (e) {
                    scope.isTypeAheadLoading = false;
                    var data = setTarget.getIndex(scope.presetValues, scope.targetString);
                    if (data != undefined) {
                        scope.modelService.set(scope.targetString, data);
                    }
                }
            });
            element.bind('focus', function () {
                if (attrs.inputField == "from" || attrs.inputField == "to") {
                    scope.states.focused = true;
                    scope.$parent.focused = true;
                }
                if (scope.states.typeahead == "geolocation") {
                    scope.activeList = "destination";
                } else {
                    scope.activeList = "geolocation";
                }
                scope.activeRow = 0;
                if (!(attrs.nolatestsearch != undefined && attrs.nolatestsearch == "true") && scope.states.typeahead != "geolocation") {
                    if (scope.model.states.searchType == "timetable") {
                        scope.destination = latestSearch.get("LatestTimetablesSearch");
                    } else if (stateService.getShowSearchTo()) {
                        scope.destination = latestSearch.get("LatestTravelplannerSearch");
                    } else {
                        scope.destination = latestSearch.get("LatestRealtimeSearch");
                    }
                    scope.states.typeahead = 'latestsearch';
                    if (scope.ignoreApply == true) {
                        scope.ignoreApply = false;
                    } else {
                        scope.$apply();
                    }
                }
            });
            element.bind('blur', function () {
                scope.$parent.focused = false;

                setTimeout(function () {
                    if (
                        (scope.ignoreDefaultTarget == undefined
                        || scope.ignoreDefaultTarget === false)
                        && !(scope.model.states.searchType == "timetable"
                        && scope.isLineNumber())
                    ) {
                        if (scope.targetString == 'from'
                            && scope.states.typeahead != 'latestsearch'
                            && scope.destination[0] != undefined
                            && (scope.model.states.searchType == "timetable" || !scope.isGeoLookup())
                        ) {
                            scope.updateInput(scope.destination[scope.activeRow]);
                        } else if (scope.targetString == 'to'
                            && scope.states.typeahead != 'latestsearch'
                            && scope.destination[0] != undefined
                        ) {
                            scope.updateInput(scope.destination[scope.activeRow]);
                        } else if (scope.model.states.searchType != "timetable" && scope.model.advancedParams.viaStation.data != undefined) {
                            scope.model.advancedParams.viaStation.data.value = scope.model.advancedParams.viaStation.data.Name;
                        }
                    }
                    if (stateService.getShowSearchTo() && scope.states.typeahead != "latestsearch") {
                        if (attrs.inputField == "from") {
                            scope.$emit("focusOnToInput");
                        } else if (attrs.inputField == "to") {
                            scope.$emit("focusOnSwitchDirections");
                        }
                    }
                    scope.ignoreDefaultTarget = false;
                    if ((scope.ignoreBlur == undefined || scope.ignoreBlur === false)) {
                        scope.destination = {};
                        if (attrs.inputField == "from" || attrs.inputField == "to") {
                            scope.states.focused = false;
                        }
                        scope.states.typeahead = null;
                    }
                    scope.ignoreBlur = false;
                    if (!((stateService.getShowSearchTo() && attrs.inputField == "from") && attrs.inputField == "to") && scope.clickedOnUpdateInput && scope.clickedOnUpdateInput.Type == "address") {
                        scope.$emit("focusOnSearchButton");
                    }

                    if (scope.clickedOnUpdateInput != false) {
                        if (scope.states.typeahead != "geolocation") {
                            scope.updateInput(scope.clickedOnUpdateInput);
                        }
                        scope.clickedOnUpdateInput = false;
                    }

                    scope.$apply();
                }, 300);

                //}
                //Causes bad bug that causes the typeahead to close before click has done its job
                //scope.states.focused = false;

                scope.$apply();
            });
        };
    } ])
    .directive('newtypeahead', ["$rootScope", "$http", "$timeout", "$location", "newAjaxService", "latestSearch", "setTarget", "providedValue", "mapDataService", "stateService", function ($rootScope, $http, $timeout, $location, newAjaxService, latestSearch, setTarget, providedValue, mapDataService, stateService) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {

                if (attrs.inputField == "from") {
                    scope.$on('performGeoLocationLookup', function (e, latitude, longitude) {

                        if (e) {
                            if (attrs.allowgeolookup) {
                                scope.getGeoLocation(latitude, longitude);
                            }
                        }
                    });
                }
                scope.getGeoLocation = function (latitude, longitude) {
                    var url = '/api/Map/FindStationByGeoLocation/' + latitude + '/' + longitude + '/5/false';

                    var callback = function (data) {
                        try {
                            mapDataService.setNearbyStations(data, latitude, longitude);
                            scope.destination = data.data;

                            if (data.data[0].Sid != null) {
                                var longlat = data.data[0].Sid.split(",");
                                data.data[0].Longitude = longlat[0];
                                data.data[0].Latitude = longlat[0];
                            }

                            var target = {
                                value: element.data().$ngModelController.$viewValue,
                                SiteId: data.data[0].SiteId,
                                Name: data.data[0].Name,
                                Longitude: data.data[0].Longitude,
                                Latitude: data.data[0].Latitude
                            };

                            if (!stateService.getShowSearchTo()) {
                                target.value = data.data[0].Name;
                            }
                            setTarget.setIndex(scope.model, scope.targetString, target);
                            scope.states.typeahead = 'geolocation';
                            if (attrs.inputField == "from" || attrs.inputField == "to") {
                                scope.states.focused = true;
                            }
                            //window.temp = element;
                            element.focus();
                            // Because geolocation is always called in a blurred state and timeout resets blur,
                            // we need to tell the blur event to ignore the reset on this occasion
                            scope.ignoreBlur = true;
                        } catch (error) {
                        }
                    };
                    newAjaxService.autocomplete(url, scope, $http, callback);
                };

                var delay = parseInt(scope.delay);

                scope.locationSearch = function () {
                    var url = '/api/TypeAhead/Find/'; //Hardcoded not good
                    newAjaxService.setTimestamp();
                    if (!(scope.model.states.searchType == "timetable" && (scope.isLineNumber() || scope.isTrafficType()))) {
                        $timeout(function () {

                            if (newAjaxService.checkTime(delay)) {

                                var requestUrl = url + createUrlSafeWord(element.data().$ngModelController.$viewValue);

                                if (attrs.onlystations != undefined && attrs.onlystations == "true") {
                                    requestUrl += "/true";
                                }
                                var callback = function (data) {
                                    try {
                                        if (scope.model.states.searchType != "timetable") {
                                            scope.destination = data.data;
                                        } else {
                                            scope.destination = [];
                                            for (var i in data.data) {
                                                if (isNaN(data.data[i].Name)) {
                                                    scope.destination[i] = data.data[i];
                                                }
                                            }
                                        }
                                        if (data.data[0].Sid != null) {
                                            var longlat = data.data[0].Sid.split(",");
                                            data.data[0].Latitude = longlat[0];
                                            data.data[0].Longitude = longlat[1];
                                        } else {
                                            data.data[0].Latitude = null;
                                            data.data[0].Longitude = null;
                                        }
                                        var target = {
                                            value: element.data().$ngModelController.$viewValue,
                                            SiteId: data.data[0].SiteId,
                                            Name: data.data[0].Name,
                                            Longitude: data.data[0].Longitude,
                                            Latitude: data.data[0].Latitude
                                        };
                                        setTarget.setIndex(scope.model, scope.targetString, target);
                                        scope.states.typeahead = 'stations';
                                        scope.activeList = "destination";
                                        scope.activeRow = 0;
                                    } catch (error) {
                                    }
                                };
                                var value = "";
                                if (scope.model[attrs.inputField] == undefined) {
                                    value = scope.model.advancedParams.viaStation.data.value;
                                } else {
                                    value = scope.model[attrs.inputField].value;
                                }

                                var reg = new RegExp(/^[\w\s\u00C0-\u0231-´'`:()]+$/);
                                var result = reg.test(value);
                                if (result) {
                                    newAjaxService.autocomplete(requestUrl, scope, $http, callback);
                                    newAjaxService.setTimestamp();
                                } else {
                                    scope.destination = {
                                        Error: providedValue.invalidSearchTerm
                                    };
                                }
                            }
                        }, (delay + 1));
                    } else {
                        scope.destination = {};
                        scope.states.typeahead = "timetable";
                    }
                    scope.activeRow = null;
                };

                //Bind Key Events
                scope.initKeys = function () {
                    scope.activeRow = null;
                    var keyupHandler = function (event) {
                        var keyId = event.keyCode || event.which || event.key;
                        var geolocation = "geolocation";
                        var destination = "destination";
                        if (keyId != 38 &&
                                keyId != 40 &&
                                    keyId != 13) {
                            if (keyId != 37 &&
                                keyId != 39 &&
                                keyId != 16 && // SHIFT
                                keyId != 9 && // TAB
                                (element.data().$ngModelController.$viewValue != undefined && element.data().$ngModelController.$viewValue.length >= scope.charlimit)) {
                                scope.locationSearch();
                            } else if (element.data().$ngModelController.$viewValue != undefined && element.data().$ngModelController.$viewValue.length < scope.charlimit) {
                                var latestSearchKey = stateService.getShowSearchTo() ? "LatestTravelplannerSearch" : "LatestRealtimeSearch";
                                scope.resetField({ value: element.data().$ngModelController.$viewValue }, latestSearch.get(latestSearchKey));
                                scope.states.typeahead = 'latestsearch';
                                scope.$apply();
                            } else {
                               
                            }

                        } else {
                            event.returnValue = false;
                            if (scope.destination != null && scope.destination.length > 0) {
                                switch (keyId) {
                                    case 37:
                                        //left
                                        break;
                                    case 39:
                                        //right
                                        break;
                                    case 40:
                                        //down
                                        if (scope.activeRow == null) {
                                            if (scope.targetString != "advancedParams.viaStation.data" && scope.states.typeahead == "latestsearch") {
                                                scope.activeList = geolocation;
                                            } else {
                                                scope.activeList = destination;
                                            }
                                            scope.activeRow = 0;
                                        } else {
                                            if (scope.activeList == geolocation
                                                && scope.activeRow == scope.geolocation.length - 1) {
                                                scope.activeList = destination;
                                                scope.activeRow = 0;
                                            } else {
                                                scope.activeRow = (scope.activeRow < scope.destination.length - 1 ? scope.activeRow + 1 : scope.destination.length - 1);
                                            }
                                        }
                                        break;
                                    case 38:
                                        //up
                                        if (scope.activeRow == null) {
                                            scope.activeRow = 0;
                                        } else {
                                            if (scope.activeList == destination
                                                && scope.activeRow == 0
                                                    && scope.targetString != "advancedParams.viaStation.data"
                                                        && scope.states.typeahead == "latestsearch") {
                                                scope.activeList = geolocation;
                                                scope.activeRow = scope.geolocation.length - 1;
                                            } else {
                                                scope.activeRow = (scope.activeRow > 0 ? scope.activeRow - 1 : 0);
                                            }
                                        }
                                        break;
                                    case 13:
                                        var activeRow = 0;
                                        var activeList = "destination";

                                        if (scope.activeList != undefined) {
                                            activeList = scope.activeList;
                                        }
                                        if (scope.activeRow != null) {
                                            activeRow = scope.activeRow;
                                        }
                                        if (scope.activeList == geolocation) {
                                            element[0].blur();
                                            scope.$broadcast("setPosition");
                                        }

                                        scope.updateInput(scope[activeList][activeRow], "click");
                                        scope.clickedOnUpdateInput = scope[activeList][activeRow];
                                        element[0].blur();

                                        if (scope.model.states.searchType != "timetable" && !(scope.model.states.searchType == "realTime" && scope.model.from.Longitude != null && scope.model.from.Latitude != null && !(scope.model.from.SiteId > 0))) {
                                            scope.performRealtimeSearch();
                                        }
                                }
                                scope.$apply();
                            }
                        }
                    };
                    element.bind('keyup', function (e) {
                        keyupHandler(e);
                    });
                };
                scope.clickedOnUpdateInput = false;
                scope.mouseDownHandler = function (choice) {
                    scope.clickedOnUpdateInput = choice;
                };
                scope.updateInput = function (values, event) {

                    if (values != undefined && event != "click" || (event == "click" && scope.states.typeahead == "geolocation")) {
                        // Because blur is called before updateInput, 
                        // we need to tell the blur event to ignore the default target
                        // when we want to set the target that has been selected
                        if (scope.clickedOnUpdateInput == false) {
                            scope.ignoreDefaultTarget = true;
                        }
                        if (values.Sid != undefined) {
                            var longlat = values.Sid.split(",");
                            values.Latitude = longlat[0];
                            values.Longitude = longlat[1];
                        }
                        var target = {
                            SiteId: values.SiteId,
                            Name: values.Name,
                            Longitude: values.Longitude,
                            Latitude: values.Latitude,
                            value: values.Name
                        };

                        if (values.Name == undefined) {
                            target.Name = values.FromName;
                            target.value = values.FromName;
                        }

                        if (((scope.states.typeahead == "stations" || scope.states.typeahead == "geolocation" || scope.states.typeahead == null) && values.Name != undefined) || scope.model.states.searchType == "timetable") {
                            setTarget.setIndex(scope.model, scope.targetString, target);
                        }

                        /*
                        scope.target.value = values.Name;
                        scope.target.Name = values.Name;
                        scope.target.SiteId = values.SiteId;
                        scope.target.Longitude = values.Longitude;
                        scope.target.Latitude = values.Latitude;
                        */

                        if (scope.model.states.searchType != "timetable") {
                            if (scope.clickedOnUpdateInput != false && (scope.states.typeahead == "geolocation" || values.Type == "station")) {
                                scope.performRealtimeSearch();
                            }
                            if (scope.states.typeahead == "latestsearch") {
                                window.SiteCatalyst.TrackClient("Search", "senaste sökningar");
                            } else if (scope.states.typeahead != "geolocation") {
                                window.SiteCatalyst.TrackClient("Search", "autocomplete");
                            }

                            if (values.Url != undefined) {
                                if (values.Type == "Travelplanner") {
                                    $location.path(values.Url);
                                } else {
                                    $location.path(values.Url);
                                }
                            }
                        } else {
                            scope.model.from.value = scope.model.from.FromName = scope.model.from.Name = values.FromName != undefined ? values.FromName : values.Name;
                            scope.performTimetablesSearch("typeahead");
                        }

                        scope.destination = {};
                        //reset typeaheadstate
                        scope.states.typeahead = null;

                    }
                };

                scope.initKeys();
            }
        };
    } ])
    .directive("typeaheadChoice", function () {
        return function (scope, element) {
            element.bind("touchstart", function () {
                scope.mouseDownHandler();
            });
        };
    })
    .directive("dateTimePicker", function () {
        return {
            link: function (scope, element, attrs) {

                element.bind("focus", function () {
                    element.onclick();
                    if (attrs.ngModel == "data.time") {
                        if (element.val() != scope.data.time) {
                            element.blur();
                        }
                    } else if (attrs.ngModel == "model.advancedParams.time.day") {
                        if (element.val() != scope.model.advancedParams.time.day) {
                            element.blur();
                        }
                    }

                });

                element.bind("blur", function () {
                    if (attrs.ngModel == "data.time") {
                        scope.data.time = element.val();
                        scope.updateTime(scope.data.time);
                    } else if (attrs.ngModel == "model.advancedParams.time.day") {
                        scope.model.advancedParams.time.day = element.val();
                        scope.$apply();
                    }
                });

                scope.updateTime = function (time) {
                    var timeArray = time.split(":");
                    scope.model.advancedParams.time.hour = timeArray[0];
                    scope.model.advancedParams.time.minute = timeArray[1];
                    scope.$apply();
                };
            }
        };
    });

angular.module('slapp.newTravelPlanner.factories', [])
    .factory("favouritesModel", ["favoriteSearch", function (favoriteSearch) {
        /*
        * Every fav item is an array of following variables;
        * fromName : Name of from address/station
        * toName : Name of to address/station (only if type is travelPlanner)
        * SiteId : Id of from station (only if type is realTime)
        * url : search url path
        * type : either realTime or travelPlanner or Timetables
        * active: bool value
        */
        var favService = {
            data: {
                favoriteSearch: [],
                favoriteTimetables: []
            }
        };

        favService.compare = function (key, url) {
            for (var item in favService.data[key]) {
                if (url == favService.data[key][item].url) {
                    return item;
                }
            }
            return false;
        };

        favService.handleClick = function (key, currentSearchObject) {
            if (currentSearchObject.active) {
                parseAndRemoveFromFavourites(key, currentSearchObject.url);
            } else {
                if (!favoriteSearch.exists(key, currentSearchObject.url)) {
                    favoriteSearch.add(key, currentSearchObject);
                    if (favService.compare(key, currentSearchObject.url) === false) {
                        favService.data[key].push(currentSearchObject);
                    }
                }
            }
            var updatedObject = inverseState(key, currentSearchObject);
            return updatedObject;
        };

        favService.updateFavourite = function (key, currentSearchObject) {
            var updated = false;
            var currentList = favoriteSearch.get(key);
            for (var item in currentList) {
                if (currentList[item].url == currentSearchObject.url) {
                    updated = favoriteSearch.update(key, item, currentSearchObject);
                    if (updated) {
                        var exists = favService.compare(key, currentSearchObject.url);

                        if (exists) {
                            favService.data[key][exists] = currentSearchObject;
                        } else {
                            //If it doesn't exist we add it (should never happen)
                            favService.data[key].push(currentSearchObject);
                        }
                    }
                }
            }
            return updated;
        };

        favService.getRealtimeGroups = function (key, url) {
            var templist = favoriteSearch.get(key);
            for (var item in templist) {
                if (templist[item].url == url) {
                    return templist[item].realtimeGroups;
                }
            }
            return {};
        };

        for (var item in favService.data) {
            //Get current favourites list
            var localList = favoriteSearch.get(item);
            if (localList !== null) {
                favService.data[item] = localList;
            }

            //add active state to all existing favourites
            addActiveState(item);
        }

        return favService;

        function parseAndRemoveFromFavourites(key, url) {
            var removed = false;
            var currentList = favoriteSearch.get(key);
            for (var item in currentList) {
                if (currentList[item].url == url) {
                    removed = favoriteSearch.remove(key, item, url);
                    break;
                }
            }
            return removed;
        }

        function inverseState(key, currentSearchObject) {
            for (var item in favService.data[key]) {
                if (favService.data[key][item].url == currentSearchObject.url) {
                    favService.data[key][item].active = !favService.data[key][item].active;
                    return favService.data[key][item];
                }
            }
            return false;
        }

        function addActiveState(key) {
            for (var item in favService.data[key]) {
                favService.data[key][item].active = true;
            }
        }
        

    } ]);

    angular.module('slapp.newTravelPlanner.controllers', [])
        .controller("newTravelPlanner", ["$scope", "$rootScope", "$filter", "$location", "providedValue", "latestSearch", "setTarget", "urlprovider", "$timeout", "latestSearchType", "stateService", function ($scope, $rootScope, $filter, $location, providedValue, latestSearch, setTarget, urlprovider, $timeout, latestSearchType, stateService) {
            $rootScope.isMapLoaded = false;
            $scope.stateService = stateService;
            $scope.modelService = {
                data: {}
            };
            $scope.modelService.reset = function () {
                $scope.modelService.data = {};
            };
            $scope.modelService.set = function (target, value) {
                setTarget.setIndex($scope.modelService.data, target, value);
            };
            var setFocus = function (string) {
                $scope[string] = true;
                $timeout(function () {
                    $scope[string] = false;
                }, 300);
            };
            $scope.$on("focusOnTravelplannerTab", function () {
                setFocus("focusOnTravelplannerTab");
            });
            $scope.$on("focusOnToInput", function () {
                setFocus("focusOnToInput");
            });
            $scope.$on("focusOnSwitchDirections", function () {
                setFocus("focusOnSwitchDirections");
            });
            $scope.$on("focusOnSearchButton", function () {
                setFocus("focusOnSearchButton");
            });
            $scope.toggleSearch = function () {
                $scope.stateService.setShowSearchTo(!$scope.stateService.getShowSearchTo());
                $scope.updateState();
            };
            $scope.stateService.setShowSearchTo(latestSearchType.get() != "realtime");
            $scope.updateState = function () {
                $scope.model.states.searchType = ($scope.stateService.getShowSearchTo() ? "travelPlanner" : "realTime");
            };

            $scope.$on("scrollToSearchField", function () {
                $scope.scrollToSearchField = true;
                $timeout(function () {
                    $scope.scrollToSearchField = false;
                });
            });

            $scope.searchIsValid = function () {
                if ($scope.stateService.getShowSearchTo() == true
                    && (
                    (
                    $scope.model.to.SiteId != undefined
                    && $scope.model.from.Longitude != ""
                    && $scope.model.from.Latitude != ""
                    && $scope.model.from.Longitude != undefined
                    && $scope.model.from.Latitude != undefined
                ) || (
                    $scope.model.from.SiteId != undefined
                    && $scope.model.to.Longitude != ""
                    && $scope.model.to.Latitude != ""
                    && $scope.model.to.Longitude != undefined
                    && $scope.model.to.Latitude != undefined
                ) || (
                    ($scope.model.from.SiteId != undefined && $scope.model.from.SiteId > 0)
                    && ($scope.model.to.SiteId != undefined && $scope.model.to.SiteId > 0)
                ) || (
                    $scope.model.from.Longitude != ""
                    && $scope.model.from.Latitude != ""
                    && $scope.model.to.Longitude != ""
                    && $scope.model.to.Latitude != ""
                    && $scope.model.from.Longitude != undefined
                    && $scope.model.from.Latitude != undefined
                    && $scope.model.to.Longitude != undefined
                    && $scope.model.to.Latitude != undefined

                ))
                ) {
                    return true;
                }
                return false;
            };
            $scope.isGeoLookup = function () {
                if ($scope.stateService.getShowSearchTo() == false
                    && ($scope.model.from.SiteId != undefined
                    && $scope.model.from.SiteId == 0)
                    || ($scope.model.from.Longitude != undefined
                    && $scope.model.from.Latitude != undefined)
                ) {
                    return true;
                }
                return false;
            };

            $scope.realTimeSearchIsValid = function () {
                if ($scope.stateService.getShowSearchTo() == false
                    && $scope.model.from.SiteId != undefined
                    && $scope.model.from.SiteId > 0
                //&& $scope.model.from.Name.length > 0 //Vet ej om denna behövs eller inte, skapar fel vid val i latestsearch.
                ) {
                    return true;
                }
                return false;
            };

            $scope.performRealtimeSearch = function () {

                if ($scope.model.states.searchType == "realTime" && $scope.model.from.Longitude != null && $scope.model.from.Latitude != null && !($scope.model.from.SiteId > 0)) {
                    $scope.$broadcast('performGeoLocationLookup', $scope.model.from.Latitude, $scope.model.from.Longitude);
                }

                if ($scope.realTimeSearchIsValid()) {
                    //var callback = function () {
                    var url = urlprovider.realtime.createRouteUrl($scope.model.from.Name, $scope.model.from.SiteId);

                    // Remove from latest search if it already exists
                    if (latestSearch.exists("LatestRealtimeSearch", url)) {
                        var currentList = latestSearch.get("LatestRealtimeSearch");
                        for (var item in currentList) {
                            if (currentList[item].Url == url) {
                                latestSearch.remove("LatestRealtimeSearch", item, url);
                                break;
                            }
                        }
                    }

                    // Add to latest search
                    latestSearch.add({ Type: 'Realtime', Url: url, FromName: $scope.model.from.Name, SiteId: $scope.model.from.SiteId });

                    $location.path(url);
                    
                }
            };
            $scope.performSearch = function () {
                if ($scope.searchIsValid()) {
                    //var callback = function () {
                    $scope.model.advancedParams.advParamsChanged = $scope.advParamsChanged($scope.advancedParamsCheck) ? "1" : "0";
                    var url = urlprovider.travelplanner.createRouteUrl($scope.model.from, $scope.model.to, $scope.model.advancedParams);

                    if (url !== $location.path()) {

                        // Reset date/time for latest search url
                        $scope.model.advancedParams.time.direction = 1;
                        var latestSearchUrl = urlprovider.travelplanner.createRouteUrl($scope.model.from, $scope.model.to, $scope.model.advancedParams);

                        // Remove from latest search if it already exists
                        if (latestSearch.exists("LatestTravelplannerSearch", latestSearchUrl)) {
                            var currentList = latestSearch.get("LatestTravelplannerSearch");
                            for (var item in currentList) {
                                if (currentList[item].Url == latestSearchUrl) {
                                    latestSearch.remove("LatestTravelplannerSearch", item, latestSearchUrl);
                                    break;
                                }
                            }
                        }

                        // Add to latest search
                        latestSearch.add({ Type: 'Travelplanner', Url: latestSearchUrl, FromName: $scope.model.from.Name, ToName: $scope.model.to.Name });

                        $location.path(url);
                    } else {
                        $rootScope.$broadcast('updateSearch');
                    }
                }
            };

            $scope.prepareSearch = function () {

            };

            $scope.switchDirections = function () {
                var tempmodel = {
                    from: $scope.model.from,
                    to: $scope.model.to
                };
                $scope.$broadcast('switchFromTo', tempmodel);
            };
            $scope.advancedParamsToggler = function () {
                $scope.model.advancedParams.isVisible = !$scope.model.advancedParams.isVisible;
                $scope.advancedButton();
            };

            $scope.advancedButton = function () {

                $scope.advancedButtonText = "text";

                if ($scope.model.advancedParams.isVisible != true) {

                    if ($scope.advParamsChanged($scope.advancedParamsCheck)) {
                        $scope.advancedButtonText = providedValue.yourChoices;
                    } else {
                        $scope.advancedButtonText = providedValue.moreOptions;
                    }
                } else {
                    $scope.advancedButtonText = providedValue.hide;
                }

                return $scope.advancedButtonText;
            };

            $scope.advParamsChanged = function (advancedParamsCheck) {
                var changed = false;

                for (var obj in advancedParamsCheck) {
                    if (advancedParamsCheck[obj]) {
                        changed = true;
                        break;
                    }
                }

                return changed;
            };
            $scope.reset = function () {
                $scope.modelService.reset();
                $scope.model = $scope.modelService.data;
                $scope.modelService.set('states', {});
                $scope.modelService.set('advancedParams', {});
                $scope.display = {};
                $scope.advancedButtonText = providedValue.moreOptions;
                $scope.advancedParamsCheck = {};
                $scope.model.states.searchType = ($scope.stateService.getShowSearchTo() ? "travelPlanner" : "realTime");
                $scope.$broadcast('reset');
                $scope.$emit("focusOnTravelplannerTab");
            };
            $scope.init = function () {
                $scope.modelService.set('states', {});
                $scope.modelService.set('advancedParams', {});
                $scope.model.states.searchType = ($scope.stateService.getShowSearchTo() ? "travelPlanner" : "realTime");
                $scope.$broadcast('init');
            };
            $scope.$on('begininit', function (e, presetValues, travelPlannerBool) {
                if (e) {
                    $scope.stateService.setShowSearchTo(travelPlannerBool);
                    $scope.updateState();
                    
                    $scope.presetValues = presetValues;
                    $scope.init();

                }
            });

            $scope.advancedButtonText = providedValue.moreOptions;
            $scope.advancedParamsCheck = {};
            $scope.placeholder = {
                "from": providedValue.placeholderFrom,
                "to": providedValue.placeholderTo
            };
            $scope.model = $scope.modelService.data;
            $scope.init();
        } ])
        .controller("inputField", ["$rootScope", "$scope", "setTarget", "providedValue", function ($rootScope, $scope, setTarget, providedValue) {
            $scope.$on('init', function (e) {
                if (e) {
                    $scope.init();
                }
            });
            $scope.$watch("states.focused", function () {
                if ($scope.states.focused) {
                    $scope.$emit("scrollToSearchField");
                }
            });
            $scope.$on("initMap", function () {
                $scope.reset();
            });
            $scope.showDropdown = function (field) {

                this.hasResult = function () {
                    return $scope.destination && $scope.destination.length > 0;
                };

                this.lessThanLimit = function () {
                    return $scope.model[field].value == undefined || ($scope.model[field].value != undefined && $scope.model[field].value.length < $scope.charlimit);
                };

                return (
                            (
                                this.hasResult() || this.lessThanLimit()
                            )
                            || (
                                !this.hasResult()
                                && $scope.states.typeahead == 'latestsearch'
                                && !this.lessThanLimit()
                            )
                        )
                        && (
                            $rootScope.hasGeoLocation
                            || (
                                !$rootScope.hasGeoLocation
                                && $scope.destination
                                && $scope.destination.length > 0
                            )
                        )
                        && $scope.states.focused;
            };
            $scope.geolocation = [{ Name: providedValue.myLocation}];
            
            $scope.resetField = function (value, destination) {
                $scope.states.typeahead = null;
                if (destination != undefined) {
                    $scope.destination = destination;
                } else {
                    $scope.destination = {};
                }
                if (value != undefined) {
                    setTarget.setIndex($scope.model, $scope.targetString, value);
                } else {
                    setTarget.setIndex($scope.model, $scope.targetString, {
                        Name: null,
                        SiteId: null,
                        Longitude: null,
                        Latitude: null,
                        value: null
                    });
                }
                $scope.$emit("resetField");
            };
            //Typahead can be one of; geolocation, latestsearch or stations
            $scope.reset = function () {
                $scope.isTypeAheadLoading = false;
                $scope.charlimit = 3;
                $scope.destination = {};
                $scope.states = {
                    focused: false,
                    loading: false,
                    typeahead: null
                };
            };
            $scope.init = function () {

            };
            $scope.reset();
        } ])
        .controller("newDepartureTimeSearch", ["$scope", "$filter", "providedValue", function ($scope, $filter, providedValue) {
            $scope.data = {
                time: "00:00"
            };
            $scope.setTime = function () {
                $scope.model.advancedParams.time.direction = 1;
                $scope.model.advancedParams.time.addHour = false;
                $scope.model.advancedParams.time.addDay = false;

                //Minutes
                var minute = Math.ceil($filter("date")(new Date(), "mm") / 5) * 5;
                if (minute == 60) {
                    minute = 0;
                    $scope.model.advancedParams.time.addHour = true;
                }
                $scope.model.advancedParams.time.minute = $scope.formatDoubleDigit(minute);

                //Hours
                var dateHour = new Date();
                if ($scope.model.advancedParams.time.addHour) {
                    dateHour.setHours(dateHour.getHours() + 1, 0, 0, 0);
                }
                $scope.model.advancedParams.time.hour = $filter("date")(dateHour, "HH");
                if ($scope.model.advancedParams.time.hour == "00") {
                    $scope.model.advancedParams.time.addDay = true;
                }

                // Hours + Minutes
                $scope.data.time = $scope.model.advancedParams.time.hour + ":" + $scope.model.advancedParams.time.minute;

                //Dates
                $scope.model.advancedParams.time.dayDate = new Date();
                var start = new Date(Date.parse($scope.model.advancedParams.time.dayDate) - 24 * 3600 * 1000 - 1);
                if ($scope.model.advancedParams.time.addDay) {
                    $scope.model.advancedParams.time.dayDate = new Date(start.setDate(start.getDate() + 1));
                }
                $scope.model.advancedParams.time.day = $filter("date")($scope.model.advancedParams.time.dayDate, "yyyy-MM-dd");

            };

            $scope.formatDoubleDigit = function (i) {
                return (i < 10 ? "0" + i : i + "");
            };

            $scope.parseDate = function (dateValue) {
                for (var obj in $scope.dateChoices) {
                    if ($scope.dateChoices[obj].value == dateValue) {
                        return ($scope.dateChoices[obj].name);
                    }
                }
            };
            function setBase() {
                $scope.modelService.set('advancedParams.time', {});
                $scope.minChoices = [];
                $scope.hourChoices = [];
                $scope.dateChoices = [];
                $scope.setTime();

                $scope.model.advancedParams.time.direction = 1;

                $scope.departTypeChoices = [
                    { name: providedValue.departNow, value: 1 },
                    { name: providedValue.departEarliest, value: 2 },
                    { name: providedValue.arriveAt, value: 3 }
                ];

                //Populate minChoices
                var step = 5;
                var limit = 60;
                for (var i = 0; i < limit; i = i + step) {
                    $scope.minChoices.push({ name: $scope.formatDoubleDigit(i), value: $scope.formatDoubleDigit(i) });
                }

                //Populate hourChoices
                step = 1;
                limit = 24;
                for (var i = 0; i < limit; i = i + step) {
                    $scope.hourChoices.push({ name: $scope.formatDoubleDigit(i), value: $scope.formatDoubleDigit(i) });
                }

                //Populate Dates
                var start = new Date(Date.parse($scope.model.advancedParams.time.dayDate) - 24 * 3600 * 1000 - 1);
                var end = new Date();
                end.setDate(end.getDate() + 28);
                $scope.dateChoices.push({ name: $filter("date")(start, "EEE dd MMM"), value: $filter("date")(start, "yyyy-MM-dd") });
                start = new Date(start.setDate(start.getDate() + 1));
                $scope.dateChoices.push({ name: providedValue.today, value: $filter("date")(start, "yyyy-MM-dd") });
                start = new Date(start.setDate(start.getDate() + 1));
                $scope.dateChoices.push({ name: providedValue.tomorrow, value: $filter("date")(start, "yyyy-MM-dd") });
                start = new Date(start.setDate(start.getDate() + 1));

                limit = 28; // was 100
                x = 0;
                while (start < end || limit > x) {
                    $scope.dateChoices.push({ name: $filter("date")(start, "EEE dd MMM"), value: $filter("date")(start, "yyyy-MM-dd") });
                    start = new Date(start.setDate(start.getDate() + 1));
                    x++;
                }
            };

            $scope.html5DateTimePicker = function () {
                if (Modernizr.inputtypes.date && Modernizr.inputtypes.time) {
                    return true;
                }
                return false;
            };

            $scope.$on('reset', function (e) { if (e) { $scope.reset(); } });
            $scope.reset = function () {
                setBase();
            };

            $scope.$on('init', function (e) { if (e) { $scope.init(); } });
            $scope.init = function () {
                setBase();
                if ($scope.presetValues != undefined && $scope.presetValues.advancedParams != undefined && $scope.presetValues.advancedParams.time != undefined) {

                    $scope.model.advancedParams.time.minute = $scope.presetValues.advancedParams.time.minute;
                    $scope.model.advancedParams.time.hour = $scope.presetValues.advancedParams.time.hour;
                    $scope.model.advancedParams.time.day = $scope.presetValues.advancedParams.time.day;
                    $scope.model.advancedParams.time.direction = $scope.presetValues.advancedParams.time.direction;
                    $scope.data.time = $scope.presetValues.advancedParams.time.hour + ":" + $scope.presetValues.advancedParams.time.minute;
                }
            };

            $scope.init();
        } ])
        .controller('newGeoLocation', ["$scope", "providedValue", function ($scope, providedValue) {
            var infoText = providedValue.myLocation;
            $scope.$on("setPosition", function () {
                $scope.getPosition($scope.targetString);
            });
            $scope.getPosition = function (field) {
                if (geo_position_js.init()) {
                    $scope.$parent.$parent.isTypeAheadLoading = true;
                    $scope.model[field].value = infoText;
                    geo_position_js.getCurrentPosition(successCallback, errorCallback, { enableHighAccuracy: true });
                    window.SiteCatalyst.TrackClient("Search", "gps");
                }

                function successCallback(p) {
                    $scope.$parent.$parent.isTypeAheadLoading = false;
                    $scope.model[field].value = infoText;
                    $scope.model[field].SiteId = 0;
                    $scope.model[field].Name = infoText;
                    $scope.model[field].Longitude = p.coords.longitude;
                    $scope.model[field].Latitude = p.coords.latitude;
                    $scope.$parent.destination = {};
                    if ($scope.model.states.searchType !== "timetable") {
                        $scope.performRealtimeSearch();
                    } else {
                        $scope.performTimetablesSearch();
                    }
                    $scope.$apply(); //Because geo_position_js aint angular, we need to tell angular that we are back from the non angular work.

                }

                function errorCallback(p) {
                    $scope.$parent.isTypeAheadLoading = false;
                    $scope.model[field] = {};
                    $scope.$parent.destination = {};
                }
            };

        } ])
        .controller("newViaStation", ["$scope", "providedValue", function ($scope, providedValue) {
            $scope.placeholder = providedValue.placeholderVia;
            $scope.$on('init', function (e) { if (e) { $scope.init(); } });
            $scope.init = function () {
                $scope.modelService.set('advancedParams.viaStation', { data: {} });
            };

            $scope.isChanged = function () {
                if ($scope.model.advancedParams.viaStation.data == undefined) {
                    return false;
                }
                var isChanged = ($scope.model.advancedParams.viaStation.data.SiteId != undefined);

                $scope.$parent.advancedParamsCheck["newViaStation"] = isChanged;
                return isChanged;
            };

            $scope.init();
        } ])
        .controller("newTransportationTypeChoice", ["$scope", "$filter", "providedValue", "setTarget", function ($scope, $filter, providedValue, setTarget) {
            var path = 'advancedParams.transportationTypes';

            function setBase() {
                var types = [
                    { name: providedValue.metro, checked: true, DefaultValue: true, icon: 'advanced-station-icon MET', value: 2 },
                    { name: providedValue.bus, checked: true, DefaultValue: true, icon: 'advanced-station-icon BUS', value: 8 },
                    { name: providedValue.train, checked: true, DefaultValue: true, icon: 'advanced-station-icon TRN', value: 1 },
                    { name: providedValue.lightRailwaysAndTram, checked: true, DefaultValue: true, icon: 'advanced-station-icon TRM', value: 4 },
                    { name: providedValue.ferry, checked: true, DefaultValue: true, icon: 'advanced-station-icon FER', value: 96 },
                    { name: providedValue.localTrafic, checked: false, DefaultValue: false, icon: 'advanced-station-icon NTF', value: 128 }
                ];
                $scope.modelService.set(path, {
                    data: types
                });
            };

            $scope.$on('reset', function (e) { if (e) { $scope.reset(); } });
            $scope.reset = function () {
                setBase();
            };

            $scope.$on('init', function (e) { if (e) { $scope.init(); } });
            $scope.init = function () {
                setBase();

                if ($scope.presetValues != undefined) {
                    var data = setTarget.getIndex($scope.presetValues, path);
                    if (data != undefined && data.data != undefined) {
                        var array = data.data.split(',');
                        for (var item in $scope.model.advancedParams.transportationTypes.data) {
                            if (array.indexOf($scope.model.advancedParams.transportationTypes.data[item].value + "") > -1) {
                                $scope.model.advancedParams.transportationTypes.data[item].checked = true;
                            } else {
                                $scope.model.advancedParams.transportationTypes.data[item].checked = false;
                            }
                        }
                    }
                }
            };

            $scope.transportationTypeSelection = function () {
                var sum = 0;
                var journeyProductsValue = '';
                for (var item in $scope.model.advancedParams.transportationTypes.data) {
                    if ($scope.model.advancedParams.transportationTypes.data[item].checked) {
                        sum += this.value;
                        journeyProductsValue += $scope.model.advancedParams.transportationTypes.data[item].value + ",";
                    }
                }

                if (sum == 47) { //47 is sum of default checked items.
                    journeyProductsValue = '';
                }

                return {
                    journeyProductsValue: journeyProductsValue
                };
            };

            $scope.isChanged = function () {
                var isChanged = false;
                //*
                $.each($scope.model.advancedParams.transportationTypes.data, function () {
                    if (this.checked != this.DefaultValue) {
                        isChanged = true;
                    }
                });
                $scope.$parent.advancedParamsCheck["newTransportationTypeChoice"] = isChanged;
                return isChanged;
            };

            $scope.init();
        } ])
        .controller("newLineChoice", ["$scope", "providedValue", "setTarget", function ($scope, providedValue, setTarget) {
            //Constants 
            var LINE_SELECTED = 0;
            var LINE_CHOICE_TEXT = '';
            var path = 'advancedParams.lineChoice';
            $scope.placeholder = providedValue.specifyLineNumber;

            function setBase() {
                $scope.modelService.set(path, {});

                var lineChoices = [
                    { name: providedValue.includeAllLines, id: 0 },
                    { name: providedValue.includeOnly, id: 2 },
                    { name: providedValue.doNotInclude, id: 1 }
                ];

                $scope.model.advancedParams.lineChoice.data = lineChoices;
                $scope.model.advancedParams.lineChoice.lineSelected = LINE_SELECTED;
                $scope.model.advancedParams.lineChoice.lineChoiceText = LINE_CHOICE_TEXT;
            };

            $scope.$on('reset', function (e) { if (e) { $scope.reset(); } });
            $scope.reset = function () {
                setBase();
            };

            $scope.$on('init', function (e) { if (e) { $scope.init(); } });
            $scope.init = function () {
                setBase();

                if ($scope.presetValues != undefined) {
                    var data = setTarget.getIndex($scope.presetValues, path);
                    if (data != undefined && data.filterLine != undefined) {
                        $scope.model.advancedParams.lineChoice.lineChoiceText = data.filterLine;
                    }
                    if (data != undefined && data.filterMode) {
                        $scope.model.advancedParams.lineChoice.lineSelected = parseInt(data.filterMode);
                    }
                }
            };

            $scope.isChanged = function () {
                var isChanged = ($scope.model.advancedParams.lineChoice.lineChoiceText != LINE_CHOICE_TEXT && $scope.model.advancedParams.lineChoice.lineChoiceText != undefined);
                $scope.$parent.advancedParamsCheck["newLineChoice"] = isChanged;
                if ($scope.model.advancedParams.lineChoice.lineSelected == LINE_SELECTED) {
                    $scope.model.advancedParams.lineChoice.lineChoiceText = "";
                }
                return isChanged;
            };

            $scope.init();
        } ])
        .controller("newWalkway", ["$scope", "setTarget", function ($scope, setTarget) {
            //Constants 
            var CHECKBOX = true;
            var SELECTED = 2000;
            var path = 'advancedParams.walkway';

            function setBase() {
                $scope.modelService.set(path, {});

                $scope.model.advancedParams.walkway.checkbox = CHECKBOX;
                $scope.model.advancedParams.walkway.selected = SELECTED;
                $scope.model.advancedParams.walkway.choices = [
                    { name: '200 m', value: 200 },
                    { name: '500 m', value: 500 },
                    { name: '1 km', value: 1000 },
                    { name: '2 km', value: 2000 }
                ];

                $scope.recipients = [];
                $scope.selectedRecipients = [2, 4, 6, 8]; // DUMMY DATA
                $scope.recipientsList = [];
            };

            $scope.$on('reset', function (e) { if (e) { $scope.reset(); } });
            $scope.reset = function () {
                setBase();
            };

            $scope.$on('init', function (e) { if (e) { $scope.init(); } });
            $scope.init = function () {
                setBase();

                if ($scope.presetValues != undefined) {
                    var data = setTarget.getIndex($scope.presetValues, path);
                    if (data != undefined && data.maxWalkDistance != undefined && data.maxWalkDistance != SELECTED) {
                        $scope.model.advancedParams.walkway.selected = parseInt(data.maxWalkDistance);
                    }
                    if (data != undefined && data.unsharpSearch != undefined) {
                        $scope.model.advancedParams.walkway.checkbox = data.unsharpSearch == "true";
                    }
                }
            };

            $scope.parseWalkway = function (walkwayValue) {
                for (var obj in $scope.model.advancedParams.walkway.choices) {
                    if ($scope.model.advancedParams.walkway.choices[obj].value == walkwayValue) {
                        return $scope.model.advancedParams.walkway.choices[obj].name;
                    }
                }
            };
            //default = 2km
            $scope.walkwaySelection = function () {
                var maxWalkDistance = "";
                if ($scope.model.advancedParams.walkway.selected != 2000) {
                    maxWalkDistance = $scope.model.advancedParams.walkway.selected;
                }
                return {
                    unsharpSearch: $scope.model.advancedParams.walkway.checkbox,
                    maxWalkDistance: maxWalkDistance//Value in meter, default is "", I.e. if 2km is selected.
                };
            };

            $scope.isChanged = function () {
                var isChanged = $scope.model.advancedParams.walkway.checkbox != CHECKBOX || $scope.model.advancedParams.walkway.selected != SELECTED;
                $scope.$parent.advancedParamsCheck["newWalkway"] = isChanged;
                return isChanged;
            };

            $scope.init();

        } ])
        .controller("newTransportationChanges", ["$scope", "providedValue", "setTarget", function ($scope, providedValue, setTarget) {
            //Constants 
            var CHANGE = -1;
            var EXTRA_TIME = 2;
            var EXTRA_TIME_ENABLING = 0;
            var path = 'advancedParams.transportationChanges';

            function setBase() {
                $scope.modelService.set(path, {
                    data: {}
                });

                $scope.model.advancedParams.transportationChanges.change = CHANGE;
                $scope.model.advancedParams.transportationChanges.data.changeValues = [
                    { name: providedValue.noRestrictions, value: -1 },
                    { name: providedValue.noChanges, value: 0 },
                    { name: providedValue.max1Change, value: 1 },
                    { name: providedValue.max2Changes, value: 2 },
                    { name: providedValue.max3Changes, value: 3 }
                ];
                //default = inga byten
                $scope.model.advancedParams.transportationChanges.extraTime = EXTRA_TIME;
                $scope.model.advancedParams.transportationChanges.data.extraTimeValues = [
                    { name: providedValue.twoMinutes, value: 2 },
                    { name: providedValue.fiveMinutes, value: 5 },
                    { name: providedValue.tenMinutes, value: 10 },
                    { name: providedValue.fifteenMinutes, value: 15 }
                ];

                $scope.model.advancedParams.transportationChanges.extraTimeEnabling = EXTRA_TIME_ENABLING;
                $scope.model.advancedParams.transportationChanges.data.extraTimeEnablingValues = [
                    { name: providedValue.dontAffectChanges, id: 0 },
                    { name: providedValue.extraTimeNeeded, id: 1 }
                ];
            };

            $scope.parseExtraTime = function (extraTimeValue) {
                for (var obj in $scope.model.advancedParams.transportationChanges.data.extraTimeValues) {
                    if (extraTimeValue == $scope.model.advancedParams.transportationChanges.data.extraTimeValues[obj].value) {
                        return $scope.model.advancedParams.transportationChanges.data.extraTimeValues[obj].name;
                    }
                }
            };
            $scope.$on('reset', function (e) { if (e) { $scope.reset(); } });
            $scope.reset = function () {
                setBase();
            };

            $scope.$on('init', function (e) { if (e) { $scope.init(); } });
            $scope.init = function () {
                setBase();

                if ($scope.presetValues != undefined) {
                    var data = setTarget.getIndex($scope.presetValues, path);
                    if (data != undefined && data.change != undefined) {
                        $scope.model.advancedParams.transportationChanges.change = parseInt(data.change);
                    }
                    if (data != undefined && data.extraTime != undefined && data.extraTime != EXTRA_TIME) {
                        $scope.model.advancedParams.transportationChanges.extraTime = parseInt(data.extraTime);
                        $scope.model.advancedParams.transportationChanges.extraTimeEnabling = 1;
                    }
                }
            };

            $scope.isChanged = function () {
                var isChanged = $scope.model.advancedParams.transportationChanges.change != CHANGE || $scope.model.advancedParams.transportationChanges.extraTimeEnabling != EXTRA_TIME_ENABLING;
                $scope.$parent.advancedParamsCheck["newTransportationChanges"] = isChanged;
                return isChanged;
            };

            $scope.init();
        } ])
        .controller('newSearchResults', ['$scope', '$rootScope', '$http', '$location', '$anchorScroll', 'urlprovider', 'favoriteSearch', 'favouritesModel', 'travelplannerBaseUrl', 'mapDataService', 'errorHandler', 'latestSearchType', 'stateService', function ($scope, $rootScope, $http, $location, $anchorScroll, urlprovider, favoriteSearch, favouritesModel, travelplannerBaseUrl, mapDataService, errorHandler, latestSearchType, stateService) {
            $scope.stateService = stateService;
            $scope.isViewLoading.newSearchResults = false;
            $scope.isViewLoading.stationList = false;
            $scope.isViewLoading.laterTrips = false;
            $scope.isViewLoading.earlierTrips = false;
            $scope.fromName = arguments[0].fromName;
            $scope.toName = arguments[0].toName;
            $scope.isLoadedArray = [];
            $scope.isLoadingArray = [];
            $scope.clickedArray = [];
            $scope.clickedGroup = {};
            $scope.cancelledTrips = 0;
            $scope.indermediateResult = {
                Error: {}
            };

            $scope.hasStationPassed = function ($time, $date) {
                // @function $scope.hasStationPassed
                // Used to check if start or a destination has passed when getting intermediateStops
                // Every intermediateStop has a param, hasPassed (bool). 
                // But Subtrips start and end doesn't have that param.
                var datetime = new Date($date + ' ' + $time);
                var now = new Date();
                return (now.getTime() - datetime.getTime()) >= 0;
            }

            var sharePresetValues = {};
            var timeSelection;
            $scope.toggleCancelledTrips = function () {

                if (typeof (window.localStorage) === "undefined") {
                    $scope.travelResult.showCancelledTrips = !$scope.travelResult.showCancelledTrips;
                } else {
                    if (localStorage.getItem("showCancelledTrips")) {
                        localStorage.setItem("showCancelledTrips", (localStorage.getItem("showCancelledTrips") === "true" ? false : true));
                    } else {
                        localStorage.setItem("showCancelledTrips", true);
                    }
                    $scope.travelResult.showCancelledTrips = (localStorage.getItem("showCancelledTrips") === "true" ? true : false);
                }

            };
            $scope.setLoaded = function (i) {
                $scope.isLoadedArray[i] = !$scope.isLoadedArray[i];
            };
            $scope.getLoaded = function (i) {
                return $scope.isLoadedArray[i];
            };
            $scope.setLoading = function (i) {
                $scope.isLoadingArray[i] = !$scope.isLoadingArray[i];
            };
            $scope.getLoading = function (i) {
                return $scope.isLoadingArray[i] == true;
            };
            $scope.setClicked = function (i) {
                $scope.clickedArray[i] = !$scope.clickedArray[i];
            };
            $scope.getClicked = function (i) {
                return $scope.clickedArray[i];
            };
            $scope.setClickedGroup = function (group, i) {
                if ($scope.clickedGroup[group] == i) {
                    $scope.clickedGroup[group] = undefined;
                } else {
                    $scope.clickedGroup[group] = i;
                }
            };
            $scope.getClickedGroup = function (group) {
                return $scope.clickedGroup[group];
            };
            $scope.reset = function () {
                $scope.clickedArray = [];
                $scope.clickedGroup = {};
                if ($scope.singleTrip && $scope.limit == 1) {
                    $scope.setClicked(0);
                }
            };
            $scope.mapDataService = mapDataService;
            $scope.$watch("mapDataService.travelResult", function (newVal) {
                if (newVal.length > 0) {
                    $scope.travelResult.Trips = newVal;
                    var trips = newVal.length,
                        subtrips;
                    for (var i = 0; i < trips; i++) {
                        subtrips = newVal[i].SubTrips.length;
                        for (var j = 0; j < subtrips; j++) {
                            $scope.setLoaded(i + 'sub' + j);
                        }
                    }
                }

            });
            
            $scope.getIntermediateStops = function (parentIndex, subindex) {

                var intermediate = $scope.travelResult.Trips[parentIndex].SubTrips[subindex].IntermediateStopRef;
                if (intermediate === null) { return false; }
                var refUrl = intermediate.Url;
                var refIndexStart = intermediate.StartIdx;
                var refIndexStop = intermediate.StopIdx;
                var indermediateStopUrl = urlprovider.travelplanner.createIntermediateStopUrl(refUrl + "/" + refIndexStart + "/" + refIndexStop);

                if ($scope.getLoaded(parentIndex + 'sub' + subindex)) {
                    $scope.setClicked(parentIndex + 'sub' + subindex);
                    return false;
                }

                $scope.setLoading(parentIndex + 'sub' + subindex);

                $http.get(indermediateStopUrl)
                    .success(function (data, status, headers, config) {
                        if (data.data.Error !== null) {
                            $scope.indermediateResult.Error[parentIndex + "_" + subindex] = data.data.Error;
                        }
                        $scope.travelResult.Trips[parentIndex].SubTrips[subindex].IntermediateStops = data.data.Points;
                    })
                    .error(function (data, status, headers, config) {
                        $scope.indermediateResult.Error[parentIndex + "_" + subindex] = errorHandler.getErrorMessage();
                        $scope.setClicked(parentIndex + 'sub' + subindex);
                        $scope.setLoading(parentIndex + 'sub' + subindex);
                    })
                    .then(function () {
                        $scope.setClicked(parentIndex + 'sub' + subindex);
                        $scope.setLoaded(parentIndex + 'sub' + subindex);
                        $scope.setLoading(parentIndex + 'sub' + subindex);
                    });
            };
            $scope.getData = function (url, timeSelection) {
                if (!$scope.getLaterOrEarlierTrips) {
                    $scope.isViewLoading.newSearchResults = true;
                } else {
                    $scope.getLaterOrEarlierTrips = false;
                }
                $http.get(url).
                success(function (data, status, headers, config) {
                    if (data.status == "error") {

                    } else {

                        var scope = $scope,
                            travelResult = data.data,
                            existingTravelResult = scope.travelResult,
                            time,
                            trip,
                            from,
                            trips = travelResult.Trips.length,
                            subtrips;
                        mapDataService.setTravelTrip(data.data);

                        for (var i = 0; i < trips; i++) {
                            if (travelResult.Trips[i].Cancelled) {
                                $scope.cancelledTrips++;
                            }
                            subtrips = travelResult.Trips[i].SubTrips.length;
                            for (var j = 0; j < subtrips; j++) {
                                if (travelResult.Trips[i].SubTrips[j].Hide) {
                                    travelResult.Trips[i].SubTrips.splice(j, 1);
                                    travelResult.Trips[i].Transports.splice(j, 1);
                                    subtrips--;
                                }
                            }
                            if (travelResult.Trips[i].SubTrips[0].TransportSymbol == "Walk") {
                                trip = travelResult.Trips[i].SubTrips[1];
                                from = {
                                    Name: trip.Origin,
                                    SiteId: travelResult.Trips[i].SubTrips[0].DestinationSiteId,
                                    Longitude: undefined,
                                    Latitude: undefined,
                                    value: trip.Origin
                                };
                            } else {
                                trip = travelResult.Trips[i];
                                from = sharePresetValues.from;
                            }
                            time = trip.DepartureTime.replace("ca ", "").split(":");
                            sharePresetValues.advancedParams.time = {
                                direction: 2,
                                day: travelResult.Trips[i].DepartureDate,
                                hour: time[0],
                                minute: time[1]
                            };
                            sharePresetValues.advancedParams.ShareTrip = "1";
                            travelResult.Trips[i].ShareLink = "http://sl.se/sharelink/?q=" + encodeURIComponent(urlprovider.travelplanner.createRouteUrl(from, sharePresetValues.to, sharePresetValues.advancedParams));
                            travelResult.Trips[i].MailtoLink = "http://sl.se/sharelink/?q=" + encodeURIComponent(escape(urlprovider.travelplanner.createRouteUrl(from, sharePresetValues.to, sharePresetValues.advancedParams)));
                        }

                        if (!$scope.resultHasContent(existingTravelResult)) {
                            scope.travelResult = travelResult;
                        } else {
                            var isArriveTimeSel = (timeSelection == "arrive");

                            var mergeTrips = [];
                            if (isArriveTimeSel) {
                                // upp search
                                mergeTrips = mergeTrips.concat(travelResult.Trips);
                                mergeTrips = mergeTrips.concat(existingTravelResult.Trips);
                                // restore LastDepartureDateTime
                                travelResult.LastDepartureDateTime = existingTravelResult.LastDepartureDateTime;
                            } else {
                                // down search
                                mergeTrips = mergeTrips.concat(existingTravelResult.Trips);
                                mergeTrips = mergeTrips.concat(travelResult.Trips);
                                // restore FirstArrivalDateTime
                                travelResult.FirstArrivalDateTime = existingTravelResult.FirstArrivalDateTime;
                            }

                            travelResult.Trips = mergeTrips;

                            // triggers render
                            scope.travelResult = travelResult;

                            scope.limit = scope.travelResult.Trips.length;
                            if (scope.singleTrip) {
                                scope.limit -= 4;
                            }
                        }

                        if (typeof ($scope.travelResult.showCancelledTrips) === "undefined") {
                            $scope.travelResult.showCancelledTrips = (typeof (window.localStorage) !== "undefined") ? (localStorage.getItem("showCancelledTrips") === "true" ? true : false) : false;
                        }

                        // Twitter hack for IE7/8
                        if ($("html").hasClass("lte8")) {
                            setTimeout(function () {
                                var $twitter;
                                $(".share-links").find(".twitter").each(function () {
                                    $twitter = $(this);
                                    if (typeof $twitter.attr("href") === "string") {
                                        $twitter.attr("href", $twitter.attr("href").replace("twitter", "mobile.twitter"));
                                    }
                                });
                            });
                        }
                    }
                }).
                error(function (data, status, headers, config) {
                    $scope.isViewLoading.newSearchResults = false;
                    headers = headers();
                    if (!headers || Object.keys(headers).length == 0) {
                        // aborted by user
                        return;
                    } else {
                        $scope.travelResult.Error = errorHandler.getErrorMessage();
                    }
                })
                .then(function () {
                    $scope.isLoadedArray = [];
                    $scope.isViewLoading.newSearchResults = false;
                    $scope.isViewLoading.earlierTrips = false;
                    $scope.isViewLoading.laterTrips = false;
                });
            };
            $scope.renderTime = function (time) {

                var time = new Date(time).getTime();
                return time;
            };
            $scope.newRealtimeSearch = function (SiteId, Name) {
                $scope.url = urlprovider.realtime.createRouteUrl(Name, SiteId);
                $location.path($scope.url);
            };
            $scope.updateSearch = function () {
                var url = urlprovider.travelplanner.createApiUrl($location);
                $scope.isLoadedArray.length = 0;
                $scope.travelResult.Trips = [];
                $scope.getData(url, timeSelection);
            };
            $rootScope.$on('updateSearch', $scope.updateSearch);
            $rootScope.$on('newResetSearch', function (e) {//, type, callback
                $scope.travelResult = {};
                $scope.realTimeResult = {};

            });

            $scope.resultHasContent = function () {
                var obj = $scope.travelResult;
                var size = 0, key;
                for (key in obj) {
                    if (obj.hasOwnProperty(key)) size++;
                }
                return size > 0;
            };

            $scope.findLaterOrEarlierTrips = function (later) {

                if (later) {
                    if ($scope.singleTrip) {
                        $scope.limit += 9999;
                        $scope.singleTrip = false;
                        return;
                    }
                    $scope.isViewLoading.laterTrips = true;
                } else {
                    $scope.isViewLoading.earlierTrips = true;
                }
                $scope.getLaterOrEarlierTrips = true;
                var response = urlprovider.travelplanner.findLaterOrEarlierTrips(later, $scope.travelResult);

                $scope.getData(response.url, response.timeSelection);

            };
            $scope.saveToFav = function () {
                // Travelplanner fav click
                $scope.currentSearchObject = favouritesModel.handleClick("favoriteSearch", $scope.currentSearchObject);
            };
            $scope.currentSearch = function (url, fromName, toName, advParamsChanged) {
                //Prepare currentSearchObject
                var currentSearchObject = {};
                var favKey = "favoriteSearch";
                //Get id of item if it exists else false;
                var exists = favouritesModel.compare(favKey, url);

                if (exists !== false) {
                    currentSearchObject = favouritesModel.data[favKey][exists];
                } else {
                    /*
                    * fromName : Name of from address/station
                    * toName : Name of to address/station (only if type is travelPlanner)
                    * url : search url path
                    * type : either realTime or travelPlanner
                    * advParamsChanged : bool value
                    * active: bool value
                    */
                    currentSearchObject = {
                        fromName: fromName,
                        toName: toName,
                        url: url,
                        type: 'Travelplanner',
                        advParamsChanged: advParamsChanged,
                        active: false
                    };
                }
                return currentSearchObject;
            };
            $rootScope.$on('newTravelplannerSearch', function (e, routeParams, presetvalues) {

                travelplannerBaseUrl.setPreviousSearch(presetvalues.from, presetvalues.to, presetvalues.advancedParams);
                var url = urlprovider.travelplanner.createApiUrl($location);
                $scope.fromName = routeParams.from;
                $scope.toName = routeParams.to;
                $scope.url = $location.$$path;
                $scope.cancelledTrips = 0;
                timeSelection = routeParams.timeSelection;
                $scope.getData(url, timeSelection);
                if (routeParams.singleTrip == "1") {
                    $scope.singleTrip = true;
                    $scope.limit = 1;
                } else {
                    $scope.limit = 9999;
                }
                if (presetvalues.advancedParams.time != undefined) {
                    presetvalues.advancedParams.time.direction = 1;
                }

                presetvalues.advancedParams.advParamsChanged = routeParams.advParamsChanged;
                var currentSearchObjectUrl = urlprovider.travelplanner.createRouteUrl(presetvalues.from, presetvalues.to, presetvalues.advancedParams);
                $scope.currentSearchObject = $scope.currentSearch(currentSearchObjectUrl, revertUrlSafeWord($scope.fromName), revertUrlSafeWord($scope.toName), routeParams.advParamsChanged);
                // Save preset values for share url
                sharePresetValues = angular.copy(presetvalues);
                sharePresetValues.advParamsChanged = routeParams.advParamsChanged;
                // Add to latest search type
                latestSearchType.set("travelplanner");
            });
        } ])
        .controller('TravelPlannerUrlSearch', ["$scope", "$routeParams", "$rootScope", function ($scope, $routeParams, $rootScope) {
            $rootScope.$broadcast('newResetSearch');
            $scope.parseTime = function (timeString, direction) {

                if (timeString != "null" && direction != "null") {
                    var timeObject = {
                        day: "",
                        hour: "",
                        minute: "",
                        direction: (direction == "arrive" ? 3 : 2)
                    };
                    var dayTimeArr = timeString.split(" ");
                    var timeArr = dayTimeArr[1].split("_");

                    timeObject.day = dayTimeArr[0];
                    timeObject.hour = timeArr[0];
                    timeObject.minute = timeArr[1];

                    return timeObject;
                }
            };

            var getValue = function (value) {
                if (value == undefined || value == "null" || value == null || value.length == 0) {
                    return undefined;
                }
                if (typeof (value) == "string") {
                    value = revertUrlSafeWord(value);
                }

                return value;
            };

            var presetValues = {
                from: {
                    Name: getValue($routeParams.from),
                    SiteId: getValue($routeParams.fromSiteId),
                    Longitude: getValue($routeParams.fromLong),
                    Latitude: getValue($routeParams.fromLat),
                    value: getValue($routeParams.from)
                },
                to: {
                    Name: getValue($routeParams.to),
                    SiteId: getValue($routeParams.toSiteId),
                    Longitude: getValue($routeParams.toLong),
                    Latitude: getValue($routeParams.toLat),
                    value: getValue($routeParams.to)
                },
                advancedParams: {
                    time: $scope.parseTime($routeParams.time, $routeParams.timeSelection),
                    viaStation: {
                        data: {
                            Name: getValue($routeParams.viaStation),
                            SiteId: getValue($routeParams.viaStationSiteId),
                            Longitude: getValue(null),
                            Latitude: getValue(null),
                            value: getValue($routeParams.viaStation)
                        }
                    },
                    transportationChanges: {
                        change: getValue($routeParams.maxChanges),
                        extraTime: getValue($routeParams.additionalChangeTime)
                    },
                    walkway: {
                        maxWalkDistance: getValue($routeParams.maxWalkDistance),
                        unsharpSearch: getValue($routeParams.unsharpSearch)
                    },
                    lineChoice: {
                        filterLine: getValue($routeParams.filterLine),
                        filterMode: getValue($routeParams.filterMode)
                    },
                    transportationTypes: {
                        data: getValue($routeParams.journeyProducts)
                    }
                }
            };

            $rootScope.$broadcast('begininit', presetValues, true);

            $rootScope.$broadcast('newTravelplannerSearch', $routeParams, presetValues);
        } ])
        .controller('newRealTimeSearchResults', ['$scope', '$rootScope', '$http', '$filter', '$location', '$anchorScroll', 'urlprovider', 'favoriteSearch', 'favouritesModel', 'hilightResults', '$timeout', 'errorHandler', 'providedValue', 'latestSearchType', 'stateService', "$locale", function ($scope, $rootScope, $http, $filter, $location, $anchorScroll, urlprovider, favoriteSearch, favouritesModel, hilightResults, $timeout, errorHandler, providedValue, latestSearchType, stateService, $locale) {
            $scope.stateService = stateService;
            $scope.travelResult = {};
            $scope.highlight = hilightResults.get();
            $scope.subpanels = {};
            $scope.currentSearchObject = {};
            $scope.url = null;
            $scope.findPos = function (obj) {
                var curtop = 0;
                if (obj.offsetParent) {
                    do {
                        curtop += obj.offsetTop;
                    } while (obj = obj.offsetParent);
                    return [curtop];
                }
            };
            $scope.hideExpanded = function (index, trafficType, parentIndex) {
                var LIMIT = 4;
                var result = index >= LIMIT && !$scope.subpanels['realTimeTransportItem' + trafficType + parentIndex];
                return result;
            };
            $scope.currentSearch = function (url, fromName, fromId) {
                //Prepare currentSearchObject
                var currentSearchObject = {};
                var favKey = "favoriteSearch";
                //Get id of item if it exists else false;
                var exists = favouritesModel.compare(favKey, url);

                if (exists !== false) {
                    currentSearchObject = favouritesModel.data[favKey][exists];
                    currentSearchObject.realtimeGroups = favouritesModel.getRealtimeGroups(favKey, url);
                } else {
                    /*
                    * fromName : Name of from address/station
                    * toName : Name of to address/station (only if type is travelPlanner)
                    * SiteId : Id of from station (only if type is realTime)
                    * url : search url path
                    * type : either realTime or travelPlanner
                    * active: bool value
                    */
                    currentSearchObject = {
                        fromName: fromName,
                        SiteId: fromId,
                        url: url,
                        type: 'Realtime',
                        realtimeGroups: {},
                        active: false
                    };
                }

                return currentSearchObject;
            };

            //Handle realtimeGroups filters in favourites aswell
            $scope.$watchCollection('showallonnull.realtimeGroups', function (e) {
                if (e && !$scope.$parent.isViewLoading.newSearchResults) {
                    $scope.currentSearchObject.realtimeGroups = $scope.showallonnull.realtimeGroups;
                    favouritesModel.updateFavourite("favoriteSearch", $scope.currentSearchObject);
                    $scope.checkAll('realtimeGroups');
                }
            });

            $scope.isViewLoading.newRealTimeSearchResults = false;

            $scope.highlightTransport = function (fromId, group, departure) {
                
                var journeyProduct = group.JourneyProduct + '';
                var fromIdString = fromId + '';
                var title = group.Title;
                var lineNumber = departure.LineNumber + '';
                var destination = departure.Destination;

                var stringId = journeyProduct + "_" + fromIdString + "_" + title + "_" + lineNumber + "_" + destination;

                if ($scope.highlight[stringId] == undefined) {
                    $scope.highlight[stringId] = true;
                } else {
                    delete $scope.highlight[stringId];
                }

                hilightResults.set($scope.highlight);
            };
            $scope.isHighlighted = function (fromId, group, departure) {
                var journeyProduct = group.JourneyProduct + '';
                var fromIdString = fromId + '';
                var title = group.Title;
                var lineNumber = departure.LineNumber + '';
                var destination = departure.Destination;

                var stringId = journeyProduct + "_" + fromIdString + "_" + title + "_" + lineNumber + "_" + destination;

                if ($scope.highlight[stringId] != undefined) {
                    return $scope.highlight[stringId];
                }
                return false;
            };

            $scope.showTransportTypeFilters = function () {
                var show = false,
                transportTypesCount = 0;
                if ($scope.realTimeResult != "undefined") {
                    var results = $scope.realTimeResult;

                    for (var obj in results) {
                        if (typeof (results[obj]) == "object") {
                            if (results[obj] && results[obj].length > 0) {
                                transportTypesCount++;
                            }
                        }
                    }
                }
                if (transportTypesCount > 1) show = true;

                return show;
            };

            $scope.getData = function (SiteId, Name) {
                $scope.isViewLoading.newRealTimeSearchResults = true;

                $scope.realTimeResult = {};
                $scope.travelResult = {};
                $scope.subpanels = {};
                $scope.loadingRealTimeStations = [];
                $scope.fromName = Name;
                $scope.fromId = SiteId;

                var config = {
                    url: '/api/' + $locale.id + '/RealTime/GetDepartures/' + $scope.fromId
                };

                $http.get(config.url).
                success(function (data, status, headers, config) {
                    if (data.status == "error") {
                    } else {
                        $scope.realTimeResult = data.data;
                    }
                }).
                error(function (data, status, headers, config) {
                    headers = headers();
                    $scope.isViewLoading.newRealTimeSearchResults = false;
                    if (!headers || Object.keys(headers).length == 0) {
                        // aborted by user
                        return;
                    } else {
                        $scope.realTimeResult.Error = errorHandler.getErrorMessage();
                    }
                })
                .then(function () {
                    $scope.isViewLoading.newRealTimeSearchResults = false;
                });
            };

            $scope.newRealtimeSearch = function (SiteId, Name) {
                $scope.subpanel = undefined;
                $scope.url = urlprovider.realtime.createRouteUrl(Name, SiteId);
                $location.path($scope.url);
            };

            $scope.saveToFav = function () {
                // RealTime fav click
                $scope.currentSearchObject = favouritesModel.handleClick("favoriteSearch", $scope.currentSearchObject);
            };
            $scope.updateSearch = function () {
                $scope.getData($scope.fromId, $scope.fromName);

            };
            $scope.notRealTime = function (timeString) {
                return timeString.indexOf(':') >= 0;
            };

            $scope.getMetroIconName = function (metroLine) {
                switch (metroLine) {
                    case "1": return "MET_green";
                    case "2": return "MET_red";
                    case "3": return "MET_blue";
                }

                return "";
            };

            $scope.getTramIconName = function (groupType) {
                switch (groupType) {
                    case "tram": return "TRL";
                    case "lightrail": return "TRM";
                    default: return "TRL";
                }
            };

            $scope.parseTrafficType = function (type) {
                var name;
                switch (type) {
                    case "BUS":
                        name = providedValue.bus;
                        break;
                    case "TRM":
                        name = providedValue.lightRailwaysAndTram;
                        break;
                    case "TRN":
                        name = providedValue.train;
                        break;
                    case "MET":
                        name = providedValue.metro;
                        break;
                    case "FER":
                        name = providedValue.ferry;
                        break;
                    default:
                        name = "";
                }
                return name;
            };

            $scope.isSubpanelPressed = function (a, b, c, d) {
                return $scope.subpanel == a + "_" + b + "_" + c + "_" + d;
            };
            $scope.getRealTimeStations = function (pindex, index, departure, journeyProduct, lastupdated) {
                var nameOfDestination = departure.Destination;
                var lineNumber = departure.LineNumber;
                var time = replaceExt(departure.ExpectedDateTime, "\:", "_");
                lastupdated = replaceExt(lastupdated, "\:", "_");
                if (time == undefined) {
                    time = departure.DisplayTime;
                }

                var loadIndex = pindex + '_' + index + '_' + journeyProduct + '_' + lineNumber;

                if ($scope.subpanels[loadIndex] == undefined) {
                    $scope.subpanels[loadIndex] = true;
                } else {
                    $scope.subpanels[loadIndex] = !$scope.subpanels[loadIndex];
                }

                $scope.loadingRealTimeStations[loadIndex] = true;


                if (typeof ($scope.travelResult[loadIndex]) != 'undefined') {
                    $scope.loadingRealTimeStations[loadIndex] = false;
                    return false;
                }


                nameOfDestination = nameOfDestination.replace(".", "");

                var config = {
                    url: '/api/RealTime/GetStationsInBetween/' + $scope.fromId + "/" + nameOfDestination + "/" + journeyProduct + "/" + lineNumber + "/" + time + "/" + lastupdated
                };
                $http.get(config.url).
                success(function (data, status, headers, config) {
                    $scope.loadingRealTimeStations[loadIndex] = false;
                    if (data.status == "error") {

                    } else {
                        $scope.travelResult[loadIndex] = data.data;
                    }
                }).
                error(function (data, status, headers, config) {
                    $scope.loadingRealTimeStations[loadIndex] = false;
                    headers = headers();
                    if (!headers || Object.keys(headers).length == 0) {
                        // aborted by user
                        return;
                    } else {
                        $scope.travelResult[loadIndex] = new Object;
                        $scope.travelResult[loadIndex].Error = errorHandler.getErrorMessage();
                    }
                });

            };

            $scope.resultHasContent = function () {
                var obj = $scope.realTimeResult;
                var size = 0, key;
                for (key in obj) {
                    if (obj.hasOwnProperty(key)) size++;
                }
                return size > 0;
            };

            $rootScope.$on('newResetSearch', function (e) {//, type, callback
                $scope.travelResult = {};
                $scope.subpanels = {};
                $scope.realTimeResult = {};

            });

            $rootScope.$on('doNewRealTimeSearch', function (e, SiteId, Name) {
                $scope.url = urlprovider.realtime.createRouteUrl(Name, SiteId);
                $scope.currentSearchObject = $scope.currentSearch($scope.url, Name, SiteId);
                $scope.getData(SiteId, Name);
                //Set realtimeGroups filters if they exist;
                $scope.showallonnull.realtimeGroups = $scope.currentSearchObject.realtimeGroups;

                // Add to latst search type
                latestSearchType.set("realtime");
            });
        } ])
    .controller('newRealTimeUrlSearch', ["$scope", "$routeParams", "$rootScope", function ($scope, $routeParams, $rootScope) {
        $rootScope.$broadcast('newResetSearch');

        var getValue = function (value) {
            if (value == undefined || value == "null" || value == null || value.length == 0) {
                return undefined;
            }
            if (typeof (value) == "string") {
                value = revertUrlSafeWord(value);
            }

            return value;
        };

        var presetValues = {
            from: {
                Name: getValue($routeParams.fromName),
                SiteId: getValue($routeParams.fromSiteId),
                Longitude: getValue(null),
                Latitude: getValue(null),
                value: getValue($routeParams.fromName)
            },
            to: {
                Name: getValue(null),
                SiteId: getValue(null),
                Longitude: getValue(null),
                Latitude: getValue(null),
                value: getValue(null)
            }
        };

        $rootScope.$broadcast('begininit', presetValues, false);

        $rootScope.$broadcast('doNewRealTimeSearch', $routeParams.fromSiteId, getValue($routeParams.fromName));
    } ])
    .controller('searchFavourites', ["$scope", "$rootScope", "$location", "favouritesModel", function ($scope, $rootScope, $location, favouritesModel) {
        $("#FavList").remove();
        $scope.favModel = favouritesModel.data.favoriteSearch;
        $scope.saveToFav = function (favourite) {
            favouritesModel.handleClick("favoriteSearch", favourite);
        };

        $scope.goToFavUrl = function (url) {
            $location.path(url);
            window.SiteCatalyst.TrackClient("Search", "favoriter");
        };
    } ]);
