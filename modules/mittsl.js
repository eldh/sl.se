var mittsl = angular.module('slapp');
var hasBeenAssigned = false; // Not optimal

mittsl.directive("gallery", function () {
    return function (scope, element) {

        var self = this;
        var itemInfo = $("<li></li>").addClass('active-card-actions').attr("aria-expanded", "true").attr("tabindex", "-1");
        var currentIndex = null;
        var currentItem = null;
        var prevClickedEl = "";

        self.init = function () {
            scope.$watchCollection("shopping_cart.data.UserTravelCards", function () {
                if (!hasBeenAssigned) {
                    initItems(element);
                    hasBeenAssigned = true;
                }

            });
        };

        var initItems = function (el) {

            el.find('.galleryItem.clickable').each(function () {
                assignItemClickEvent.call(this, $(this).attr('class'));
            });
        };

        var assignItemClickEvent = function () {
            var clickedEl = $(this),
                gallery = clickedEl.closest(".gallery");

            clickedEl.click(function (e, skipApply) {

                e.stopPropagation();
                scope.shopping_cart.data.ValidationErrors = {};

                if (skipApply != true) {
                    scope.$apply();
                }

                if (prevClickedEl != "") {
                    $(".active-card-actions .card-actions").appendTo(prevClickedEl.find(".card-actions-tpl"));
                }

                prevClickedEl = $(this);

                var clickedIndex = $(this).closest(".gallery").index() + " " + $(this).index(".galleryItem");
                gallery.find('.galleryItem').removeClass('sel').attr("aria-pressed", "false");

                if (currentItem == clickedIndex) {
                    currentItem = null;
                    currentIndex = null;
                    $('.expandedrow').removeClass('expandedrow');
                    itemInfo.empty();
                    gallery.find('.active-card-actions').remove();
                    return false;
                } else if (!scope.skipScroll) {
                    $.view.actions.scrollTo(clickedEl.find(".card"));
                }

                currentItem = clickedIndex;

                clickedEl.addClass('sel').attr("aria-pressed", "true");
                var edgeElement = findEdge.call(this, "find edge");

                if (!($(edgeElement).hasClass('expandedrow'))) {
                    $('.expandedrow').removeClass('expandedrow');
                    gallery.find('.active-card-actions').remove();

                    $(edgeElement).addClass('expandedrow');
                    $(edgeElement).after(itemInfo);
                }
                itemInfo.empty();

                var itemData = $('<div></div>').addClass('itemData');

                var content = clickedEl.find(".card-actions");

                itemData.append(content);
                itemInfo.append(itemData);

                if (!scope.skipScroll) {
                    gallery.find('.active-card-actions').focus();
                } else {
                    scope.skipScroll = false;
                }
            });
        };

        var findEdge = function () {
            var edgeElement = $(this);
            var clickedElPos = $(this).position().top;
            $(this).nextAll().each(function () {
                //Check if top position has changed
                //break out of the loop when it has
                if (clickedElPos != $(this).position().top) {
                    return false;
                }
                edgeElement = this;
            });
            return edgeElement;
        };

        self.init();
    };
})
.directive("travelCard", function () {
    return function (scope, element) {
        scope.setMaxHeight = function () {
            if ((element.closest(".galleryItem").css("display") == "inline-block"
                || element.closest(".galleryItem").css("float") == "left")
                && element.height() > scope.shopping_cart.data.cardMaxHeight
            ) {
                scope.shopping_cart.data.cardMaxHeight = element.height();
            }
        };
        scope.expandCard = function (autoload) {
            element.closest(".galleryItem").trigger("click", true);
            if (autoload == true) {
                scope.setClicked("actionsGroup", "autoload");
            }
        };
    };
})
.directive("getTravelFundsHistory", function () {
    return function (scope, element) {
        element.on("change", function () {
            scope.getTravelCardHistory();
        });
    };
});

