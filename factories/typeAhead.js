var typeaheadModule = angular.module('typeahead', ['ngResource'], function ($locationProvider) {
    $locationProvider.hashPrefix('');
});
typeaheadModule.factory('typeahead', ["$http", function ($http) {
    return {
        TypeAhead: function(request, response) {
            //console.log('AutoComplete called:' + request.term);
            var retArray, dataToPost;
            //console.log('Term:' + request.term);
            dataToPost = {
                featureClass: "P",
                style: "full",
                maxRows: 12,
                name_startsWith: request.term,
                callback: 'JSON_CALLBACK'
            };
            config = {
            //method: 'JSONP',
                url: '/api/typeahead/find/' + request.term
            //params: dataToPost
            };
            $http.get(config.url).
                success(function(data, status, headers, config) {
                    //console.log(data);
                    //                    var tesst = [];
                    //                    $.each(data, function (key, value) {
                    //                        tesst.push();
                    //                    });
                    //console.log('loading');
                    retArray = data.data.map(function(item) {
                        return {
                            label: item.Name + " " + item.SiteId,
                            value: item.SiteId
                        };
                    });
                    //console.log(retArray);
                    response(retArray);
                }).
                error(function(data, status, headers, config) {
                    response([]);
                });
        }
    };
}]);