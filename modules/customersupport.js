var customersupport = angular.module('slapp');

customersupport.factory("customerSupportModel", function () {
    var modelService = {};
    modelService.init = function () {
        var initData = {};
        modelService.data = {};
        modelService.init = function () {
            initData = {
                issue: {
                    subject: "",
                    body: "",
                    body_ext: "",
                    ext: {
                        contact: "submit",
                        body: ""
                    },
                    contact: {
                        type: {
                            submit: {

                            },
                            email: {
                                first_name: "",
                                last_name: "",
                                email: "",
                                email_verify: ""
                            },
                            address: {
                                first_name: "",
                                last_name: "",
                                care_of: "",
                                street: "",
                                zip_code: "",
                                city: ""
                            },
                            phone: {
                                first_name: "",
                                last_name: "",
                                phone: ""
                            }
                        }
                    }
                }
            };
            angular.copy(initData, modelService.data);
        };
        modelService.reset = function () {
            angular.copy(initData, modelService.data);
        };
        modelService.preparePostData = function (temp) {
            temp.issue.body_ext = "Ärendetyp: Synpunkt\r\n\n";
            if (temp.issue.ext.contact == "submit") {
                delete temp.issue.contact.type.email;
                delete temp.issue.contact.type.address;
                delete temp.issue.contact.type.phone;
            } else {
                if (temp.issue.ext.contact == "email") {
                    /*** E-post ***/
                    delete temp.issue.contact.type.submit;
                    delete temp.issue.contact.type.address;
                    delete temp.issue.contact.type.phone;
                } else if (temp.issue.ext.contact == "address") {
                    /*** Adress ***/
                    delete temp.issue.contact.type.email;
                    delete temp.issue.contact.type.submit;
                    delete temp.issue.contact.type.phone;
                } else if (temp.issue.ext.contact == "phone") {
                    /*** Telefon ***/
                    delete temp.issue.contact.type.email;
                    delete temp.issue.contact.type.address;
                    delete temp.issue.contact.type.submit;
                }
            }

            temp.issue.body = temp.issue.ext.body;

            return temp;
        };
    };
    modelService.init();
    return modelService;
});

customersupport.controller("CustomerSupportCtrl", ["$scope", "$element", "customerSupportModel", "setTarget", "ajaxHandler", "shoppingCartModel", "$sce", function ($scope, $element, customerSupportModel, setTarget, ajaxHandler, shoppingCartModel, $sce) {

    customerSupportModel.init();
    $scope.data = customerSupportModel.data;
    $scope.shopping_cart = shoppingCartModel;
    $scope.isSendingForm = false;
    $scope.receipt = {
        issue_number: "",
        body: ""
    };

    // SiteCatalyst
    var scData = {
        formname: "kundservice",
        formaction: "startad",
        send: false
    };
    window.SiteCatalyst.TrackClient("Forms", scData);

    var setContactInformation = function () {
        if ($scope.shopping_cart.data.UserAuthenticated) {
            var address;
            var length = 0;
            var data = $scope.shopping_cart.data.UserSession.Address;
            for (var prop in data) {
                if (data.hasOwnProperty(prop)) {
                    length++;
                }
            }
            if (length > 1) {
                address = "Address";
            } else { // Fallback to national address
                address = "NationalAddress";
            }
            $scope.data.issue.contact.type.address.care_of = $scope.shopping_cart.data.UserSession[address].care_of || "";
            $scope.data.issue.contact.type.address.street = $scope.shopping_cart.data.UserSession[address].street;
            $scope.data.issue.contact.type.address.zip_code = $scope.shopping_cart.data.UserSession[address].zip_code;
            $scope.data.issue.contact.type.address.city = $scope.shopping_cart.data.UserSession[address].city;

            $scope.data.issue.contact.type.email.first_name =
            $scope.data.issue.contact.type.address.first_name =
            $scope.data.issue.contact.type.phone.first_name =
            $scope.shopping_cart.data.UserSession.FirstName;

            $scope.data.issue.contact.type.email.last_name =
            $scope.data.issue.contact.type.address.last_name =
            $scope.data.issue.contact.type.phone.last_name =
            $scope.shopping_cart.data.UserSession.LastName;

            $scope.data.issue.contact.type.phone.phone = $scope.shopping_cart.data.UserSession.CellPhone;
            $scope.data.issue.contact.type.email.email = $scope.shopping_cart.data.UserSession.Email;
            $scope.data.issue.contact.type.email.email_verify = $scope.shopping_cart.data.UserSession.Email;
        }
    };
    $scope.$watch("shopping_cart.data.UserAuthenticated", function () {
        setContactInformation();
    });

    $scope.submit = function () {
        if (!$scope.isSendingForm) {
            $scope.isSendingForm = true;

            // Find disabled inputs, and remove the "disabled" attribute
            // This is needed because otherwise disabled fields won't be included in the serialized array
            var disabled = $element.find(':input:disabled').removeAttr('disabled');

            // Serialize the form
            var data = $element.serializeArray(); //serializeArray is a jQuery function

            // Re-disabled the set of inputs that were previously enabled
            disabled.attr('disabled', 'disabled');

            customerSupportModel.reset();

            for (var i = 0; i < data.length; i++) {
                setTarget.setIndex($scope, data[i].name, data[i].value);
            }

            data = customerSupportModel.preparePostData(angular.copy($scope.data));

            var callback = function (response) {
                $scope.isSendingForm = false;
                $scope.showReceipt = true;
                $scope.receipt.issue_number = response.data.issue.issue_number;
                $scope.receipt.body = $sce.trustAsHtml(response.data.issue.body.replace(/\n/g, '<br/>').replace("\r", ""));
                customerSupportModel.reset();
                setContactInformation();
                scData.formaction = "avslutad";
                scData.send = true;
                window.SiteCatalyst.TrackClient("Forms", scData);
            };

            var errorCallback = function (response, status, header, config) {
                $scope.shopping_cart.errorCallback(response, status, header, config);
                $scope.isSendingForm = false;
            };

            if ($scope.shopping_cart.data.UserAuthenticated) {
                delete data.issue.contact;
            }

            ajaxHandler.postData("/api/MySL/SubmitForm", data, callback, errorCallback);
        }
    };
} ]);