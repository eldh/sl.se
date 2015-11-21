var shoppingcart = angular.module('slapp.shoppingcart', []);

shoppingcart.factory("shoppingCartModel", ["$http", "errorHandler", "$window", "ajaxHandler", "$timeout", function ($http, errorHandler, $window, ajaxHandler, $timeout) {
    //console.log("init shoppingCartModel");
    var modelService = {
        data: {
            Errors: [],
            ValidationErrors: [],
            DeliveryAddressLines: [],
            ProductsView: [],
            NewTravelPurseView: [],
            TravelCards: [],
            NewTravelCards: [],
            PaymentReceipt: null,
            TotalSum: 0,
            isAddingProduct: false,
            isViewLoading: false,
            loadedTravelCards: 0,
            cardMaxHeight: 0
        }
    };

    modelService.init = function () {
        var setData = function (response) {
            if (response.data != undefined) {
                modelService.data.ProductsView = response.data.ProductsView;
                modelService.data.TravelCardsView = response.data.TravelCardsView;
                modelService.data.UserTravelCards = response.data.UserTravelCards;
                modelService.data.UserExpiredTravelCards = response.data.UserExpiredTravelCards;
                modelService.data.UserBlockedTravelCards = response.data.UserBlockedTravelCards;
                modelService.data.NewTravelCards = response.data.NewTravelCards;
                modelService.data.NewTravelPurseView = response.data.NewTravelPurseView;
                modelService.data.TotalSum = response.data.TotalSum;
                modelService.data.UserAuthenticated = response.data.UserAuthenticated;
                modelService.data.PaymentMethod = response.data.PaymentMethod;
                modelService.data.DeliveryAddress = response.data.DeliveryAddress;
                modelService.data.DeliveryAddressLines = response.data.DeliveryAddressLines;
                modelService.data.DeliveryEmail = response.data.DeliveryEmail;
                modelService.data.PaymentMedia = response.data.PaymentMedia;
                modelService.data.SelectedPaymentMedia = response.data.SelectedPaymentMedia;
                modelService.data.ValidationErrors = response.data.ValidationErrors;
                modelService.data.UserSession = response.data.UserSession;
                modelService.data.ECommerseProductsURL = response.data.ECommerseProductsURL;
                modelService.data.IsSecure = response.data.IsSecure;
                modelService.data.Notes = response.data.Notes;
                modelService.data.ExternalAuthenticationMethods = response.data.ExternalAuthenticationMethods;
                modelService.data.AutoExpandCard = response.data.AutoExpandCard;
                if (response.data.PaymentReceipt != null) {
                    modelService.data.PaymentReceipt = response.data.PaymentReceipt;
                }
            }
            //console.log("cart data", modelService.data);
        };

        modelService.errorCallback = function (response, status, headers, config) {
            //console.log("error", response, status, headers, config);
            modelService.data.Errors = [];
            modelService.data.ValidationErrors = {};
            if (response.data != undefined) {
                // timeout needed for autoscroll
                $timeout(function () {
                    if (response.status == "error") {
                        if (response.data != null) {
                            if ((response.data.Errors != undefined && response.data.Errors != null && response.data.Errors.length > 0)
                                || (response.data.ValidationErrors != undefined && response.data.ValidationErrors != null)
                            ) {
                                modelService.data.Errors = response.data.Errors;
                            } else if (response.data.b2_error != undefined && response.data.b2_error.message != undefined && response.data.b2_error.message != null) {
                                modelService.data.Errors = [response.data.b2_error.message];
                            } else {
                                modelService.data.Errors = [errorHandler.getErrorMessage()];
                            }
                        } else {
                            modelService.data.Errors = [errorHandler.getErrorMessage()];
                        }
                    }
                    var form = config.url.split("/");
                    form = form[form.length - 1];
                    modelService.data.ValidationErrors[form] = response.data.ValidationErrors;
                });
            } else if (response.status != "success") {
                // timeout needed for autoscroll
                $timeout(function () {
                    modelService.data.Errors = [errorHandler.getErrorMessage()];
                });
            }
            if (response.status == "success") {
                modelService.data.isAddingProduct = false;
            } else {
                modelService.data.isAddingProduct = undefined;
            }
        };

        var errorCallback = modelService.errorCallback;

        modelService.init = function () {
            modelService.getShoppingCart();
        };

        modelService.logout = function () {
            var callback = function (response) {
                //console.log(response);
            };
            ajaxHandler.getData("/api/MySL/Logout", callback, errorCallback);
        };

        modelService.getShoppingCart = function () {
            modelService.data.isViewLoading = true;
            var callback = function (response) {
                setData(response);
                modelService.data.isViewLoading = false;
            };
            var shoppingCartErrorCallback = function (response, status, headers, config) {
                errorCallback(response, status, headers, config);
                setData(response);
                modelService.data.isViewLoading = false;
            };
            ajaxHandler.getData("/api/ECommerse/GetShoppingCart", callback, shoppingCartErrorCallback);
        };

        modelService.addProduct = function (callback, addProductErrorCallback, id, serial) {
            //console.log("Updating shopping cart", id, serial);
            var data = {
                id: id,
                travelCardSerial: serial
            };
            modelService.data.isAddingProduct = true;
            ajaxHandler.postData("/api/ECommerse/AddProduct", data, callback, addProductErrorCallback);
        };

        modelService.removeProduct = function (id) {
            //console.log("Removing", id);
            var callback;
            if (modelService.data.IsSecure) {
                var data = {
                    id: id
                };
                callback = function (response) {
                    modelService.data.ProductsView = response.data.ProductsView;
                    modelService.data.TravelCardsView = response.data.TravelCardsView;
                    modelService.data.TotalSum = response.data.TotalSum;
                };
                ajaxHandler.postData("/api/ECommerse/RemoveProduct", data, callback, errorCallback);
            } else {
                callback = function (response) {
                    //console.log("success", response);
                };
                ajaxHandler.getData("/api/ECommerse/GetSecurityMessage", callback, errorCallback);
            }
        };

        modelService.setPurseValue = function (callback, value, serial) {
            //console.log("adding travel purse", value, serial);
            var data = {
                id: null,
                travelCardSerial: serial,
                value: value
            };
            modelService.data.isAddingProduct = true;
            ajaxHandler.postData("/api/ECommerse/SetPurseValue", data, callback, errorCallback);
        };

        modelService.setStandardTrip = function (url, data) {
            var callback = function (response) {
                modelService.data.NewTravelPurseView = response.data.NewTravelPurseView;
            };
            ajaxHandler.postData(url, data, callback, errorCallback);
        };

        modelService.addTravelCard = function () {
            //console.log("Adding travel card");
            var data = {
                name: null
            };
            var callback = function (response) {
                modelService.data.ProductsView = response.data.ProductsView;
                modelService.data.TravelCardsView = response.data.TravelCardsView;
                modelService.data.TravelCards = response.data.TravelCards;
                modelService.data.UserTravelCards = response.data.UserTravelCards;
                modelService.data.NewTravelCards = response.data.NewTravelCards;
                modelService.data.TotalSum = response.data.TotalSum;
            };
            ajaxHandler.postData("/api/ECommerse/AddTravelCard", data, callback, errorCallback);
        };

        modelService.removeTravelCard = function (serial) {
            var data = {
                travelCardSerial: serial
            };
            var callback = function (response) {
                modelService.data.ProductsView = response.data.ProductsView;
                modelService.data.TravelCardsView = response.data.TravelCardsView;
                modelService.data.TravelCards = response.data.TravelCards;
                modelService.data.UserTravelCards = response.data.UserTravelCards;
                modelService.data.NewTravelCards = response.data.NewTravelCards;
                modelService.data.TotalSum = response.data.TotalSum;
            };
            ajaxHandler.postData("/api/ECommerse/RemoveTravelCard", data, callback, errorCallback);
        };

        modelService.selectTravelCard = function (data, customCallback) {
            var callback = function (response) {
                // Refresh everything except name

                for (var i = 0; i < response.data.ProductsView.length; i++) {
                    response.data.ProductsView[i].Name = modelService.data.ProductsView[i].Name;
                    if (modelService.data.ProductsView[i].IsProduct) {
                        for (var u = 0; u < modelService.data.ProductsView[i].TravelCards.length; u++) {
                            response.data.ProductsView[i].TravelCards[u].Name = modelService.data.ProductsView[i].TravelCards[u].Name;
                        }
                    }
                }

                modelService.data.ProductsView = response.data.ProductsView;

                if (typeof (customCallback) === "function") {
                    customCallback();
                }
            };
            ajaxHandler.postData("/api/ECommerse/SelectTravelCard", data, callback, errorCallback);
        };

        modelService.setPaymentMethod = function (data) {
            var callback = function (response) {
                modelService.data.PaymentMethod = response.data.PaymentMethod;
                modelService.data.PaymentMedia = response.data.PaymentMedia;
                modelService.data.SelectedPaymentMedia = response.data.SelectedPaymentMedia;
            };
            ajaxHandler.postData("/api/ECommerse/SetPaymentMethod", data, callback, errorCallback);
        };

        modelService.getCardDetails = function (id, callback) {
            var data = {
                "reference": id
            };
            var url = "/api/MySL/GetTravelCardDetails";
            $http.post(url, data).
            success(function (response, status, headers) {
                //console.log("details", response);
                modelService.data.loadedTravelCards++;
                callback(response);
            }).
            error(function (response, status, headers) {
                //console.log("error", response);
                headers = headers();
                if (!headers || Object.keys(headers).length == 0) {
                    // aborted by user
                    return;
                } else {
                    modelService.data.loadedTravelCards++;
                    response.status = "error";
                    response.message = response.data.ValidationErrors.form_errors[0] || errorHandler.getErrorMessage();
                    callback(response);
                }
            });
        };

        modelService.registerTravelCard = function (data, callback, registerCardErrorCallback) {
            ajaxHandler.postData("/api/MySL/RegisterTravelCard", data, callback, registerCardErrorCallback);
        };

        modelService.renameTravelCard = function (data, callback, renameCardErrorCallback) {
            ajaxHandler.postData("/api/MySL/RenameTravelCard", data, callback, renameCardErrorCallback);
        };

        modelService.unregisterTravelCard = function (serial, href, callback, unregisterCardErrorCallback) {
            var data = {
                travel_card: {
                    href: href,
                    serial_number: serial
                }
            };
            ajaxHandler.postData("/api/MySL/UnregisterTravelCard", data, callback, unregisterCardErrorCallback);
        };

        modelService.setupAutoload = function (data, callback, autoloadErrorCallback) {
            ajaxHandler.postData("/api/MySL/SetupAutoload", data, callback, autoloadErrorCallback);
        };

        modelService.listAutoloadContracts = function (data, callback, autoloadErrorCallback) {
            ajaxHandler.getData("/api/MySL/GetAutoloads", callback, autoloadErrorCallback);
        };

        modelService.updateAutoload = function (data, callback, autoloadErrorCallback) {
            ajaxHandler.postData("/api/MySL/UpdateAutoload", data, callback, autoloadErrorCallback);
        };

        modelService.activateAutoload = function (data, callback, autoloadErrorCallback) {
            ajaxHandler.postData("/api/MySL/ActivateAutoload", data, callback, autoloadErrorCallback);
        };

        modelService.verifyAutoload = function (callback, autoloadErrorCallback) {
            ajaxHandler.getData("/api/MySL/VerifyResultAutoload", callback, autoloadErrorCallback);
        };

        modelService.cancelAutoload = function (data, callback, autoloadErrorCallback) {
            ajaxHandler.postData("/api/MySL/CancelAutoload", data, callback, autoloadErrorCallback);
        };

        modelService.removePaymentMedia = function (data, callback, customCallback) {
            ajaxHandler.postData("/api/MySL/RemoveCreditCard", data, callback, customCallback);
        };
        modelService.getNumberOfProducts = function () {
            //console.log("modelService.data.ProductsView.length", modelService.data.ProductsView.length);
            return modelService.data.ProductsView.length;
        };
    };
    modelService.init();
    return modelService;
} ]);

shoppingcart.controller("ShoppingCartCtrl", ["$scope", "shoppingCartModel", function ($scope, shoppingCartModel) {
    //console.log("init shoppingcart");
    shoppingCartModel.init();

    $scope.shopping_cart = shoppingCartModel;
    //console.log("shopping_cart", $scope.shopping_cart);

    $scope.cartCheckout = function () {
        window.SiteCatalyst.TrackClient("CartCheckout", $scope.shopping_cart.data.ProductsView);
    };
}]);