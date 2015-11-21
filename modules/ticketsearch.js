var ticketsearch = angular.module('slapp');

ticketsearch.controller("TicketSearchCtrl", ["$scope", "shoppingCartModel", function ($scope, shoppingCartModel) {
    $scope.shopping_cart = shoppingCartModel;
    if ($scope.data == undefined) {
        $scope.data = {};
    }
    $scope.data["single-ticket-price"] = "Full";
    $scope.data["singleTicketZone"] = "ZoneA";
    $scope.data["period-ticket-price"] = "Full";
    $scope.travel_purse = {
        value: ""
    };
    $scope.addingProduct = null;
    $scope.addProduct = function (id, name, price, serial) {
        serial = serial || "";
        name = name.replace(",", "");
        name = name.replace(";", "");
        price = price.replace(",", ".");
        var callback = function (response) {
            $scope.shopping_cart.data.ProductsView = response.data.ProductsView;
            $scope.shopping_cart.data.TravelCardsView = response.data.TravelCardsView;
            $scope.shopping_cart.data.TotalSum = response.data.TotalSum;
            $scope.addingProduct = null;
            $scope.$emit("scrollToTop");
            window.SiteCatalyst.TrackClient("CartAdd", { name: name, price: price });
        };
        var errorCallback = function (response, status, header, config) {
            $scope.shopping_cart.errorCallback(response, status, header, config);
        };
        $scope.addingProduct = id;

        $scope.shopping_cart.addProduct(callback, errorCallback, id, serial);
    };
    $scope.setPurseValue = function () {
        var serial = $scope.data.travelCardSerial || "";
        var callback = function (response) {
            $scope.shopping_cart.data.ProductsView = response.data.ProductsView;
            $scope.shopping_cart.data.TravelCardsView = response.data.TravelCardsView;
            $scope.shopping_cart.data.TotalSum = response.data.TotalSum;
            $scope.addingProduct = null;
            $scope.$emit("scrollToTop");
            window.SiteCatalyst.TrackClient("CartAdd", { name: "Reskassa", price: $scope.travel_purse.value });
        };
        $scope.addingProduct = "travel_purse";
        $scope.shopping_cart.setPurseValue(callback, $scope.travel_purse.value, serial);
    };
    $scope.hasZones = function (zones) {
        if (($scope.ticketCategory == "single-ticket"
            && $.inArray($scope.data.singleTicketZone, zones.split(',')) > -1)
                || $scope.ticketCategory == "period-ticket") {
            return true;
        }
        return false;
    };
    $scope.viewTicket = function (index, name, price) {
        if ($scope.clickedItems["ticket"] == index) {
            name = name.replace(",", "");
            name = name.replace(";", "");
            price = price.replace(",", ".");
            window.SiteCatalyst.TrackClient("ProdView", { name: name, price: price });
        }
    };
}]);