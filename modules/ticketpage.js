var ticketpage = angular.module('slapp');

ticketpage.controller("TicketPageCtrl", ["$scope", "$location", 'shoppingCartModel', function ($scope, $location, shoppingCartModel) {
    $scope.ticketCategory = "period-ticket";
    $scope.shopping_cart = shoppingCartModel;
    $scope.clickedItems = {
        ticket: undefined
    };
    $scope.setClicked = function (key, val) {
        if (key == "ticket" && $scope.clickedItems["ticket"] == val) {
            $scope.clickedItems["ticket"] = undefined;
        } else {
            $scope.clickedItems[key] = val;
        }
    };
    var handleUrl = function (path) {
        path = path.replace("/", "");
        var category = "";
        switch (path) {
            case "periodbiljett":
                category = "period-ticket";
                break;
            case "reskassa":
                category = "travel-funds";
                break;
            case "enkelbiljett":
                category = "single-ticket";
                break;
            default:
                category = "period-ticket";
        }
        $scope.ticketCategory = category;
    };
    $scope.$watch(function () {
        return $location.path();
    }, function (newVal) {
        handleUrl(newVal);
    });
}]);