var timetables = angular.module('slapp');

timetables.directive("trafficTypeSearch", function () {
    return function (scope, element, attrs) {
        element.bind("click", function () {
            scope.performTimetablesSearch("trafficType", { type: attrs.trafficTypeSearch, value: attrs.value });
            scope.$apply();
        });
    };
})
.directive("timetable", function () {
    return function (scope, element, attrs) {
        element.bind("click", function () {
            window.SiteCatalyst.TrackClient("TimeTable", attrs.ngHref);
        });
    };
});

timetables.factory("timetableModel", function () {
    var timetableService = {};

    timetableService.parseData = function (data, isBusSearch) {

        var timetables = {
            BusGroups: [],
            MetroBlueGroups: [],
            MetroGreenGroups: [],
            MetroRedGroups: [],
            TrainGroups: [],
            TramTypes: [],
            TranCityTypes: [],
            ShipGroups: [],
            CollectionTimeTables: [],
            Other: []
        },
        group;


        for (var i = 0; i < data.length; i++) {
            if ((isBusSearch && !data[i].IsCollectionTimeTable) || !isBusSearch) {
                switch (data[i].TrafficType) {
                    case "BUS":
                        group = "BusGroups";
                        break;
                    case "METRO_RED":
                        group = "MetroRedGroups";
                        break;
                    case "METRO_GREEN":
                        group = "MetroGreenGroups";
                        break;
                    case "METRO_BLUE":
                        group = "MetroBlueGroups";
                        break;
                    case "TRAIN":
                        group = "TrainGroups";
                        break;
                    case "TRAM":
                        group = "TramTypes";
                        break;
                    case "TRAM2":
                        group = "TranCityTypes";
                        break;
                    case "SHIP":
                        group = "ShipGroups";
                        break;
                    default:
                        group = "Other";
                }
                timetables[group].push(data[i]);
            } else {
                timetables.CollectionTimeTables.push(data[i]);
            }
        }

        return timetables;
    };

    return timetableService;
});

