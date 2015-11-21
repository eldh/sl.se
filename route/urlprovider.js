angular.module('slapp.urlprovider', [])
    .factory("urlcontainer", ["$locale", function ($locale) {
        var apiRoute = '/api/' + $locale.id + '/';
        var modelService = {
            TravelPlanner: {
                Api: apiRoute + 'TravelPlanner/',
                Route: '/Travel/'
            },
            Realtime: {
                Api: apiRoute + 'Realtime/',
                Route: '/Realtime/'
            },
            Typeahead: {
                Api: ''
            },
            TimeTable: {
                Api: apiRoute + 'TimeTableSearch/',
                Route: '/TimeTable/'
            }
        };

        return modelService;
    } ])
    .factory("urlprovider", ["urlcontainer", "travelplannerBaseUrl", function (urlcontainer, travelplannerBaseUrl) {
        var modelService = {};
        modelService.travelplanner = {
            createApiUrl: function (routeConfig) {
                return travelplannerBaseUrl.createApiUrl(routeConfig);
            },
            createRouteUrl: function (from, to, advanced) {
                return urlcontainer.TravelPlanner.Route + travelplannerBaseUrl.createRouteUrl(from, to, advanced);
            },
            createIntermediateStopUrl: function (url) {
                var gi = "GetIntermediateStops";
                gi += (typeof (g_pilot) !== "undefined") ? 2 : "";
                gi += "/";
                return urlcontainer.TravelPlanner.Api + gi + url;
            },
            findLaterOrEarlierTrips: function (later, travelResult) {
                var response = travelplannerBaseUrl.findLaterOrEarlierTrips(later, travelResult);
                response.url = urlcontainer.TravelPlanner.Api + response.url;
                return response;
            },
            setPreviousSearch: function (from, to, advanced) {
                return travelplannerBaseUrl.setPreviousSearch(from, to, advanced);
            }
        };

        modelService.realtime = {
            createApiUrl: function (name, siteId) {
                return urlcontainer.Realtime.Api + createUrlSafeWord(name) + '/' + siteId;
            },
            createRouteUrl: function (name, siteId) {
                return urlcontainer.Realtime.Route + createUrlSafeWord(name) + '/' + siteId;
            }
        };

        modelService.timetable = {
            createApiUrl: {
                station: function (params) {
                    return urlcontainer.TimeTable.Api + "GetStationTimeTables/" + params.from.SiteId + "/" + params.timetable.LineNumber + "/" + params.timetable.TrafficType + "/" + params.timetable.DaysAhead + "/" + params.timetable.ValidDate;
                },
                line: function (params) {
                    return urlcontainer.TimeTable.Api + "GetLineTimeTables/" + params.from.SiteId + "/" + params.timetable.LineNumber + "/" + params.timetable.TrafficType + "/" + params.timetable.DaysAhead + "/" + params.timetable.Skip + "/" + params.timetable.Take;
                }
            },
            
            createRouteUrl: function (type, daysAhead, params, isLineNumber, isTrafficType, from, trafficType, siteId) {

                var url = "";
                if (type == "trafficType") {
                    url = "TimeTableSearch/GetLineTimeTables/" + createUrlSafeWord(params.value) + "/NULL/NULL/" + createUrlSafeWord(params.type) + "/" + daysAhead + "/0/10";
                } else if (type == "typeahead") {
                    if (isLineNumber) {
                        url = "TimeTableSearch/GetLineTimeTables/" + createUrlSafeWord(from) + "/NULL/" + createUrlSafeWord(from) + "/NULL/" + daysAhead + "/0/10";
                    } else if (isTrafficType) {
                        url = "TimeTableSearch/GetLineTimeTables/" + createUrlSafeWord(from) + "/NULL/NULL/" + createUrlSafeWord(trafficType) + "/" + daysAhead + "/0/10";
                    } else {
                        url = "TimeTableSearch/GetStationTimeTables/" + createUrlSafeWord(from) + "/" + siteId + "/NULL/NULL/" + daysAhead + "/NULL";
                    }
                }

                return url;
            }
        };

        return modelService;
    } ])

    .factory("travelplannerBaseUrl", ["urlcontainer", function (urlcontainer) {
        var modelService = {
            previousSearch: {
                fromData: {},
                toData: {},
                advancedParams: {}
            },
            createApiUrl: function (location) {
                var url = location.$$path.replace(urlcontainer.TravelPlanner.Route, urlcontainer.TravelPlanner.Api);
                if (typeof g_pilot != "undefined") {
                    var apis = [
                        "SearchTravelByStartPosition",
                        "SearchTravelByPositions",
                        "SearchTravelByDestinationPosition",
                        "SearchTravelById"
                    ],
                        i,
                        l = apis.length;
                    for (i = 0; i < l; i++) {
                        url = url.replace(apis[i], apis[i]);
                    }
                }
                return url;
            },
            createRouteUrl: function (from, to, advanced) {
                return createUrl(from, to, advanced);
            },
            findLaterOrEarlierTrips: function (later, travelResult) {
                return findLaterOrEarlierTrips(later, travelResult);
            },
            setPreviousSearch: function (from, to, advanced) {
                modelService.previousSearch.fromData = from;
                modelService.previousSearch.toData = to;
                modelService.previousSearch.advancedParams = advanced;
            }
        };

        function createUrl(fromData, toData, advancedParams) {
            var getValue = function (value) {
                if (value == undefined || value == null || value.length == 0) {
                    return "null";
                }
                if (typeof (value) == "string") {
                    value = createUrlSafeWord(value);
                }

                return value;
            };

            if (!advancedParams.ShareTrip) {
                modelService.previousSearch = {
                    fromData: fromData,
                    toData: toData,
                    advancedParams: advancedParams
                };
            }


            /*
            string from
            string to
            double latitude
            double longitude
            string startStation
            string destinationStation
            double startLatitude
            double startLongitude
            double destinationLatitude
            double destinationLongitude
            */
            var from = getValue(fromData.Name),
                    to = getValue(toData.Name),
                    startStation = getValue(fromData.SiteId),
                    destinationStation = getValue(toData.SiteId),
                    startLatitude = getValue(fromData.Latitude),
                    startLongitude = getValue(fromData.Longitude),
                    destinationLatitude = getValue(toData.Latitude),
                    destinationLongitude = getValue(toData.Longitude);

            var url = ""; //"/api/TravelPlanner/";
            /*
            Create url's for these calls:
            public Travel SearchTravelByDestinationPosition	(string from, string to, double destinationLatitude, double destinationLongitude, string startStation, 						    string time, string timeSelection, string language, bool strictTime, string viaStation, string journeyProducts, string filterMode, string filterLine, string maxWalkDistance, string maxChanges, string additionalChangeTime, bool unsharpSearch, string serverGeneratedQuery)
            public Travel SearchTravelByPositions		    (string from, string to, double startLatitude, double startLongitude, double destinationLatitude, double destinationLongitude, 	string time, string timeSelection, string language, bool strictTime, string viaStation, string journeyProducts, string filterMode, string filterLine, string maxWalkDistance, string maxChanges, string additionalChangeTime, bool unsharpSearch, string serverGeneratedQuery)
            public Travel SearchTravelByStartPosition	    (string from, string to, double startLatitude, double startLongitude, string destinationStation, 						        string time, string timeSelection, string language, bool strictTime, string viaStation, string journeyProducts, string filterMode, string filterLine, string maxWalkDistance, string maxChanges, string additionalChangeTime, bool unsharpSearch, string serverGeneratedQuery)
            public Travel SearchTravelById			        (string from, string to, string startStation, string destinationStation, 							                            string time, string timeSelection, string language, bool strictTime, string viaStation, string journeyProducts, string filterMode, string filterLine, string maxWalkDistance, string maxChanges, string additionalChangeTime, bool unsharpSearch, string serverGeneratedQuery)
            */

            var v = (typeof (g_pilot) !== "undefined") ? 2 : "";
            if (startLatitude != "null" && startLongitude != "null" && destinationLatitude != "null" && destinationLongitude != "null") {
                url += "SearchTravelByPositions" + v + "/" + from + "/" + to + "/" + startLatitude + "/" + startLongitude + "/" + destinationLatitude + "/" + destinationLongitude;
            } else if (startLatitude != "null" && startLongitude != "null") {
                url += "SearchTravelByStartPosition" + v + "/" + from + "/" + to + "/" + startLatitude + "/" + startLongitude + "/" + destinationStation;
            } else if (destinationLatitude != "null" && destinationLongitude != "null") {
                url += "SearchTravelByDestinationPosition" + v + "/" + from + "/" + to + "/" + destinationLatitude + "/" + destinationLongitude + "/" + startStation;
            } else {
                url += "SearchTravelById" + v + "/" + from + "/" + to + "/" + startStation + "/" + destinationStation;
            }
            /*
            After the first params these are the common order and params:

            string time,
            string timeSelection,
            string language,
            bool strictTime,
            string viaStation,
            string journeyProducts,
            string filterMode,
            string filterLine,
            string maxWalkDistance,
            string maxChanges,
            string additionalChangeTime,
            bool unsharpSearch,
            string serverGeneratedQuery
            */

            var time = (advancedParams.newTime != undefined && advancedParams.newTime != "" ? getValue(advancedParams.newTime) : getValue(getTimeSelection(advancedParams.time).time)),
                timeSelection = (advancedParams.timeSel != undefined && advancedParams.timeSel != "" ? getValue(advancedParams.timeSel) : getValue(getTimeSelection(advancedParams.time).timeSelection)),
                language = getValue(document.getElementsByTagName("html")[0].getAttribute("lang")),
                strictTime = getValue(advancedParams.strictTime),
                viaStationId = getValue(advancedParams.viaStation.data.SiteId),
                journeyProducts = getValue(transportationTypeSelection(advancedParams.transportationTypes.data).journeyProductsValue),
                filterMode = getValue(lineSelection(advancedParams.lineChoice).filterMode),
                filterLine = getValue(lineSelection(advancedParams.lineChoice).filterLine),
                maxWalkDistance = getValue(walkwaySelection(advancedParams.walkway).maxWalkDistance),
                maxChanges = getValue(transportationChangeSelection(advancedParams.transportationChanges.change, advancedParams.transportationChanges.extraTimeEnabling, advancedParams.transportationChanges.extraTime).maxChanges),
                additionalChangeTime = getValue(transportationChangeSelection(advancedParams.transportationChanges.change, advancedParams.transportationChanges.extraTimeEnabling, advancedParams.transportationChanges.extraTime).additionalChangeTime),
                unsharpSearch = getValue(walkwaySelection(advancedParams.walkway).unsharpSearch),
                serverGeneratedQuery = "null",
                advParamsChanged = advancedParams.advParamsChanged,
                shareTrip = advancedParams.ShareTrip || "0",
                viaStation = getValue(advancedParams.viaStation.data.Name);

            /*
            Create url's for these calls:
            public Travel SearchTravelByDestinationPosition	(string from, string to, double destinationLatitude, double destinationLongitude, string startStation, 						    string time, string timeSelection, string language, bool strictTime, string viaStation, string journeyProducts, string filterMode, string filterLine, string maxWalkDistance, string maxChanges, string additionalChangeTime, bool unsharpSearch, string serverGeneratedQuery)
            public Travel SearchTravelByPositions		    (string from, string to, double startLatitude, double startLongitude, double destinationLatitude, double destinationLongitude, 	string time, string timeSelection, string language, bool strictTime, string viaStation, string journeyProducts, string filterMode, string filterLine, string maxWalkDistance, string maxChanges, string additionalChangeTime, bool unsharpSearch, string serverGeneratedQuery)
            public Travel SearchTravelByStartPosition	    (string from, string to, double startLatitude, double startLongitude, string destinationStation, 						        string time, string timeSelection, string language, bool strictTime, string viaStation, string journeyProducts, string filterMode, string filterLine, string maxWalkDistance, string maxChanges, string additionalChangeTime, bool unsharpSearch, string serverGeneratedQuery)
            public Travel SearchTravelById			        (string from, string to, string startStation, string destinationStation, 							                            string time, string timeSelection, string language, bool strictTime, string viaStation, string journeyProducts, string filterMode, string filterLine, string maxWalkDistance, string maxChanges, string additionalChangeTime, bool unsharpSearch, string serverGeneratedQuery)
            */
            url += "/" + time; //time
            url += "/" + timeSelection; //timeSelection
            url += "/" + language; //language
            url += "/" + strictTime; //strictTime
            url += "/" + viaStationId; //viaStationId
            url += "/" + journeyProducts; //journeyProducts
            url += "/" + filterMode; //filterMode
            url += "/" + filterLine; //filterLine
            url += "/" + maxWalkDistance; //maxWalkDistance
            url += "/" + maxChanges; //maxChanges
            url += "/" + additionalChangeTime; //additionalChangeTime
            url += "/" + unsharpSearch; //unsharpSearch
            url += "/" + serverGeneratedQuery; //serverGeneratedQuery
            url += "/" + advParamsChanged; //advParamsChanged
            url += "/" + shareTrip; //shareTrip
            url += "/" + viaStation; //viaStation

            return url;
        };

        function getTimeSelection(time) {
            if (time != undefined) {
                var direction = time.direction,
                        day = time.day,
                        hour = time.hour,
                        minute = time.minute;
            } else {
                var direction = 1;
            }
            var timeSelection = "depart";
            if (direction == 3) {
                timeSelection = "arrive";
            }

            var time = "";
            if (direction != 1) {
                time = escape(day + " " + hour + "_" + minute);
            }

            return {
                time: time,
                timeSelection: timeSelection
            };
        };

        function transportationTypeSelection(transportationTypes) {
            
            var journeyProductsValue = '';
            if (typeof (transportationTypes) == "string") {
                /*journeyProductsValue = transportationTypes.split(',').reduce(function (previousValue, currentValue, index, array) {
                previousValue = parseInt(previousValue, 10);
                currentValue = parseInt(currentValue, 10);
                previousValue = (previousValue != previousValue ? 0 : previousValue);
                currentValue = (currentValue != currentValue ? 0 : currentValue);
                return previousValue + currentValue;
                });*/
                journeyProductsValue = transportationTypes;
            } else if (typeof (transportationTypes) == "object") {

                var sum = 0;
                $.each(transportationTypes, function () {
                    if (this.checked) {
                        sum += this.value;
                        journeyProductsValue += this.value + ",";
                    }
                });
                if (sum == 47) { //47 is sum of default checked items.
                    journeyProductsValue = '';
                }
            }

            return {
                journeyProductsValue: journeyProductsValue
            };
        };
        function lineSelection(lineChoice) {
            var filterMode = "",
                lineChoiceText = "";
            if (lineChoice.filterMode != undefined && lineChoice.filterLine != undefined) {
                filterMode = lineChoice.filterMode;
                lineChoiceText = lineChoice.filterLine;
            } else if (lineChoice.lineSelected > 0) {
                filterMode = lineChoice.lineSelected;
                lineChoiceText = lineChoice.lineChoiceText;
            }
            return {
                filterMode: filterMode,
                filterLine: lineChoiceText
            };
        };
        function walkwaySelection(walkway) {
            var maxWalkDistance = "",
                unsharpSearch = "";
            if (walkway.maxWalkDistance != undefined) {
                maxWalkDistance = walkway.maxWalkDistance;
                unsharpSearch = walkway.unsharpSearch;
            } else if (walkway.selected != 2000) {
                maxWalkDistance = walkway.selected;
                unsharpSearch = walkway.checkbox;
            } else {
                unsharpSearch = walkway.checkbox;
            }
            if (walkway.unsharpSearch != undefined) {
                unsharpSearch = walkway.unsharpSearch;
            }
            return {
                unsharpSearch: unsharpSearch,
                maxWalkDistance: maxWalkDistance//Value in meter, default is "", I.e. if 2km is selected.
            };
        };
        function transportationChangeSelection(transportationChangeSelected, extraTimeEnablingSelected, extraTimeSelected) {
            var maxChanges = "";
            if (transportationChangeSelected > -1) {
                maxChanges = transportationChangeSelected;
            }

            var additionalChangeTime = "";
            if (extraTimeEnablingSelected > 0 || extraTimeEnablingSelected == undefined) {
                additionalChangeTime = extraTimeSelected;
            }

            return {
                additionalChangeTime: additionalChangeTime,
                maxChanges: maxChanges
            };
        };

        function findLaterOrEarlierTrips(later, travelResult) {
            modelService.previousSearch.advancedParams.strictTime = "true";

            // This needs to be set in advancedParams
            //modelService.previousSearch.advancedParams.walkway.checkbox = true;
            
            if (later) {
                modelService.previousSearch.advancedParams.serverGeneratedQuery = travelResult.NextQueryString;
                modelService.previousSearch.advancedParams.newTime = replaceExt(travelResult.LastDepartureDateTime, "\:", "_"); //.replace("\:", "_");
                modelService.previousSearch.advancedParams.timeSel = "depart";
            } else {
                modelService.previousSearch.advancedParams.serverGeneratedQuery = travelResult.PrevQueryString;
                modelService.previousSearch.advancedParams.newTime = replaceExt(travelResult.FirstArrivalDateTime, "\:", "_"); //.replace("\:", "_");
                modelService.previousSearch.advancedParams.timeSel = "arrive";
            }

            var url = createUrl(modelService.previousSearch.fromData, modelService.previousSearch.toData, modelService.previousSearch.advancedParams);
            var timeSelection = modelService.previousSearch.advancedParams.timeSel;
            modelService.previousSearch.advancedParams.strictTime = "";
            modelService.previousSearch.advancedParams.serverGeneratedQuery = "";
            modelService.previousSearch.advancedParams.newTime = "";
            modelService.previousSearch.advancedParams.timeSel = "";

            return { url: url, timeSelection: timeSelection };
        };

        return modelService;
    } ]);