mittsl.controller("MittSLCtrl", ['$scope', '$rootScope', 'shoppingCartModel', 'ajaxHandler', '$timeout', '$location', function ($scope, $rootScope, shoppingCartModel, ajaxHandler, $timeout, $location) {
    //console.log("init MittSL");
    $scope.shopping_cart = shoppingCartModel;
    $scope.authentication_method_selected = 'no';
    $scope.clickedItems = {};
    $scope.firstTime = {};
    $scope.FirstTimeLoginPathName = 'inloggning';
    $scope.CompleteAccountInfo = 'slutforkonto';
    $scope.FirstTimeLoginSecondPathName = 'confirmation';
    $scope.FirstTimeLoginCompletePathName = '/';
    $rootScope.showFirstTimeLogin = false;
    $rootScope.showFirstTimeLoginSecondStep = false;
    $rootScope.showCompleteAccountInfo = false;
    $scope.upgrade_account = {
        user_account: {
            private_customer: {
                first_name: "",
                last_name: "",
                birth_date: "",
                person_number: ""
            }
        }
    };

    $scope.complete_account = {
        user_account: {
            private_customer: {
                email: '',
                re_email: '',
                direct_advertising: false,
                terms_accepted: false
            }
        },
        validation_errors: {},
        general_form_errors: []
    };

    $scope.skipScroll = false;
    $scope.lossReportReceipt = false;
    $scope.unregisterCardReceipt = false;
    $scope.disableUpgradeAccount = false;
    $scope.isVerifyingAutoload = false;
    var autoloadVerification = function () {
        if ($location.path().replace(/\//g, "").toLowerCase() == "autoload" && $scope.shopping_cart.data.AutoExpandCard != "") {
            var callback = function (response) {
                $scope.$broadcast("autoloadVerified", response.data.autoload_contract);
                $scope.isVerifyingAutoload = false;
            };
            var errorCallback = function (response, status, header, config) {
                $scope.shopping_cart.errorCallback(response, status, header, config);
                $scope.isVerifyingAutoload = false;
            };
            $scope.shopping_cart.verifyAutoload(callback, errorCallback);
        }
    };

    function handleUrl(path) {
        // path = ex. /confirmation
        path = path.replace(/\//g, "");
        $scope.path = path;
        $rootScope.showFirstTimeLogin = false;
        $rootScope.showFirstTimeLoginSecondStep = false;
        $rootScope.showCompleteAccountInfo = false;

        if (path === $scope.FirstTimeLoginSecondPathName) {
            $rootScope.showFirstTimeLoginSecondStep = true;
        } else if (path === $scope.CompleteAccountInfo) {
            $rootScope.showCompleteAccountInfo = true;
        }
    };

    $scope.completeFirstTimeLogin = function () {
        // Just a redirect
        $location.path($scope.FirstTimeLoginCompletePathName);
    };

    $scope.ChangeProfileSettings = function () {
        // Populate data object. Ready to send to ChangeProfileSettings service.
        var usrauth = ($scope.firstTime.username_authentication === 'yes' || $scope.firstTime.username_authentication === 'true') ? true : false;
        var data = {
            "user_account": {
                "username_authentication": usrauth
            }
        };
        // Handle the final step
        function finalStep() {
            if (usrauth) {
                $scope.completeFirstTimeLogin();
            } else {
                $location.path($scope.FirstTimeLoginSecondPathName);
            }
        }
        // Handle the returning data if status is success.
        function callback(data, status) {
            // Hide loader
            $scope.showLoader = false;
            // Redirect to external url from arguments
            finalStep();
        }
        function errorCallback(data, status, errorXhr, headers) {
            // Hide loader
            $scope.showLoader = false;
            // Show error/s
            finalStep();
        }
        // Show loader
        $scope.showLoader = true;
        // Do post
        ajaxHandler.postData("/api/MySL/ChangeProfileSettings", data, callback, errorCallback);
    };

    $scope.upgradeAccount = function () {
        if (!$scope.disableUpgradeAccount) {
            $scope.disableUpgradeAccount = true;
            var callback = function (response) {
                $scope.disableUpgradeAccount = false;
                $scope.shopping_cart.getShoppingCart();
            };
            var errorCallback = function (response, status, header, config) {
                $scope.shopping_cart.errorCallback(response, status, header, config);
                $scope.disableUpgradeAccount = false;
            };
            ajaxHandler.postData("/api/MySL/UpgradeAccount", $scope.upgrade_account, callback, errorCallback);
        }
    };
    function validateCompleteAccountForm() {

        $scope.complete_account.validation_errors = {};

        if ($scope.complete_account.user_account.private_customer.re_email !== $scope.complete_account.user_account.private_customer.email) {
            $scope.complete_account.validation_errors.email = "Epostadress och Upprepa Epostadress är inte samma";
            $scope.complete_account.validation_errors.re_mail = "Epostadress och Upprepa Epostadress är inte samma";
        }

        for (var key in $scope.complete_account.user_account.private_customer) {
            var value = $scope.complete_account.user_account.private_customer[key];
            if (value.length === 0 || value === "") {
                $scope.complete_account.validation_errors[key] = key + " får inte vara tom";
            }
        }
        if ($scope.complete_account.user_account.private_customer.re_email.indexOf("@") === -1 || $scope.complete_account.user_account.private_customer.re_email.slice(-4, $scope.complete_account.user_account.private_customer.re_email.length).indexOf(".") === -1) {
            $scope.complete_account.validation_errors.re_email = "Epostadress saknar @ eller .";
        }
        if ($scope.complete_account.user_account.private_customer.email.indexOf("@") === -1 || $scope.complete_account.user_account.private_customer.email.slice(-4, $scope.complete_account.user_account.private_customer.email.length).indexOf(".") === -1) {
            $scope.complete_account.validation_errors.email = "Epostadress saknar @ eller .";
        }
        if (!$scope.complete_account.user_account.private_customer.terms_accepted) {
            $scope.complete_account.validation_errors.terms_accepted = "Du måste acceptera kontovillkoren";
        }

    }

    $scope.complementuserAccount = function () {
        validateCompleteAccountForm();
        if (JSON.stringify($scope.complete_account.validation_errors) !== "{}") {
            return false;
        }
        var data = {
            settings: {
                email: $scope.complete_account.user_account.private_customer.email,
                directadvertising: $scope.complete_account.user_account.private_customer.direct_advertising,
                approve: true
            }
        };

        // Validera mail?

        // Validera att man har godkänt villkor?

        var callback = function (response) {
            //    alert('success');
            $location.path("/");
        };

        var errorCallback = function (response, status, header, config) {
            // fel hantering
            $scope.complete_account.general_form_errors = response.data.ResultErrors;
        };

        var url = "/api/MySL/AccountSetEmailAndApproveTerms";
        ajaxHandler.postData(url, data, callback, errorCallback);
    };


    $scope.$watch(function () {
        return $location.path();
    }, function (newVal) {
        handleUrl(newVal);
    });

    $scope.$watch("shopping_cart.data.UserTravelCards", function (newVal) {
        if (newVal != undefined) {
            if ($location.path().replace(/\//g, "").toLowerCase() == "autoload" && $scope.shopping_cart.data.AutoExpandCard != "") {
                $scope.isVerifyingAutoload = true;
            }
            if (newVal.length == 1 && !$scope.isVerifyingAutoload) {
                $timeout(function () {
                    $scope.skipScroll = true;
                    $(".galleryItem:first .card").trigger("click");
                });
            }
        }
    });

    $scope.$watch("shopping_cart.data.UserSession.AccountSettings.authentication_method_selected.value", function (newVal) {

        // Waiting for shopping cart object to load. (authentication_method_selected value)

        if ($scope.path === $scope.FirstTimeLoginPathName && newVal === 'yes') {
            $scope.completeFirstTimeLogin();
        }
        else if ($scope.path === $scope.FirstTimeLoginPathName && newVal === 'no') {
            $rootScope.showFirstTimeLogin = true;
            $rootScope.showFirstTimeLoginSecondStep = false;
        }
    });

    $scope.$watch("shopping_cart.data.loadedTravelCards", function (newVal) {
        $timeout(function () {
            if (newVal >= $(".galleryItem").length) {
                if ($scope.isVerifyingAutoload) {
                    autoloadVerification();
                }
                if ($(".mitt-sl .card-list > li:first").css("display") == "inline-block" || $(".mitt-sl .card-list > li:first").css("float") == "left") {
                    setCardHeight();
                }
            }
        });
    });
    var setCardHeight = function () {
        var card,
            maxHeight;
        $(".card").each(function () {
            card = $(this);
            maxHeight = $scope.shopping_cart.data.cardMaxHeight;
            if (card.height() != maxHeight) {
                card.height(maxHeight);
            }
        });
    };
    $scope.$on("showLossReportReceipt", function (event, args) {
        $scope.lossReportReceipt = true;
        $scope.loss_report_issue_number = args.data.issue.issue_number;
        $scope.loss_report_serial_number = args.data.issue.travel_card_ref.description;
    });
    $scope.$on("showUnregisterCardReceipt", function (event, args) {
        $scope.unregisterCardReceipt = true;
        $scope.unregister_card_serial_number = args;
    });

} ])
.controller("TravelCardCtrl", ["$scope", "ajaxHandler", "$filter", "$timeout", "$location", function ($scope, ajaxHandler, $filter, $timeout, $location) {
    $scope.clickedItems = {
        ticket: undefined
    };
    $scope.data = {
        name: "",
        temp_name: "",
        travelCardSerial: "",
        travelCardId: "",
        delivery_address_option: "primary_address",
        periodTicketPrice: "Full",
        delivery_address: {
            recipient_1: "",
            care_of: "",
            street: "",
            zip_code: "",
            city: ""
        },
        details: {},
        autoload_status_text: "AV",
        end_date: "",
        travel_card_history: [],
        travel_card_history_limit: 50,
        travel_card_history_skip: 0,
        currentTravelCardHistory: {
            end_date: ""
        },
        debug_test_mode: false,
        errors: []
    };
    $scope.dateChoices = [];
    $scope.date = new Date();
    $scope.disableRenameCard = false;
    $scope.disableSendLossReport = false;
    $scope.disableUnregisterCard = false;
    $scope.isLoadingTravelCardHistory = false;
    $scope.isLoadingMoreTravelCardHistory = false;
    $scope.addingProduct = null;
    var hasLoadedTravelCardHistory = false;
    $scope.getAutoloadStatus = function (status) {
        switch (status) {
            case "not_activated":
                return "AV";
            case "pending_activation":
                return "PÅ*";
            case "active":
                return "PÅ";
            case "pending_cancellation":
                return "AV*";
            default:
                return "AV";
        }
    };
    $scope.$on("autoloadVerified", function (event, args) {
        if (args.travel_card_ref.ref == $scope.data.travelCardId) {
            $scope.data.details.autoload_contract = args;
            $scope.data.autoload_status_text = $scope.getAutoloadStatus(args.status_ext);
        }
    });
    var getCardDetails = function (id) {
        var callback = function (response) {
            var message = response.message || "";
            if (response.status == "success") {
                $scope.data.details = response.data.travel_card;
                if (response.data.travel_card.autoload_contract != undefined && response.data.travel_card.autoload_contract != null) {
                    if (response.data.travel_card.autoload_contract.status_ext == "not_activated" && response.data.travel_card.detail.purse_autoload) {
                        $scope.data.autoload_status_text = $scope.getAutoloadStatus("active");
                    } else {
                        $scope.data.autoload_status_text = $scope.getAutoloadStatus(response.data.travel_card.autoload_contract.status_ext);
                    }
                } else if (response.data.travel_card.autoload_contract == undefined && response.data.travel_card.detail.purse_autoload) {
                    $scope.data.autoload_status_text = $scope.getAutoloadStatus("active");
                }
            } else if (response.status == "error") {
                $scope.data.errors = [message];
            }
            $scope.isLoadingCardDetails = false;
            if ($location.path().replace(/\//g, "").toLowerCase() == "autoload" && response.data.travel_card.href == $scope.shopping_cart.data.AutoExpandCard) {
                $scope.expandCard(true);
            }
            $timeout(function () {
                $scope.setMaxHeight();
            });
        };
        $scope.isLoadingCardDetails = true;
        $scope.shopping_cart.getCardDetails(id, callback);
    };
    $scope.$watchCollection("data.travelCardId", function () {
        getCardDetails($scope.data.travelCardId);
    });
    $scope.resetField = function (field) {
        $scope.data[field] = "";
    };
    $scope.renameTravelCard = function () {
        if (!$scope.disableRenameCard) {
            $scope.disableRenameCard = true;
            var data = {
                travel_card: {
                    href: $scope.data.travelCardId,
                    serial_number: $scope.data.travelCardSerial,
                    name: $scope.data.temp_name
                }
            };
            var callback = function (response) {
                $scope.disableRenameCard = false;
                $scope.data.name = $scope.data.temp_name = response.data.travel_card.name;
                $scope.setClicked('renameCard', false);
            };
            var errorCallback = function (response, status, header, config) {
                $scope.shopping_cart.errorCallback(response, status, header, config);
                $scope.disableRenameCard = false;
            };
            $scope.shopping_cart.renameTravelCard(data, callback, errorCallback);
        }
    };
    $scope.cancelRenameTravelCard = function () {
        if (!$scope.disableRenameCard) {
            $scope.setClicked('renameCard', false);
            $scope.data.temp_name = $scope.data.name;
        }
    };
    $scope.initTravelCardHistory = function () {
        if (!hasLoadedTravelCardHistory) {
            $scope.getTravelCardHistory();
        }
    };
    $scope.getTravelCardHistory = function () {
        if (!$scope.isLoadingTravelCardHistory) {
            $scope.isLoadingTravelCardHistory = true;
            $scope.data.travel_card_history_skip = 0;
            var data = {
                travel_card: {
                    serial_number: $scope.data.travelCardSerial,
                    end_date: $scope.data.end_date,
                    limit: $scope.data.travel_card_history_limit,
                    skip: $scope.data.travel_card_history_skip
                }
            };
            var callback = function (response) {
                $scope.data.travel_card_history = response.data.travel_card_transaction_list;
                $scope.data.currentTravelCardHistory.end_date = $scope.data.end_date;
                $scope.isLoadingTravelCardHistory = false;
                if (response.data.travel_card_transaction_list.length == $scope.data.travel_card_history_limit) {
                    $scope.showMoreButton = true;
                } else {
                    $scope.showMoreButton = false;
                }
                hasLoadedTravelCardHistory = true;
            };
            var errorCallback = function (response, status, header, config) {
                $scope.shopping_cart.errorCallback(response, status, header, config);
                $scope.isLoadingTravelCardHistory = false;
                hasLoadedTravelCardHistory = true;
            };
            var url = "/api/MySL/GetTravelCardHistory";
            ajaxHandler.postData(url, data, callback, errorCallback);
        }
    };
    $scope.showMoreTravelCardHistory = function () {
        $scope.isLoadingMoreTravelCardHistory = true;
        $scope.data.travel_card_history_skip += $scope.data.travel_card_history_limit;
        var data = {
            travel_card: {
                serial_number: $scope.data.travelCardSerial,
                end_date: $scope.data.currentTravelCardHistory.end_date,
                limit: $scope.data.travel_card_history_limit,
                skip: $scope.data.travel_card_history_skip
            }
        };
        var callback = function (response) {
            $scope.data.travel_card_history = $scope.data.travel_card_history.concat(response.data.travel_card_transaction_list);
            $scope.isLoadingMoreTravelCardHistory = false;
            if (response.data.travel_card_transaction_list.length == $scope.data.travel_card_history_limit) {
                $scope.showMoreButton = true;
            } else {
                $scope.showMoreButton = false;
            }
        };
        var errorCallback = function (response, status, header, config) {
            $scope.shopping_cart.errorCallback(response, status, header, config);
            $scope.isLoadingMoreTravelCardHistory = false;
        };
        var url = "/api/MySL/GetTravelCardHistory";
        ajaxHandler.postData(url, data, callback, errorCallback);
    };
    $scope.populateDateChoices = function () {

        var years = 3;
        var days = 365 * years;
        var start = new Date();
        var end = new Date(Date.parse($scope.date) - (24 * days) * 3600 * 1000 - 1);
        end.setDate(end.getDate());
        start = new Date(start.setDate(start.getDate()));
        $scope.dateChoices.push({ name: "idag", value: $filter("date")(start, "yyyy-MM-dd") });

        start = new Date(start.setDate(start.getDate() - 15));

        while (start > end) {
            $scope.dateChoices.push({ name: $filter("date")(start, "EEE dd MMM yyyy"), value: $filter("date")(start, "yyyy-MM-dd") });
            start = new Date(start.setDate(start.getDate() - 15));
        }

        $scope.data.end_date = $scope.dateChoices[0].value;
    };
    $scope.populateDateChoices();
    $scope.populateAlternativeAddress = function () {
        $scope.data.delivery_address.recipient_1 = $scope.shopping_cart.data.UserSession.FullName;
        var length = 0;
        var data = $scope.shopping_cart.data.UserSession.Address;
        for (var prop in data) {
            if (data.hasOwnProperty(prop)) {
                length++;
            }
        }
        if (length > 0) {
            $scope.data.delivery_address.care_of = $scope.shopping_cart.data.UserSession.Address.care_of || "";
            $scope.data.delivery_address.street = $scope.shopping_cart.data.UserSession.Address.street;
            $scope.data.delivery_address.zip_code = $scope.shopping_cart.data.UserSession.Address.zip_code;
            $scope.data.delivery_address.city = $scope.shopping_cart.data.UserSession.Address.city;
        }
    };
    $scope.populateAlternativeAddress();
    $scope.sendLossReport = function (index) {
        if (!$scope.disableSendLossReport) {
            $scope.disableSendLossReport = true;
            var callback = function (response) {
                $scope.disableSendLossReport = false;
                $scope.$emit("showLossReportReceipt", response);
                $scope.shopping_cart.data.UserBlockedTravelCards.push($scope.shopping_cart.data.UserTravelCards[index]);
                $scope.shopping_cart.data.UserTravelCards.splice(index, 1);
                $('.gallery').find('.active-card-actions').remove();
                window.SiteCatalyst.TrackClient("LossReport");
            };
            var errorCallback = function (response, status, header, config) {
                $scope.shopping_cart.errorCallback(response, status, header, config);
                $scope.disableSendLossReport = false;
                $scope.confirmSendLossReport = false;
            };
            var url = "/api/MySL/SubmitLostTravelCard";
            var data;
            if ($scope.data.delivery_address_option == "alt_address") {
                data = {
                    travel_card: {
                        href: $scope.data.travelCardId,
                        serial_number: $scope.data.travelCardSerial,
                        delivery_address: $scope.data.delivery_address
                    }
                };
            } else {
                data = {
                    travel_card: {
                        href: $scope.data.travelCardId,
                        serial_number: $scope.data.travelCardSerial,
                        national_address: true
                    }
                };
            }
            if ($scope.data.debug_test_mode) {
                data.travel_card.debug_test_mode = true;
            }

            ajaxHandler.postData(url, data, callback, errorCallback);
        }
    };
    $scope.cancelSendLossReport = function () {
        if (!$scope.disableSendLossReport) {
            $scope.confirmSendLossReport = false;
        }
    };
    $scope.unregisterTravelCard = function (serial, href) {
        if (!$scope.disableUnregisterCard) {
            $scope.disableUnregisterCard = true;
            var callback = function (response) {
                $scope.shopping_cart.getShoppingCart();
                $scope.disableUnregisterCard = false;
                $scope.$emit("showUnregisterCardReceipt", $scope.data.travelCardSerial);
            };
            var errorCallback = function (response, status, header, config) {
                $scope.shopping_cart.errorCallback(response, status, header, config);
                $scope.disableUnregisterCard = false;
                $scope.cancelUnregisterCard();
            };
            hasBeenAssigned = false;
            $scope.shopping_cart.unregisterTravelCard(serial, href, callback, errorCallback);
        }
    };
    $scope.cancelUnregisterCard = function () {
        if (!$scope.disableUnregisterCard) {
            $scope.confirmUnregisterCard = false;
        }
    };
    $scope.setClicked = function (key, val) {
        if ((key == "ticket" || key == "actionsGroup" || key == "paymentMethods" || key == "terms")
            && $scope.clickedItems[key] == val) {
            $scope.clickedItems[key] = undefined;
        } else {
            $scope.clickedItems[key] = val;
        }

        if (key == "actionsGroup") {
            $scope.clickedItems["ticket"] = undefined;
        }
    };
} ])
.controller("MittSLAsideCtrl", ["$scope", "$http", "shoppingCartModel", "errorHandler", "ajaxHandler", function ($scope, $http, shoppingCartModel, errorHandler, ajaxHandler) {
    
    $scope.shopping_cart = shoppingCartModel;
    $scope.clickedItems = {};
    $scope.disableChangeProfile = false;
    $scope.disableElogin = !isEloginEnabled;
    $scope.isRegisteringCard = false;
    $scope.disableSavedPaymentMedia = [];
    $scope.disableChangePassword = false;
    $scope.disableChangeUsername = false;
    $scope.hasLoadedInternetPurchases = false;
    $scope.isLoadingUserSession = true;
    $scope.data = {
        travel_card: {
            serial_number1: "",
            serial_number2: "",
            serial_number_verify1: "",
            serial_number_verify2: "",
            name: ""
        },
        profile: {
            user_account: {
                email: "",
                cell_phone: "",
                address: {
                    care_of: "",
                    street: "",
                    zip_code: "",
                    city: ""
                },
                direct_advertising: false,
                username_authentication: false
            },
            temp: {
                user_account: {
                    email: "",
                    cell_phone: "",
                    address: {
                        care_of: "",
                        street: "",
                        zip_code: "",
                        city: ""
                    },
                    direct_advertising: false,
                    username_authentication: false
                }
            }
        },
        change_password: {
            user_account: {
                username: "",
                password: "",
                new_password: "",
                new_password_verify: ""
            }
        },
        change_username: {
            user_account: {
                username: "",
                new_username: "",
                new_username_verify: ""
            }
        }
    };
    $scope.internet_purchases = {
        errors: [],
        data: []
    };

    $scope.$watchCollection("shopping_cart.data.UserSession", function (newVal) {
        if (newVal != undefined && newVal.Address != null) {
            $scope.isLoadingUserSession = false;
            $scope.data.profile.user_account.email = $scope.data.profile.temp.user_account.email = newVal.Email;
            $scope.data.profile.user_account.cell_phone = $scope.data.profile.temp.user_account.cell_phone = newVal.CellPhone;
            $scope.data.profile.user_account.address.care_of = $scope.data.profile.temp.user_account.address.care_of = newVal.Address.care_of;
            $scope.data.profile.user_account.address.street = $scope.data.profile.temp.user_account.address.street = newVal.Address.street;
            $scope.data.profile.user_account.address.zip_code = $scope.data.profile.temp.user_account.address.zip_code = newVal.Address.zip_code;
            $scope.data.profile.user_account.address.city = $scope.data.profile.temp.user_account.address.city = newVal.Address.city;
            if (newVal.AccountSettings.direct_advertising) {
                $scope.data.profile.user_account.direct_advertising = $scope.data.profile.temp.user_account.direct_advertising = newVal.AccountSettings.direct_advertising.value == "true" || newVal.AccountSettings.direct_advertising.value == true ? true : false;
            }
            if (newVal.AccountSettings.username_authentication) {
                $scope.data.profile.user_account.username_authentication = $scope.data.profile.temp.user_account.username_authentication = newVal.AccountSettings.username_authentication.value == "yes" || newVal.AccountSettings.username_authentication.value == true ? 'yes' : 'no';
            }
        }
    });

    $scope.resetField = function (field) {
        $scope.data[field] = "";
    };
    $scope.registerCard = function () {
        if (!$scope.isRegisteringCard) {
            $scope.isRegisteringCard = true;
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
                $scope.shopping_cart.data.ErrorSource = response.data.ErrorSource;
                $scope.isRegisteringCard = false;
            };
            hasBeenAssigned = false;
            $scope.shopping_cart.registerTravelCard(data, callback, errorCallback);
        }
    };
    $scope.getInternetPurchases = function () {
        if (!$scope.isLoadingInternetPurchases && !$scope.hasLoadedInternetPurchases) {
            var url = "/api/MySL/GetSalesOrders";
            $scope.isLoadingInternetPurchases = true;
            $http.get(url).
            success(function (response, status, headers) {
                $scope.isLoadingInternetPurchases = false;
                $scope.hasLoadedInternetPurchases = true;
                if (response.status == "success") {
                    $scope.internet_purchases.data = response.data.sales_order_list;
                } else {
                    $scope.internet_purchases.errors = [errorHandler.getErrorMessage()];
                }
            }).
            error(function (response, status, headers, config) {
                $scope.isLoadingInternetPurchases = false;
                $scope.hasLoadedInternetPurchases = true;
                headers = headers();
                if (!headers || Object.keys(headers).length == 0) {
                    // aborted by user
                    return;
                } else if (response.data != undefined && response.data.ValidationErrors != undefined) {
                    $scope.shopping_cart.errorCallback(response, status, headers, config);
                } else {
                    $scope.internet_purchases.errors = [errorHandler.getErrorMessage()];
                }
            });
        }
    };
    $scope.changeProfile = function () {
        if (!$scope.disableChangeProfile) {
            $scope.disableChangeProfile = true;
            var callback = function (response) {
                $scope.data.profile.user_account.email = response.data.private_customer.email;
                $scope.data.profile.user_account.cell_phone = response.data.private_customer.cell_phone;
                $scope.data.profile.user_account.address.care_of = response.data.private_customer.address.care_of;
                $scope.data.profile.user_account.address.street = response.data.private_customer.address.street;
                $scope.data.profile.user_account.address.zip_code = response.data.private_customer.address.zip_code;
                $scope.data.profile.user_account.address.city = response.data.private_customer.address.city;
                $scope.data.profile.user_account.direct_advertising = $scope.data.profile.temp.user_account.direct_advertising;
                $scope.data.profile.user_account.username_authentication = $scope.data.profile.temp.user_account.username_authentication;
                $scope.disableChangeProfile = false;
                $scope.setProfileData = false;
            };
            var errorCallback = function (response, status, header, config) {
                $scope.shopping_cart.errorCallback(response, status, header, config);
                $scope.data.profile.user_account.username_authentication = $scope.data.profile.temp.user_account.username_authentication;
                $scope.disableChangeProfile = false;
            };

            $scope.data.profile.temp.user_account.username_authentication = ($scope.data.profile.temp.user_account.username_authentication === 'no' || $scope.data.profile.temp.user_account.username_authentication === 'false') ? false : true;
            if ($scope.disableElogin) {
                delete $scope.data.profile.temp.user_account.username_authentication;
            }
            ajaxHandler.postData("/api/MySL/ChangeProfile", $scope.data.profile.temp, callback, errorCallback);
        }
    };
    $scope.cancelChangeProfile = function () {
        if (!$scope.disableChangeProfile) {
            $scope.setProfileData = false;
            $scope.data.profile.temp.user_account.email = $scope.data.profile.user_account.email;
            $scope.data.profile.temp.user_account.cell_phone = $scope.data.profile.user_account.cell_phone;
            $scope.data.profile.temp.user_account.address.care_of = $scope.data.profile.user_account.address.care_of;
            $scope.data.profile.temp.user_account.address.street = $scope.data.profile.user_account.address.street;
            $scope.data.profile.temp.user_account.address.zip_code = $scope.data.profile.user_account.address.zip_code;
            $scope.data.profile.temp.user_account.address.city = $scope.data.profile.user_account.address.city;
            $scope.data.profile.temp.user_account.direct_advertising = $scope.data.profile.user_account.direct_advertising;
            if (!$scope.disableElogin) {
                $scope.data.profile.temp.user_account.username_authentication = $scope.data.profile.user_account.username_authentication;
            }
            $scope.shopping_cart.data.ValidationErrors.ChangeProfile = {};
        }
    };
    $scope.removePaymentMedia = function (href, referenceNumber) {
        if (!$scope.disableSavedPaymentMedia[referenceNumber]) {
            $scope.disableSavedPaymentMedia[referenceNumber] = true;
            var data = {
                payment_media: {
                    href: href
                }
            };
            var callback = function (response) {
                $scope.disableSavedPaymentMedia[referenceNumber] = false;
                $scope.shopping_cart.data.PaymentMedia = response.data;
            };
            var errorCallback = function (response, status, header, config) {
                $scope.shopping_cart.errorCallback(response, status, header, config);
                $scope.disableSavedPaymentMedia[referenceNumber] = false;
            };
            $scope.shopping_cart.removePaymentMedia(data, callback, errorCallback);
        }
    };
    $scope.changePassword = function () {
        if (!$scope.disableChangePassword) {
            $scope.disableChangePassword = true;
            var callback = function (response) {
                $scope.disableChangePassword = false;
            };
            var errorCallback = function (response, status, header, config) {
                $scope.shopping_cart.errorCallback(response, status, header, config);
                $scope.disableChangePassword = false;
            };
            ajaxHandler.postData("/api/MySL/ChangePassword", $scope.data.change_password, callback, errorCallback);
        }
    };
    $scope.changeUsername = function () {
        if (!$scope.disableChangeUsername) {
            $scope.disableChangeUsername = true;
            var callback = function (response) {
                $scope.disableChangeUsername = false;
            };
            var errorCallback = function (response, status, header, config) {
                $scope.shopping_cart.errorCallback(response, status, header, config);
                $scope.disableChangeUsername = false;
            };
            ajaxHandler.postData("/api/MySL/ChangeUsername", $scope.data.change_username, callback, errorCallback);
        }
    };
    $scope.setClicked = function (key, val) {
        if ($scope.clickedItems["purchase"] == val) {
            $scope.clickedItems["purchase"] = undefined;
        } else {
            $scope.clickedItems[key] = val;
        }
    };
} ])
.controller("MittSLLoginCtrl", ["$scope", "$http", "shoppingCartModel", "errorHandler", "$location", "$window", "ajaxHandler", '$timeout', function ($scope, $http, shoppingCartModel, errorHandler, $location, $window, ajaxHandler, $timeout) {
    var externalAuthCallDone = false;
    $scope.shopping_cart = shoppingCartModel;
    $scope.disableLogin = false;
    $scope.disableElogin = !isEloginEnabled;
    $scope.isCreatingAccount = false;
    $scope.disableForgotUsername = false;
    $scope.disableForgotPassword = false;
    $scope.disableActivateAccount = false;
    $scope.disableActivateAccountPassword = false;
    $scope.disableChangePassword = false;
    $scope.display = {
        forgot_username: false,
        forgot_password: false,
        create_account: false,
        activate_account: false,
        activate_account_password: false,
        terms: false
    };
    $scope.createAccountModel = {
    };
    $scope.data = {
        login_data: {
            username: "",
            password: ""
        },
        create_account: {
            user_account: {
                username: "",
                password: "",
                password_verify: "",
                private_customer: {
                    first_name: "",
                    last_name: "",
                    email: "",
                    email_verify: "",
                    birth_date: "",
                    person_number: ""
                },
                terms_accepted: false,
                direct_advertising: false
            }
        },
        forgot_username: {
            user_account: {
                email: ""
            }
        },
        forgot_password: {
            user_account: {
                username: "",
                email: ""
            }
        },
        activate_account: {
            user_account: {
                username: "",
                one_time_key: ""
            }
        },
        activate_account_password: {
            user_account: {
                username: "",
                one_time_key: "",
                new_password: "",
                new_password_verify: ""
            }
        },
        change_password: {
            user_account: {
                username: "",
                password: "",
                new_password: "",
                new_password_verify: ""
            }
        }
    };
    var setPresetValues = function (form) {
        var search = $location.search();
        $scope.data[form].user_account.username = search.username;
        $scope.data[form].user_account.one_time_key = search.code;
    };

    function resetLoginForm() {
        $scope.data.login_data.username = null;
        $scope.data.login_data.password = null;
    };

    var handleUrl = function (path) {
        path = path.replace(/\//g, "");
        $scope.showFirstStep = true;
        $scope.regularlogin = 'anvandarnamn';
        $scope.completeAccountCreation = 'slutforkonto';
        $scope.createAccountType = 'skapakontotyp';
        $scope.createAccountRegular = 'skapakontovanlig';
        $scope.newPasswordRequired = false;
        $scope.showCreateAccount = false;
        $scope.userDataChanged = false;
        $scope.disableLogin = false;
        $scope.loginStep = path;
        resetLoginForm();

        if (path == "AktiveraKonto") {
            $scope.display.activate_account = true;
            setPresetValues("activate_account");
        }
        if (path == "Kassa") {
            $scope.e_commerse = true;
        }
        if (path == "AktiveraKontoLosenord") {
            $scope.display.activate_account_password = true;
            setPresetValues("activate_account_password");
        }
        if (path == "NyttLosenordKravs") {
            $scope.newPasswordRequired = true;
        }
        if (path == "AnvandarnamnAndrat") {
            $scope.userDataChanged = "användarnamn";
        }
        if (path === "e-leg" || path === "eid" || path === "AktiveraKonto" || path === "AktiveraKontoLosenord" || path === "NyttLosenordKravs" || path === "skapakonto" || path === $scope.createAccountRegular || path === $scope.createAccountType || path === $scope.completeAccountCreation || path === $scope.regularlogin) {
            $scope.showFirstStep = false;
        }
        if (path == $scope.createAccountRegular || path == $scope.createAccountType || path == $scope.completeAccountCreation) {
            $scope.loginStep = 'skapakonto';
            $scope.createAccountStep = path;
        }
        if (path == $scope.createAccountType && $scope.disableElogin) {
            $location.path($scope.createAccountRegular);
        }
        if (path == "e-leg" && $scope.disableElogin) {
            $location.path($scope.regularlogin);
        }
        if (path == "LosenordAndrat") {
            $scope.shopping_cart.data.ValidationErrors.length = 0;
            $scope.userDataChanged = "lösenord";
        }
        if (path == "skapakonto" || path == $scope.regularlogin) {
            if (typeof ($scope.shopping_cart.data.ValidationErrors.Authenticate) !== "undefined") {
                $scope.shopping_cart.data.ValidationErrors.Authenticate.form_errors.length = 0;
            }
        }
        if (path == "skapakonto" || path == $scope.createAccountRegular) {
            $scope.display.create_account = true;
        }
        if (path == "eid") {
            $scope.disableLogin = true;
            $scope.processExternalAuthentication();
        }
        if (path == "" && $scope.disableElogin) {
            $location.path($scope.regularlogin);
        }
        if (path == "") {
            $scope.loginStep = "start";
        }
    };

    $scope.goToLoginLanding = function () {
        if (!$scope.disableLogin) {
            $scope.externalAuthError = null;
            $scope.display.activate_account_password = false;
            $scope.display.activate_account = false;
            window.location = "#/";
        }
    };

    $scope.$watch(function () {
        return $location.path();
    }, function (newVal, oldval) {

        handleUrl(newVal);
    });

    $scope.initExternalAuthentication = function ($provider) {
        function callback() {
            // Hide loader
            // Redirect to external url from arguments
            $scope.disableLogin = false;
        }
        function errorCallback(data, status, errorXhr, headers) {
            // Hide loader
            // Show error/s
            $scope.disableLogin = false;
            if (status === 500) {
                $scope.externalAuthError = errorHandler.getErrorMessage();
            } else {
                $scope.externalAuthError = (typeof (data.data.ResultErrors[0]) !== "undefined") ? data.data.ResultErrors[0] : errorHandler.getErrorMessage();
            }
        }
        // Show loader
        $scope.disableLogin = true;
        // remove errors
        $scope.externalAuthError = (typeof ($scope.externalAuthError) === "String") ? '' : [];
        // Do post
        ajaxHandler.postData("/api/MySL/InitExternalAuthentication", { 'provider': $provider }, callback, errorCallback);
    };

    $scope.processExternalAuthentication = function (data, status) {

        function callback() {
            // Hide loader
            $scope.showLoader = false;
            // Redirect to external url from arguments
        }
        function errorCallback(data, status, errorXhr, headers) {
            // Hide loader
            $scope.showLoader = false;
            
            // Show error/s
            if (status === 500) {
                $location.path("e-leg");
                $scope.externalAuthError = errorHandler.getErrorMessage();
            }
            else {
                $location.path("e-leg");
                $scope.externalAuthError = (typeof (data.data.ResultErrors[0]) !== "undefined") ? data.data.ResultErrors[0] : errorHandler.getErrorMessage();
            }
        }

        // Show loader
        $scope.showLoader = true;

        $timeout(function () {
            ajaxHandler.postData("/api/MySL/ProcessExternalAuthentication", {}, callback, errorCallback);
        }, 1);

    };
    
    $scope.authenticateUser = function () {
        if (!$scope.disableLogin) {
            $scope.disableLogin = true;
            var callback = function (response) {
                $scope.disableLogin = false;
            };
            var errorCallback = function (response, status, headers, config) {
                $scope.shopping_cart.errorCallback(response, status, headers, config);
                $scope.disableLogin = false;
            };
            ajaxHandler.postData("/api/MySL/Authenticate", $scope.data.login_data, callback, errorCallback);
            if ($scope.shopping_cart.data.ProductsView.length > 0) {
                window.SiteCatalyst.TrackClient("PurchaseType", "betala mitt sl");
            }
        }
    };
    $scope.enableGuestMode = function () {
        if (!$scope.disableGuestMode) {
            $scope.disableGuestMode = true;
            var callback = function (response) {
                $scope.disableGuestMode = false;
            };
            var errorCallback = function (response, status, headers, config) {
                $scope.shopping_cart.errorCallback(response, status, headers, config);
                $scope.disableGuestMode = false;
            };
            ajaxHandler.getData("/api/ECommerse/EnableGuestMode", callback, errorCallback);
            window.SiteCatalyst.TrackClient("PurchaseType", "betala utan konto");
        }
    };
    $scope.forgotUsername = function () {
        if (!$scope.disableForgotUsername) {
            $scope.disableForgotUsername = true;
            var callback = function (response) {
                $scope.disableForgotUsername = false;
                $scope.forgotUsernameConfirmation = true;
            };
            var errorCallback = function (response, status, headers, config) {
                $scope.shopping_cart.errorCallback(response, status, headers, config);
                $scope.disableForgotUsername = false;
            };
            ajaxHandler.postData("/api/MySL/ForgotUsername", $scope.data.forgot_username, callback, errorCallback);
        }
    };
    $scope.forgotPassword = function () {
        if (!$scope.disableForgotPassword) {
            $scope.disableForgotPassword = true;
            var callback = function (response) {
                $scope.disableForgotPassword = false;
                $scope.forgotPasswordConfirmation = true;
            };
            var errorCallback = function (response, status, headers, config) {
                $scope.shopping_cart.errorCallback(response, status, headers, config);
                $scope.disableForgotPassword = false;
            };
            ajaxHandler.postData("/api/MySL/ForgotPassword", $scope.data.forgot_password, callback, errorCallback);
        }
    };
    $scope.createAccount = function () {
        if (!$scope.isCreatingAccount) {
            $scope.isCreatingAccount = true;
            var callback = function (response) {
                $scope.isCreatingAccount = false;
                $scope.createAccountConfirmation = true;
                window.SiteCatalyst.TrackClient("RegisterAccount", response.data.private_customer.href);
            };
            var errorCallback = function (response, status, headers, config) {
                $scope.shopping_cart.errorCallback(response, status, headers, config);
                $scope.isCreatingAccount = false;
            };
            ajaxHandler.postData("/api/MySL/CreateAccount", $scope.data.create_account, callback, errorCallback);
        }
    };
    $scope.cancelCreateAccount = function () {
        $location.path("/");
    };
    $scope.activateAccount = function () {
        if (!$scope.disableActivateAccount) {
            $scope.disableActivateAccount = true;
            var callback = function (response) {
                $scope.disableActivateAccount = false;
                $scope.activateAccountConfirmation = true;
                $scope.showCreateAccount = true;
                $scope.showFirstStep = true;
            };
            var errorCallback = function (response, status, headers, config) {
                $scope.shopping_cart.errorCallback(response, status, headers, config);
                $scope.disableActivateAccount = false;
            };

            ajaxHandler.postData("/api/MySL/ActivateAccount", $scope.data.activate_account, callback, errorCallback);
        }
    };
    $scope.activateAccountPassword = function () {
        if (!$scope.disableActivateAccountPassword) {
            $scope.disableActivateAccountPassword = true;
            var callback = function (response) {
                $scope.disableActivateAccountPassword = false;
                $scope.activateAccountPasswordConfirmation = true;
            };
            var errorCallback = function (response, status, headers, config) {
                $scope.shopping_cart.errorCallback(response, status, headers, config);
                $scope.disableActivateAccountPassword = false;
            };
            ajaxHandler.postData("/api/MySL/ActivateAccountPassword", $scope.data.activate_account_password, callback, errorCallback);
        }
    };
    $scope.changePassword = function () {
        if (!$scope.disableChangePassword) {
            $scope.disableChangePassword = true;
            var callback = function (response) {
                $scope.disableChangePassword = false;
            };
            var errorCallback = function (response, status, header, config) {
                $scope.shopping_cart.errorCallback(response, status, header, config);
                $scope.disableChangePassword = false;
            };
            ajaxHandler.postData("/api/MySL/ChangePassword", $scope.data.change_password, callback, errorCallback);
        }
    };
} ]);
