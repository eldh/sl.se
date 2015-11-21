var typeaheadModule = angular.module('typeahead', ['ngResource'], function ($locationProvider) {
    $locationProvider.hashPrefix('');
});
typeaheadModule.directive('myAutocomplete', function () {
    return {
        restrict: 'A',
        replace: true,
        scope: {
            minInputLength: '@minInput',
            remoteData: '&',
            placeholder: '@placeholder',
            restrictCombo: '@restrict',
            selectedItem: '=selectedItem'
        },
        templateUrl: 'static/SearchTypeAhead.htm',
        controller: function ($scope, $element, $attrs) {
            //console.log('inside controller');
            $scope.selectMe = function (choice) {
                $scope.selectedItem = choice;
                $scope.searchTerm = $scope.lastSearchTerm = choice.label;
            };
            $scope.UpdateSearch = function() {
                //console.log('Can Refresh:' + $scope.canRefresh());
                if ($scope.canRefresh()) {
                    $scope.searching = true;
                    $scope.lastSearchTerm = $scope.searchTerm;
                    try {
                        $scope.remoteData({
                            request: {
                                term: $scope.searchTerm
                            },
                            response: function(data) {
                                $scope._choices = data;
                                $scope.searching = false;
                            }
                        });
                    } catch(ex) {
                        //console.log(ex.message);
                        $scope.searching = false;
                    }
                }
            };
            $scope.$watch('searchTerm', $scope.UpdateSearch);
            $scope.canRefresh = function () {
                return ($scope.searchTerm !== "") && ($scope.searchTerm !== $scope.lastSearchTerm) && ($scope.searching != true);
            };
        },
        link: function (scope, iElement, iAttrs, controller) {
            scope._searchTerm = '';
            scope._lastSearchTerm = '';
            scope.searching = false;
            scope._choices = [];
            if (iAttrs.restrict == 'true') {
                var searchInput = angular.element(iElement.children()[0]);
                searchInput.bind('blur', function () {
                    if (scope._choices.indexOf(scope.selectedItem) < 0) {
                        scope.selectedItem = null;
                        scope.searchTerm = '';
                    }
                });
            }
        }
    };
});

typeaheadModule.directive("focused", ["$timeout", function ($timeout) {
    return function(scope, element, attrs) {
        element[0].focus();
        element.bind('focus', function() {
            scope.$apply(attrs.focused + '=true');
        });
        element.bind('blur', function() {
            $timeout(function() {
                scope.$eval(attrs.focused + '=false');
            }, 500);
        });
        scope.$eval(attrs.focused + '=true');
    };
}]);