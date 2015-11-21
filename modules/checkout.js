var checkout = angular.module('slapp');

checkout.directive('cardList', ["$timeout", function ($timeout) {
    return function (scope, element) {
        scope.$watch("clickedItems['cardGroup']", function () {
            $timeout(function () {
                element.find(".expand-mini-icon").attr("aria-pressed", "false");
                element.find(".card").attr("aria-expanded", "false");
                element.find(".expand-mini-icon.active").attr("aria-pressed", "true");
                element.find(".expand-mini-icon.active").siblings(".card").attr("aria-expanded", "true");
            });
        });
    };
} ]);

checkout.controller("CheckoutCtrl", ['$scope', '$location', 'shoppingCartModel', '$http', '$timeout', 'errorHandler', '$window', 'ajaxHandler', '$rootScope', function ($scope, $location, shoppingCartModel, $http, $timeout, errorHandler, $window, ajaxHandler, $rootScope) {

    $scope.shopping_cart = shoppingCartModel;

    $scope.disableButton = false;
    $scope.errors = [];
    $scope.clickedItems = {};
    $scope.setClicked = function (key, val) {
        if ($scope.clickedItems[key] == val) {
            $scope.clickedItems[key] = undefined;
        } else {
            $scope.clickedItems[key] = val;
        }
    };
    $scope.isExpanded = function (parentindex, index, ObjectId) {

        return (typeof (ObjectId) !== "undefined") ? ($rootScope.display["note_" + ObjectId + "_" + parentindex + "_" + index] === true) : ($rootScope.display["note_" + parentindex + "_" + index] === true);
    };
    $scope.changeStep = function (step) {
        $scope.shopping_cart.data.Errors = [];
        $scope.$emit("scrollToTop");
        $scope.step = step.replace("/", "");
        if ($location.path() == "/Kopvillkor" && $scope.shopping_cart.data.NewTravelPurseView.length > 0 && step == "Kort") {
            $scope.step = "Standardresa";
        }
        $location.path($scope.step);
    };
    $scope.$watch(function () {
        return $location.path();
    }, function (path) {
        if (path != "/content") {
            $scope.updateStep(path);
        }
    });
    $scope.updateStep = function (path) {
        $scope.step = path.replace("/", "");
        if ($scope.step.toLowerCase() == "kvitto") {
            $scope.$broadcast("getReceipt");
        }
    };

    $scope.updateStep($location.path());
    $scope.validateStep = function (url, params, nextStep) {
        if (!$scope.disableButton) {
            $scope.disableButton = true;

            var callback = function (response) {
                $scope.shopping_cart.data.TravelCardsView = response.data.TravelCardsView;
                $scope.shopping_cart.data.NewTravelCards = response.data.NewTravelCards;
                if (response.data.NewTravelPurseView.length > 0 && url == "/api/ECommerse/ValidateTravelCardSelection") {
                    $scope.shopping_cart.data.NewTravelPurseView = response.data.NewTravelPurseView;
                    $scope.changeStep('Standardresa');
                } else {
                    $scope.changeStep(nextStep);
                }
                $scope.disableButton = false;
            };

            var errorCallback = function (response, status, headers, config) {
                $scope.shopping_cart.errorCallback(response, status, headers, config);
                $scope.disableButton = false;
            };
            ajaxHandler.postData(url, params, callback, errorCallback);
        }
    };
} ])

.directive('renamecard', ['shoppingCartModel', function (shoppingCartModel) {

    // Rename same card for all products

    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var serial = attrs.cardserial;
            var cardIndex = scope.$index;
            var products = shoppingCartModel.data.ProductsView;

            scope.$watch("card.Name", function (newVal, oldVal) {
                // Add watch for the current editing card.
                for (var i = 0; i < products.length; i++) {
                    if (products[i].IsProduct) {
                        products[i].TravelCards[cardIndex].Name = newVal;
                    } else if (products[i].IsProduct && products[i].Serial === serial) {
                        products[i].Name = newVal;
                    }
                }
            })
        }
    };

} ])

