angular.module('slapp.factories', []).
    factory('getStateOld', ["$window", function ($window) {
        return function() {
            var mid = 624;
            var min = 400;
            var width = $window.document.width;
            var state = 'max';
            if (Modernizr.mq('(max-width: ' + min + 'px)')) {
                state = 'min';
            } else if (Modernizr.mq('(max-width: ' + mid + 'px)')) {
                state = 'mid';
            }
            return state;
        };
    }]);