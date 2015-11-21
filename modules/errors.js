var errors = angular.module('slapp.errors', []);

errors.controller("ErrorsCtrl", ["$scope", "shoppingCartModel", function ($scope, shoppingCartModel) {
    $scope.shopping_cart = shoppingCartModel;
    $scope.trackData = function ($event) {
        var name = $($event.target).closest(".attention-message").find("h3").html();
        window.SiteCatalyst.TrackClient("StatusName", name);
    };
}]);