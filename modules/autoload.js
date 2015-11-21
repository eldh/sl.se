var autoload = angular.module('slapp');

autoload.controller("AutoloadCtrl", ["$scope", function ($scope) {
    $scope.isOrderingAutoload = false;
    $scope.isUpdatingAutoload = false;
    $scope.showPaymentMethodForm = false;
    $scope.isCancelingAutoload = false;
    $scope.autoload = {
        payment_media: 0,
        terms_accepted: false,
        send_email_confirmations: false
    };

    $scope.$watch("data.details.autoload_contract", function (newVal) {
        if (newVal != undefined && newVal != null) {
            $scope.autoload.send_email_confirmations = newVal.send_email_confirmations;
            if (newVal.payment_media_ref != undefined && newVal.payment_media_ref != null) {
                $scope.autoload.payment_media = newVal.payment_media_ref.ref;
            }
        }
    });

    $scope.setupAutoload = function () {
        if (!$scope.isOrderingAutoload) {
            $scope.isOrderingAutoload = true;
            var data = {
                autoload: {
                    terms_accepted: $scope.autoload.terms_accepted,
                    travel_card_ref: {
                        ref: $scope.data.travelCardId
                    },
                    payment: {
                        value: $scope.autoload.payment_media,
                        reference: ""
                    },
                    send_email_confirmations: $scope.autoload.send_email_confirmations
                }
            };
            if (data.autoload.payment.value != 0 && data.autoload.payment.value != 1) {
                data.autoload.payment.value = 2;
                data.autoload.payment.reference = $scope.autoload.payment_media;
            }
            var callback = function (response) {
                $scope.isOrderingAutoload = false;
                $scope.data.details.autoload_contract = response.data.autoload_contract;
                $scope.data.autoload_status_text = $scope.getAutoloadStatus(response.data.autoload_contract.status_ext);
            };
            var errorCallback = function (response, status, header, config) {
                $scope.shopping_cart.errorCallback(response, status, header, config);
                $scope.isOrderingAutoload = false;
            };
            $scope.shopping_cart.setupAutoload(data, callback, errorCallback);
        }
    };

    $scope.listAutoloadContracts = function () {
        if (!$scope.isOrderingAutoload) {
            $scope.isOrderingAutoload = true;
            var data = {
                autoload: {
                    travel_card_ref: {
                        ref: $scope.data.travelCardId
                    }
                }
            };
            var callback = function (response) {
                $scope.isOrderingAutoload = false;
            };
            var errorCallback = function (response, status, header, config) {
                $scope.shopping_cart.errorCallback(response, status, header, config);
                $scope.isOrderingAutoload = false;
            };
            $scope.shopping_cart.listAutoloadContracts(data, callback, errorCallback);
        }
    };

    $scope.resetUpdateForm = function () {
        $scope.autoload.send_email_confirmations = $scope.data.details.autoload_contract.send_email_confirmations;
    };

    $scope.activateAutoload = function () {
        if (!$scope.isOrderingAutoload) {
            $scope.isOrderingAutoload = true;
            var data = {
                autoload: {
                    autoload_contract_href: "autoload_contract/50"
                }
            };
            var callback = function (response) {
                $scope.isOrderingAutoload = false;

            };
            var errorCallback = function (response, status, header, config) {
                $scope.shopping_cart.errorCallback(response, status, header, config);
                $scope.isOrderingAutoload = false;
            };
            $scope.shopping_cart.activateAutoload(data, callback, errorCallback);
        }
    };

    $scope.updateAutoload = function () {
        if (!$scope.isUpdatingAutoload) {
            $scope.isUpdatingAutoload = true;
            var data = {
                autoload: {
                    autoload_contract: {
                        href: "autoload_contract/" + $scope.data.details.autoload_contract.contract_number
                    },
                    update: {
                        payment: {
                            value: $scope.autoload.payment_media,
                            reference: ""
                        },
                        send_email_confirmations: $scope.autoload.send_email_confirmations
                    }
                }
            };
            if (data.autoload.update.payment.value != 0 && data.autoload.update.payment.value != 1) {
                data.autoload.update.payment.value = 2;
                data.autoload.update.payment.reference = $scope.autoload.payment_media;
            }
            
            var callback = function (response) {
                $scope.isUpdatingAutoload = false;
                $scope.data.details.autoload_contract = response.data.autoload_contract;
                $scope.autoload.showUpdateForm = false;
            };
            var errorCallback = function (response, status, header, config) {
                $scope.shopping_cart.errorCallback(response, status, header, config);
                $scope.isUpdatingAutoload = false;
            };
            $scope.shopping_cart.updateAutoload(data, callback, errorCallback);
        }
    };

    $scope.cancelAutoload = function () {
        if (!$scope.isCancelingAutoload) {
            $scope.isCancelingAutoload = true;
            var data = {
                autoload: {
                    autoload_contract_ref: "autoload_contract/" + $scope.data.details.autoload_contract.contract_number
                }
            };
            var callback = function (response) {
                $scope.isCancelingAutoload = false;
                $scope.data.details.autoload_contract = response.data.autoload_contract;
                $scope.data.autoload_status_text = $scope.getAutoloadStatus(response.data.autoload_contract.status_ext);
            };
            var errorCallback = function (response, status, header, config) {
                $scope.shopping_cart.errorCallback(response, status, header, config);
                $scope.isCancelingAutoload = false;
            };
            $scope.shopping_cart.cancelAutoload(data, callback, errorCallback);
        }
    };
}]);