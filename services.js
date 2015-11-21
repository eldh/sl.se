'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('slapp.services', ['LocalStorageModule'], function ($provide) {

    $provide.service('stateService', ["$window", function ($window) {
        this.states = {
            min: 400,
            mid: 977,
            showSearchTo: true
        };
        this.getState = function () {
            var state = 'max';
            var w = $window;
            var d = w.document;
            var e = d.documentElement;
            var g = d.getElementsByTagName('body')[0];
            var x = w.innerWidth || e.clientWidth || g.clientWidth;
            var y = w.innerHeight || e.clientHeight || g.clientHeight;

            if (x <= this.states.min) {
                state = 'min';
            } else if (x <= this.states.mid) {
                state = 'mid';
            }

            return state;
        };
        this.setShowSearchTo = function (bool) {
            this.states.showSearchTo = bool;
        };
        this.getShowSearchTo = function () {
            return this.states.showSearchTo;
        };
    } ]);
    $provide.service('ajaxService', ["$timeout", function ($timeout) {
        var timeStamp = new Date();

        this.autocomplete = function (url, $scope, $http) {
            $scope.isTypeAheadLoading = true;
            $http.get(url).
                success(function (data, status, headers, config) {
                    $scope[$scope.callback](data);
                }).
                error(function (data, status, headers, config) {

                }).
                then(function () {
                    $timeout(function () {
                        $scope.isTypeAheadLoading = false;
                    }, 1000);
                });
        };

        this.setTimestamp = function () {
            timeStamp = new Date();
        };
        this.checkTime = function (delay) {
            var now = new Date(),
                first = (timeStamp.getTime()),
                seccond = (now.getTime() - delay);
            return (first < seccond);
        };
    } ]);
    $provide.service('groupService', function () {
        var uniqueGroups = {};
        this.init = function () {
        };
        this.isInGroup = function (group, element) {
            //Could use indexOf, need ie legacy fix first
            if (this.groupExists(group)) {
                var item = uniqueGroups[group].filter(function (x) {
                    return x == element;
                });
                return (item.length > 0);
            } else {
                return false;
            }
        };
        this.groupExists = function (group) {
            return (typeof (uniqueGroups[group]) == "object");
        };
        this.getGroupMates = function (group, element) {
            if (this.groupExists(group)) {
                var groupMates = uniqueGroups[group].filter(function (x) {
                    return x != element;
                });
                return groupMates;
            } else {
                return false;
            }
        };
        this.addToGroup = function (group, element) {
            if (this.groupExists(group)) {
                uniqueGroups[group].push(element);
                return true;
            } else {
                if (this.createGroup(group)) {
                    return this.addToGroup(group, element);
                } else {
                    return false;
                }
            }
        };
        this.createGroup = function (group) {
            if (!this.groupExists(group)) {
                uniqueGroups[group] = [];
                return true;
            } else {
                return false;
            }
        };
        this.init();
    });

    $provide.service('latestSearch', ["localStorageArrayStack", function (localStorageArrayStack) {
        var maxSize = 8;
        this.add = function (item) {
            var key;
            if (item.Type == "Realtime") {
                key = "LatestRealtimeSearch";
            } else if (item.Type == "Travelplanner") {
                key = "LatestTravelplannerSearch";
            } else if (item.Type == "Timetables") {
                key = "LatestTimetablesSearch";
            }
            localStorageArrayStack.add(key, item, maxSize);
        };
        this.get = function (key) {
            return localStorageArrayStack.get(key);
        };
        this.remove = function (key, id, url) {
            var list = localStorageArrayStack.get(key);
            if (list[id].Url == url) {
                return localStorageArrayStack.remove(key, id);
            }
        };
        this.exists = function (key, url) {
            var list = localStorageArrayStack.get(key);
            for (var item in list) {
                if (list[item].Url == url) {
                    return true;
                }
            }
            return false;
        };
    } ]);

    $provide.service('favoriteSearch', ["localStorageArrayStack", function (localStorageArrayStack) {
        //var maxSize = 5;
        this.add = function (key, item) {
            localStorageArrayStack.add(key, item);
        };
        this.get = function (key) {
            return localStorageArrayStack.get(key);
        };
        this.remove = function (key, id, url) {
            var list = localStorageArrayStack.get(key);
            if (list[id].url == url) {
                return localStorageArrayStack.remove(key, id);
            }
        };
        this.update = function (key, id, item) {
            var list = localStorageArrayStack.get(key);
            if (list[id].url == item.url) {
                return localStorageArrayStack.update(key, id, item);
            }
            return false;
        };
        this.exists = function (key, url) {
            var list = localStorageArrayStack.get(key);
            for (var item in list) {
                if (list[item].url == url) {
                    return true;
                }
            }
            return false;
        };
    } ]);

    $provide.service('hilightResults', ["localStorageService", function (localStorageService) {
        var key = "realtimeHilights";
        this.set = function (item) {
            return localStorageService.add(key, item);
            //return localStorageService.add(key, JSON.stringify(item));

        };
        this.get = function () {
            var realtimeHilights = localStorageService.get(key) ? localStorageService.get(key) : null;
            //var realtimeHilights = localStorageService.get(key) ? JSON.parse(localStorageService.get(key)) : null;
            return (realtimeHilights == null ? {} : realtimeHilights);
        };
    } ]);

    $provide.service("latestSearchType", ["localStorageService", function (localStorageService) {
        var key = "latestSearchType";
        this.set = function (item) {
            return localStorageService.add(key, item);
        };
        this.get = function () {
            var latestSearchType = localStorageService.get(key) ? localStorageService.get(key) : null;
            return (latestSearchType == null ? {} : latestSearchType);
        };
    } ]);

    $provide.service('localStorageArrayStack', ["localStorageService", function (localStorageService) {
        this.add = function (key, item, size) {
            var storedItem = localStorageService.get(key) ? localStorageService.get(key) : null;
            //var storedItem = localStorageService.get(key) ? JSON.parse(localStorageService.get(key)) : null;
            if (storedItem == null) {
                storedItem = [];
            }

            storedItem.splice(0, 0, item);
            if (size != undefined) {
                storedItem = storedItem.splice(0, size);
            }
            return localStorageService.add(key, storedItem);
            //return localStorageService.add(key, JSON.stringify(storedItem));
        };
        this.get = function (key) {
            return localStorageService.get(key) ? localStorageService.get(key) : null;
            //return localStorageService.get(key) ? JSON.parse(localStorageService.get(key)) : null;
        };
        this.remove = function (key, id) {
            var storedItem = localStorageService.get(key) ? localStorageService.get(key) : null;
            //var storedItem = localStorageService.get(key) ? JSON.parse(localStorageService.get(key)) : null;
            var curLength = storedItem.length;
            storedItem.splice(id, 1);
            var success = ((curLength - storedItem.length) == 1);
            if (success) {
                return localStorageService.add(key, storedItem);
                //return localStorageService.add(key, JSON.stringify(storedItem));
            }
        };
        this.update = function (key, id, item) {
            var storedItem = localStorageService.get(key) ? localStorageService.get(key) : null;
            //var storedItem = localStorageService.get(key) ? JSON.parse(localStorageService.get(key)) : null;
            storedItem[id] = item;
            return localStorageService.add(key, storedItem);
            //return localStorageService.add(key, JSON.stringify(storedItem));
        };
    } ]);

    $provide.service('errorHandler', ["providedValue", function (providedValue) {
        this.getErrorMessage = function () {
            return providedValue.errorMessage;
        };
    } ]);

    $provide.service("ajaxHandler", ["$http", "$window", function ($http, $window) {
        this.getData = function (url, callback, errorCallback) {
            $http.get(url).
                success(function (response, status, headers, config) {
                    if (response.status == "success") {
                        if (response.RedirectURL != null) {
                            $window.location.href = response.RedirectURL;
                        }
                        else {
                            callback(response);
                        }
                    } else if (response.status == "redirect") {
                        $window.location.href = response.data;
                    } else {
                        errorCallback(response, status, headers, config);
                    }
                }).
                error(function (response, status, headers, config) {
                    headers = headers();
                    if (!headers || Object.keys(headers).length == 0) {
                        // aborted by user
                        return;
                    } else {
                        errorCallback(response, status, headers, config);
                    }
                });
        };
        this.postData = function (url, data, callback, errorCallback) {
            $http.post(url, data).
                success(function (response, status, headers, config) {
                    if (response.status == "success") {

                        /* Why error callback in success? */
                        errorCallback(response, status, headers, config);
                        
                        if (response.RedirectURL != null) {
                            callback(response);
                            $window.location.href = response.RedirectURL;
                        } else if (response.data == null || !response.data.Errors || (response.data.Errors && response.data.Errors.length == 0)) {
                            callback(response);
                        }
                    } else if (response.status == "redirect") {
                        $window.location.href = response.data;
                    } else {
                        errorCallback(response, status, headers, config);
                    }
                })
                .error(function (response, status, headers, config) {
                    headers = headers();
                    if (!headers || Object.keys(headers).length == 0) {
                        // aborted by user
                        return;
                    } else {
                        errorCallback(response, status, headers, config);
                    }
                });
        };
    } ]);
}).value('version', '0.1');