.controller("ChooseCardsCtrl", ["$scope", '$http', 'errorHandler', function ($scope, $http, errorHandler) {
    $scope.$watch("shopping_cart.data.ProductsView", function (newVal) {
        if (newVal.length > 0) {
            for (var i = 0; i < $scope.shopping_cart.data.ProductsView.length; i++) {
                if (typeof ($scope.shopping_cart.data.ProductsView[i].TravelCards) !== "undefined") {
                    for (var u = 0; u < $scope.shopping_cart.data.ProductsView[i].TravelCards.length; u++) {
                        $scope.shopping_cart.data.ProductsView[i].TravelCards[u]['CurrentName'] = $scope.shopping_cart.data.ProductsView[i].TravelCards[u].Name;
                    }
                }
            }
        }
    })

    $scope.shoppingCartContainsTickets = function () {
        for (var i in $scope.shopping_cart.data.ProductsView) {
            if ($scope.shopping_cart.data.ProductsView[i].IsProduct) {
                return true;
            }
        }
        return false;
    };
    $scope.changeCardName = function (card) {
        $scope.isChangingCardNameFor = card.Serial;
        var data = {
            travelCardSerial: card.Serial,
            name: card.Name
        };
        function callback(data) {
            //Success 
            $scope.isChangingCardNameFor = null;
            $scope.shopping_cart.data = data.data;
            $scope.setClicked("edit_card_name", "edit_new_card_" + card.Serial);

            if (typeof ($scope.shopping_cart.data.ValidationErrors.RenameTravelCard) !== "undefined") {
                $scope.shopping_cart.data.ValidationErrors.ValidateTravelCardSelection.form_errors.length = 0;
                $scope.shopping_cart.data.ValidationErrors.RenameTravelCard.form_errors[card.Serial].length = 0;
            }
        }
        function errorCallback(data, status, xhr, headers) {
            //Error 
            if (typeof ($scope.shopping_cart.data.ValidationErrors.RenameTravelCard) === "undefined") {
                $scope.shopping_cart.data.ValidationErrors.RenameTravelCard = {
                    form_errors: {}
                };
            }
            if (typeof ($scope.shopping_cart.data.ValidationErrors.ValidateTravelCardSelection) === "undefined") {
                $scope.shopping_cart.data.ValidationErrors.ValidateTravelCardSelection = {
                    form_errors: {}
                };
            }

            $scope.shopping_cart.data.ValidationErrors.RenameTravelCard.form_errors[card.Serial] = [];

            if (typeof (data.data.ResultErrors) !== "undefined" && typeof (data.data.ValidationErrors.travel_card_name) === "undefined") {

                $scope.shopping_cart.data.ValidationErrors.RenameTravelCard.form_errors[card.Serial] = data.data.ResultErrors;
            }

            if (status === 500) {
                $scope.shopping_cart.data.ValidationErrors.RenameTravelCard.form_errors[card.Serial].push(errorHandler.getErrorMessage());
            } else {
                $scope.shopping_cart.data.ValidationErrors.RenameTravelCard.form_errors[card.Serial].push(data.data.ValidationErrors.travel_card_name);
            }

            $scope.shopping_cart.data.ValidationErrors.ValidateTravelCardSelection.form_errors = data.data.ValidationErrors.form_errors;

            $scope.isChangingCardNameFor = null;

        }
        $http.post("/api/ECommerse/RenameTravelCard", data).success(callback).error(errorCallback);
    };

    $scope.validate = function (product, card) {

        var data = {
            form_name: "UserECommerseProductCardSelectorView",
            post_data: {}
        };

        $scope.validateStep("/api/ECommerse/ValidateTravelCardSelection", data, "Kopvillkor");

    };
    $scope.validateCardSelection = function (product, card, canAddProduct, isTravelPurse, canSelect) {
        if ((canAddProduct && !isTravelPurse) || (isTravelPurse && canSelect)) {
            var data = {
                id: product,
                travelCardSerial: card
            };
            var callback = function () {
                $scope.clickedItems["cardNoteGroup"] = null;
                $scope.clickedItems["cardGroup"] = card + "_" + product;
            };

            $scope.shopping_cart.selectTravelCard(data, callback);
        }
    };

} ])
.controller("ECommerseTravelCardCtrl", ["$scope", function ($scope) {
    $scope.data = {
        details: [],
        errors: ""
    };
    $scope.isLoadingCardDetails = false;
    $scope.expand = function (serial, ticket, id) {
        $scope.setClicked("cardGroup", serial + "_" + ticket);
        if ($scope.data.details.length == 0 && $scope.data.errors == "") {
            var callback = function (response) {
                var message = response.message || "";
                if (response.status == "success") {
                    $scope.data.details = response.data.travel_card;
                } else if (response.status == "error") {
                    $scope.data.errors = [message];
                }
                $scope.isLoadingCardDetails = false;
            };
            $scope.isLoadingCardDetails = true;
            $scope.shopping_cart.getCardDetails(id, callback);
        }
    };
} ])
.controller("RegisterCardCtrl", ["$scope", function ($scope) {
    $scope.data = {
        travel_card: {
            serial_number1: "",
            serial_number2: "",
            serial_number_verify1: "",
            serial_number_verify2: "",
            name: ""
        }
    };
    $scope.registerCard = function () {
        var data = {
            travel_card: {
                serial_number: [$scope.data.travel_card.serial_number1, $scope.data.travel_card.serial_number2],
                serial_number_verify: [$scope.data.travel_card.serial_number_verify1, $scope.data.travel_card.serial_number_verify2],
                name: $scope.data.travel_card.name
            }
        };
        var callback = function (response) {
            $scope.shopping_cart.getShoppingCart();
            $scope.data.travel_card.serial_number1 = "";
            $scope.data.travel_card.serial_number2 = "";
            $scope.data.travel_card.serial_number_verify1 = "";
            $scope.data.travel_card.serial_number_verify2 = "";
            $scope.data.travel_card.name = "";
            $scope.isRegisteringCard = false;
            window.SiteCatalyst.TrackClient("RegisterCard");
        };
        var errorCallback = function (response, status, headers, config) {
            $scope.shopping_cart.errorCallback(response, status, headers, config);
            $scope.isRegisteringCard = false;
        };
        $scope.isRegisteringCard = true;
        $scope.shopping_cart.registerTravelCard(data, callback, errorCallback);
    };
} ])
.controller("ChooseStandardTripCtrl", ["$scope", function ($scope) {
    $scope.setPursePriceLevel = function (id, val) {
        var data = {
            id: id,
            value: val
        };
        $scope.shopping_cart.setStandardTrip("/api/ECommerse/SetPursePriceLevel", data);
    };
    $scope.setPurseCoupons = function (id, val) {
        var data = {
            id: id,
            value: val
        };
        $scope.shopping_cart.setStandardTrip("/api/ECommerse/SetPurseCoupons", data);
    };
    $scope.validate = function () {
        var data = {
            form_name: "UserECommerseTravelPurseView",
            post_data: {}
        };
        $scope.validateStep("/api/ECommerse/ValidateTravelPurseSelection", data, "Kopvillkor");
    };
} ])
.controller("ImportantInfoCtrl", ["$scope", function ($scope) {
    $scope.delivery_options = {
        data: {
            email: $scope.shopping_cart.data.DeliveryEmail
        }
    };
    $scope.delivery_address = {
        option: "primary_address"
    };
    $scope.$watchCollection("shopping_cart.data.UserAuthenticated", function (newVal) {
        if (newVal) {
            var length = 0;
            var data = $scope.shopping_cart.data.UserSession.Address;
            for (var prop in data) {
                if (data.hasOwnProperty(prop)) {
                    length++;
                }
            }
            if (length > 0) {
                $scope.delivery_options.data.care_of = $scope.shopping_cart.data.UserSession.Address.care_of || "";
                $scope.delivery_options.data.street = $scope.shopping_cart.data.UserSession.Address.street;
                $scope.delivery_options.data.zip_code = $scope.shopping_cart.data.UserSession.Address.zip_code;
                $scope.delivery_options.data.city = $scope.shopping_cart.data.UserSession.Address.city;
            }
            $scope.delivery_options.data.first_name = $scope.shopping_cart.data.UserSession.FirstName;
            $scope.delivery_options.data.last_name = $scope.shopping_cart.data.UserSession.LastName;
        }
    });
    $scope.$watch("shopping_cart.data.DeliveryEmail", function (newVal) {
        if (newVal != undefined) {
            $scope.delivery_options.data.email = $scope.shopping_cart.data.DeliveryEmail;
        }
    });
    $scope.setDeliveryOptions = function () {
        for (var i in $scope.shopping_cart.data.DeliveryAddress) {
            $scope.delivery_options.data[$scope.shopping_cart.data.DeliveryAddress[i].Key] = $scope.shopping_cart.data.DeliveryAddress[i].Value;
        }
    };
    $scope.validate = function () {
        var data;
        if ($scope.delivery_address.option == 'alt_address' || !$scope.shopping_cart.data.UserAuthenticated) {
            data = $scope.delivery_options;
        } else {
            data = {
                data: {
                    terms_accepted: $scope.delivery_options.data.terms_accepted,
                    email: $scope.delivery_options.data.email,
                    national_address: true
                }
            };
        }
        $scope.validateStep("/api/ECommerse/ValidateDeliveryOptions", data, "Betalsatt");
    };
} ])
.controller("PaymentMethodCtrl", ["$scope", "$window", "$http", "errorHandler", "ajaxHandler", function ($scope, $window, $http, errorHandler, ajaxHandler) {
    $scope.validatePaymentSelection = function (value, ref) {
        ref = ref || null;
        var data = {
            reference: ref,
            value: value
        };
        $scope.shopping_cart.setPaymentMethod(data);
    };
    $scope.initPayment = function () {
        if (!$scope.disableButton) {
            $scope.disableButton = true;
            $scope.$emit("scrollToTop");
            var callback = function (response) {
                $scope.shopping_cart.data.Errors = response.data.Errors;
                $window.location.href = response.data.redirect;
                $scope.disableButton = false;
            };
            var errorCallback = function (response, status, headers, config) {
                $scope.shopping_cart.errorCallback(response, status, headers, config);
                $scope.disableButton = false;
            };
            
            ajaxHandler.getData("/api/ECommerse/InitPayment", callback, errorCallback);
            window.SiteCatalyst.TrackClient("PaymentMethod", $scope.shopping_cart.data.PaymentMethod);
        }
    };
} ])
.controller("ReceiptCtrl", ["$scope", "ajaxHandler", function ($scope, ajaxHandler) {
    $scope.isLoadingReceipt = false;
    $scope.$on("getReceipt", function () {

        var callback = function (response) {

            $scope.isLoadingReceipt = false;
            $scope.shopping_cart.data.PaymentReceipt = response.data.PaymentReceipt;
            $scope.shopping_cart.data.ProductsView = response.data.ProductsView;

            window.SiteCatalyst.TrackClient("Purchase", $scope.shopping_cart.data.PaymentReceipt.sales_order);
        };
        var errorCallback = function (response, status, header, config) {
            $scope.shopping_cart.errorCallback(response, status, header, config);
            $scope.isLoadingReceipt = false;

        };
        $scope.isLoadingReceipt = true;
        ajaxHandler.getData("/api/ECommerse/VerifyOrGetPayment", callback, errorCallback);



    });
} ]);