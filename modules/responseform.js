var responseform = angular.module('slapp');

responseform.controller('ResponseFormCtrl', ["$scope", "$location", "ajaxHandler", "shoppingCartModel", function ($scope, $location, ajaxHandler, shoppingCartModel) {
    $scope.shopping_cart = shoppingCartModel;
    $scope.receipt = {};
    var init = function () {
        $scope.data = {
            email: {
                subject: "",
                body: "",
                issue_ref: ""
            },
            referral: {
                referral_ref: "",
                body: "",
                name: "",
                email: ""
            },
            issue_ref: ""
        };
    };
    init();
    var url;
    $scope.isSendingForm = false;
    $scope.submit = function (form) {
        $scope.isSendingForm = true;
        url = form == "referral" ? "/api/MySL/SubmitAnswerReferral" : "/api/MySL/SubmitAnswerMail";
        var data = {
            issue: $scope.data[form]
        };
        var callback = function (response) {
            $scope.isSendingForm = false;
            $scope.showReceipt = true;
            angular.copy($scope.data, $scope.receipt);
            init();
        };
        var errorCallback = function (response, status, header, config) {
            $scope.isSendingForm = false;
            $scope.shopping_cart.errorCallback(response, status, header, config);
        };
        ajaxHandler.postData(url, data, callback, errorCallback);
    };
    $scope.$watch(function () {
        return $location.search();
    }, function () {
        $scope.data.referral.referral_ref = "issue/" + $location.search().iFeedID + "/referrals/" + $location.search().iDocID;
        $scope.data.email.issue_ref = $location.search().iFeedID;
        $scope.data.referral.email = $location.search().sSenderEmail;
        $scope.data.issue_ref = $location.search().iFeedID;
    });
}]);