timetables.controller("TimetablesCtrl", ["$scope", "$http", "setTarget", "$location", "latestSearch", "$timeout", "favouritesModel", "providedValue", "errorHandler", "urlprovider", "timetableModel", function ($scope, $http, setTarget, $location, latestSearch, $timeout, favouritesModel, providedValue, errorHandler, urlprovider, timetableModel) {
    var favKey = "favoriteTimetables";
    var currentSearches = 0;
    var trafficTypes = {
        "buss": "BUS",
        "pendeltåg": "TRAIN",
        "tunnelbana": "METRO",
        "spårvagn": "TRAM2",
        "lokalbana": "TRAM",
        "båt": "SHIP"
    };
    $scope.isViewLoading = false;
    $scope.resetSearchResult = function () {
        $scope.searchResult = {
            Errors: [],
            Timetables: {
                BusGroups: [],
                MetroRedGroups: [],
                MetroGreenGroups: [],
                MetroBlueGroups: [],
                TrainGroups: [],
                TranCityTypes: [],
                TramTypes: [],
                ShipGroups: [],
                CollectionTimeTables: []
            }
        };
        $scope.currentPage = 0;
    };
    $scope.currentSearchObject = {};
    $scope.resultHasContent = function () {
        var obj = $scope.searchResult.Timetables;
        var size = 0, key;
        for (key in obj) {
            if ($scope.searchResult.Timetables[key].length > 0) size++;
        }
        return size > 0;
    };
    $scope.showTransportTypeFilters = function () {
        var show = false,
            transportTypesCount = 0;
        if ($scope.searchResult.Timetables != "undefined") {
            var results = $scope.searchResult.Timetables;

            for (var obj in results) {
                if (typeof (results[obj]) == "object" && obj != "CollectionTimeTables") {
                    if (results[obj] && results[obj].length > 0) {
                        transportTypesCount++;
                    }
                }
            }
        }
        if (transportTypesCount > 1) show = true;

        return show;
    };
    $scope.daysAhead = 0;
    $scope.pdfRootFolder = "";
    $scope.resetSearchResult();
    $scope.currentPage = 0;
    $scope.pageSize = 100;
    $scope.numberOfPages = function () {
        return Math.ceil($scope.searchResult.Timetables.BusGroups.length / $scope.pageSize);
    };
    $scope.pages = [];
    $scope.getPages = function () {
        var pages = [],
            from,
            to;
        for (var i = 0; i < $scope.numberOfPages(); i++) {
            from = $scope.searchResult.Timetables.BusGroups[i * $scope.pageSize].LineId;
            to = i == $scope.numberOfPages() - 1 ? $scope.searchResult.Timetables.BusGroups[$scope.searchResult.Timetables.BusGroups.length - 1].LineId : $scope.searchResult.Timetables.BusGroups[((i + 1) * $scope.pageSize) - 1].LineId;
            pages.push({ value: i, text: "Nr " + from + " till " + to });
        }
        pages.push({ value: $scope.numberOfPages(), text: "Samlingstidtabeller" });
        return pages;
    };
    $scope.setCurrentPage = function (index) {
        $scope.currentPage = index;
    };
    $scope.modelService = {
        data: {}
    };
    $scope.modelService.reset = function () {
        $scope.modelService.data = {};
    };
    $scope.modelService.set = function (target, value) {
        setTarget.setIndex($scope.modelService.data, target, value);
    };
    $scope.isLineNumber = function (str) {
        str = str || $scope.model.from.value;
        var reg = new RegExp(/^[0-9]+$/);
        var result = reg.test(str);
        if (!result) {
            reg = new RegExp(/^([A-Z0-9]|Å|Ä|Ö)([A-Z0-9]|Å|Ä|Ö)+$/ig);
            result = reg.test(str);
            reg = new RegExp(/^([A-Z]|Å|Ä|Ö)+$/i);
            if (reg.test(str)) {
                result = false;
            }
        }
        return result;
    };
    $scope.isTrafficType = function (str) {
        str = str || $scope.model.from.value;
        return str != null && trafficTypes[$scope.model.from.value.toLowerCase()] != undefined;
    };
    $scope.$on("doNewTimeTableSearch", function (e, routeParams) {
        var apiurl;
        var routeurl = $location.path();

        if (routeParams.from.SiteId != "NULL") {
            apiurl = urlprovider.timetable.createApiUrl.station(routeParams);
        } else {
            apiurl = urlprovider.timetable.createApiUrl.line(routeParams);
        }

        $scope.getData(routeurl, apiurl, routeParams.from.value);
        $scope.model.from.value = routeParams.from.value;
    });
    $scope.performTypeaheadSearch = function () {
        $scope.performTimetablesSearch("typeahead");
    };
    $scope.performTimetablesSearch = function (type, params) {
        if ($scope.isLineNumber()) {
            $scope.model.from.value = $scope.model.from.value.toUpperCase();
        } else if ($scope.isTrafficType()) {
            $scope.model.from.value = $scope.model.from.value.charAt(0).toUpperCase() + $scope.model.from.value.slice(1);
        }
        if (($scope.model.from.SiteId == 0 || $scope.model.from.SiteId == undefined) && $scope.model.from.Longitude != null && $scope.model.from.Latitude != null) {
            $scope.$broadcast('performGeoLocationLookup', $scope.model.from.Latitude, $scope.model.from.Longitude);
        } else if ($scope.searchIsValid() || $scope.isLineNumber() || $scope.isTrafficType() || type == "trafficType") {
            var trafficType = "";
            if ($scope.model.from.value != null) {
                trafficType = trafficTypes[$scope.model.from.value.toLowerCase()];
            }
            var url = urlprovider.timetable.createRouteUrl(type, $scope.daysAhead, params, $scope.isLineNumber(), $scope.isTrafficType(), $scope.model.from.value, trafficType, $scope.model.from.SiteId);

            // Remove from latest search if it already exists
            if (latestSearch.exists("LatestTimetablesSearch", url)) {
                var currentList = latestSearch.get("LatestTimetablesSearch");
                for (var item in currentList) {
                    if (currentList[item].Url == url) {
                        latestSearch.remove("LatestTimetablesSearch", item, url);
                        break;
                    }
                }
            }

            // Add to latest search
            var icon;
            if (type == "trafficType") {
                icon = setTrafficTypeIcon(params.value);
                latestSearch.add({ Type: 'Timetables', Url: url, FromName: params.value, Icon: icon });
            } else if ($scope.isLineNumber() || $scope.isTrafficType()) {
                if ($scope.isLineNumber()) {
                    icon = "travelIcon";
                } else {
                    icon = setTrafficTypeIcon($scope.model.from.value);
                }
                latestSearch.add({ Type: 'Timetables', Url: url, FromName: $scope.model.from.value, Icon: icon });
            } else {
                icon = "stationIcon";
                latestSearch.add({ Type: 'Timetables', Url: url, FromName: $scope.model.from.Name, SiteId: $scope.model.from.SiteId, Icon: icon });
            }

            $location.path(url);
        }

    };

    $scope.currentSearch = function (url, name) {
        //Prepare currentSearchObject
        var currentSearchObject = {};
        //Get id of item if it exists else false;
        var exists = favouritesModel.compare(favKey, url);
        if (exists !== false) {
            currentSearchObject = favouritesModel.data[favKey][exists];
            currentSearchObject.realtimeGroups = favouritesModel.getRealtimeGroups(favKey, url);
        } else {
            /*
            * url : search url path
            * type : Timetables
            * name: description of favorite
            * realtimeGroups: traffic type filters
            * active: bool value
            */
            currentSearchObject = {
                url: url,
                type: 'Timetables',
                name: name,
                realtimeGroups: {},
                active: false,
                icon: "stationIcon"
            };
        }

        return currentSearchObject;
    };

    //Handle realtimeGroups filters in favourites aswell
    $scope.$watchCollection('showallonnull.realtimeGroups', function (e) {
        if (e && !$scope.isViewLoading) {
            $scope.currentSearchObject.realtimeGroups = $scope.showallonnull.realtimeGroups;
            favouritesModel.updateFavourite(favKey, $scope.currentSearchObject);
            $scope.checkAll('realtimeGroups');
        }
    });
    $scope.$on("scrollToSearchField", function () {
        $scope.scrollToSearchField = true;
        $timeout(function () {
            $scope.scrollToSearchField = false;
        });
    });
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
    };
    $scope.searchIsValid = function () {
        if ((
            $scope.model.from.Longitude != ""
                && $scope.model.from.Latitude != ""
                    && $scope.model.from.Longitude != undefined
                        && $scope.model.from.Latitude != undefined
        ) || (
            $scope.model.from.SiteId != undefined && $scope.model.from.SiteId > 0
        ) || (
            $scope.isTrafficType() || $scope.isLineNumber()
        )) {
            return true;
        }
        return false;
    };

    $scope.getData = function (routeurl, apiurl, heading) {
        currentSearches++;
        $scope.resetSearchResult();
        $scope.isViewLoading = true;
        if ($scope.isLineNumber(heading)) {
            $scope.searchResultHeading = "Linje " + heading;
        } else {
            $scope.searchResultHeading = heading;
        }
        $scope.searchResultHeading = heading;
        $http.get(apiurl).
            success(function (response) {
                currentSearches--;
                if (currentSearches == 0) {
                    if (response.data.length > 0) {
                        var isBusSearch = ($scope.isTrafficType() && heading == "Buss");
                        $scope.searchResult.Timetables = timetableModel.parseData(response.data, isBusSearch);
                        $scope.pages = $scope.getPages();
                        $scope.currentSearchObject = $scope.currentSearch(routeurl, heading);
                        $scope.showallonnull.realtimeGroups = $scope.currentSearchObject.realtimeGroups;
                        if ($scope.isLineNumber(heading)) {
                            $scope.currentSearchObject.icon = "travelIcon";
                        } else if ($scope.isTrafficType(heading)) {
                            $scope.currentSearchObject.icon = setTrafficTypeIcon(heading);
                        }
                    } else {
                        $scope.searchResult.Errors = ["Sökningen genererade inga resultat"];
                    }
                    $scope.isViewLoading = false;
                }
            }).
            error(function () {
                $scope.searchResult.Errors = [errorHandler.getErrorMessage()];
                $scope.currentPage = 0;
                $scope.currentSearchObject = {};
                currentSearches--;
                if (currentSearches == 0) {
                    $scope.isViewLoading = false;
                }
            });
    };
    var setTrafficTypeIcon = function (heading) {
        var icon;
        switch (trafficTypes[heading.toLowerCase()]) {
            case "BUS":
                icon = "BUS";
                break;
            case "TRAIN":
                icon = "TRN";
                break;
            case "METRO":
                icon = "MET";
                break;
            case "TRAM":
                icon = "TRM";
                break;
            case "TRAM2":
                icon = "TRL";
                break;
            case "SHIP":
                icon = "SHP";
                break;
            default:
                icon = "travelIcon";
        };
        return icon;
    };
    $scope.init = function () {
        $scope.modelService.set('states', {});
        $scope.model.states.searchType = "timetable";
    };
    $scope.model = $scope.modelService.data;
    $scope.init();

    $("#FavList").remove();
    $scope.favModel = favouritesModel.data.favoriteTimetables;
    $scope.saveToFav = function (favourite) {
        favouritesModel.handleClick(favKey, favourite);
    };
    $scope.goToFavUrl = function (url) {
        $location.path(url);
    };
} ])
.controller('TimeTableUrlSearch', ["$scope", "$routeParams", "$rootScope", function ($scope, $routeParams, $rootScope) {
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
        timetable: {
            LineNumber: getValue($routeParams.lineNumber),
            TrafficType: getValue($routeParams.trafficType),
            DaysAhead: getValue($routeParams.daysAhead),
            Skip: getValue($routeParams.skip),
            Take: getValue($routeParams.take),
            ValidDate: getValue($routeParams.validDate)
        }
    };

    $rootScope.$broadcast('doNewTimeTableSearch', presetValues);
} ]);