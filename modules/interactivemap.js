var realTimeSearchModule = angular.module('slapp.interactiveMap', ['ngResource', 'slapp.interactiveMap.controllers', 'slapp.interactiveMap.directives', 'slapp.interactiveMap.factories', 'slapp.interactiveMap.services'], function ($locationProvider) {
    $locationProvider.hashPrefix('');
}).run(function ($rootScope) {
    //console.log('initializing interactiveMap');
});

angular.module('slapp.interactiveMap.directives', []);



angular.module('slapp.interactiveMap.factories', [])

    .factory("store", function () {
        var store = {
            zones: {},
            markers: {
                vendors: {},
                parkings: {},
                stations: {}
            },
            paths: {}
        };

        return store;
    })

    .factory("mapServices", ["vendorModel", "parkingsModel", "zoneModel", "stationsModel", function (vendorModel, parkingsModel, zoneModel, stationsModel) {
        var mapservices = {
            getVendors: function () {
                vendorModel.fetchVendors();
            },
            getParkings: function () {
                parkingsModel.fetchParkings();
            },
            getStations: function (bounds, trafficTypes) {
                stationsModel.fetchStations(bounds, trafficTypes);
            },
            getZones: function () {
                zoneModel.fetchZones();
            },
            updateStations: function (bounds, trafficTypes) {
                stationsModel.updateStations(bounds, trafficTypes);
            }
        };

        return mapservices;
    } ])

    .factory("vendorModel", ["$http", "store", function ($http, store) {

        var vendorModel = {

            loaded: false,

            fetchVendors: function () {
                var urlTickets = "/api/sv/Map/GetTicketVendors";

                $http.get(urlTickets).success(function (response) {
                    vendorModel.parseVendors($.parseJSON(response.data));
                }).then(function () {
                    vendorModel.loaded = true;
                });
            },

            parseVendors: function (markers) {
                var markersObj = [];

                // merges ticketmachines and vendors/resellers
                var iconName;

                for (var group in markers) {

                    iconName = group.toLowerCase();
                    for (var u = 0, lenu = markers[group].length; u < lenu; u++) {
                        if (group != "TicketMachines") {
                            markersObj.push({
                                Lat: markers[group][u].Lat,
                                Lon: markers[group][u].Lon,
                                Icon: iconName,
                                PopupContent: "<b>" + markers[group][u].Name + "</b><br />" + markers[group][u].Address + "."
                            });
                        } else {
                            markersObj.push({
                                Lat: markers[group][u].Lat,
                                Lon: markers[group][u].Lon,
                                Icon: iconName,
                                PopupContent: "<b>Biljettmaskin</b><br />" + markers[group][u].Location + "."
                            });
                        }
                    }
                }

                store.markers.vendors = markersObj;
            }
        };

        return vendorModel;

    } ])

    .factory("stationsModel", ["$http", "store", function ($http, store) {


        var stationsModel = {
            loaded: false,

            updated: false,

            updateStations: function(bounds, trafficTypes) {

                stationsModel.updated = false;

                var url = "/api/map/GetSitePoints/" + bounds.getNorthWest().lat + "/" + bounds.getNorthWest().lng + "/" + bounds.getSouthEast().lat + "/" + bounds.getSouthEast().lng + "/" + trafficTypes;

                $http.get(url).success(function(response) {
                    markers = response.data;
                    var markersObj = [];
                    var length = 500 < markers.length ? 500 : markers.length;
                    for (var u = 0, lenu = markers.length; u < lenu; u++) {
                        var icontype;
                        var type = markers[u].TrafficType;
                        if (type == "TRN") {
                            icontype = "commuterstation";
                        } else if (type == "MET") {
                            icontype = "metrostation";
                        } else if (type == "BUS") {
                            icontype = "busstation";
                        } else if (type == "TRM") {
                            icontype = "tramstation";
                        } else {
                            icontype = "station";
                        }
                        markersObj.push({
                            Lat: markers[u].Lat,
                            Lon: markers[u].Lon,
                            Icon: icontype,
                            PopupContent: "<b>Stations</b><br />" + markers[u].Name + "."
                        });
                    }
                    store.markers.stations = markersObj;
                 
                }).then(function(response) {
                    stationsModel.updated = true;
                });

            },

            fetchStations: function(bounds, trafficTypes) {

                var url = "/api/map/GetSitePoints/" + bounds.getNorthWest().lat + "/" + bounds.getNorthWest().lng + "/" + bounds.getSouthEast().lat + "/" + bounds.getSouthEast().lng + "/" + trafficTypes;

                $http.get(url).success(function(response) {
                    markers = response.data;
                    var markersObj = [];
                    var length = 500 < markers.length ? 500 : markers.length;
                    for (var u = 0, lenu = length; u < lenu; u++) {
                        var icontype;
                        var type = markers[u].TrafficType;
                        if (type == "TRN") {
                            icontype = "commuterstation";
                        } else if (type == "MET") {
                            icontype = "metrostation";
                        } else if (type == "BUS") {
                            icontype = "busstation";
                        } else if (type == "TRM") {
                            icontype = "tramstation";
                        } else {
                            icontype = "station";
                        }

                        markersObj.push({
                            Lat: markers[u].Lat,
                            Lon: markers[u].Lon,
                            Icon: icontype,
                            PopupContent: "<b>Stations</b><br />" + markers[u].Name + "."
                        });
                    }
                    store.markers.stations = markersObj;
                    
                }).then(function(response) {
                    stationsModel.loaded = true;
                });

            },

            parseStations: function(markers) {

                var markersObj = [];

                // merges ticketmachines and vendors/resellers

                markers = markers["List"];

                for (var u = 0, lenu = markers.length; u < lenu; u++) {

                    var icontype;
                    var type = markers[u].TrafficType;
                    if (type == "TRN") {
                        icontype = "commuterstation";
                    } else if (type == "MET") {
                        icontype = "metrostation";
                    } else if (type == "BUS") {
                        icontype = "busstation";
                    } else if (type == "TRM") {
                        icontype = "tramstation";
                    } else {
                        icontype = "station";
                    }

                    markersObj.push({
                        Lat: markers[u].Lat,
                        Lon: markers[u].Lon,
                        Icon: icontype,
                        PopupContent: "<b>Stationer</b><br />" + markers[u].Name + "."
                    });
                }

                store.markers.stations = markersObj;

            }
        };

        return stationsModel;

    } ])

    .factory("parkingsModel", ["$http", "store", function ($http, store) {

        var parkingsModel = {

            loaded: false,

            fetchParkings: function () {

                var data;
                var urlCommuter = "/api/map/GetCommuterParking";

                $http.get(urlCommuter).success(function (response) {
                    parkingsModel.parseParkings($.parseJSON(response.data));

                }).then(function () {
                    parkingsModel.loaded = true;
                    commuterparkloaded = true;
                });

            },

            parseParkings: function (markers) {

                var markersObj = [];

                // merges ticketmachines and vendors/resellers

                markers = markers["List"];

                for (var u = 0, lenu = markers.length; u < lenu; u++) {
                    markersObj.push({
                        Lat: markers[u].Lat,
                        Lon: markers[u].Lon,
                        Icon: "commuterparking",
                        PopupContent: "<b>Pendlarparkering</b><br />" + markers[u].Name + ".<br />Antal platser: " + markers[u].Capacity
                    });
                }

                store.markers.parkings = markersObj;
            }
        };

        return parkingsModel;

    }])

    .factory("zoneModel", ["$http", "store", function ($http, store) {

        var zoneModel = {

            loaded: false,

            fetchZones: function () {
                var urlZone = "/api/map/GetZoneData";

                $http.get(urlZone).success(function (response) {
                    zoneModel.parseZones($.parseJSON(response.data));
                }).then(function () {
                    zoneModel.loaded = true;
                });
            },

            parseZones: function (zones) {
                store.zones = zones;
            }
        };

        return zoneModel;
    }])

    .factory("pathsModel", function () {

        var pathsModel = {
            data: {
                paths: {},
                pathsInit: {},
                source: {
                    trips: {

                    }
                },
                sourceData: {

                }
            },
            methods: {
                parsePathSource: function (source) {

                    var pathSource = {};
                    for (var type in source) {
                        switch (type) {
                            case "trips":

                                //Handle trip
                                // TODO: Fix this

                                var pathSource2 = {};
                                for (var i in source[type]) {
                                    pathSource[i] = source[type][i];
                                    pathSource2[i] = source[type][i];
                                }
                                break;
                            default:
                                var sourcePathTypePaths = pathsModel.methods.parsePathSourceTypes(source[type], type);
                                for (var i in sourcePathTypePaths) {
                                    pathSource[i] = sourcePathTypePaths[i];
                                }
                        }
                    }

                    return pathSource;
                },

                parsePathSourceTypes: function (sourceType, type) {
                    var typePaths = {};
                    return typePaths;
                }

            }

        };

        return pathsModel;

    }) // END OF PathsModel

    .factory("markersModel", ["$http", "pathsModel", "$timeout", "iconService", function ($http, pathsModel, $timeout, iconService) {

        /*
        * TODO:document this monstrosity
        */

        var markersModel = {
            data: {
                markers: {},
                markersInit: {},
                source: {
                    vendors: {
                        representatives: {},
                        resellers: {},
                        ticketmachines: {}
                    },
                    stations: {
                        metro: {},
                        bus: {},
                        train: {},
                        tram: {},
                        ferry: {},
                        local: {}
                    },
                    parkinglots: {
                        transitparking: {},
                        commuterparking: {}
                    },
                    tripstations: {

                    },
                    nearbyStations: {

                    }
                },
                sourceData: {
                    vendors: {
                        vendorMessages: {} //In case we need to make a special case for how to handle messages on same coordinates but different layers
                    }
                }
            }
        };

        markersModel.init = function () {
            var urlTickets = "/api/sv/Map/GetTicketVendors";
            var urlCommuter = "/api/map/GetCommuterParking";
            fetchVendors(urlTickets);
            fetchCarParks(urlCommuter);
        };

        function clearTrip() { // CLEAR ALL TRIPS/NEARBYSTATIONS

            markersModel.data.source.tripstations = {};
            markersModel.data.source.nearbyStations = {};
            pathsModel.data.source.trips = {};
            markersModel.data.markers = {}; // Clear markers
            pathsModel.data.paths = {}; // Clear paths 

        };

        function parseSource(source) {

            var markerSource = {};
            for (var type in source) {
                switch (type) {
                    case "tripstations":

                        //Handle tripstations
                        // TODO: Fix this
                        var markerSource2 = {};
                        for (var i in source[type]) {
                            markerSource[i] = source[type][i];
                            markerSource2[i] = source[type][i];
                        }

                        break;
                    case "nearbyStations":
                        //Handle nearbyStations
                        // TODO: Fix this

                        var markerSource2 = {};
                        for (var i in source[type]) {
                            markerSource[i] = source[type][i];
                            markerSource2[i] = source[type][i];
                        }

                        break;
                    default:
                        var sourceTypeMarkers = parseSourceTypes(source[type], type);
                        for (var i in sourceTypeMarkers) {
                            markerSource[i] = sourceTypeMarkers[i];
                        }
                }
            }
            return markerSource;
        }
        function parseSourceTypes(sourceType, type) {

            var typeMarkers = {};

            for (var group in sourceType) {
                for (var item in sourceType[group]) {
                    var marker = sourceType[group][item];
                    var id = (group + '_' + item).replace(/[\s\.]/g, '');
                    marker.icon = iconService.local_icons[group].initial;
                    if (typeof typeMarkers[id] != "undefined") {
                        marker.title = handleMultiples(marker.title, typeMarkers[id].title);
                        marker.message = handleMultiples(marker.message, typeMarkers[id].message);
                        marker.type = handleMultiples(marker.type, typeMarkers[id].type);
                        if (typeMarkers[id].type != group) {
                            marker.icon = iconService.local_icons['combined' + type].initial;
                            marker.type = type; //'combined' + type;
                        }
                    }
                    typeMarkers[id] = marker;
                }
            }
            for (var marker in typeMarkers) {
                if (typeMarkers[marker].title instanceof Array) {
                    typeMarkers[marker].title = typeMarkers[marker].title.join(', ');
                }
                if (typeMarkers[marker].message instanceof Array) {
                    typeMarkers[marker].message = typeMarkers[marker].message.join('<br/>');
                }
                if (typeMarkers[marker].type instanceof Array) {
                    typeMarkers[marker].type = typeMarkers[marker].type.join(',');
                }
                //We depending on how we want to group them
                typeMarkers[marker].layer = typeMarkers[marker].type;
                //typeMarkers[marker].layer = type;
            }
            return typeMarkers;
        };

        /* --- Trip functions ---*/



        markersModel.parseTrip = function (data) {

            var trips = data.Trips;
            var tripsobj = {};
            var pathObj = {};
            clearTrip();

            for (var i = 0, triplength = trips.length; i < triplength; i++) {

                var trip = {},
                    path = {},
                    destination = trips[i].Destination,
                    origin = trips[i].Origin,
                    destinationname = ("station_" + destination.toLowerCase() + "_" + trips[i].DestinationLatitude + "_" + trips[i].DestinationLongitude).replace(/[\s\.]/g, ''),
                    originname = ("station_" + origin.toLowerCase() + "_" + trips[i].OriginLatitude + "_" + trips[i].OriginLongitude).replace(/[\s\.]/g, ''),
                    prefix = "trip_" + i + "_",
                    specIndex = i + "_" + "0_0_";

                path.color = "#a7a9ac";
                path.weight = 5;
                //path.opacity = 1,
                path.layer = 'trip';
                path.latlngs = [];

                path.latlngs.push({ lat: parseFloat(trips[i].OriginLatitude), lng: parseFloat(trips[i].OriginLongitude) }); // Adding Main start 

                markersModel.data.source.tripstations[specIndex + prefix + (destinationname).replace(/[()éöåäüÖÅÄÜ\-]/g, '_')] = {
                    title: destination,
                    type: "station",
                    draggable: false,
                    icon: iconService.local_icons.end.initial,
                    lat: parseFloat(trips[i].DestinationLatitude),
                    lng: parseFloat(trips[i].DestinationLongitude),
                    message: "<h2>" + destination + "</h2>" + "<p>Destination<p>"
                };

                markersModel.data.source.tripstations[specIndex + prefix + (originname).replace(/[()éöåäüÖÅÄÜ\-]/g, '_')] = {
                    title: origin,
                    type: "station",
                    draggable: false,
                    icon: iconService.local_icons.start.initial,
                    lat: parseFloat(trips[i].OriginLatitude),
                    lng: parseFloat(trips[i].OriginLongitude),
                    message: "<h2>" + origin + "</h2>" + "<p>Start<p>"
                };


                for (var u = 0, sublength = trips[i].SubTrips.length; u < sublength; u++) { //Loop all Sub trips

                    // TODO: Check if multi markers (Sub and start/destination can be the same);

                    var destinationSub = (trips[i].SubTrips[u].Destination);
                    var originSub = (trips[i].SubTrips[u].Origin);


                    var destinationnameSub = ("station_sub_" + destinationSub.toLowerCase() + "_" + trips[i].SubTrips[u].DestinationLatitude + "_" + trips[i].SubTrips[u].DestinationLongitude).replace(/[\s\.]/g, '');
                    var originnameSub = ("station_sub_" + originSub.toLowerCase() + "_" + trips[i].SubTrips[u].OriginLatitude + "_" + trips[i].SubTrips[u].OriginLongitude).replace(/[\s\.]/g, '');
                    var specIndexSub = i + "_" + u + "_" + "0_";


                    if (originSub != origin) { // CHECK IF Sub Origin is same as Main Origin
                        markersModel.data.source.tripstations[specIndexSub + prefix + (originnameSub).replace(/[():éöåäüÖÅÄÜ\-]/g, '_')] = {
                            title: originSub,
                            type: "substation",
                            draggable: false,
                            icon: iconService.local_icons.substation.initial,
                            lat: parseFloat(trips[i].SubTrips[u].OriginLatitude),
                            lng: parseFloat(trips[i].SubTrips[u].OriginLongitude)
                        };
                        path.latlngs.push({ lat: parseFloat(trips[i].SubTrips[u].OriginLatitude), lng: parseFloat(trips[i].SubTrips[u].OriginLongitude) }); // Adding start for subtrips
                    }


                    for (var y = 0, lengy = trips[i].SubTrips[u].IntermediateStops.length; y < lengy; y++) { // Loop all intermediate stops

                        var stationName = trips[i].SubTrips[u].IntermediateStops[y].Name,
                            lat = trips[i].SubTrips[u].IntermediateStops[y].Lat,
                            lng = trips[i].SubTrips[u].IntermediateStops[y].Lon,
                            stationNameID = (("station_" + stationName.toLowerCase() + "_" + lat + "_" + lng).replace(/[\s\.]/g, '')),
                            specIndexIntermediate = i + "_" + u + "_" + y + "_";

                        path.latlngs.push({ lat: parseFloat(lat), lng: parseFloat(lng) }); // Adding destination for substrips

                        // These two creates a line between start and destination 

                        markersModel.data.source.tripstations[specIndexIntermediate + prefix + (stationNameID).replace(/[():éöåäüÖÅÄÜ\-]/g, '_')] = {
                            title: stationName,
                            type: "IntermediateStops",
                            draggable: false,
                            icon: iconService.local_icons.tripstations.initial,
                            lat: parseFloat(lat),
                            lng: parseFloat(lng)
                        };
                    }

                    if (destinationSub != destination) { // CHECK IF Sub Destination is same as Main Destination
                        markersModel.data.source.tripstations[specIndexSub + prefix + (destinationnameSub).replace(/[():éöåäüÖÅÄÜ\-]/g, '_')] = {
                            title: destinationSub,
                            type: "substation",
                            draggable: false,
                            icon: iconService.local_icons.substation.initial,
                            lat: parseFloat(trips[i].SubTrips[u].DestinationLatitude),
                            lng: parseFloat(trips[i].SubTrips[u].DestinationLongitude)
                        }
                        path.latlngs.push({ lat: parseFloat(trips[i].SubTrips[u].DestinationLatitude), lng: parseFloat(trips[i].SubTrips[u].DestinationLongitude) }); // Adding destination for substrips 
                    }

                }



                path.latlngs.push({ lat: parseFloat(trips[i].DestinationLatitude), lng: parseFloat(trips[i].DestinationLongitude) }); // Adding destination 

                pathObj[prefix + "path"] = path;

            }

            pathsModel.data.source.trips = pathObj;
            pathsModel.data.pathsInit = pathsModel.methods.parsePathSource(pathsModel.data.source);
            angular.copy(pathsModel.data.pathsInit, pathsModel.data.paths);

        };


        /* --- Nerby stations functions ---*/

        markersModel.parseNerbyStations = function (data, lat, lng) {

            clearTrip();

            for (var i in data.data) {
                var station = data.data[i];
                var id = ("station_" + station.Latitude + "_" + station.Longitude).replace(/[\s\.]/g, '');
                var icon;
                var trafficType = station.TrafficTypeList;

                if (trafficType.length > 1) {
                    icon = iconService.local_icons.multistation.initial
                } else {
                    if (trafficType[0] == "BUS") {
                        icon = iconService.local_icons.busstation.initial
                    }
                    if (trafficType[0] == "TRN") {
                        icon = iconService.local_icons.commuterstation.initial
                    }
                    if (trafficType[0] == "MET") {
                        icon = iconService.local_icons.metrostation.initial
                    }
                    if (trafficType[0] == "TRM") {
                        icon = iconService.local_icons.tramstation.initial
                    }
                }
                markersModel.data.source.nearbyStations[id] = {
                    lat: station.Latitude,
                    lng: station.Longitude,
                    title: station.Name,
                    draggable: false,
                    info: { siteid: station.SiteId, name: station.Name },
                    icon: icon,
                    focus: false,
                    message: "<h3>" + station.Name + "<br /><small>Avstånd: " + station.Distance + "</small></h3>" + "<p>" + station.TrafficTypeList.join(", ") + "<p>"
                };
            }

            if (typeof lat != 'undefined' && typeof lng != 'undefined') { // Adds a "My position" marker to the map

                markersModel.data.source.nearbyStations['myposition'] = {
                    lat: lat,
                    lng: lng,
                    title: "myposition",
                    draggable: false,
                    icon: iconService.local_icons.myposition.initial,
                    focus: false,
                    message: "<h3>Min position</h3>"
                }
            }

        };

        /* --- Car Parks functions */

        function fetchCarParks(url) {

            $http.get(url).
                success(function (data, status, headers, config) {
                    parseCarParks(data);
                })
                .error(function (data, status, headers, config) {

                })
                .then(function () {

                    markersModel.data.markersInit = parseSource(markersModel.data.source);
                    angular.copy(markersModel.data.markersInit, markersModel.data.markers);

                });
        }
        function parseCarParks(data) {

            var carobj = { commuterparking: data.data.List }
            var carParkGroup = {};
            var type = 'commuterparking';

            for (var parkingArea in carobj[type]) {

                var carpark = {};
                carpark.title = carobj[type][parkingArea].Name;
                carpark.message = "<h3>" + carpark.title + "</h3>";

                carpark.lat = 0;
                carpark.lng = 0;

                if (typeof carobj[type][parkingArea].Lat != "undefined" && typeof carobj[type][parkingArea].Lon != "undefined") {
                    carpark.lat = carobj[type][parkingArea].Lat.replace(' ', '');
                    carpark.lng = carobj[type][parkingArea].Lon.replace(' ', '');
                }

                //fix horrible databug (THIS SHOULD NOT STAY, CORRUPT DATA MUST BE FIXED
                if (carpark.lat == '0539706717235') {
                    carpark.lat = '59.3244858548227';
                }
                carpark.lat = parseFloat(carpark.lat);
                carpark.lng = parseFloat(carpark.lng);
                carpark.draggable = false;
                carpark.focus = false;
                carpark.type = type;

                var markerPos = carpark.lat + '_' + carpark.lng;

                carParkGroup[markerPos] = addToGroup(carParkGroup, carpark, markerPos);

            }

            markersModel.data.source.parkinglots.commuterparking = carParkGroup;

        }

        /* --- Vendor Marker functions ---*/

        function fetchVendors(url) {

            $http.get(url).
                success(function (data, status, headers, config) {
                    //console.log("fetchVendors", data);
                    data = data.data;
                    //console.log("fetchVendors", data);
                    parseVendors(data);
                })
                .error(function (data, status, headers, config) {

                })
                .then(function () {

                    markersModel.data.markersInit = parseSource(markersModel.data.source);

                });
        }

        function parseVendors(data) {
            for (var group in data) {

                var vendorGroup = {};
                var type = group.toLowerCase();

                for (var i = 0, len = data[group].length; i < len; i++) {

                    var item = i;
                    var vendor = {};
                    if (typeof data[group][item].Name != "undefined") {
                        vendor.title = data[group][item].Name;
                    }
                    if (typeof data[group][item].Address != "undefined") {
                        vendor.message = (typeof vendor.title != "undefined" ? "<h2>" + vendor.title + "</h2><h6>" + type + "</h6><p>" : '') + data[group][item].Address + "</p>";
                    } else {
                        vendor.message = "<h6>" + type + "</h6>";
                    }
                    vendor.lat = 0;
                    vendor.lng = 0;
                    if (typeof data[group][item].Lat != "undefined" && typeof data[group][item].Lon != "undefined") {
                        vendor.lat = data[group][item].Lat.replace(' ', '');
                        vendor.lng = data[group][item].Lon.replace(' ', '');
                    }


                    //fix horrible databug (THIS SHOULD NOT STAY, CORRUPT DATA MUST BE FIXED
                    if (vendor.lat == '0539706717235') {
                        //alert(vendor.lat);
                        //console.log("error still here ERIK FIX IT!");
                        vendor.lat = '59.3244858548227';
                    }
                    vendor.lat = parseFloat(vendor.lat);
                    vendor.lng = parseFloat(vendor.lng);
                    vendor.draggable = false;
                    vendor.focus = false;
                    vendor.type = type;

                    var markerPos = vendor.lat + '_' + vendor.lng;

                    vendorGroup[markerPos] = addToGroup(vendorGroup, vendor, markerPos);
                }
                // TODO: Consider adding type to markerPos
                //var markerPos = vendor.type + '_' + vendor.lat + '_' + vendor.lng;

                markersModel.data.source.vendors[type] = vendorGroup;
            }
        }
        function addToGroup(vendorGroup, vendor, markerPos) {
            if (typeof vendorGroup[markerPos] != "undefined") {
                vendor.title = handleMultiples(vendor.title, vendorGroup[markerPos].title);
                vendor.message = handleMultiples(vendor.message, vendorGroup[markerPos].message);
            }
            return vendor;
        };
        function handleMultiples(source, destination) {
            if (destination instanceof Array) {
                var unique = true;
                for (var i in destination) {
                    if (destination[i] == source) {
                        unique = false;
                        break;
                    }
                }
                if (unique) {
                    source = destination.push(source);
                }
            } else {
                source = [destination, source];
                //console.log('handleMultiples source', source instanceof Array);
            }
            return source;
        };


        function createMarker(options) { } //TODO: Maybe

        return markersModel;

    }]);                                                                      // END OF MARKERS MODEL

    angular.module('slapp.interactiveMap.controllers', [])
    .controller("InteractiveMap", ["$scope", "$http", "$location", "markersModel", "stationsModel", "zoneModel", "vendorModel", "$timeout", "store", "mapServices", "pathsModel", "parkingsModel", "urlprovider", "latestSearch", "iconService", function ($scope, $http, $location, markersModel, stationsModel, zoneModel, vendorModel, $timeout, store, mapServices, pathsModel, parkingsModel, urlprovider, latestSearch, iconService) {

        var map,
            isLoadingCommuterParking = false,
            isLoadingVendors = false,
            isLoadingZones = false,
            loadedCommuterParking = false,
            loadedVendors = false,
            loadedZones = false,
            visibleCommuterParking = false,
            visibleVendors = false,
            visibleZones = false,
            visibleStations = false,

            zoneLayer,
            parkingMarkers = [],
            vendorMarkers = [],
            tripMarkers = [],
            stationsMarkers = [],
            realtimeMarkers = [],

            renderTypes = ["marker", "zone", "trip", "realtime"],
            renderAmountPerLoop = 100,
            renderWithDelayPerLoop = 10,
            isRenderingRunning = false,
            polylineLayers = [],
            realtimeCluster = new L.MarkerClusterGroup({
                removeOutsideVisibleBounds: true,
                maxClusterRadius: 40,
                disableClusteringAtZoom: 10,
                zoomToBoundsOnClick: false,
                spiderfyOnMaxZoom: false,
                showCoverageOnHover: false
            }),
            tripCluster = new L.MarkerClusterGroup({
                removeOutsideVisibleBounds: true,
                maxClusterRadius: 40,
                disableClusteringAtZoom: 10,
                zoomToBoundsOnClick: false,
                spiderfyOnMaxZoom: false,
                showCoverageOnHover: false
            }),
            stationCluster = new L.MarkerClusterGroup({
                removeOutsideVisibleBounds: true,
                maxClusterRadius: 40,
                disableClusteringAtZoom: 8,
                zoomToBoundsOnClick: false,
                spiderfyOnMaxZoom: false,
                showCoverageOnHover: false
            }),
            cluster = new L.MarkerClusterGroup({
                maxClusterRadius: 80, //Default 80
                removeOutsideVisibleBounds: true,
                zoomToBoundsOnClick: true,
                spiderfyOnMaxZoom: false,
                disableClusteringAtZoom: 16
                //iconCreateFunction: function (thecluster) {//TODO This creates the icon for the cluster. Make it custom per grouping?

                //                iconCreateFunction: function (thecluster) {
                //                    var childCount = thecluster.getChildCount();

                //                    var c = ' marker-cluster-';
                //                    if (childCount < 10) {
                //                        c += 'small';
                //                    } else if (childCount < 100) {
                //                        c += 'medium';
                //                    } else {
                //                        c += 'large';
                //                    }

                //                    return new L.DivIcon({ html: '<div><span>' + childCount + '</span></div>', className: 'marker-cluster' + c, iconSize: new L.Point(40, 40) });
                //                }
            });


        $scope.SetBounds = function () {
            //console.log("Set bounds");
            var org = markersModel.data.source;
            var prearr = [];
            var finalarr = [];
            prearr.push(org.nearbyStations);
            prearr.push(org.tripstations);
            for (var i in prearr) {
                for (var m in prearr[i]) {
                    var marker = prearr[i][m];
                    var latlng = [marker.lat, marker.lng];
                    finalarr.push(latlng);
                }
            }

            if (finalarr.length > 0) {
                map.fitBounds(finalarr); //Moves the map to a more zoomed in state.
            }
        };

        $scope.renderMap = function () {

            var test = store.markers.parking; //Init factory.
            map = L.map('interactiveMap');
            map.locate({ watch: false });
            //https://c.tiles.mapbox.com/v3/examples.map-h61e8o8e/14/4824/6158.png
            //https://{s}.tiles.mapbox.com/v3/examples.map-h61e8o8e
            L.tileLayer('https://api.tiles.mapbox.com/v3/examples.map-51f69fea/{z}/{x}/{y}.png', {
                //L.tileLayer('http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/997/256/{z}/{x}/{y}.png', {
                maxZoom: 18,
                subdomains: ['a', 'b', 'c', 'd'],
                autoPan: false,
                attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>'
            }).addTo(map);

            map.addLayer(cluster);
            map.addLayer(stationCluster);
            map.addLayer(tripCluster);
            map.addLayer(realtimeCluster);

            map.on("load", function() {
                $scope.QueueRendering(null, renderTypes[2]);
                $scope.QueueRendering(null, renderTypes[3]);
            });

            map.on("moveend", function () { // Get stations based on bounds
                //console.log("Zoomend or dragend happend");
                if (visibleStations) {
                    $scope.updateStations();
                }

            });

            window.cluster = cluster;
            window.tripCluster = tripCluster;
            window.realtimeCluster = realtimeCluster;

            map.setView([59.331376, 18.060434], 9);

            //console.log("Map has been rendered.");
        };

        $scope.renderMarkers = function (markers, kind) {

            var previousIconName = "";
            var theIcon;

            var mapMarker = [];
            for (var i = 0, len = markers.length; i < len; i++) {
                if (markers[i] == undefined) { return; }

                var lat = markers[i].Lat; if (lat == '0539706717235') { continue; } //lat = '59.3244858548227';
                var lon = markers[i].Lon;

                if (previousIconName != markers[i].Icon) {
                    theIcon = L.icon(iconService.local_icons[markers[i].Icon].initial);
                }
                var marker = L.marker(new L.LatLng(lat, lon), { icon: theIcon });
                marker.bindPopup(markers[i].PopupContent);

                if (kind == "vendor") {
                    vendorMarkers.push(marker);
                } else if (kind == "parking") {
                    parkingMarkers.push(marker);
                } else if (kind == "stations") {
                    stationsMarkers.push(marker);
                } else if (kind == "trip") {

                }

                mapMarker.push(marker);
                //cluster.addLayer(marker);
            }
            if (kind == "stations") {
                stationCluster.addLayers(mapMarker);
            } else {
                cluster.addLayers(mapMarker);
            }

        };

        $scope.RenderTrips = function () {

            tripCluster.removeLayers(tripMarkers);
            for (var polyindex in polylineLayers) {
                map.removeLayer(polylineLayers[polyindex]);
            }
            tripMarkers = [];
            polylineLayers = [];

            var tripPolylines = pathsModel.data.source.trips;
            var markers = markersModel.data.source.tripstations;

            var mapMarker = [];
            for (var i in markers) {
                if (markers[i] == undefined) { continue; }

                var icon = L.icon(iconService.local_icons[markers[i].icon.className].initial);
                var marker = L.marker(new L.LatLng(markers[i].lat, markers[i].lng), { icon: icon });

                if (markers[i].message != undefined) {
                    marker.bindPopup(markers[i].message);
                } else {
                    marker.bindPopup(markers[i].title);
                }

                if ($scope.IsUniqueTripMarker(marker)) {
                    tripMarkers.push(marker);
                    mapMarker.push(marker);
                }
            }
            tripCluster.addLayers(mapMarker);


            var weigth = 6;
            for (var loop in tripPolylines) {
                var trip = tripPolylines[loop].latlngs;
                if (trip == undefined || trip.length == 0) { continue; }

                var polylines = [];
                var color = tripPolylines[loop].color;

                for (var index in trip) {
                    polylines.push(new L.LatLng(trip[index].lat, trip[index].lng));
                }

                if ($scope.IsUniquePolyLine(polylines)) {
                    var line = new L.Polyline(polylines, { color: color, opacity: 1, weigth: weigth, smoothFactor: 1 });
                    line.on("click", $scope.PolyLineClick);

                    polylineLayers.push(line);

                    map.addLayer(line);
                    weigth--;
                }
            }
            isRenderingRunning = false;
            $scope.SetBounds();
            if (polylineLayers.length != 0) {
                $scope.SetCurrentLine();
            }
        };

        $scope.SetCurrentLine = function () {
            polylineLayers[polylineLayers.length - 1].setStyle({ color: "#3ca7f9" }).bringToFront();
        };

        $scope.PolyLineClick = function () {
            for (var i = 0, len = polylineLayers.length; i < len; i++) {
                polylineLayers[i].setStyle({ color: "#a7a9ac" });
            }
            this.setStyle({ color: "#3ca7f9" }).bringToFront();
        };

        $scope.RealtimeMarkerClick = function (marker) {
            var markeropt = marker.target.options;
            if (typeof markeropt.info != "undefined") {

                var info = markeropt.info,
                    name = info.name,
                    siteid = info.siteid;

                var url = urlprovider.realtime.createRouteUrl(name, siteid);

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
                latestSearch.add({ Type: 'Realtime', Url: url, FromName: name, SiteId: siteid });
                $scope.toggleMap();
                $location.path(url);

            }
        };

        $scope.RenderNearbyStations = function () {

            realtimeCluster.removeLayers(realtimeMarkers);
            realtimeMarkers = [];
            var markers = markersModel.data.source.nearbyStations;
            //console.log(markers)

            var mapMarker = [];

            $.each(markers, function(i, obj) {

                var info = obj.info;
                var icon = L.icon(iconService.local_icons[obj.icon.className].initial);
                var marker = L.marker(new L.LatLng(obj.lat, obj.lng), { icon: icon, info: info });

                if (markers[i].message != undefined) {
                    marker.bindPopup(markers[i].message);
                } else {
                    marker.bindPopup(markers[i].title);
                }
                realtimeMarkers.push(marker);
                mapMarker.push(marker);
            });

            realtimeCluster.addLayers(realtimeMarkers);

            $.each(mapMarker, function (i, marker) {
                marker.on("click", function (args) {
                    $scope.RealtimeMarkerClick(args);
                    $scope.$apply();
                });
            });

            isRenderingRunning = false;
            $scope.SetBounds();
        };

        $scope.IsUniquePolyLine = function (polylines) {//TODO this is not working correctly. Dubletts will still exist.
            if (polylineLayers.length == 0) { return true; }

            for (var i in polylineLayers) {
                for (var j = 0; j < polylineLayers[i]._latlngs.length; j++) {
                    var point = polylineLayers[i]._latlngs[j];
                    if (polylines[j] == undefined || polylines[j].lat != point.lat || polylines[j].lng != point.lng) {
                        return true;
                    }
                }
            }

            return false;
        };

        $scope.IsUniqueTripMarker = function (marker) {
            for (var i in tripMarkers) {
                if (tripMarkers[i]._latlng.lat == marker._latlng.lat &&
                    tripMarkers[i]._latlng.lng == marker._latlng.lng &&
                    tripMarkers[i].options.icon.options.className == marker.options.icon.options.className &&
                    tripMarkers[i]._popup._content == marker._popup._content) {

                    //TODO Add a check for transportation type? If transportation type is different but the rest is the equal, then change icon to multitransport location?

                    return false;
                }
            }

            return true;
        };

        //var isRunning = false;
        $scope.QueueRendering = function (arrayToRender, type, kind) {//TODO maybe add check for seeing if map startup is completed.

            if (isRenderingRunning) {
                setTimeout(function () {
                    $scope.QueueRendering(arrayToRender, type, kind);
                }, renderWithDelayPerLoop * 2);
            } else {
                isRenderingRunning = true; //Comment this row and multiple marker arrays will be rendered asynchronusly.
                switch (type) {
                    case renderTypes[0]:
                        $scope.MarkerHandler(arrayToRender.slice(), kind);
                        break;
                    case renderTypes[1]:
                        //$scope.MarkerQueueHandler(arrayToRender);
                        break;
                    case renderTypes[2]:
                        $scope.RenderTrips();
                        break;
                    case renderTypes[3]:
                        $scope.RenderNearbyStations();
                        break;
                    default:
                        break;
                }
            }
        };

        $scope.MarkerHandler = function (markers, kind) {
            if (markers.length == 0) {
                isRenderingRunning = false;
                return;
            }

            var size = markers.length > renderAmountPerLoop ? renderAmountPerLoop : markers.length;
            var render = markers.slice(0, size);
            $scope.renderMarkers(render, kind);

            setTimeout(function () {
                markers.splice(0, size);
                $scope.MarkerHandler(markers, kind);
            }, renderWithDelayPerLoop);
        };



        $scope.ready = function () {

            if (Object.prototype.toString.call(store.markers.vendors) === '[object Array]') {
                $scope.QueueRendering(store.markers.vendors, renderTypes[0]);
            }
            if (Object.prototype.toString.call(store.markers.parkings) === '[object Array]') {
                $scope.QueueRendering(store.markers.parkings, renderTypes[0]);
            }
            if (Object.prototype.toString.call(store.markers.stations) === '[object Array]') {
                $scope.QueueRendering(store.markers.stations, renderTypes[0]);
            }

            //map.on("zoomend", $scope.changeicon);
        };

        $scope.changeicon = function () {
            //            var a = cluster._needsClustering;
            //            var b = cluster._needsRemoving;
            //            var c = cluster._gridUnclustered;
            //            var d = cluster._markers;
            //            if (map.getZoom() > revertToIconsAtZoom - 2) {
            //                for (var marker in weeMarker) {
            //                    var wee = weeMarker[marker];
            //                    var parent = cluster.getVisibleParent(wee);
            //                    if (parent != null) {
            //                        var wwww = wee.options.icon.options.className;
            //                        wee.options.icon = L.icon(iconService.local_icons[wee.options.icon.options.className].zoom1);
            //                    }
            //                    //L.icon(iconService.local_icons[markers[i].Icon].initial)
            //                }
            //            }
        };

        $scope.toggleCommuterParking = function () {

            if (!parkingsModel.loaded) {

                mapServices.getParkings();

                function checker() {

                    if (!parkingsModel.loaded) {
                        setTimeout(function () {
                            checker()
                        }, 100);
                    } else {

                        if (Object.prototype.toString.call(store.markers.parkings) === '[object Array]') {
                            $scope.QueueRendering(store.markers.parkings, renderTypes[0], "parking");
                        }

                        loadedCommuterParking = true;
                        visibleCommuterParking = true;
                    }
                }

                checker();

            }

            else if (!visibleCommuterParking) {
                if (Object.prototype.toString.call(store.markers.parkings) === '[object Array]') {
                    $scope.QueueRendering(store.markers.parkings, renderTypes[0], "parking");
                }
                //cluster.addLayers(parkingMarkers);

                visibleCommuterParking = true;
            } else if (visibleCommuterParking) {
                cluster.removeLayers(parkingMarkers);
                parkingMarkers = [];
                visibleCommuterParking = false;
            }

            if (!parkingsModel.loaded || visibleCommuterParking) {
                window.SiteCatalyst.TrackClient("MapFilter", "pendelparkering");
            }
        };

        $scope.getTrafficTypesByZoomAndWidth = function (zoomLvl) {
            var zoomLvls = [];

            zoomLvls.push(1);

            if (zoomLvl >= 10) {
                zoomLvls.push(2);
            }
            if (zoomLvl >= 12) {
                zoomLvls.push(4);
            }
            if (zoomLvl >= 14) {
                zoomLvls.push(8);
            }

            return zoomLvls.sort().join();
        };

        $scope.sortTrafficTypesByWidth = function(trafficTypes) {
            var trafficsArr = trafficTypes.split();
            var width = $(window).width();

            if (width > 460) { // width is only 480 remove busses
                if (trafficsArr.indexOf("8") != -1) {
                    trafficsArr.splice(trafficsArr.indexOf("8"), 1);
                }
            } else if (width > 960) { // width is only 960 remove busses
                if (trafficsArr.indexOf("4") != -1) {
                    trafficsArr.splice(trafficsArr.indexOf("4"), 1);
                }
            } else {

            }

            return trafficsArr.join();

        };

        $scope.updateStations = function () {

            stationCluster.removeLayers(stationsMarkers);

            var zoomLvl = map.getZoom();
            var trafficTypes;
            trafficTypes = $scope.getTrafficTypesByZoomAndWidth(zoomLvl);
            trafficTypes = $scope.sortTrafficTypesByWidth(trafficTypes);
            var bounds = map.getBounds();

            mapServices.updateStations(bounds, trafficTypes);

            function checker() {

                if (!stationsModel.updated) {
                    setTimeout(function () {
                        checker()
                    }, 10);
                } else {
                    if (Object.prototype.toString.call(store.markers.stations) === '[object Array]') {
                        $scope.QueueRendering(store.markers.stations, renderTypes[0], "stations");
                    }
                }
            }

            checker();



        };

        $scope.toggleStations = function () {

            if (!stationsModel.loaded) {

                var zoomLvl = map.getZoom();
                var trafficTypes;
                trafficTypes = $scope.getTrafficTypesByZoomAndWidth(zoomLvl);
                trafficTypes = $scope.sortTrafficTypesByWidth(trafficTypes);
                var bounds = map.getBounds();

                mapServices.getStations(bounds, trafficTypes);
                //$scope.QueueRendering(markersObj, renderTypes[0], "stations");
                function checker() {

                    if (!stationsModel.loaded) {
                        setTimeout(function () {
                            checker()
                        }, 10);
                    } else {

                        if (Object.prototype.toString.call(store.markers.stations) === '[object Array]') {
                            $scope.QueueRendering(store.markers.stations, renderTypes[0], "stations");
                        }

                        loadedStations = true;
                        visibleStations = true;
                    }
                }

                checker();

            }

            else if (!visibleStations) {
                if (Object.prototype.toString.call(store.markers.stations) === '[object Array]') {
                    $scope.QueueRendering(store.markers.stations, renderTypes[0], "stations");
                }
                //cluster.addLayers(parkingMarkers);

                visibleStations = true;
            } else if (visibleStations) {
                stationCluster.removeLayers(stationsMarkers);
                stationsMarkers = [];
                visibleStations = false;
            }

            if (!stationsModel.loaded || visibleStations) {
                window.SiteCatalyst.TrackClient("MapFilter", "hallplatser");
            }
        };

        $scope.toggleVendors = function () {
            if (!vendorModel.loaded) {

                mapServices.getVendors();

                function checker() {

                    if (!vendorModel.loaded) {
                        setTimeout(function () {
                            checker()
                        }, 100);
                    } else {

                        if (Object.prototype.toString.call(store.markers.vendors) === '[object Array]') {
                            $scope.QueueRendering(store.markers.vendors, renderTypes[0], "vendor");
                        }

                        loadedVendors = true;
                        visibleVendors = true;

                    }

                }

                checker();

            } else if (!visibleVendors) {
                if (Object.prototype.toString.call(store.markers.vendors) === '[object Array]') {
                    $scope.QueueRendering(store.markers.vendors, renderTypes[0], "vendor");
                }
                //cluster.addLayers(vendorMarkers);//Segt i FF, lär vara segt i mobiler.
                visibleVendors = true;
            } else if (visibleVendors) {
                cluster.removeLayers(vendorMarkers); //Kanske göra om så att man tar bort lite åt gången såsom man lägger till. Lär väll lagga annars...
                vendorMarkers = [];
                visibleVendors = false;
            }

            if (!vendorModel.loaded || visibleVendors) {
                window.SiteCatalyst.TrackClient("MapFilter", "forsaljning");
            }
        };

        $scope.toggleZones = function () {
            if (!zoneModel.loaded) {

                mapServices.getZones();

                function checker() {

                    if (!zoneModel.loaded) {
                        setTimeout(function () {
                            checker()
                        }, 100);
                    } else {

                        var zone = store.zones; //TODO

                        zoneLayer = L.geoJson([zone], {
                            style: function (feature) {
                                return feature.properties && feature.properties.style;
                            }
                        });

                        map.addLayer(zoneLayer);
                        $(".indicators").show();
                        loadedZones = true;
                        visibleZones = true;

                    }

                }

                checker();

            } else if (!visibleZones) {
                map.addLayer(zoneLayer);
                $(".indicators").show();
                visibleZones = true;
            } else if (visibleZones) {
                $(".indicators").hide();
                map.removeLayer(zoneLayer);
                visibleZones = false;
            }
        };

        $scope.toggleControllers = function () {
            var $controllerList = $(".map-controllers");
            $controllerList.toggleClass("open");
        };

        $scope.renderMap(); //Do this last! All functions must be loaded before use.
    }]);

    // END OF FUNCTIONS

    /* Map Data Service */

    angular.module('slapp.interactiveMap.services', [], function ($provide) {
        $provide.service('mapDataService', ["markersModel", function (markersModel) {
            var self = this;

            self.setNearbyStations = function (data, lat, lng) {
                markersModel.parseNerbyStations(data, lat, lng);
            };

            self.setTravelTrip = function (data) {
                markersModel.parseTrip(data);
            };

            self.setRealTime = function (data) {
                markersModel.parseNerbyStations(data);
            };

        } ]);

        $provide.service('iconService', function() {

            var self = this;

            self.local_icons = {
                default_icon: {
                    initial: {
                        className: 'default_icon',
                        iconUrl: '/Resources/styles/leaflet/images/marker-icon_13x21.png',
                        iconRetinaUrl: '/Resources/styles/leaflet/images/marker-icon.png',
                        //shadowUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        //shadowRetinaUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        iconSize: [13, 21], // size of the icon
                        //shadowSize: [41, 41], // size of the shadow
                        iconAnchor: [6, 20], // point of the icon which will correspond to marker's location
                        //shadowAnchor: [12, 40],  // the same for the shadow
                        popupAnchor: [0, -20] // point from which the popup should open relative to the iconAnchor
                    },
                    zoom1: {
                        className: 'default_icon',
                        iconUrl: '/Resources/styles/leaflet/images/marker-icon_13x21.png',
                        iconRetinaUrl: '/Resources/styles/leaflet/images/marker-icon.png',
                        //shadowUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        //shadowRetinaUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        iconSize: [13, 21], // size of the icon
                        //shadowSize: [41, 41], // size of the shadow
                        iconAnchor: [6, 20], // point of the icon which will correspond to marker's location
                        //shadowAnchor: [12, 40],  // the same for the shadow
                        popupAnchor: [0, -20] // point from which the popup should open relative to the iconAnchor
                    }
                },

                commuterparking: {
                    zoom1: {
                        className: 'commuterparking',
                        iconUrl: '/Resources/styles/leaflet/images/dot1_8x8px.png',
                        iconRetinaUrl: '/Resources/styles/leaflet/images/marker-icon.png',
                        //shadowUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        //shadowRetinaUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        iconSize: [8, 8], // size of the icon
                        //shadowSize: [41, 41], // size of the shadow
                        iconAnchor: [4, 8], // point of the icon which will correspond to marker's location
                        //shadowAnchor: [12, 40],  // the same for the shadow
                        popupAnchor: [0, -4] // point from which the popup should open relative to the iconAnchor
                    },
                    initial: {
                        className: 'commuterparking',
                        iconUrl: '/Resources/styles/leaflet/images/p_25x41px.png',
                        iconRetinaUrl: '/Resources/styles/leaflet/images/p_50x81px.png',
                        //shadowUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        //shadowRetinaUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        iconSize: [25, 41], // size of the icon
                        //shadowSize: [41, 41], // size of the shadow
                        iconAnchor: [12, 40], // point of the icon which will correspond to marker's location
                        //shadowAnchor: [12, 40],  // the same for the shadow
                        popupAnchor: [0, -40] // point from which the popup should open relative to the iconAnchor
                    }
                },
                resellers: {
                    zoom1: {
                        className: 'resellers',
                        iconUrl: '/Resources/styles/leaflet/images/dot1_8x8px.png',
                        iconRetinaUrl: '/Resources/styles/leaflet/images/marker-icon.png',
                        //shadowUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        //shadowRetinaUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        iconSize: [8, 8], // size of the icon
                        //shadowSize: [41, 41], // size of the shadow
                        iconAnchor: [4, 8], // point of the icon which will correspond to marker's location
                        //shadowAnchor: [12, 40],  // the same for the shadow
                        popupAnchor: [0, -4] // point from which the popup should open relative to the iconAnchor
                    },
                    initial: {
                        className: 'resellers',
                        iconUrl: '/Resources/styles/leaflet/images/tickets_25x41px.png',
                        iconRetinaUrl: '/Resources/styles/leaflet/images/tickets_50x81px.png',
                        //shadowUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        //shadowRetinaUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        iconSize: [25, 41], // size of the icon
                        //shadowSize: [41, 41], // size of the shadow
                        iconAnchor: [12, 40], // point of the icon which will correspond to marker's location
                        //shadowAnchor: [12, 40],  // the same for the shadow
                        popupAnchor: [0, -40] // point from which the popup should open relative to the iconAnchor
                    }
                },
                ticketmachines: {
                    zoom1: {
                        className: 'ticketmachines',
                        iconUrl: '/Resources/styles/leaflet/images/dot1_8x8px.png',
                        iconRetinaUrl: '/Resources/styles/leaflet/images/marker-icon.png',
                        //shadowUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        //shadowRetinaUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        iconSize: [8, 8], // size of the icon
                        //shadowSize: [41, 41], // size of the shadow
                        iconAnchor: [4, 8], // point of the icon which will correspond to marker's location
                        //shadowAnchor: [12, 40],  // the same for the shadow
                        popupAnchor: [0, -4] // point from which the popup should open relative to the iconAnchor
                    },
                    initial: {
                        className: 'ticketmachines',
                        iconUrl: '/Resources/styles/leaflet/images/tickets_25x41px.png',
                        iconRetinaUrl: '/Resources/styles/leaflet/images/tickets_50x81px.png',
                        //shadowUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        //shadowRetinaUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        iconSize: [25, 41], // size of the icon
                        //shadowSize: [41, 41], // size of the shadow
                        iconAnchor: [12, 40], // point of the icon which will correspond to marker's location
                        //shadowAnchor: [12, 40],  // the same for the shadow
                        popupAnchor: [0, -40] // point from which the popup should open relative to the iconAnchor
                    }
                },
                representatives: {
                    zoom1: {
                        className: 'representatives',
                        iconUrl: '/Resources/styles/leaflet/images/dot1_8x8px.png',
                        iconRetinaUrl: '/Resources/styles/leaflet/images/marker-icon.png',
                        //shadowUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        //shadowRetinaUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        iconSize: [8, 8], // size of the icon
                        //shadowSize: [41, 41], // size of the shadow
                        iconAnchor: [4, 8], // point of the icon which will correspond to marker's location
                        //shadowAnchor: [12, 40],  // the same for the shadow
                        popupAnchor: [0, -4] // point from which the popup should open relative to the iconAnchor
                    },
                    initial: {
                        className: 'representatives',
                        iconUrl: '/Resources/styles/leaflet/images/tickets_25x41px.png',
                        iconRetinaUrl: '/Resources/styles/leaflet/images/tickets_50x81px.png',
                        //shadowUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        //shadowRetinaUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        iconSize: [25, 41], // size of the icon
                        //shadowSize: [41, 41], // size of the shadow
                        iconAnchor: [12, 40], // point of the icon which will correspond to marker's location
                        //shadowAnchor: [12, 40],  // the same for the shadow
                        popupAnchor: [0, -40] // point from which the popup should open relative to the iconAnchor
                    }
                },
                combinedvendors: {
                    zoom1: {
                        className: 'combinedvendors',
                        iconUrl: '/Resources/styles/leaflet/images/marker-icon_13x21.png',
                        iconRetinaUrl: '/Resources/styles/leaflet/images/marker-icon.png',
                        //shadowUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        //shadowRetinaUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        iconSize: [13, 21], // size of the icon
                        //shadowSize: [41, 41], // size of the shadow
                        iconAnchor: [6, 20], // point of the icon which will correspond to marker's location
                        //shadowAnchor: [12, 40],  // the same for the shadow
                        popupAnchor: [0, -20] // point from which the popup should open relative to the iconAnchor
                    },
                    initial: {
                        className: 'combinedvendors',
                        iconUrl: '/Resources/styles/leaflet/images/marker-icon.png',
                        iconRetinaUrl: '/Resources/styles/leaflet/images/marker-icon@2x.png',
                        shadowUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        shadowRetinaUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        iconSize: [25, 41], // size of the icon
                        shadowSize: [41, 41], // size of the shadow
                        iconAnchor: [12, 40], // point of the icon which will correspond to marker's location
                        shadowAnchor: [12, 40],  // the same for the shadow
                        popupAnchor: [0, -40] // point from which the popup should open relative to the iconAnchor
                    }
                },
                multistation: {
                    zoom1: {
                        className: 'multistation',
                        iconUrl: '/Resources/styles/leaflet/images/plus_25x41px.png',
                        iconRetinaUrl: '/Resources/styles/leaflet/images/plus_50x81px.png',
                        //shadowUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        //shadowRetinaUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        iconSize: [25, 41], // size of the icon
                        //shadowSize: [41, 41], // size of the shadow
                        iconAnchor: [12, 40], // point of the icon which will correspond to marker's location
                        //shadowAnchor: [12, 40],  // the same for the shadow
                        popupAnchor: [0, -40] // point from which the popup should open relative to the iconAnchor
                    },
                    initial: {
                        className: 'multistation',
                        iconUrl: '/Resources/styles/leaflet/images/plus_25x41px.png',
                        iconRetinaUrl: '/Resources/styles/leaflet/images/plus_50x81px.png',
                        //shadowUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        //shadowRetinaUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        iconSize: [25, 41], // size of the icon
                        //shadowSize: [41, 41], // size of the shadow
                        iconAnchor: [12, 40], // point of the icon which will correspond to marker's location
                        //shadowAnchor: [12, 40],  // the same for the shadow
                        popupAnchor: [0, -40] // point from which the popup should open relative to the iconAnchor
                    }
                },
                hilightstation: {
                    zoom1: {
                        className: 'hilightstation',
                        iconUrl: '/Resources/styles/leaflet/images/marker-icon_13x21.png',
                        iconRetinaUrl: '/Resources/styles/leaflet/images/marker-icon.png',
                        //shadowUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        //shadowRetinaUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        iconSize: [13, 21], // size of the icon
                        //shadowSize: [41, 41], // size of the shadow
                        iconAnchor: [6, 20], // point of the icon which will correspond to marker's location
                        //shadowAnchor: [12, 40],  // the same for the shadow
                        popupAnchor: [0, -20] // point from which the popup should open relative to the iconAnchor
                    },
                    initial: {
                        className: 'hilightstation',
                        iconUrl: '/Resources/styles/leaflet/images/s_25x41px.png',
                        iconRetinaUrl: '/Resources/styles/leaflet/images/s_50x81px.png',
                        //shadowUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        //shadowRetinaUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        iconSize: [25, 41], // size of the icon
                        //shadowSize: [41, 41], // size of the shadow
                        iconAnchor: [12, 40], // point of the icon which will correspond to marker's location
                        //shadowAnchor: [12, 40],  // the same for the shadow
                        popupAnchor: [0, -40] // point from which the popup should open relative to the iconAnchor
                    }
                },
                commuterstation: {
                    zoom1: {
                        className: 'commuterstation',
                        iconUrl: '/Resources/styles/leaflet/images/j_25x41px.png',
                        iconRetinaUrl: '/Resources/styles/leaflet/images/j_50x81px.png',
                        //shadowUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        //shadowRetinaUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        iconSize: [25, 41], // size of the icon
                        //shadowSize: [41, 41], // size of the shadow
                        iconAnchor: [12, 40], // point of the icon which will correspond to marker's location
                        //shadowAnchor: [12, 40],  // the same for the shadow
                        popupAnchor: [0, -40] // point from which the popup should open relative to the iconAnchor
                    },
                    initial: {
                        className: 'commuterstation',
                        iconUrl: '/Resources/styles/leaflet/images/j_25x41px.png',
                        iconRetinaUrl: '/Resources/styles/leaflet/images/j_50x81px.png',
                        //shadowUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        //shadowRetinaUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        iconSize: [25, 41], // size of the icon
                        //shadowSize: [41, 41], // size of the shadow
                        iconAnchor: [12, 40], // point of the icon which will correspond to marker's location
                        //shadowAnchor: [12, 40],  // the same for the shadow
                        popupAnchor: [0, -40] // point from which the popup should open relative to the iconAnchor
                    }
                },
                metrostation: {
                    zoom1: {
                        className: 'metrostation',
                        iconUrl: '/Resources/styles/leaflet/images/t_25x41px.png',
                        iconRetinaUrl: '/Resources/styles/leaflet/images/t_50x81px.png',
                        //shadowUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        //shadowRetinaUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        iconSize: [13, 21], // size of the icon
                        //shadowSize: [41, 41], // size of the shadow
                        iconAnchor: [6, 20], // point of the icon which will correspond to marker's location
                        //shadowAnchor: [12, 40],  // the same for the shadow
                        popupAnchor: [0, -20] // point from which the popup should open relative to the iconAnchor
                    },
                    initial: {
                        className: 'metrostation',
                        iconUrl: '/Resources/styles/leaflet/images/t_25x41px.png',
                        iconRetinaUrl: '/Resources/styles/leaflet/images/t_50x81px.png',
                        //shadowUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        //shadowRetinaUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        iconSize: [25, 41], // size of the icon
                        //shadowSize: [41, 41], // size of the shadow
                        iconAnchor: [12, 40], // point of the icon which will correspond to marker's location
                        //shadowAnchor: [12, 40],  // the same for the shadow
                        popupAnchor: [0, -40] // point from which the popup should open relative to the iconAnchor
                    }
                },
                busstation: {
                    zoom1: {
                        className: 'busstation',
                        iconUrl: '/Resources/styles/leaflet/images/bu_25x41px.png',
                        iconRetinaUrl: '/Resources/styles/leaflet/images/bu_50x81px.png',
                        //shadowUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        //shadowRetinaUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        iconSize: [13, 21], // size of the icon
                        //shadowSize: [41, 41], // size of the shadow
                        iconAnchor: [6, 20], // point of the icon which will correspond to marker's location
                        //shadowAnchor: [12, 40],  // the same for the shadow
                        popupAnchor: [0, -20] // point from which the popup should open relative to the iconAnchor
                    },
                    initial: {
                        className: 'busstation',
                        iconUrl: '/Resources/styles/leaflet/images/bu_25x41px.png',
                        iconRetinaUrl: '/Resources/styles/leaflet/images/bu_50x81px.png',
                        //shadowUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        //shadowRetinaUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        iconSize: [25, 41], // size of the icon
                        //shadowSize: [41, 41], // size of the shadow
                        iconAnchor: [12, 40], // point of the icon which will correspond to marker's location
                        //shadowAnchor: [12, 40],  // the same for the shadow
                        popupAnchor: [0, -40] // point from which the popup should open relative to the iconAnchor
                    }
                },
                tramstation: {
                    zoom1: {
                        className: 'tramstation',
                        iconUrl: '/Resources/styles/leaflet/images/l_25x41px.png',
                        iconRetinaUrl: '/Resources/styles/leaflet/images/l_50x81px.png',
                        //shadowUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        //shadowRetinaUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        iconSize: [13, 21], // size of the icon
                        //shadowSize: [41, 41], // size of the shadow
                        iconAnchor: [6, 20], // point of the icon which will correspond to marker's location
                        //shadowAnchor: [12, 40],  // the same for the shadow
                        popupAnchor: [0, -20] // point from which the popup should open relative to the iconAnchor
                    },
                    initial: {
                        className: 'tramstation',
                        iconUrl: '/Resources/styles/leaflet/images/l_25x41px.png',
                        iconRetinaUrl: '/Resources/styles/leaflet/images/l_50x81px.png',
                        //shadowUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        //shadowRetinaUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        iconSize: [25, 41], // size of the icon
                        //shadowSize: [41, 41], // size of the shadow
                        iconAnchor: [12, 40], // point of the icon which will correspond to marker's location
                        //shadowAnchor: [12, 40],  // the same for the shadow
                        popupAnchor: [0, -40] // point from which the popup should open relative to the iconAnchor
                    }
                },
                station: {
                    zoom1: {
                        className: 'station',
                        iconUrl: '/Resources/styles/leaflet/images/marker-icon_13x21.png',
                        iconRetinaUrl: '/Resources/styles/leaflet/images/marker-icon.png',
                        //shadowUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        //shadowRetinaUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        iconSize: [13, 21], // size of the icon
                        //shadowSize: [41, 41], // size of the shadow
                        iconAnchor: [6, 20], // point of the icon which will correspond to marker's location
                        //shadowAnchor: [12, 40],  // the same for the shadow
                        popupAnchor: [0, -20] // point from which the popup should open relative to the iconAnchor
                    },
                    initial: {
                        className: 'station',
                        iconUrl: '/Resources/styles/leaflet/images/marker-icon.png',
                        iconRetinaUrl: '/Resources/styles/leaflet/images/marker-icon@2x.png',
                        shadowUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        shadowRetinaUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        iconSize: [25, 41], // size of the icon
                        shadowSize: [41, 41], // size of the shadow
                        iconAnchor: [12, 40], // point of the icon which will correspond to marker's location
                        shadowAnchor: [12, 40],  // the same for the shadow
                        popupAnchor: [0, -40] // point from which the popup should open relative to the iconAnchor
                    }
                },
                substation: {
                    zoom1: {
                        className: 'substation',
                        iconUrl: '/Resources/styles/leaflet/images/marker-icon_13x21.png',
                        iconRetinaUrl: '/Resources/styles/leaflet/images/marker-icon.png',
                        //shadowUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        //shadowRetinaUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        iconSize: [13, 21], // size of the icon
                        //shadowSize: [41, 41], // size of the shadow
                        iconAnchor: [6, 20], // point of the icon which will correspond to marker's location
                        //shadowAnchor: [12, 40],  // the same for the shadow
                        popupAnchor: [0, -20] // point from which the popup should open relative to the iconAnchor
                    },
                    initial: {
                        className: 'substation',
                        iconUrl: '/Resources/styles/leaflet/images/change_25x41px.png',
                        iconRetinaUrl: '/Resources/styles/leaflet/images/change_50x81px.png',
                        //shadowUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        //shadowRetinaUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        iconSize: [25, 41], // size of the icon
                        //shadowSize: [41, 41], // size of the shadow
                        iconAnchor: [12, 40], // point of the icon which will correspond to marker's location
                        //shadowAnchor: [12, 40],  // the same for the shadow
                        popupAnchor: [0, -40] // point from which the popup should open relative to the iconAnchor
                    }
                },
                tripstations: {
                    zoom1: {
                        className: 'tripstations',
                        iconUrl: '/Resources/styles/leaflet/images/marker-icon_13x21.png',
                        iconRetinaUrl: '/Resources/styles/leaflet/images/marker-icon.png',
                        //shadowUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        //shadowRetinaUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        iconSize: [13, 21], // size of the icon
                        //shadowSize: [41, 41], // size of the shadow
                        iconAnchor: [6, 20], // point of the icon which will correspond to marker's location
                        //shadowAnchor: [12, 40],  // the same for the shadow
                        popupAnchor: [0, -20] // point from which the popup should open relative to the iconAnchor
                    },
                    initial: {
                        className: 'tripstations',
                        iconUrl: '/Resources/styles/leaflet/images/s_25x41px.png',
                        iconRetinaUrl: '/Resources/styles/leaflet/images/s_50x81px.png',
                        //shadowUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        //shadowRetinaUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        iconSize: [25, 41], // size of the icon
                        //shadowSize: [41, 41], // size of the shadow
                        iconAnchor: [12, 40], // point of the icon which will correspond to marker's location
                        //shadowAnchor: [12, 40],  // the same for the shadow
                        popupAnchor: [0, -40] // point from which the popup should open relative to the iconAnchor
                    }
                },
                myposition: {
                    zoom1: {
                        className: 'myposition',
                        iconUrl: '/Resources/styles/leaflet/images/marker-icon_13x21.png',
                        iconRetinaUrl: '/Resources/styles/leaflet/images/marker-icon.png',
                        //shadowUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        //shadowRetinaUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        iconSize: [13, 21], // size of the icon
                        //shadowSize: [41, 41], // size of the shadow
                        iconAnchor: [6, 20], // point of the icon which will correspond to marker's location
                        //shadowAnchor: [12, 40],  // the same for the shadow
                        popupAnchor: [0, -20] // point from which the popup should open relative to the iconAnchor
                    },
                    initial: {
                        className: 'myposition',
                        iconUrl: '/Resources/styles/leaflet/images/me_25x41px.png',
                        iconRetinaUrl: '/Resources/styles/leaflet/images/me_50x81px.png',
                        //shadowUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        //shadowRetinaUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        iconSize: [25, 41], // size of the icon
                        //shadowSize: [41, 41], // size of the shadow
                        iconAnchor: [12, 41], // point of the icon which will correspond to marker's location
                        //shadowAnchor: [12, 40],  // the same for the shadow
                        popupAnchor: [0, -40] // point from which the popup should open relative to the iconAnchor
                    }
                },
                start: {
                    zoom1: {
                        className: 'start',
                        iconUrl: '/Resources/styles/leaflet/images/a_12x20px.png',
                        iconRetinaUrl: '/Resources/styles/leaflet/images/marker-icon.png',
                        //shadowUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        //shadowRetinaUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        iconSize: [13, 21], // size of the icon
                        //shadowSize: [41, 41], // size of the shadow
                        iconAnchor: [6, 20], // point of the icon which will correspond to marker's location
                        //shadowAnchor: [12, 40],  // the same for the shadow
                        popupAnchor: [0, -20] // point from which the popup should open relative to the iconAnchor
                    },
                    initial: {
                        className: 'start',
                        iconUrl: '/Resources/styles/leaflet/images/a_50x81px.png',
                        iconRetinaUrl: '/Resources/styles/leaflet/images/a_50x81px.png',
                        //shadowUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        //shadowRetinaUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        iconSize: [50, 81], // size of the icon
                        //shadowSize: [41, 41], // size of the shadow
                        iconAnchor: [25, 80], // point of the icon which will correspond to marker's location
                        //shadowAnchor: [12, 40],  // the same for the shadow
                        popupAnchor: [0, -80] // point from which the popup should open relative to the iconAnchor
                    }
                },
                end: {
                    zoom1: {
                        className: 'end',
                        iconUrl: '/Resources/styles/leaflet/images/b_12x20px.png',
                        iconRetinaUrl: '/Resources/styles/leaflet/images/marker-icon.png',
                        //shadowUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        //shadowRetinaUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        iconSize: [13, 21], // size of the icon
                        //shadowSize: [41, 41], // size of the shadow
                        iconAnchor: [6, 20], // point of the icon which will correspond to marker's location
                        //shadowAnchor: [12, 40],  // the same for the shadow
                        popupAnchor: [0, -20] // point from which the popup should open relative to the iconAnchor
                    },
                    initial: {
                        className: 'end',
                        iconUrl: '/Resources/styles/leaflet/images/b_50x81px.png',
                        iconRetinaUrl: '/Resources/styles/leaflet/images/b_50x81px.png',
                        //shadowUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        //shadowRetinaUrl: '/Resources/styles/leaflet/images/marker-shadow.png',
                        iconSize: [50, 81], // size of the icon
                        //shadowSize: [41, 41], // size of the shadow
                        iconAnchor: [25, 80], // point of the icon which will correspond to marker's location
                        //shadowAnchor: [12, 40],  // the same for the shadow
                        popupAnchor: [0, -80] // point from which the popup should open relative to the iconAnchor
                    }
                }
            };
        });
    });