var trafficStatus = angular.module('slapp.trafficStatus', []);

trafficStatus.factory("trafficStatusModel", ["$http", "$timeout", "shoppingCartModel", "errorHandler", "$sce", function ($http, $timeout, shoppingCartModel, errorHandler, $sce) {
    var modelService = {};
    modelService.init = function () {
        modelService.data = {
            line: {
                value: null
            },
            traffic_types: [],
            time_updated: null,
            isLoadingTrafficSituation: false
        };
        var MINUTE = 60 * 1000; // one minute in milliseconds
        var update = function (autoUpdate) {
            modelService.data.isLoadingTrafficSituation = true;
            
            var line = (typeof (modelService.data.searchedLineNumber) !== "undefined") ? modelService.data.searchedLineNumber : null;
            var date = (typeof (modelService.data.date) !== "undefined") ? modelService.data.date.value : null;

            var config = {
                urlGetCurrentDeviationsFromDateTime: (line === null && date === null) ? '/api/TrafficSituation/GetTrafficSituation' : '/api/TrafficSituation/GetCurrentDeviationsFromDateTime/' + date + "/" + line,
                urlGetTrafficSituation: '/api/TrafficSituation/GetTrafficSituation'
            };

            // First do a regular GetTrafficSituation
            // To populate regular data to Tunnelbana/Lokalbana/Pendeltåg/spårvagn/Båt and buss (Bus will be overwriten if user have searched for station)

            $http.get(config.urlGetTrafficSituation)
                .success(function (response) {
                    if (response.status == "success" && response.data != undefined) {
                        modelService.data.isLoadingTrafficSituation = false;
                        if (response.data.Synchronized) {
                            modelService.data.time_updated = response.data.TimeUpdated;
                            
                            doSpecialSearchOnlyForBus(); 

                            for (var i = 0; i < response.data.TrafficTypes.length; i++) {
                                if (modelService.data.line.value === null || (modelService.data.line.value !== null && i !== 0)) {
                                    if (typeof (response.data.TrafficTypes[i].CURRENT) !== "undefined") {
                                        response.data.TrafficTypes[i].CURRENT.length = 0;
                                    }
                                    if (typeof (response.data.TrafficTypes[i].UPCOMMING) !== "undefined") {
                                        modelService.data.TrafficTypes[i].UPCOMMING.length = 0;
                                    }
                                }
                                for (var j = 0; j < response.data.TrafficTypes[i].Deviations.length; j++) {

                                    var trafficType = response.data.TrafficTypes[i].Deviations[j].TrafficType;
                                    var status = response.data.TrafficTypes[i].Deviations[j].Status;
                                    var deviation = response.data.TrafficTypes[i].Deviations[j];

                                    if (typeof (response.data.TrafficTypes[i][status]) === "undefined") {
                                        response.data.TrafficTypes[i][status] = [];
                                    }

                                    if (modelService.data.line.value === null || (modelService.data.line.value !== null && i !== 0)) {
                                        response.data.TrafficTypes[i][status].push(deviation);
                                    }

                                    response.data.TrafficTypes[i].Deviations[j].Details = $sce.trustAsHtml(response.data.TrafficTypes[i].Deviations[j].Details);
                                }
                                for (var k = 0; k < response.data.TrafficTypes[i].Events.length; k++) {
                                    for (var l = 0; l < response.data.TrafficTypes[i].Events[k].Deviations.length; l++) {
                                        response.data.TrafficTypes[i].Events[k].Deviations[l].Details = $sce.trustAsHtml(response.data.TrafficTypes[i].Events[k].Deviations[l].Details);
                                    }
                                }
                            }
                            modelService.data.traffic_types = response.data.TrafficTypes;

                        }

                        if (autoUpdate) {
                            if (response.data.Synchronized) {
                                modelService.getTrafficSituation(MINUTE);
                            } else {
                                modelService.getTrafficSituation(30000); // update in 30 seconds
                            }
                        }
                    } else if (response.status == "error") {
                        if (autoUpdate) {
                            modelService.getTrafficSituation(30000); // update in 30 seconds 
                        } else {
                            shoppingCartModel.data.Errors = [];
                            $timeout(function () {
                                shoppingCartModel.data.Errors = [errorHandler.getErrorMessage()];
                            });
                        }
                    }
                })
                .error(function (response) {
                    modelService.data.isLoadingTrafficSituation = false;
                    if (autoUpdate) {
                        modelService.getTrafficSituation(30000); // update in 30 seconds
                    } else {
                        shoppingCartModel.data.Errors = [];
                        $timeout(function () {
                            shoppingCartModel.data.Errors = [errorHandler.getErrorMessage()];
                        });
                    }
                });

            // Do another search to get trafficsituations based on line number
            function doSpecialSearchOnlyForBus() {
                if (date === null) { return false; }
                var UPCOMMING = [];
                var CURRENT = [];
                $http.get(config.urlGetCurrentDeviationsFromDateTime)
                    .success(function (data, status, headers, config) {
                        if (data.status == "error") {
                            shoppingCartModel.data.Errors = [];
                            $timeout(function () {
                                for (var i = 0; i < modelService.data.traffic_types.length; i++) {
                                    modelService.data.traffic_types[i].CURRENT = [];
                                    modelService.data.traffic_types[i].UPCOMMING = [];
                                }
                                shoppingCartModel.data.Errors = [errorHandler.getErrorMessage()];
                            });

                        } else {

                            for (var i = 0; i < data.data.length; i++) {
                                var trafficType = data.data[i].TrafficType;
                                var status = data.data[i].Status;
                                if (status === "CURRENT") {
                                    CURRENT.push(data.data[i]);
                                }
                                if (status === "UPCOMMING") {
                                    UPCOMMING.push(data.data[i]);
                                }

                                data.data[i].Details = $sce.trustAsHtml(data.data[i].Details);
                            }

                            modelService.data.traffic_types[0].UPCOMMING = UPCOMMING;
                            modelService.data.traffic_types[0].CURRENT = CURRENT;
                        }
                    })
                    .error(function (response) {
                        modelService.data.isLoadingTrafficSituation = false;

                        shoppingCartModel.data.Errors = [];
                        $timeout(function () {
                            for (var i = 0; i < modelService.data.traffic_types.length; i++) {
                                modelService.data.traffic_types[i].CURRENT = [];
                                modelService.data.traffic_types[i].UPCOMMING = [];
                            }
                            shoppingCartModel.data.Errors = [errorHandler.getErrorMessage()];
                        });

                    });
            }
        };
        modelService.getTrafficSituation = function (time, autoUpdate) {
            autoUpdate = autoUpdate == false ? false : true;
            if (time == 0) {
                update(autoUpdate);
            } else {
                $timeout(function () {
                    update(autoUpdate);
                }, time);
            }
        };
        modelService.getTrafficSituation(0, false);
        modelService.init = function () {
            modelService.getTrafficSituation(MINUTE);
        };
    };
    modelService.init();
    return modelService;
} ]);

