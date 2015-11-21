var realTimeSearchModule = angular.module('slapp.googleMap', ['ngResource', 'slapp.googleMap.controllers', 'slapp.googleMap.directives', 'slapp.googleMap.factories', 'slapp.googleMap.services'], function ($locationProvider) {
    $locationProvider.hashPrefix('');
}).run(function ($rootScope) {

});

angular.module('slapp.googleMap.directives', []);

angular.module('slapp.googleMap.factories', [])

    .factory("externalModel", ["$http", "$timeout", "urlprovider", "latestSearch", "$location", function ($http, $timeout, urlprovider, latestSearch, $location) {

        var externalModel = {
            store: {
                myposition: {},
                trip: [],
                realtime: {},
                nearbystations: {}
            },
            states: {
                myposition: {
                    loaded: false
                },
                nearbystations: {
                    loaded: false
                },
                trip: {
                    loaded: false
                },
                realtime: {
                    loaded: false
                },
                mapInit: {
                    loaded: false
                }
            },
            cleaner: function (types) {
                $.each(types, function (e, a) {
                    if (a === "myposition") {
                        externalModel.store.myposition = {};
                        externalModel.store.nearbystations = [];
                        externalModel.states.myposition.loaded = false;
                        externalModel.states.nearbystations.loaded = false;
                    }
                    if (a === "trip") {
                        externalModel.store.trip.markers = [];
                        externalModel.store.trip.paths = [];
                        externalModel.store.trip = [];
                        externalModel.states.trip.loaded = false;
                    }
                    if (a === "realtime") {
                        externalModel.store.realtime = {};
                        externalModel.states.realtime.loaded = false;
                    }
                });
            }
        };

        externalModel.RealtimeMarkerClick = function (marker, $scope) {

            var name = marker.name,
                    siteid = marker.SiteId;
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
            $scope.$apply();

        };

        externalModel.mypositionHandler = function (data, lat, lng) {

            externalModel.cleaner(["trip", "realtime"]);
            data = data.data;
            var points = [];

            $.each(data, function (i, obj) {
                points.push({
                    Distance: obj.Distance,
                    Id: obj.Id,
                    SiteId: obj.SiteId,
                    Name: obj.Name,
                    Lat: obj.Latitude,
                    Lon: obj.Longitude,
                    Traffictypes: obj.TrafficTypeList
                });
            });

            externalModel.store.nearbystations = points;
            externalModel.states.nearbystations.loaded = true;

            if (typeof (lat) !== 'undefined' && typeof (lng) !== 'undefined') { // Adds a "My position" marker to the map
                externalModel.store.myposition = { lat: lat, lon: lng };
                externalModel.states.myposition.loaded = true;

            }
        };
        externalModel.tripHandler = function (data) {
            externalModel.cleaner(["myposition", "realtime", "trip"]);
            var tripsMarkerArr = [];
            var tripsPathsArr = [];
            var trips = data.Trips;

            function IsUniqueTripMarker(arr, marker) {
                if (arr.length > 0) {
                    for (var i = 0; i < arr.length; i++) {
                        if (arr[i].Lat === marker.Lat && arr[i].Lon === marker.Lon && arr[i].icontype === marker.icontype && arr[i].text === marker.text) {
                            return false;
                        }
                    }
                    return true;
                } else {
                    return true;
                }
            };

            $.each(trips, function (i, a) {

                var trip = [];
                var start = { title: a.Origin, Lat: a.OriginLatitude, Lon: a.OriginLongitude, icontype: "start" };
                var destination = { title: a.Destination, Lat: a.DestinationLatitude, Lon: a.DestinationLongitude, icontype: "destination" };
                if (a.SubTrips[0].Origin !== a.Origin) {
                    trip.push({ title: a.SubTrips[0].Origin, Lat: a.SubTrips[0].OriginLatitude, Lon: a.SubTrips[0].OriginLongitude, icontype: "start" });
                    start.Lat = a.SubTrips[0].DestinationLatitude;
                    start.Lon = a.SubTrips[0].DestinationLongitude;
                }
                trip.push(start);

                $.each(a.SubTrips, function (u, b) {

                    $.each(b.IntermediateStops, function (o, c) {
                        trip.push({ title: c.Name, Lat: c.Lat, Lon: c.Lon, icontype: b.TransportSymbol });
                    });
                    if (b.Destination !== a.SubTrips[a.SubTrips.length - 1].Destination) {
                        trip.push({ title: b.Destination, Lat: b.DestinationLatitude, Lon: b.DestinationLongitude, icontype: "change" });
                    }

                });

                if (a.SubTrips[a.SubTrips.length - 1].Destination !== a.Destination) {
                    trip.push({ title: a.SubTrips[a.SubTrips.length - 1].Destination, Lat: a.SubTrips[a.SubTrips.length - 1].DestinationLatitude, Lon: a.SubTrips[a.SubTrips.length - 1].DestinationLongitude, icontype: "destination" });
                } else {
                    trip.push(destination);
                }

                tripsPathsArr.push(trip);
            });

            $.each(trips, function (i, a) {

                var start = {
                    title: a.SubTrips[0].Origin,
                    Lat: a.SubTrips[0].OriginLatitude,
                    Lon: a.SubTrips[0].OriginLongitude,
                    icontype: "start",
                    text: a.SubTrips[0].TransportText,
                    trip: i
                };

                if (IsUniqueTripMarker(tripsMarkerArr, start)) {
                    tripsMarkerArr.push(start);
                }
            });

            $.each(trips, function (i, a) {

                $.each(a.SubTrips, function (u, b) {
                    $.each(b.IntermediateStops, function (o, c) {
                        var betweenStn = { title: c.Name, Lat: c.Lat, Lon: c.Lon, icontype: b.TransportSymbol, trip: i };
                        if (IsUniqueTripMarker(tripsMarkerArr, betweenStn)) {
                            tripsMarkerArr.push(betweenStn);
                        }
                    });
                    if (a.SubTrips[a.SubTrips.length - 1].Destination !== b.Destination) {
                        var change = { title: b.Destination, Lat: b.DestinationLatitude, Lon: b.DestinationLongitude, icontype: "change", trip: i };
                        if (IsUniqueTripMarker(tripsMarkerArr, change)) {
                            tripsMarkerArr.push(change);
                        }
                    }
                });

                var destination = { title: a.SubTrips[a.SubTrips.length - 1].Destination, Lat: a.SubTrips[a.SubTrips.length - 1].DestinationLatitude, Lon: a.SubTrips[a.SubTrips.length - 1].DestinationLongitude, icontype: "destination", text: a.SubTrips[a.SubTrips.length - 1].TransportText, trip: i };
                if (IsUniqueTripMarker(tripsMarkerArr, destination)) {
                    tripsMarkerArr.push(destination);
                }
            });
            externalModel.store.trip.markers = [tripsMarkerArr];
            externalModel.store.trip.paths = tripsPathsArr;
            externalModel.states.trip.loaded = true;

        };

        externalModel.realtimeHandler = function (data) {
            externalModel.cleaner(["trip", "myposition"]);
            //REALTIMEHANDLER
            data = data.data;
            var transports = [];

            if (typeof (data.MetroRedGroups) !== "undefined") {
                $.each(data.MetroRedGroups, function (i, obj) {
                    transports.push(obj.Departures);
                });
            }
            if (typeof (data.MetroGreenGroups) !== "undefined") {
                $.each(data.MetroGreenGroups, function (i, obj) {
                    transports.push(obj.Departures);
                });
            }
            if (typeof (data.MetroBlueGroups) !== "undefined") {
                $.each(data.MetroBlueGroups, function (i, obj) {
                    transports.push(obj.Departures);
                });
            }
            if (typeof (data.TramTypes) !== "undefined") {
                $.each(data.TramTypes, function (i, obj) {
                    $.each(obj.TramGroups, function (u, a) {
                        transports.push(a.Departures);
                    });
                });
            }
            if (typeof (data.BusGroups) !== "undefined") {
                $.each(data.BusGroups, function (i, obj) {
                    transports.push(obj.Departures);
                });
            }
            if (typeof (data.TrainGroups) !== "undefined") {
                $.each(data.TrainGroups, function (i, obj) {
                    transports.push(obj.Departures);
                });
            }


            externalModel.store.realtime = transports;
            externalModel.states.realtime.loaded = true;

        };

        return externalModel;

    } ]);


    // GOOGLE MAP

    angular.module('slapp.googleMap.controllers', [])
    .controller("GoogleMap", ["$scope", "$http", "$location", "externalModel", '$rootScope', function ($scope, $http, $location, externalModel, $rootScope) {

        $scope.googleMapsApiUrl = "";

        $scope.$watch("googleMapsApiUrl", function (newUrl) {
            if ($rootScope.isMapLoaded) {
                initializeMap();
                return;
            }
            $rootScope.isMapLoaded = true;

            var scriptTag = document.createElement('script');

            scriptTag.type = 'text/javascript';

            scriptTag.src = newUrl;

            document.body.appendChild(scriptTag);
        });
        // Make string capitalized

        String.prototype.capitalize = function () {
            return this.charAt(0).toUpperCase() + this.slice(1);
        };

        // END OF POLYFILLS

        //
        //                  @ GOOGLE MAP 
        //

        window.initializeMap = function () {
            initializeMap();
        };

        function initializeMap() {
            var $map, states = {}, store, icons, clusters, isiPad = (navigator.platform.indexOf("iPad") != -1);


            // STORE 
            // Vendors: store.vendors.ticketMachines 
            // Stations: store.stations
            // Trips: store.trips

            store = {
                vendors: {
                    TicketMachines: [],
                    Representatives: [],
                    Resellers: []
                },
                parking: {
                    all: []
                },
                stations: {
                    all: [],
                    nearby: [],
                    realtime: []
                },
                infowindows: [],
                other: {
                    myposition: []
                },
                trips: {
                    stations: [],
                    paths: []
                },
                cleaner: function (types) {
                    $.each(types, function (u, a) {
                        if (a == "nearby") {
                            store.stations.nearby = [];
                            store.other.myposition = [];
                            states.markers.nearby.loaded = false;
                            states.markers.nearby.visible = false;
                            states.markers.myposition.loaded = false;
                            states.markers.myposition.visible = false;
                        }
                        if (a == "realtime") {
                            store.stations.realtime = [];
                            states.markers.realtime.loaded = false;
                            states.markers.realtime.visible = false;
                        }
                        if (a == "trips") {
                            store.trips.stations = [];
                            store.trips.paths = [];
                            states.markers.travel.loaded = false;
                            states.markers.travel.visible = false;
                        }
                        if (a == "stations") {
                            store.stations.all = [];
                            states.markers.stations.loaded = false;
                            states.markers.stations.visible = false;
                        }
                        if (a == "vendors") {
                            store.vendors.TicketMachines = [];
                            store.vendors.Representatives = [];
                            store.vendors.Resellers = [];
                            states.markers.vendors.loaded = false;
                            states.markers.vendors.visible = false;
                        }
                        if (a == "parking") {
                            store.parking.all = [];
                            states.markers.parking.loaded = false;
                            states.markers.parking.visible = false;
                        }
                    });
                }
            };

            // MAP States. Markers, paths and zones

            states = $.extend(states, {
                zoomLevel: 0,
                map: {
                    main: { loaded: false, visible: false }
                },
                markers: {
                    stations: { loaded: false, visible: false },
                    myposition: { loaded: false, visible: false },
                    vendors: { loaded: false, visible: false },
                    parking: { loaded: false, visible: false },
                    travel: { loaded: false, visible: false },
                    nearby: { loaded: false, visible: false },
                    realtime: { loaded: false, visible: false }
                },
                paths: {
                    travel: { loaded: false, visible: false }
                },
                zones: {
                    ticket: { loaded: false, visible: false }
                }
            });

            var iconBase = "/Resources/styles/leaflet/images/";

            icons = {
                trip: {
                    start: {
                        icon: {
                            url: iconBase + 'a_50x81px.png',
                            shadow: iconBase + 'marker-shadow.png'
                        }
                    },
                    destination: {
                        icon: {
                            url: iconBase + 'b_50x81px.png',
                            shadow: iconBase + 'marker-shadow.png'
                        }
                    },
                    stations: {
                        icon: {
                            url: iconBase + 'dot2.png',
                            anchor: new google.maps.Point(11, 11)
                        }
                    },
                    stationsActive: {
                        icon: iconBase + 'dot1.png'
                    },
                    change: {
                        icon: iconBase + 'change_25x41px.png',
                        shadow: iconBase + 'marker-shadow.png'
                    }
                },
                vendors: {
                    large: {
                        icon: iconBase + 'tickets_50x81px.png',
                        shadow: iconBase + 'marker-shadow.png'
                    },
                    normal: {
                        icon: iconBase + 'tickets_25x41px.png',
                        shadow: iconBase + 'marker-shadow.png'
                    }
                },
                vendors_1: {
                    large: {
                        icon: iconBase + 'tickets1_50x81px.png',
                        shadow: iconBase + 'marker-shadow.png'
                    },
                    normal: {
                        icon: iconBase + 'tickets1_25x41px.png',
                        shadow: iconBase + 'marker-shadow.png'
                    }
                },
                vendors_2: {
                    large: {
                        icon: iconBase + 'tickets2_50x81px.png',
                        shadow: iconBase + 'marker-shadow.png'
                    },
                    normal: {
                        icon: iconBase + 'tickets2_25x41px.png',
                        shadow: iconBase + 'marker-shadow.png'
                    }
                },
                vendors_3: {
                    large: {
                        icon: iconBase + 'tickets3_50x81px.png',
                        shadow: iconBase + 'marker-shadow.png'
                    },
                    normal: {
                        icon: iconBase + 'tickets3_25x41px.png',
                        shadow: iconBase + 'marker-shadow.png'
                    }
                },
                parking: {
                    large: {
                        icon: iconBase + 'p_50x81px.png',
                        shadow: iconBase + 'marker-shadow.png'
                    },
                    normal: {
                        icon: iconBase + 'p_25x41px.png',
                        shadow: iconBase + 'marker-shadow.png'
                    }
                },
                other: {
                    myposition: {
                        icon: iconBase + 'me_25x41px.png',
                        shadow: iconBase + 'marker-shadow.png'
                    }
                },
                stations: {
                    buses: {
                        icon: iconBase + 'bu_25x41px.png',
                        shadow: iconBase + 'marker-shadow.png'
                    },
                    metro: {
                        icon: iconBase + 't_25x41px.png',
                        shadow: iconBase + 'marker-shadow.png'
                    },
                    tram: {
                        icon: iconBase + 'l_25x41px.png',
                        shadow: iconBase + 'marker-shadow.png'
                    },
                    boat: {
                        icon: iconBase + 'bo_25x41px.png',
                        shadow: iconBase + 'marker-shadow.png'
                    },
                    lightrail: {
                        icon: iconBase + 's_25x41px.png',
                        shadow: iconBase + 'marker-shadow.png'
                    },
                    commuter: {
                        icon: iconBase + 'j_25x41px.png',
                        shadow: iconBase + 'marker-shadow.png'
                    },
                    multi: {
                        icon: iconBase + 'plus_25x41px.png',
                        shadow: iconBase + 'marker-shadow.png'
                    }
                },
                cluster: {
                    normal: {
                        gridSize: 50,
                        maxZoom: 12,
                        styles: [{
                            opt_textColor: 'white',
                            url: iconBase + 'kluster.png',
                            height: 30,
                            width: 30
                        }, {
                            opt_textColor: 'white',
                            url: iconBase + 'kluster.png',
                            height: 30,
                            width: 30
                        }, {
                            opt_textColor: 'white',
                            url: iconBase + 'kluster.png',
                            height: 30,
                            width: 30
                        }, {
                            opt_textColor: 'white',
                            url: iconBase + 'kluster.png',
                            height: 30,
                            width: 30
                        }, {
                            opt_textColor: 'white',
                            url: iconBase + 'kluster.png',
                            height: 30,
                            width: 30
                        }]
                    }
                }
            };
            // Define 
            clusters = {};

            // OPTION Class. Default options.
            // @ Factory.defaults, default settings for map
            // @ Factory.hideDefaults, object of types to be hidden

            function Options() {
            }

            Options.prototype.defaults = function () {
                var options = {
                    center: new google.maps.LatLng("59.32893", "18.06491"),
                    zoom: 10,
                    minZoom: 9,
                    rotateControl: false,
                    panControl: false,
                    zoomControl: true,
                    zoomControlOptions: {
                        style: google.maps.ZoomControlStyle.SMALL,
                        position: google.maps.ControlPosition.LEFT_TOP
                    },
                    scrollwheel: true,
                    navigationControl: false,
                    mapTypeControl: false,
                    scaleControl: false,
                    draggable: true,
                    streetViewControl: false,
                    mapTypeId: google.maps.MapTypeId.HYBRID
                };
                return options;
            };

            Options.prototype.hideDefaults = function () {

                var noTransitStationsStyle = {
                    featureType: 'transit.station',
                    elementType: 'all',
                    stylers: [
                        { visibility: 'off' }
                    ]
                };
                var noRoadStyle = {
                    featureType: "road.highway",
                    elementType: 'all',
                    stylers: [
                        { visibility: 'off' }
                    ]
                };
                var noPoiStyle = {
                    featureType: "poi",
                    elementType: "all",
                    stylers: [
                        { visibility: 'off' }
                    ]
                };
                var noHighwayStyle = {
                    featureType: "road.highway",
                    elementType: 'all',
                    stylers: [
                        { visibility: 'on' }
                    ]
                };
                var noLandscapeStyle = {
                    featureType: "landscape",
                    elementType: "all",
                    stylers: [
                        { visibility: 'off' }
                    ]
                };
                var hideDefaults = [
                    noTransitStationsStyle,
                    noPoiStyle,
                    noHighwayStyle
                ];

                return hideDefaults;

            };

            // @ Common METHODS Class

            function CommonMethods() {
            }

            CommonMethods.prototype.translateStations = function (arr) {
                var fullNames = [];
                $.each(arr, function (i, obj) {
                    if (obj === "TRN") {
                        fullNames.push(mapVars.commuter);
                    }
                    if (obj === "BUS") {
                        fullNames.push(mapVars.bus);
                    }
                    if (obj === "FER") {
                        fullNames.push(mapVars.ferries);
                    }
                    if (obj === "MET") {
                        fullNames.push(mapVars.metro);
                    }
                    if (obj === "TRL") {
                        fullNames.push(mapVars.tram);
                    }
                    if (obj === "TRM") {
                        fullNames.push(mapVars.lightrail);
                    }
                });
                return fullNames;
            };

            CommonMethods.prototype.watchZoomLevels = function () {
                if (states.zoomLevel >= 9) {
                    return true;
                }
                return false;
            };

            CommonMethods.prototype.getTrafficTypesByZoomAndWidth = function (zoomLvl) {
                var zoomLvls = [];

                if (zoomLvl >= 9) {
                    zoomLvls.push(1);
                    zoomLvls.push(32);
                }
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

            var CommonMethods = new CommonMethods();

            // POLYGON/POLYLINE Creater 

            function Polygon(cords, opt) { // For creating ex. Zones
                var polyopt = opt;
                polyopt.paths = cords;
                return new google.maps.Polygon(polyopt);
            }

            function Polyline(cords, opt) { // For creating ex. Trip paths
                var polyopt = opt;
                polyopt.path = cords;
                return new google.maps.Polyline(polyopt);
            }

            // CONTROLLER Class. Take controll over what should be shown on the map. ps. Not made in china
            // @ Factory.markers, creates marker based on type and markers.
            // @ Factory.paths, creates paths based on markers
            // @ Factory.zones, creates zones based on type and markers 

            function Controller() {
                this.$controllPanel = $(".controllPanel");
            }

            Controller.prototype.toggleParking = function () {

                if (!states.markers.parking.loaded) {
                    Fetcher.getParkings();
                }

                if (!states.markers.parking.visible) {
                    var arr = [];

                    for (var i = 0; i < store.parking.all.length; i++) {
                        arr.push(store.parking.all[i]);
                    }

                    clusters.parking.addMarkers(arr); // This makes vendor and parking cluster seperated
                    // To make them combined, change parking to vendors
                    // And Create a cluster named vendors
                } else {
                    clusters.parking.clearMarkers();
                }
                states.markers.parking.visible = !states.markers.parking.visible;
            };
            Controller.prototype.toggleStations = function () {

                if (!states.markers.stations.loaded) {
                    Fetcher.getStations();
                }
                if (!states.markers.stations.visible) {
                    $.each(store.stations.all, function (u, a) {
                        a.setMap($map);
                    });
                } else {
                    $.each(store.stations.all, function (u, a) {
                        a.setMap(null);
                    });
                }
                states.markers.stations.visible = !states.markers.stations.visible;
            };

            // @TOGGLE zones
            // if zones is loaded toggle zones
            //

            Controller.prototype.toggleZones = function () {

                if (!states.zones.ticket.loaded) {
                    Fetcher.getZones();
                }
                if (!states.zones.ticket.visible) {
                    $.each(store.zones, function (i, obj) {
                        var zone = obj.Polygon;
                        zone.setMap($map);
                    });
                } else {
                    $.each(store.zones, function (i, obj) {
                        var zone = obj.Polygon;
                        zone.setMap(null);
                    });
                }
                $(".indicators").toggle();
                states.zones.ticket.visible = !states.zones.ticket.visible;
            };

            // @TOGGLE myposition
            // if my position is loaded toggle the marker

            Controller.prototype.toggleMyPosition = function () {

                if (!states.markers.myposition.loaded) {
                    Factory.markers({ "MyPosition": externalModel.store.myposition });
                    states.markers.myposition.loaded = true;
                }
                if (!states.markers.myposition.visible) {
                    $.each(store.other.myposition, function (u, a) {
                        a.setMap($map);
                    });
                    states.markers.myposition.visible = true;
                } else {
                    $.each(store.other.myposition, function (u, a) {
                        a.setMap(null);
                    });
                    states.markers.myposition.visible = false;
                }
            };

            // @TOGGLE nearby stations
            // if nearby stations is loaded toggle the markers

            Controller.prototype.toggleNearbyStations = function () {
                // Clean store before populating
                store.cleaner(["trips", "nearby", "realtime"]);

                if (!states.markers.nearby.loaded) {
                    Factory.markers({ "NearbyStations": externalModel.store.nearbystations });
                    states.markers.nearby.loaded = true;
                }

                if (!states.markers.nearby.visible) {
                    $.each(store.stations.nearby, function (u, a) {
                        a.setMap($map);
                    });
                    var boundsArr = [];
                    $.each(externalModel.store.nearbystations, function (y, b) {
                        boundsArr.push(Factory.latLng(b.Lat, b.Lon));
                    });
                    mapMethods.setBounds(boundsArr);
                    states.markers.nearby.visible = true;
                } else {
                    $.each(store.stations.nearby, function (u, a) {
                        a.setMap(null);
                    });
                    states.markers.nearby.visible = false;
                }
            };

            // @TOGGLE Realtime
            // if realtime is loaded toggle the markers

            Controller.prototype.toggleRealtime = function () {
                // Clean store before populating
                store.cleaner(["trips", "nearby", "realtime"]);

                if (!states.markers.realtime.loaded) {
                    Factory.markers({ "Realtime": externalModel.store.realtime });
                    states.markers.nearby.loaded = true;
                }

                if (!states.markers.realtime.visible) {
                    $.each(store.stations.realtime, function (u, a) {
                        a.setMap($map);
                    });
                    var boundsArr = [];
                    $.each(externalModel.store.realtime, function (y, b) {
                        boundsArr.push(Factory.latLng(b.Lat, b.Lon));
                    });
                    mapMethods.setBounds(boundsArr);
                    states.markers.realtime.visible = true;
                } else {
                    $.each(store.stations.realtime, function (u, a) {
                        a.setMap(null);
                    });
                    states.markers.realtime.visible = false;
                }
            };

            // @TOGGLE trip path
            // if trip path is loaded toggle the paths

            Controller.prototype.toggleTripPath = function () {
                if (!states.paths.travel.loaded) {
                    Factory.paths({ "TripPath": externalModel.store.trip.paths });
                    states.paths.travel.loaded = true;
                }
                if (!states.paths.travel.visible) {
                    var boundsArr = [];
                    $.each(store.trips.paths, function (u, a) {
                        a.setMap($map);
                    });

                    mapMethods.setCurrentPath(store.trips.paths[0]);

                    $.each(externalModel.store.trip.paths, function (y, b) {
                        $.each(b, function (m, c) {
                            boundsArr.push(Factory.latLng(c.Lat, c.Lon));
                        });
                    });

                    mapMethods.setBounds(boundsArr);
                    states.markers.travel.visible = true;
                } else {
                    $.each(store.trips.paths, function (u, a) {
                        a.setMap(null);
                    });
                    states.markers.travel.visible = false;
                }
                states.paths.travel.visible = !states.paths.travel.visible;
            };

            // @TOGGLE trip stations
            // if trip stations is loaded toggle the markers

            Controller.prototype.toggleTripStations = function () {

                store.cleaner(["trips", "nearby", "realtime"]);

                if (!states.markers.travel.loaded) {
                    Factory.markers({ "TripStations": externalModel.store.trip.markers });
                    states.markers.travel.loaded = true;
                }

                if (!states.markers.travel.visible) {
                    var arr = [];
                    $.each(store.trips.stations, function (u, a) {
                        clusters.travel.addMarker(a);
                    });
                    clusters.travel.setMaxZoom(11);

                } else {
                    clusters.travel.clearMarkers();
                }
                states.markers.travel.visible = !states.markers.travel.visible;
            };

            // @TOGGLE Vendor
            // if vendors is loaded toggle vendors
            //

            Controller.prototype.toggleVendors = function () {
                if (!states.markers.vendors.loaded) {
                    Fetcher.getVendors();
                }
                if (!states.markers.vendors.visible) {
                    var arr = [];

                    for (var i = 0; i < store.vendors.Representatives.length; i++) {
                        arr.push(store.vendors.Representatives[i]);
                    }

                    for (var i = 0; i < store.vendors.Resellers.length; i++) {
                        arr.push(store.vendors.Resellers[i]);
                    }

                    for (var i = 0; i < store.vendors.TicketMachines.length; i++) {
                        arr.push(store.vendors.TicketMachines[i]);
                    }

                    clusters.vendors.setMaxZoom(14);
                    clusters.vendors.addMarkers(arr);
                } else {
                    clusters.vendors.clearMarkers();
                }
                states.markers.vendors.visible = !states.markers.vendors.visible;
            };

            // @UNTOGGLE All markers
            // Not my position or nearby stations or trip

            Controller.prototype.untoggleAll = function (except) {
                var self = this, exeption = (typeof (except) !== "undefined") ? except : "";
                if (states.zones.ticket.visible) {
                    self.toggleZones();
                }
                $.each(states.markers, function (i, a) {
                    if (i !== "travel" && i !== "nearby" && i !== "myposition" && i !== exeption) {
                        if (a.visible) {
                            var toggleWhat = "toggle" + i.capitalize();
                            self[toggleWhat]();
                        }
                    }
                });

                self.$controllPanel.find("input").each(function () {
                    $(this).removeClass("checked");
                });

            };

            // PARSER Class. Transform json to complete object. 
            // @ Stations parser
            // @ Zones parser
            // @ Vendors parser

            function Parser() {
            }

            Parser.prototype.zones = function (json) {

                var zones = [];
                json = json.data;
                $.each(json.features, function (i, obj) {

                    var zone, cords = [], opt = $.extend({}, obj.properties.style);

                    if (typeof obj.zone != "undefined") {
                        zone = obj.zone;
                    } else {
                        zone = obj.properties.zone;
                    }

                    if (obj.geometry.coordinates.length === 2) {
                        obj.geometry.coordinates[1] = obj.geometry.coordinates[1].reverse();
                    }

                    $.each(obj.geometry.coordinates, function (e, a) {
                        $.each(a, function (u, b) {
                            var cord = new google.maps.LatLng(b[1], b[0]);
                            cords.push(cord);
                        });
                    });

                    var polygon = Polygon(cords, opt);
                    zones.push({ "Zone": zone, "Polygon": polygon });
                });
                return zones;
            };

            Parser.prototype.parkings = function (json) {
                json = json.data;
                var parking = { "Parking": json.List };
                return Factory.markers(parking);
            };

            Parser.prototype.stations = function (json) {
                var stations = { "Stations": json.data };
                return Factory.markers(stations);
            };

            Parser.prototype.vendors = function (json) {
                json = json.data;
                return Factory.markers(json);
            };

            var parser = new Parser();

            // FACTORY Class. Where magic happens. ps. Not made in china
            // @ Factory.markers, creates marker based on type and markers.
            // @ Factory.paths, creates paths based on markers
            // @ Factory.zones, creates zones based on type and markers 

            function Factory() {

                this.latLng = function (lat, lng) {
                    return new google.maps.LatLng(lat, lng);
                };
                this.marker = function (markerOpt) {
                    return new google.maps.Marker(markerOpt);
                };
                this.infobox = function (content) {
                    return new google.maps.InfoWindow({ content: content });
                };
                this.path = function (cordsArr, pathOpt) {
                    var polyopt = pathOpt;
                    polyopt.path = cordsArr;
                    return new google.maps.Polyline(polyopt);
                };
            }

            // @ Factory.markers, creates marker based on type and markers.
            Factory.prototype.markers = function (blueprints) {

                //store.markers
                $.each(blueprints, function (i, obj) {
                    switch (i) {
                        case 'TicketMachines':
                            $.each(obj, function (u, a) {
                                var latLng = new google.maps.LatLng(a.Lat, a.Lon);
                                var iconOpt = $.extend({}, icons.vendors_1.normal, { position: latLng });
                                var newMarker = Factory.marker(iconOpt);
                                var info = Factory.infobox("<h3 class='noscrollbar'>" + a.Location + "<br /><b><small>" + mapVars.ticketmachine + "</small></b></h3>");
                                info.infoopen = false;
                                store.vendors.TicketMachines.push(newMarker);
                                google.maps.event.addListener(newMarker, 'click', function () {
                                    if (info.infoopen) {
                                        info.close();
                                    } else {
                                        info.open($map, newMarker);
                                        store.infowindows.push(info);
                                    }
                                    info.infoopen = !info.infoopen;
                                });
                            });

                            break;
                        case 'MyPosition':
                            var latLng = new google.maps.LatLng(blueprints[i].lat, blueprints[i].lon);
                            var iconOpt = $.extend({}, icons.other.myposition, { position: latLng });
                            var newMarker = Factory.marker(iconOpt);
                            var info = Factory.infobox("<h3>Min position</h3>");
                            info.infoopen = false;
                            store.other.myposition.push(newMarker);
                            google.maps.event.addListener(newMarker, 'click', function () {
                                if (info.infoopen) {
                                    info.close();
                                } else {
                                    info.open($map, newMarker);
                                    store.infowindows.push(info);
                                }
                                info.infoopen = !info.infoopen;
                            });

                            break;
                        case 'Resellers':
                            $.each(obj, function (u, a) {
                                var latLng = new google.maps.LatLng(a.Lat, a.Lon);
                                var iconOpt = $.extend({}, icons.vendors_2.normal, { position: latLng });
                                var newMarker = Factory.marker(iconOpt);
                                var info = Factory.infobox("<h3 class='noscrollbar'>" + a.Name + "<br /><b><small>" + a.Address + "</small></b></h3>");
                                info.infoopen = false;
                                store.vendors.Resellers.push(newMarker);
                                google.maps.event.addListener(newMarker, 'click', function () {
                                    if (info.infoopen) {
                                        info.close();
                                    } else {
                                        info.open($map, newMarker);
                                        store.infowindows.push(info);
                                    }
                                    info.infoopen = !info.infoopen;
                                });
                            });

                            break;
                        case 'Representatives':
                            $.each(obj, function (u, a) {
                                var latLng = new google.maps.LatLng(a.Lat, a.Lon);
                                var iconOpt = $.extend({}, icons.vendors_3.normal, { position: latLng });
                                var newMarker = Factory.marker(iconOpt);
                                var info = Factory.infobox("<h3 class='noscrollbar'>" + a.Name + "<br /><b><small>" + a.Address + "</small></b></h3>");
                                info.infoopen = false;
                                store.vendors.Representatives.push(newMarker);
                                google.maps.event.addListener(newMarker, 'click', function () {

                                    if (info.infoopen) {
                                        info.close();
                                    } else {
                                        info.open($map, newMarker);
                                        store.infowindows.push(info);
                                    }
                                    info.infoopen = !info.infoopen;
                                });
                            });

                            break;
                        case 'Parking':
                            $.each(obj, function (u, a) {
                                var latLng = new google.maps.LatLng(a.Lat, a.Lon);
                                var iconOpt = $.extend({}, icons.parking.normal, { position: latLng });
                                var newMarker = Factory.marker(iconOpt);
                                var info = Factory.infobox("<h3 class='noscrollbar'>" + a.Name + "<br /><b><small>" + a.Capacity + " platser</small></b></h3>");
                                info.infoopen = false;
                                store.parking.all.push(newMarker);
                                google.maps.event.addListener(newMarker, 'click', function () {
                                    if (info.infoopen) {
                                        info.close();
                                    } else {
                                        info.open($map, newMarker);
                                        store.infowindows.push(info);
                                    }
                                    info.infoopen = !info.infoopen;

                                });
                            });

                            break;
                        case 'NearbyStations':
                            store.stations.nearby = [];

                            $.each(blueprints[i], function (u, a) {
                                var latLng = new google.maps.LatLng(a.Lat, a.Lon), icon;

                                if (a.Traffictypes.length >= 2) {
                                    icon = icons.stations.multi;
                                } else {
                                    if (a.Traffictypes[0] === "TRN") {
                                        icon = icons.stations.commuter;
                                    }
                                    if (a.Traffictypes[0] === "BUS") {
                                        icon = icons.stations.buses;
                                    }
                                    if (a.Traffictypes[0] === "MET") {
                                        icon = icons.stations.metro;
                                    }
                                    if (a.Traffictypes[0] === "TRM") {
                                        icon = icons.stations.tram;
                                    }
                                    if (a.Traffictypes[0] === "FER") {
                                        icon = icons.stations.boat;
                                    }
                                }

                                var iconOpt = $.extend({}, icon, { position: latLng, name: a.Name, SiteId: a.SiteId });
                                var newMarker = Factory.marker(iconOpt);
                                var TrafficTypeText = CommonMethods.translateStations(a.Traffictypes);
                                var info = Factory.infobox("<h4 class='noscrollbar'>" + a.Name + "</h4><small>" + TrafficTypeText + " ( avstånd: " + a.Distance + " )</small>");
                                info.infoopen = false;
                                store.stations.nearby.push(newMarker);
                                google.maps.event.addListener(newMarker, 'click', function () {
                                    //info.open($map, newMarker);
                                    externalModel.RealtimeMarkerClick(newMarker, $scope);
                                });
                            });

                            break;
                        case 'Realtime':
                            store.stations.realtime = [];

                            $.each(blueprints[i], function (u, a) {
                                var latLng = new google.maps.LatLng(a.Lat, a.Lon), icon;

                                if (a.Traffictypes.length >= 2) {
                                    icon = icons.stations.multi;
                                } else {
                                    if (a.Traffictypes[0] === "TRN") {
                                        icon = icons.stations.commuter;
                                    }
                                    if (a.Traffictypes[0] === "BUS") {
                                        icon = icons.stations.buses;
                                    }
                                    if (a.Traffictypes[0] === "MET") {
                                        icon = icons.stations.metro;
                                    }
                                    if (a.Traffictypes[0] === "TRM") {
                                        icon = icons.stations.tram;
                                    }
                                }

                                var iconOpt = $.extend({}, icon, { position: latLng });
                                var newMarker = Factory.marker(iconOpt);
                                var TrafficTypeText = CommonMethods.translateStations(a.Traffictypes);
                                var info = Factory.infobox("<h4>" + a.Name + "</h4><small>" + TrafficTypeText + " ( avstånd: " + a.Distance + " )</small>");
                                info.infoopen = false;
                                store.stations.nearby.push(newMarker);
                                google.maps.event.addListener(newMarker, 'click', function () {
                                    if (info.infoopen) {
                                        info.close();
                                    } else {
                                        info.open($map, newMarker);
                                        store.infowindows.push(info);
                                    }
                                    info.infoopen = !info.infoopen;
                                });
                            });

                            break;
                        case 'TripStations':
                            store.trips.stations = [];

                            $.each(blueprints[i], function (u, a) {
                                $.each(a, function (i, b) {
                                    var latLng = new google.maps.LatLng(b.Lat, b.Lon), icon;

                                    if (b.icontype === "start") {
                                        icon = icons.trip.start;
                                    }
                                    if (b.icontype === "change") {
                                        icon = icons.trip.change;
                                    }
                                    if (b.icontype === "stations") {
                                        icon = icons.trip.stations;
                                    }
                                    
                                    if (b.icontype.slice(0, 3) === "MET" ||
                                    b.icontype.slice(0, 3) === "BUS" ||
                                        b.icontype.slice(0, 3) === "FER" ||
                                            b.icontype.slice(0, 3) === "TRN" ||
                                                b.icontype.slice(0, 3) === "TRM") {
                                        icon = icons.trip.stations;
                                    }
                                    if (b.icontype === "destination") {
                                        icon = icons.trip.destination;
                                    }

                                    var iconOpt = $.extend({}, icon, { position: latLng });
                                    var newMarker = Factory.marker(iconOpt);
                                    var info = Factory.infobox("<h3>" + b.title + "</h3>");
                                    info.infoopen = false;
                                    store.trips.stations.push(newMarker);
                                    google.maps.event.addListener(newMarker, 'click', function () {
                                        if (info.infoopen) {
                                            info.close();
                                        } else {
                                            info.open($map, newMarker);
                                            store.infowindows.push(info);
                                        }
                                        info.infoopen = !info.infoopen;
                                    });
                                });
                            });

                            break;
                        case 'Stations':
                            if (states.markers.stations.visible) {
                                $.each(store.stations, function (i, obj) {
                                    $.each(obj, function (u, a) {
                                        a.setMap(null);
                                    });
                                });
                            }

                            store.stations.all = [];

                            $.each(blueprints[i], function (u, a) {
                                var latLng = new google.maps.LatLng(a.Lat, a.Lon), icon;

                                if (a.TrafficType === "TRN") {
                                    icon = icons.stations.commuter;
                                }
                                if (a.TrafficType === "BUS") {
                                    icon = icons.stations.buses;
                                }
                                if (a.TrafficType === "MET") {
                                    icon = icons.stations.metro;
                                }
                                if (a.TrafficType === "TRM") {
                                    icon = icons.stations.tram;
                                }
                                if (a.TrafficType === "FER") {
                                    icon = icons.stations.boat;
                                }
                                if ((a.TrafficType).split(",").length >= 2) {
                                    icon = icons.stations.multi;
                                }

                                var iconOpt = $.extend({}, icon, { position: latLng });
                                var newMarker = Factory.marker(iconOpt);
                                var TrafficTypeText = CommonMethods.translateStations((a.TrafficType).split(","));
                                var info = Factory.infobox("<h3>" + a.Name + "<br /><b><small>" + TrafficTypeText + "</small></b></h3>");
                                info.infoopen = false;
                                store.stations.all.push(newMarker);
                                google.maps.event.addListener(newMarker, 'click', function () {
                                    if (info.infoopen) {
                                        info.close();
                                    } else {
                                        info.open($map, newMarker);
                                        store.infowindows.push(info);
                                    }
                                    info.infoopen = !info.infoopen;
                                });
                            });

                            if (states.markers.stations.visible) {
                                var arr = [];
                                $.each(store.stations, function (j, obj) {
                                    $.each(obj, function (u, a) {
                                        a.setMap($map);
                                    });
                                });
                            }

                            break;
                        default:
                            break;
                    }
                    ;
                });
            };

            // @ Factory.paths, creates paths based on markers
            Factory.prototype.paths = function (blueprints) {
                $.each(blueprints, function (i, obj) {
                    switch (i) {
                        case 'TripPath':
                            store.trips.paths = [];

                            $.each(obj, function (e, a) {
                                var latLng = [];

                                $.each(a, function (i, o) {
                                    latLng.push(Factory.latLng(o.Lat, o.Lon));
                                });

                                var path = Factory.path(latLng, {
                                    strokeColor: '#a7a9ac',
                                    strokeOpacity: 1.0,
                                    strokeWeight: 5
                                });

                                google.maps.event.addListener(path, 'click', function (e, arg) {
                                    mapMethods.setCurrentPath(this);
                                });

                                store.trips.paths.push(path);
                            });

                            break;
                        default:
                            // Do something default?
                            break;
                    }
                });
            };

            // @ Factory.zones, creates zones based on type and markers 
            Factory.prototype.zones = function (blueprints) {

            };

            var Factory = new Factory();

            // FETCHER Class. fetch data from services.
            // @ Fetcher.zones, get zones

            function Fetcher() {
            }

            Fetcher.prototype.getZones = function () {
                $.ajax({
                    type: "GET",
                    dataType: "json",
                    async: false,
                    url: "/api/sv/map/GetZoneData",
                    success: function (response) {
                        var zones = parser.zones(response);
                        store.zones = zones;
                    },
                    error: function (error, xhr) {
                        //Error handler?
                    }
                })
                    .then(function () {

                    })
                    .done(function () {
                        states.zones.ticket.loaded = true;
                    });
            };

            Fetcher.prototype.getVendors = function () {
                $.ajax({
                    type: "GET",
                    dataType: "json",
                    async: false,
                    url: "/api/sv/map/GetTicketVendors",
                    success: function (response) {
                        parser.vendors(response);
                    },
                    error: function (error, xhr) {
                        //Error handler?
                    }
                })
                    .then(function () {

                    })
                    .done(function () {
                        states.markers.vendors.loaded = true;
                    });
            };

            Fetcher.prototype.getStations = function () {

                var TrafficTypes = CommonMethods.getTrafficTypesByZoomAndWidth(states.zoomLevel);

                var bounds = $map.getBounds();
                var NE = bounds.getNorthEast();
                var SW = bounds.getSouthWest();
                var NW = new google.maps.LatLng(NE.lat(), SW.lng());
                var SE = new google.maps.LatLng(SW.lat(), NE.lng());

                var url = "/api/map/GetSitePoints/" + NW.lat() + "/" + NW.lng() + "/" + SE.lat() + "/" + SE.lng() + "/" + TrafficTypes;

                $.ajax({
                    type: "GET",
                    async: false,
                    url: url,
                    success: function (response) {
                        parser.stations(response);
                    },
                    error: function (error, xhr) {
                        // Error handler?
                    }
                })
                    .then(function () {

                    })
                    .done(function () {
                        states.markers.stations.loaded = true;
                    });
            };

            Fetcher.prototype.getParkings = function () {
                $.ajax({
                    type: "GET",
                    async: false,
                    url: "/api/map/GetCommuterParking",
                    success: function (response) {
                        parser.parkings(response);
                    },
                    error: function (error, xhr) {
                        // Error handler?
                    }
                })
                    .then(function () {

                    })
                    .done(function () {
                        states.markers.parking.loaded = true;
                    });
            };

            var Fetcher = new Fetcher();

            // EVENTS handler

            function MapEvents() {
                this.hasZoomed = false;
            }

            MapEvents.prototype.MapCenterChange = function () { // Triggers when the Center of the map changes (ex when dragging or zooming)
                mapMethods.closeAllInfoWindows();
            };

            MapEvents.prototype.TilesLoaded = function () { // Triggers when all the tiles have finished loading

            };

            MapEvents.prototype.CompleteLoaded = function () {
                states.map.main.loaded = true;
                states.map.main.visible = true;
                MapLoaded();
            };

            MapEvents.prototype.MapCompleteUpdated = function () {

            };

            MapEvents.prototype.MapZoomChanged = function () {
                states.zoomLevel = $map.getZoom();
                if (CommonMethods.watchZoomLevels() && states.markers.stations.visible) {
                    Fetcher.getStations();
                }
                if (!this.hasZoomed) {
                    this.hasZoomed = true;
                    window.SiteCatalyst.TrackClient("ZoomUsage");
                }
            };

            MapEvents.prototype.MapDragEnd = function () {
                if (CommonMethods.watchZoomLevels() && states.markers.stations.visible) {
                    Fetcher.getStations();
                }
            };

            var mapEvents = new MapEvents();

            // END of EVENTS Handler

            // @ MAP Methods

            function MapMethods() {
            }

            MapMethods.prototype.closeAllInfoWindows = function () {
                for (var i = 0; i < store.infowindows.length; i++) {
                    store.infowindows[i].infoopen = false;
                    store.infowindows[i].close();
                }
            };

            MapMethods.prototype.setBounds = function (markers) {
                // markers should be an array of markers
                var bounds = new google.maps.LatLngBounds();
                for (var i = 0; i < markers.length; i++) {
                    bounds.extend(markers[i]);
                }
                $map.fitBounds(bounds);
            };

            MapMethods.prototype.setCurrentPath = function (path) {
                $.each(store.trips.paths, function (i, storedpath) {
                    storedpath.setOptions({ strokeColor: "#a7a9ac", zIndex: 100 });
                });
                path.setOptions({ strokeColor: "#3ca7f9", zIndex: 300 });
            };

            var mapMethods = new MapMethods();

            // INIT

            function initialize() {
                var optionObj = new Options();
                var defaults = optionObj.defaults();
                var hidden = optionObj.hideDefaults();
                if ($(window).width() <= 400) {
                    defaults.minZoom = 8;
                }
                ;
                $map = new google.maps.Map(document.getElementById("interactiveMap"), defaults);

                var mapType = new google.maps.StyledMapType(hidden, { name: 'No Stations' });

                $map.mapTypes.set('nostations', mapType);
                $map.setMapTypeId('nostations');

                google.maps.event.addListener($map, 'center_changed', function () { mapEvents.MapCenterChange(); });
                google.maps.event.addListener($map, 'tilesloaded', function () { mapEvents.TilesLoaded(); });
                google.maps.event.addListener($map, 'idle', function () {
                    if (states.map.main.loaded) {
                        mapEvents.MapCompleteUpdated();
                    }
                });
                google.maps.event.addListener($map, 'zoom_changed', function () { mapEvents.MapZoomChanged(); });
                google.maps.event.addListener($map, 'dragend', function () { mapEvents.MapDragEnd(); });

                // @ WATCHES

                // CREATE CLUSTERS

                clusters = {
                    vendors: new MarkerClusterer($map, [], icons.cluster.normal),
                    parking: new MarkerClusterer($map, [], icons.cluster.normal),
                    travel: new MarkerClusterer($map, [], icons.cluster.normal),
                    stations: new MarkerClusterer($map, [], icons.cluster.normal),
                    combined: new MarkerClusterer($map, [], icons.cluster.normal)
                };


                $scope.externalModel = externalModel;

                $scope.$watch("externalModel.states.trip.loaded", function (newVal) {
                    if (newVal) {
                        MapLoaded();
                    }
                });

                $scope.$watch("externalModel.states.myposition.loaded", function (newVal) {
                    if (newVal) {
                        MapLoaded();
                    }
                });

                if (externalModel.states.mapInit.loaded && externalModel.states.isOnlyMap) {
                    MapLoaded();
                }

            }

            function MapLoaded() {

                var siteCatalystTracker = function (input, id) {
                    if (!input.hasClass("checked")) {
                        window.SiteCatalyst.TrackClient("MapFilter", id);
                    }
                };

                $scope.controllersAreVisible = false;

                $scope.toggleControllers = function () {
                    $scope.controllersAreVisible = !$scope.controllersAreVisible;
                };

                states.zoomLevel = $map.getZoom();
                var controller = new Controller();

                controller.$controllPanel.on("change", "input", function () {

                    var input = $(this);
                    var id = input.prop("id");

                    if (isiPad) {
                        controller.untoggleAll(id); // Param id is an exception
                    }

                    siteCatalystTracker(input, id);
                    input.toggleClass("checked");

                    if (id === "vendors") {
                        controller.toggleVendors();
                    } else if (id === "zones") {
                        controller.toggleZones();
                    } else if (id === "stations") {
                        controller.toggleStations();
                    } else if (id === "parking") {
                        controller.toggleParking();
                    }
                });

                if (externalModel.states.myposition.loaded) {
                    externalModel.cleaner(["trip"]);
                    controller.toggleMyPosition();
                    controller.toggleNearbyStations();
                }
                if (externalModel.states.trip.loaded) {
                    externalModel.cleaner(["myposition"]);
                    controller.toggleTripStations();
                    controller.toggleTripPath();
                }

                if (externalModel.states.realtime.loaded) {
                    controller.toggleRealtime();
                }

            }

            initialize();
        };
    } ]);

// External

    angular.module('slapp.googleMap.services', [], function ($provide) {
        $provide.service('mapDataService', ["externalModel", '$rootScope', '$location', "$http", "urlprovider", function (externalModel, $rootScope, $location, $http, urlprovider) {
            var self = this,
                isNearbyStation = false,
                nearbystationsdata,
                origURL = '';

            self.travelResult = [];

            self.setNearbyStations = function (data, lat, lng) {
                externalModel.states.myposition.loaded = false;
                externalModel.states.nearbystations.loaded = false;
                externalModel.states.myposition.loaded = false;
                externalModel.states.trip.loaded = false;
                isNearbyStation = true;
                nearbystationsdata = {
                    data: data,
                    lat: lat,
                    lng: lng
                };
            };

            var travelData;

            $rootScope.$watch("map.locked", function (change) {
                if (change) { return; }

                if (isNearbyStation) {
                    origURL = $location.$$path;
                    externalModel.mypositionHandler(nearbystationsdata.data, nearbystationsdata.lat, nearbystationsdata.lng);
                    externalModel.states.isOnlyMap = false;
                    return false;
                }

                if (typeof (travelData) === "undefined" && !externalModel.states.mapInit.loaded) {
                    externalModel.states.mapInit.loaded = true;
                    externalModel.states.isOnlyMap = true;
                    return false;
                }

                externalModel.states.isOnlyMap = false;

                var data = travelData;
                var numberOfSubTrips = 0,
                            loadedIntermediateStops = 0;
                var getIntermediateStops = function (indermediateStopUrl, i, j) {
                    $http.get(indermediateStopUrl)
                        .success(function (response) {
                            data.Trips[i].SubTrips[j].IntermediateStops = response.data.Points;
                            loadedIntermediateStops++;

                            if (loadedIntermediateStops == numberOfSubTrips) {
                                externalModel.tripHandler(data);
                                self.travelResult = data.Trips;
                            }
                        });
                };
                if (typeof (data) === "undefined") { return; }

                var length = data.Trips.length,
                            trip,
                            subtrips,
                            indermediateStopUrl,
                            refUrl,
                            startIdx,
                            stopIdx;

                for (var i = 0; i < length; i++) {
                    trip = data.Trips[i];
                    subtrips = trip.SubTrips.length;
                    for (var j = 0; j < subtrips; j++) {
                        var subTrip = trip.SubTrips[j];
                        if (subTrip.IntermediateStopRef !== null) {
                            numberOfSubTrips++;
                            refUrl = subTrip.IntermediateStopRef.Url
                            startIdx = subTrip.IntermediateStopRef.StartIdx;
                            stopIdx = subTrip.IntermediateStopRef.StopIdx;
                            indermediateStopUrl = urlprovider.travelplanner.createIntermediateStopUrl(refUrl + "/" + startIdx + "/" + stopIdx);
                            getIntermediateStops(indermediateStopUrl, i, j);
                        } else {
                            subTrip.IntermediateStops = [];
                        }
                    }
                }
                origURL = $location.$$path;

            })

            self.setTravelTrip = function (data) {
                externalModel.states.myposition.loaded = false;
                externalModel.states.nearbystations.loaded = false;
                externalModel.states.myposition.loaded = false;
                externalModel.states.trip.loaded = false;
                travelData = data;
                isNearbyStation = false;
            };

            self.setRealTime = function (data) {
                $rootScope.$watch("map.locked", function (change) {
                    // change = map.locked (default map.locked === true)
                    if (!change && origURL !== $location.$$path) {
                        origURL = $location.$$path;
                        externalModel.realtimeHandler(data);
                    }
                })
            };

        } ]);

    });