trafficStatus.directive("trafficStatusDetails", ["$timeout", function ($timeout) {
    return function (scope, element, attrs) {
        var toggleAria = function () {
            if (scope.activeTab == attrs.target) {
                element.attr("aria-pressed", "true");
                element.siblings(".tab-list-group").attr("aria-expanded", "true");
            } else {
                element.attr("aria-pressed", "false");
                element.siblings(".tab-list-group").attr("aria-expanded", "false");
            }
        };
        toggleAria();
        element.bind("click", function () {
            $timeout(function () {
                $(".tab").attr("aria-pressed", "false");
                $(".tab-list-group").attr("aria-expanded", "false");
                toggleAria();
            });
        });
    };
}]);

trafficStatus.controller("TrafficStatusCtrl", ["$scope", "$rootScope", "$http", "providedValue", "trafficStatusModel", "$sce", "$filter", '$timeout', 'errorHandler', 'shoppingCartModel', function ($scope, $rootScope, $http, providedValue, trafficStatusModel, $sce, $filter, $timeout, errorHandler, shoppingCartModel) {
    $scope.autoUpdate = false;
    $scope.traffic_situation = trafficStatusModel;
    $scope.search = providedValue.search;
    $scope.message = [];
    $scope.activeTab = "";
    $scope.isSearching = false;
    $scope.noResults = providedValue.noDeviationsFound;
    $scope.deviationsText = function (n) {
        return n != 1 ? providedValue.deviations : providedValue.deviation;
    };
    $scope.$watch("autoUpdate", function (newVal) {

        if (newVal) {
            $scope.traffic_situation.init();
        }
    });

    $scope.$watch("traffic_situation.data.isLoadingTrafficSituation", function (newVal) {
        if (!newVal) {
            $scope.clickedArray["searchGroup"] = undefined;
        }
    });
    $scope.time = {
        day: ""
    };
    $scope.dateChoices = [];
    var reg = new RegExp(/^[0-9, ]+$/);
    var result = false;
    $scope.searchIsValid = function () {
        return true; // Makes it possible to search without line number
        if ($scope.traffic_situation.data.line.value != ""
            && $scope.traffic_situation.data.line.value != null
        ) {
            return true;
        }
        return false;
    };

    $scope.performLineNumberSearch = function () {

        if ($scope.searchIsValid()) {
            result = reg.test($scope.traffic_situation.data.line.value);
            result = ($scope.traffic_situation.data.line.value === null || $scope.traffic_situation.data.line.value === '') ? true : result; // Makes it possible to search without line number
            if (result) {
                $scope.isSearching = true;
                $scope.reset();
                $scope.resetClickedArray('searchGroup');

                var line = (typeof ($scope.traffic_situation.data.line) !== "undefined") ? $scope.traffic_situation.data.line.value : null;
                var date = (typeof ($scope.time.day) !== "undefined") ? $scope.time.day : null;
                var config = {
                    url: (line === null && date === null) ? '/api/TrafficSituation/GetTrafficSituation' : '/api/TrafficSituation/GetCurrentDeviationsFromDateTime/' + date + "/" + line
                };
                trafficStatusModel.data.searchedLineNumber = line;
                trafficStatusModel.data.date = { value: date };
                var UPCOMMING = [];
                var CURRENT = [];
                $http.get(config.url).
                    success(function (data, status, headers, config) {
                        //$scope.traffic_situation.data.traffic_types[i]

                        if (data.status == "error") {
                            shoppingCartModel.data.Errors = [];
                            $timeout(function () {
                                for (var i = 0; i < modelService.data.traffic_types.length; i++) {
                                    modelService.data.traffic_types[i].CURRENT = [];
                                    modelService.data.traffic_types[i].UPCOMMING.length = [];
                                }
                                shoppingCartModel.data.Errors = [errorHandler.getErrorMessage()];
                            });
                        } else {

                            for (var i = 0; i < data.data.length; i++) {
                                var trafficType = data.data[i].TrafficType;
                                var status = data.data[i].Status;
                                if (status === "CURRENT") {
                                    CURRENT.push(data.data[i]);
                                }
                                if (status === "UPCOMMING") {
                                    UPCOMMING.push(data.data[i]);
                                }

                                data.data[i].Details = $sce.trustAsHtml(data.data[i].Details);
                            }
                            $scope.traffic_situation.data.traffic_types[0].UPCOMMING = UPCOMMING;
                            $scope.traffic_situation.data.traffic_types[0].CURRENT = CURRENT;
                            $scope.clickedArray["searchGroup"] = undefined;
                        }

                        $scope.isSearching = false;
                    }).
                    error(function (data, status, headers, config) {

                        $scope.isSearching = false;

                        $timeout(function () {
                            shoppingCartModel.data.Errors = [];
                            $timeout(function () {

                                for (var i = 0; i < $scope.traffic_situation.data.traffic_types.length; i++) {
                                    $scope.traffic_situation.data.traffic_types[i].CURRENT = [];
                                    $scope.traffic_situation.data.traffic_types[i].UPCOMMING = [];
                                }
                                shoppingCartModel.data.Errors = [errorHandler.getErrorMessage()];
                            });
                        });

                    });
            } else {
                $scope.invalid = providedValue.invalidSearchTerm;
            }
        }
    };
    $scope.trafficStatusTab = function (type) {
        if ($scope.activeTab == type) {
            $scope.activeTab = "";
        } else {
            $scope.activeTab = type;
        }
        if ($scope.activeTab == type) {
            var data = "";
            switch (type) {
                case "bus":
                    data = "buss";
                    break;
                case "metro":
                    data = "tunnelbana";
                    break;
                case "local":
                    data = "lokalbana";
                    break;
                case "train":
                    data = "pendeltag";
                    break;
                case "tram":
                    data = "sparvagn";
                    break;
                case "fer":
                    data = "bat";
            }
            window.SiteCatalyst.TrackClient("StatusDetails", data);
        }
    };
    $scope.reset = function () {
        if ($scope.error) $scope.error = undefined;
        if ($scope.lineNumberSearchResult) $scope.lineNumberSearchResult = undefined;
        $scope.invalid = false;
    };
    $scope.trafficTypeName = function (type) {
        return providedValue[type];
    };
    $scope.splitMessage = function (split, index, message) {
        $scope.message[index] = [];
        if (split && message.indexOf(":") != -1) {
            $scope.message[index] = message.split(":");
        }
    };
    $scope.parseDate = function (datestring) {
        return datestring.split("T")[0];
    };
    $scope.parseTime = function (datestring) {
        return datestring.split("T")[1].slice(0, -3);
    };
    $scope.clickedArray = {};
    $scope.resetAllClickedArray = function () {
        for (var a in $scope.clickedArray) {
            $scope.clickedArray[a] = undefined;
        }
    };
    $scope.setClicked = function (group, i) {
        if ($scope.clickedArray[group] == i) {
            $scope.clickedArray[group] = undefined;
        } else {
            $scope.clickedArray[group] = i;
        }
    };
    $scope.resetClickedArray = function (group) {
        $scope.clickedArray[group] = undefined;
    };

    function populateDates() {
        //Dates
        $scope.time.dayDate = new Date();
        var start = new Date(Date.parse($scope.time.dayDate) - 24 * 3600 * 1000 - 1);

        $scope.time.day = $filter("date")($scope.time.dayDate, "yyyy-MM-dd");

        //Populate Dates
        var start = new Date(Date.parse($scope.time.dayDate) - 24 * 3600 * 1000 - 1);
        var end = new Date();
        end.setDate(end.getDate() + 31);
        $scope.dateChoices.push({ name: $filter("date")(start, "EEE dd MMM"), value: $filter("date")(start, "yyyy-MM-dd") });
        start = new Date(start.setDate(start.getDate() + 1));
        $scope.dateChoices.push({ name: providedValue.today, value: $filter("date")(start, "yyyy-MM-dd") });
        start = new Date(start.setDate(start.getDate() + 1));
        $scope.dateChoices.push({ name: providedValue.tomorrow, value: $filter("date")(start, "yyyy-MM-dd") });
        start = new Date(start.setDate(start.getDate() + 1));

        limit = 100;
        x = 0;
        while (start < end || limit > x) {
            $scope.dateChoices.push({ name: $filter("date")(start, "EEE dd MMM"), value: $filter("date")(start, "yyyy-MM-dd") });
            start = new Date(start.setDate(start.getDate() + 1));
            x++;
        }
    }
    populateDates();
    $scope.parseDateOption = function (dateValue) {
        for (var obj in $scope.dateChoices) {
            if ($scope.dateChoices[obj].value == dateValue) {
                return ($scope.dateChoices[obj].name);
            }
        }
    };
} ])
.controller("searchLineInputField", ["$scope", "providedValue", function ($scope, providedValue) {
    $scope.value = "";
    $scope.placeholder = providedValue.specifyLineNumber;
} ]);
