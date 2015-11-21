var refundform = angular.module('slapp');

refundform.factory("refundFormModel", function () {
    var modelService = {};
    modelService.init = function () {
        var initData = {};
        modelService.data = {};
        modelService.init = function () {
            initData = {
                issue: {
                    date: "",
                    time: "",
                    traffic_type: "",
                    traffic_line: "",
                    from: "",
                    to: "",
                    comment: "",
                    ext: {
                        compensation_type: "",
                        compensation_refound: ""
                    },

                    compensation: {
                        travel_card_serial_number: "",
                        from: "",
                        to: "",
                        amount: "", //total
                        file: {
                            filecontent: ""
                        },
                        files: [],
                        type: { //null if not selected
                            ticket: {
                                transport: "",
                                company: ""
                            },
                            mileage: {
                                registration_number: "",
                                kilometers: "",
                                amount: "",
                                comment: ""
                            },
                            taxi: {
                                kilometers: "",
                                receipt_number : ""
                            }
                        },

                        refound: { //null if not selected
                            bank_giro: {
                                account: ""
                            },
                            plus_giro: {
                                account: ""
                            },
                            bank: {
                                clearing: "",
                                account: ""
                            },
                            check: {

                            }
                        }
                    },

                    contact: {
                        first_name: "",
                        last_name: "",
                        address: {
                            care_of: "",
                            street: "",
                            zip_code: "",
                            city: "",
                            country: "Sverige"
                        },
                        email: "",
                        phone: "",
                        work_phone: "",
                        cell_phone: ""
                    },

                    body: [
                        {
                            date: "Datum: "
                        },
                        {
                            time: "Tid: "
                        },
                        {
                            traffic_type: "Trafikslag: "

                        },
                        {
                            traffic_line: "Linje: "
                        },
                        {
                            from: "Resa från: "
                        },
                        {
                            to: "Resa till: "
                        },
                        {
                            comment: "Beskrivning: "
                        },
                        {
                            travel_card_serial_number: "SL Access-kort: "
                        },
                        {
                            compensation_type: "Kompensation: "
                        },
                        {
                            refound: "Ersättning: "
                        },
                        {
                            first_name: "Förnamn: "
                        },
                        {
                            last_name: "Efternamn: "
                        },
                        {
                            care_of: "c/o adress: "
                        },
                        {
                            street: "Gatuadress: "
                        },
                        {
                            zip_code: "Postnummer: "
                        },
                        {
                            city: "Postort: "
                        },
                        {
                            country: "Land: "
                        },
                        {
                            email: "E-postadress: "
                        },
                        {
                            phone: "Telefonnummer hem: "
                        },
                        {
                            work_phone: "Telefonnummer arbete: "
                        },
                        {
                            cell_phone: "Mobilnummer: "
                        }
                    ]
                }
            };
            angular.copy(initData, modelService.data);
        };
        modelService.reset = function () {
            angular.copy(initData, modelService.data);
        };
        modelService.preparePostData = function (temp) {
            var tempContactInformation = [],
                tempBodyExt = [];

            if (temp.issue.ext.compensation_type == '') {
                temp.issue.compensation.type = null;
            } else if (temp.issue.ext.compensation_type == 'ticket') {
                delete temp.issue.compensation.type.mileage;
                delete temp.issue.compensation.type.taxi;
            } else if (temp.issue.ext.compensation_type == 'mileage') {
                delete temp.issue.compensation.type.ticket;
                delete temp.issue.compensation.type.taxi;
            } else if (temp.issue.ext.compensation_type == 'taxi') {
                delete temp.issue.compensation.type.mileage;
                delete temp.issue.compensation.type.ticket;
            }

            if (temp.issue.ext.compensation_refound == '') {
                temp.issue.compensation.refound = null;
            } else if (temp.issue.ext.compensation_refound == 'bank_giro') {
                delete temp.issue.compensation.refound.bank;
                delete temp.issue.compensation.refound.check;
                delete temp.issue.compensation.refound.plus_giro;
            } else if (temp.issue.ext.compensation_refound == 'bank') {
                delete temp.issue.compensation.refound.bank_giro;
                delete temp.issue.compensation.refound.check;
                delete temp.issue.compensation.refound.plus_giro;
            } else if (temp.issue.ext.compensation_refound == 'check') {
                delete temp.issue.compensation.refound.bank;
                delete temp.issue.compensation.refound.bank_giro;
                delete temp.issue.compensation.refound.plus_giro;
            } else if (temp.issue.ext.compensation_refound == 'plus_giro') {
                delete temp.issue.compensation.refound.bank;
                delete temp.issue.compensation.refound.bank_giro;
                delete temp.issue.compensation.refound.check;
            }

            for (var obj in temp.issue) {
                if (typeof (temp.issue[obj]) == "string") {
                    for (var i = 0; i < temp.issue.body.length; i++) {
                        if (temp.issue.body[i][obj]) {
                            temp.issue.body[i][obj] += temp.issue[obj];
                        }
                    }
                }
            }

            temp.issue.body[7].travel_card_serial_number += temp.issue.compensation.travel_card_serial_number;

            for (var obj in temp.issue.contact) {
                if (typeof (temp.issue.contact[obj]) == "string") {
                    for (var i = 0; i < temp.issue.body.length; i++) {
                        if (temp.issue.body[i][obj]) {
                            temp.issue.body[i][obj] += temp.issue.contact[obj];
                        }
                    }
                }
            }

            for (var obj in temp.issue.contact.address) {
                if (typeof (temp.issue.contact.address[obj]) == "string") {
                    for (var i = 0; i < temp.issue.body.length; i++) {
                        if (temp.issue.body[i][obj]) {
                            temp.issue.body[i][obj] += temp.issue.contact.address[obj];
                        }
                    }
                }
            }

            for (var i = 10; i <= 20; i++) {
                tempContactInformation.push(temp.issue.body[i]);
            }

            for (var i = 0; i <= 7; i++) {
                tempBodyExt.push(temp.issue.body[i]);
            }

            if (temp.issue.compensation.type == null) {
                tempBodyExt.push(
                    { compensation_type: "Kompensation: " }
                );
            } else if (temp.issue.ext.compensation_type == "mileage") {

                /*** Milersättning egen bil ***/
                tempBodyExt.push(
                    { compensation_type: "Kompensation: Milersättning egen bil" },
                    { compensation_from: "Kompensation från: " + temp.issue.compensation.from },
                    { compensation_to: "Kompensation till: " + temp.issue.compensation.to },
                    { compensation_registration: "Registreringsnummer: " + temp.issue.compensation.type.mileage.registration_number },
                    { compensation_kilometers: "Kilometer: " + temp.issue.compensation.type.mileage.kilometers },
                    { compensation_other_amount: "Annan ersättning: " + temp.issue.compensation.type.mileage.amount + " kr" },
                    { other_amount_description: "Annan ersättning - beskrivning: " + temp.issue.compensation.type.mileage.comment },
                    { compensation_amount: "Summa ersättning: " + temp.issue.compensation.amount + " kr" }
                );
            } else if (temp.issue.ext.compensation_type == "ticket") {

                /*** Annan biljett ***/
                tempBodyExt.push(
                    { compensation_type: "Kompensation: Annan biljett" },
                    { compensation_from: "Kompensation från: " + temp.issue.compensation.from },
                    { compensation_to: "Kompensation till: " + temp.issue.compensation.to },
                    { compensation_transport: "Färdsätt: " + temp.issue.compensation.type.ticket.transport },
                    { compensation_company: "Bolag: " + temp.issue.compensation.type.ticket.company },
                    { compensation_amount: "Belopp från kvitto: " + temp.issue.compensation.amount + " kr" }
                );
            } else if (temp.issue.ext.compensation_type == "taxi") {

                /*** Taxi ***/
                tempBodyExt.push(
                    { compensation_type: "Kompensation: Taxi" },
                    { compensation_from: "Kompensation från: " + temp.issue.compensation.from },
                    { compensation_to: "Kompensation till: " + temp.issue.compensation.to },
                    { compensation_kilometers: "Kilometer: " + temp.issue.compensation.type.taxi.kilometers },
                    { compensation_amount: "Belopp: " + temp.issue.compensation.amount + " kr" }
                );
            }

            if (temp.issue.compensation.refound == null) {
                tempBodyExt.push(
                    { refound: "Ersättning: " }
                );
            } else if (temp.issue.ext.compensation_refound == "bank") {

                /*** Bankkonto ***/
                tempBodyExt.push(
                    { refound: "Ersättning: Bankkonto" },
                    { clearing_number: "Clearingnummer: " + temp.issue.compensation.refound.bank.clearing },
                    { account_number: "Kontonummer: " + temp.issue.compensation.refound.bank.account }
                );
            } else if (temp.issue.ext.compensation_refound == "bank_giro") {

                /*** Bankgiro ***/
                tempBodyExt.push(
                    { refound: "Ersättning: Bankgiro" },
                    { account_number: "Bankgiro: " + temp.issue.compensation.refound.bank_giro.account }
                );
            } else if (temp.issue.ext.compensation_refound == "plus_giro") {

                /*** Plusgiro ***/
                tempBodyExt.push(
                    { refound: "Ersättning: Plusgiro" },
                    { account_number: "Plusgiro: " + temp.issue.compensation.refound.plus_giro.account }
                );
            } else if (temp.issue.ext.compensation_refound == "check") {

                /*** Utbetalningsavi ***/
                tempBodyExt.push(
                    { refound: "Ersättning: Utbetalningsavi" }
                );
            }

            temp.issue.body = tempBodyExt.concat(tempContactInformation);

            if (temp.issue.time == ":") {
                temp.issue.time = "";
            }

            return temp;
        };
    };
    modelService.init();
    return modelService;
});

refundform.controller("RefundFormCtrl", ["$scope", "$element", "refundFormModel", "setTarget", "$filter", "providedValue", "ajaxHandler", "shoppingCartModel", "$sce", "$timeout", '$upload', function ($scope, $element, refundFormModel, setTarget, $filter, providedValue, ajaxHandler, shoppingCartModel, $sce, $timeout, $upload) {

    var simulate = {
        hasNoFlash: false,
        hasFlash: false,
        fileReaderNoSupport: false,
        isIe: false
    };

    // IE Check
    // TODO: move to factory

    $scope.isIE = function () {
        var myNav = navigator.userAgent.toLowerCase();
        return (myNav.indexOf('msie') != -1) ? parseInt(myNav.split('msie')[1]) : false;
    };
    $scope.getAndroidVersion = function (ua) {
        ua = (ua || navigator.userAgent).toLowerCase();
        var match = ua.match(/android\s([0-9\.]*)/);
        return match ? match[1] : false;
    };

    // is file reader supported
    // TODO: move to factory

    $scope.isFileReaderSupported = function () {
        if (simulate.fileReaderNoSupport) {
            return false;
        }
        if ($scope.isIE() === 9 || parseInt($scope.getAndroidVersion(), 10) < 4) { return false; }
        return (typeof FileReader !== "undefined");
    };

    //// FLASH CHECK ////////
    // TODO: move to factory

    $scope.hasFlash = function () {
        if (simulate.hasNoFlash) {
            return false;
        }
        if (!$scope.isIE() || $scope.isIE() >= 10) { return true; }
        var hasFlash = false;
        try {
            var fo = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
            if (fo) {
                hasFlash = true;
            }
        } catch (e) {
            if (navigator.mimeTypes
        && navigator.mimeTypes['application/x-shockwave-flash'] != undefined
        && navigator.mimeTypes['application/x-shockwave-flash'].enabledPlugin) {
                hasFlash = true;
            }
        }
        return hasFlash;
    };

    refundFormModel.init();
    $scope.data = refundFormModel.data;
    $scope.shopping_cart = shoppingCartModel;
    $scope.isSendingForm = false;
    $scope.minChoices = [];
    $scope.hourChoices = [];
    $scope.dateChoices = [];
    $scope.no_attach_documents = false;
    $scope.files = null;
    $scope.ID = function () {
        return Math.round(Math.random() * 1000000);
    };
    $scope.fileUploaders = [
        {
            id: 1,
            file_name: '',
            progress: 0,
            model: '',
            errors: [],
            files: [],
            uniqe_id: $scope.ID()
        }
    ];
    $scope.date = new Date();
    $scope.initData = function () {
        $scope.time = {
            hour: "",
            min: ""
        };
        $scope.compensation = {
            amount: {},
            kilometers: {}
        };
        $scope.travel_card = {
            serial_number1: "",
            serial_number2: ""
        };
    };
    $scope.initData();
    $scope.receipt = {
        issue_number: "",
        body: ""
    };
    $scope.file_affix_accept = "bmp gif jpg jpeg jpe png tif tiff xls xlsx doc docx pdf ppt pptx txt rtf csv";
    $scope.max_size = 50;
    $scope.size_affix = 'mb';

    // File uploader
    // This will be triggerd when file input changes.
    $scope.uploadFile = function (uploader) {
        $scope.fileUploaders[0].model = uploader[0];
        if (typeof ($scope.shopping_cart.data.ValidationErrors.SubmitTravelRefound) === "undefined") {
            $scope.shopping_cart.data.ValidationErrors.SubmitTravelRefound = {};
        }
        $scope.shopping_cart.data.ValidationErrors.SubmitTravelRefound.issue_compensation_file = null;
        $scope.$apply();
    };

    $scope.isAllFilesValid = function () {
        var a = 0;
        for (var uploader in $scope.fileUploaders) {
            if ($scope.fileUploaders[uploader].errors.length > 0) { a++; }
        }

        return a === 0;
    };

    $scope.canSend = function () {
        if ($scope.data.issue.ext.compensation_type !== "taxi") {
            return true;
        }
        if ($scope.uploaddisabeled) {
            return true;
        }
        if ($scope.no_attach_documents) {
            return true;
        }
        if ($scope.fileUploaders[0].model && $scope.fileUploaders[0].reciept_number !== "") {
            return true;
        }
        return false;

    };

    $scope.clearAllImages = function () {
        if ($scope.fileUploaders[0].files.length > 0) {
            delete $('#file-upload-1').prop("files")[0];
        }
        $scope.fileUploaders[0].files.length = 0;
        $scope.fileUploaders[0].file_name = null;
        $scope.fileUploaders[0].model = null;
        $scope.fileUploaders[0].reciept_number = null;
        $scope.fileUploaders[0].errors.length = 0;
        $scope.no_attach_documents = !$scope.no_attach_documents;
    };

    if (!$scope.hasFlash()) {
        $scope.no_attach_documents = true;
    }

    $scope.removeFiles = function (uploader) {
        if (typeof (uploader) === "undefined") {
            return false;
        }
        if (JSON.stringify(uploader).indexOf("[") === 0) {
            // Array
        }
        else if (JSON.stringify(uploader).indexOf("{") === 0) {
            // Object
            var id = uploader.id;
        }
        $scope.fileUploaders[0].files.length = 0;
        $scope.fileUploaders[0].file_name = null;
        $scope.fileUploaders[0].model = null;
        $scope.fileUploaders[0].reciept_number = null;
        $scope.fileUploaders[0].errors.length = 0;
        $scope.no_attach_documents = true;
        $scope.$apply();
    };
    $scope.progress = 0;

    $scope.sendFiles = function (callback) {

        // This function populates a list with files. Then executes the xhr send method for each file.
        // Url to the upload service
        $scope.url = "/api/MySL/SubmitTravelRefound";
        // vars.
        var file_reader, form_data = false, xhr, numbers = [], files = [], file, i = 0;

        var returnObject = [];
        var errors = [];
        // file upload fails

        // Length of all selected files
        //var len = files.length;
        var k = 0;

        $scope.upload = function (files) {

            var successCallback = function (data, status, headers, config) {
                // body...
                $scope.returnobject.push({
                    file_temp_name: data.data.files[0],
                    file_name: config.file.name,
                    reciept_name: $scope.fileUploaders[0].reciept_number
                });
                $scope.progress = 0;
                $scope.uploading_in_action = false;
                callback($scope.returnobject, errors);
            };
            var errorCallback = function (data, status, headers, config) {
                errors = (typeof (data.data) === "string") ? [data.data] : data.data;
                callback($scope.returnobject, errors);
            };
            var progress = function (evt) {
                // body...
                var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                $scope.progress = progressPercentage;
                k++;
            };

            if (files && files.length) {
                $scope.uploading_in_action = true;
                for (var i = 0; i < files.length; i++) {
                    var file = files[i];
                    $upload.upload({
                        url: $scope.url,
                        method: 'POST',
                        file: file,
                        data: {}
                    }).progress(progress).success(successCallback).error(errorCallback);
                }
            }
        };

        $scope.upload($scope.fileUploaders[0].model);

    };

    // SiteCatalyst
    var scData = {
        formname: "resegaranti",
        formaction: "startad",
        send: true
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
            $scope.data.issue.contact.address.care_of = $scope.shopping_cart.data.UserSession[address].care_of || "";
            $scope.data.issue.contact.address.street = $scope.shopping_cart.data.UserSession[address].street;
            $scope.data.issue.contact.address.zip_code = $scope.shopping_cart.data.UserSession[address].zip_code;
            $scope.data.issue.contact.address.city = $scope.shopping_cart.data.UserSession[address].city;

            switch ($scope.shopping_cart.data.UserSession[address].country) {
                case "SWEDEN":
                    $scope.data.issue.contact.address.country = "Sverige";
                    break;
                case "DENMARK":
                    $scope.data.issue.contact.address.country = "Danmark";
                    break;
                case "NORWAY":
                    $scope.data.issue.contact.address.country = "Norge";
                    break;
                default:
                    $scope.data.issue.contact.address.country = "Sverige";
            };

            $scope.data.issue.contact.first_name = $scope.shopping_cart.data.UserSession.FirstName;
            $scope.data.issue.contact.last_name = $scope.shopping_cart.data.UserSession.LastName;
            $scope.data.issue.contact.cell_phone = $scope.shopping_cart.data.UserSession.CellPhone;
            $scope.data.issue.contact.email = $scope.shopping_cart.data.UserSession.Email;
        }
    };

    $scope.$watch("shopping_cart.data.UserAuthenticated", function () {
        setContactInformation();
    });
    $scope.calculateCompensationSum = function (otherAmount, kilometers) {
        if (isNaN(otherAmount) || otherAmount == "") {
            otherAmount = 0;
        }
        if (isNaN(kilometers) || kilometers == "") {
            kilometers = 0;
        } else {
            parseFloat(kilometers *= $scope.mileage_rate);
        }
        var sum = parseFloat(parseFloat(otherAmount) + kilometers).toFixed(2);
        $scope.compensation.amount.car = sum > 0 ? sum : "";
        //return $scope.amount_sum;
    };

    $scope.$watch('compensation.kilometers.car', function (newVal) {
        if ($scope.data.issue.ext.compensation_type == "mileage") {
            $scope.calculateCompensationSum($scope.data.issue.compensation.type.mileage.amount, newVal);
        }
    });

    $scope.$watch('data.issue.compensation.type.mileage.amount', function (newVal) {
        if ($scope.data.issue.ext.compensation_type == "mileage") {
            $scope.calculateCompensationSum(newVal, $scope.compensation.kilometers.car);
        }
    });

    $scope.refreshPage = function () {
        window.location.reload();
    };

    // Iframe version if filereader is not supported

    $scope.iframeV = function () {

        // iframe var
        var iframe;

        $scope.generateIframe = function () {
            // Target
            var target = $("#iframeuploadtarget");
            var receivertarget = $("#iframereceiver");
            // generates and returns an iframe
            var iframe_d = document.createElement('iframe');
            var iframe_djsontarget = document.createElement('iframe');
            iframe_djsontarget.setAttribute("name", "jsontarget");
            var fileInputStyle = "style='border: 1px solid #c8caca;background: #fff;padding: 12px 5px;width: 100%;'";
            var bodystyle = "style='margin: 0px;overflow:hidden;'";
            // Iframe form template
            var html = '<html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8" /></head><body ' + bodystyle + '><form target=jsontarget width="200" height="200" id="theform" enctype="multipart/form-data" method="POST" action="/api/MySL/SubmitTravelRefound"><input type="hidden" name="issue" id="issue_form_data" /><input type=file ' + fileInputStyle + 'name=file></form></body>';
            // Add iframe to 
            target.html(iframe_d);
            receivertarget.html(iframe_djsontarget);
            // Check if contentWindow or ContentDocument
            var i = (iframe_d.contentWindow || iframe_d.contentDocument);
            // Check if document is supported
            if (i.document) {
                i = i.document;
            }

            // Populate iframe with form.
            i.open(); i.write(html); i.close();

            return i;

        };

        // Defines iframe
        iframe = $scope.generateIframe();

        function SubmitIFrameForm(onsuccess, onfailure) {

            var org = "/api/MySL/SubmitTravelRefound";
            // Target
            var target = $("#iframeuploadtarget");

            var theForm = iframe.getElementById("theform");

            refundFormModel.reset();

            // Serialize the form
            var data = $("#refundForm").serializeArray(); //serializeArray is a jQuery function

            for (var i = 0; i < data.length; i++) {
                setTarget.setIndex($scope, data[i].name, data[i].value);
            }
            setDate($scope.data.issue.date);
            setTime($scope.time.hour, $scope.time.min);
            $scope.data.issue.compensation.travel_card_serial_number = $scope.travel_card.serial_number1 + $scope.travel_card.serial_number2;
            $scope.data.issue.compensation.type.taxi.receipt_number = $scope.fileUploaders[0].reciept_number;

            var formdata = refundFormModel.preparePostData(angular.copy($scope.data));

            iframe.forms[0][0].value = JSON.stringify(formdata.issue);

            theForm.submit();

            var t = 500;

            function check() {

                var im = document.getElementById("iframereceiver").children[0];
                im = (im.contentWindow || im.contentDocument);
                // Check if document is supported
                if (im.document) {
                    im = im.document;
                }

                var pre = im.body.innerText;
                var hasPre = im.body.innerHTML;
                var hasError = pre.indexOf("Maximum request length exceeded") > -1;
                var isMireksError = pre.indexOf("Ett fel har inträffat") > -1;

                try {

                    if (isMireksError) {

                        $scope.shopping_cart.errorCallback({}, 500);
                        iframe = $scope.generateIframe();
                        if (typeof ($scope.shopping_cart.data.ValidationErrors.SubmitTravelRefound) === "undefined") {
                            $scope.shopping_cart.data.ValidationErrors.SubmitTravelRefound = {};
                        }
                        $scope.shopping_cart.data.ValidationErrors.SubmitTravelRefound.issue_compensation_file = "Den uppladdade filen är för stor, var god välj ett annat format eller skicka in kvitto på annat sätt";
                        $scope.isSendingForm = false;
                        $scope.$apply();

                    } else {

                        if (hasPre.indexOf("<pre") === -1 && hasPre.indexOf("{") !== 0) {
                            setTimeout(check, t);
                        } else {
                            var json = JSON.parse(pre);
                            if (json.status === "error") {
                                onfailure(json);
                            } else {
                                onsuccess(json);
                            }
                        }

                    }
                } catch (e) {
                    $scope.shopping_cart.errorCallback({}, 500);
                    iframe = $scope.generateIframe();
                    if (typeof ($scope.shopping_cart.data.ValidationErrors.SubmitTravelRefound) === "undefined") {
                        $scope.shopping_cart.data.ValidationErrors.SubmitTravelRefound = {};
                    }
                    $scope.shopping_cart.data.ValidationErrors.SubmitTravelRefound.issue_compensation_file = "Den uppladdade filen är för stor, var god välj ett annat format eller skicka in kvitto på annat sätt";
                    $scope.isSendingForm = false;
                    $scope.$apply();
                }
            }
            setTimeout(check, t);
        };
        $scope.clearIframeImage = function () {
            iframe = $scope.generateIframe();
        };
        iframe.forms[0][1].onchange = function () {
            $scope.removeFileError();
            $scope.$apply();
        }

        $scope.removeFileError = function () {
            if (typeof ($scope.shopping_cart.data.ValidationErrors.SubmitTravelRefound) === "undefined") {
                $scope.shopping_cart.data.ValidationErrors.SubmitTravelRefound = {};
            }
            $scope.shopping_cart.data.ValidationErrors.SubmitTravelRefound.issue_compensation_file = null;
        }

        $scope.submitIframeForm = function () {
            // method to be excecuted when user clicks
            $scope.isSendingForm = true;

            var callback = function (data) {

                $scope.shopping_cart.data.ValidationErrors.SubmitTravelRefound = {};
                $scope.isSendingForm = false;
                $scope.showReceipt = true
                $scope.receipt.fileuploaderror = data.data.issue.fileuploaderror;
                $scope.receipt.issue_number = data.data.issue.issue_number;
                $scope.receipt.body = $sce.trustAsHtml(data.data.issue.body_ext);
                $scope.receipt.files = (typeof (data.data.issue.files) !== "undefined") ? data.data.issue.files : data.data.files;
                $scope.$apply();
            };
            var fail = function (data) {

                if (typeof ($scope.shopping_cart.data.ValidationErrors.SubmitTravelRefound) === "undefined") {
                    $scope.shopping_cart.data.ValidationErrors.SubmitTravelRefound = {};
                }
                $scope.shopping_cart.data.ValidationErrors.SubmitTravelRefound = data.data.ValidationErrors;
                // add errors to view
                $scope.isSendingForm = false;
                $scope.$apply();
            };

            SubmitIFrameForm(callback, fail);
        };


    }

    $scope.$watch("data.issue.ext.compensation_type", function () {
        if (!$scope.isFileReaderSupported() && $scope.data.issue.ext.compensation_type === "taxi") {
            setTimeout($scope.iframeV, 1);
        }
    });


    // reset file field

    $scope.submitOld = function () {
        if (!$scope.isSendingForm) {
            $scope.fileUploadErrors = false;
            $scope.isSendingForm = true;
            //$scope.sendFiles(function (files, errors) {
            // Check if there is errors before sending form.

            // Find disabled inputs, and remove the "disabled" attribute
            // This is needed because otherwise disabled fields won't be included in the serialized array
            var disabled = $element.find(':input:disabled').removeAttr('disabled');

            // Serialize the form
            var data = $element.serializeArray(); //serializeArray is a jQuery function

            // Re-disabled the set of inputs that were previously enabled
            disabled.attr('disabled', 'disabled');

            refundFormModel.reset();

            for (var i = 0; i < data.length; i++) {
                setTarget.setIndex($scope, data[i].name, data[i].value);
            }
            setDate($scope.data.issue.date);
            setTime($scope.time.hour, $scope.time.min);
            $scope.data.issue.compensation.travel_card_serial_number = $scope.travel_card.serial_number1 + $scope.travel_card.serial_number2;


            data = refundFormModel.preparePostData(angular.copy($scope.data));
            // Add files to compensation
            //data.issue.compensation.files = files;

            function send() {
                // Send form
                var callback = function (response) {

                    if (response.indexOf("Ett fel har inträffat") > -1) {
                        $scope.shopping_cart.errorCallback({}, 500);
                        if (typeof ($scope.shopping_cart.data.ValidationErrors.SubmitTravelRefound) === "undefined") {
                            $scope.shopping_cart.data.ValidationErrors.SubmitTravelRefound = {};
                        }
                        $scope.shopping_cart.data.ValidationErrors.SubmitTravelRefound.issue_compensation_file = "Den uppladdade filen är för stor, var god välj ett annat format eller skicka in kvitto på annat sätt";
                        $scope.isSendingForm = false;
                        return false;
                    }

                    $scope.isSendingForm = false;
                    $scope.showReceipt = true
                    $scope.receipt.fileuploaderror = response.data.issue.fileuploaderror;
                    $scope.receipt.issue_number = response.data.issue.issue_number;
                    $scope.receipt.body = $sce.trustAsHtml(response.data.issue.body_ext);
                    $scope.receipt.files = (typeof (response.data.issue.files) !== "undefined") ? response.data.issue.files : response.data.files;
                    refundFormModel.reset();
                    $scope.initData();
                    setContactInformation();
                    scData.formaction = "avslutad";
                    window.SiteCatalyst.TrackClient("Forms", scData);
                    $timeout(function () {
                        $(".option").each(function () {
                            var select = $(this).closest(".select-container").find("select");
                            setSelectOption(select);
                        });
                    });
                };

                var errorCallback = function (response, status, header, config) {
                    $scope.shopping_cart.errorCallback(response, status, header, config);
                    $scope.isSendingForm = false;
                };

                if ($scope.shopping_cart.data.UserAuthenticated) {
                    delete data.issue.contact;
                }

                ajaxHandler.postData("/api/MySL/SubmitTravelRefound", data, callback, errorCallback);

                var options = {
                    url: $scope.url,
                    method: "POST",
                    formData: { issue: JSON.stringify(data.issue) },
                    onSuccess: function () {
                        
                    }
                };

                var uploadObj = $("#file-upload-1").uploadFile(options);

                uploadObj.startUpload();
            }

            if ($('input:file')[0].files.length === 0) {
                send()
                return false;
            }

            // Read the files, if any
            var fileelement = $('input:file')[0];
            var f = fileelement.files[0];
            var fn = f.name;
            var r = new FileReader();
            r.onloadend = function (e) {
                var filedata = e.target.result;

                data.issue.compensation.file.filecontent = filedata;
                data.issue.compensation.file.filename = fn;

                send();
                $scope.removeFiles();
            };

            r.readAsDataURL(f);

        }
    };

    $scope.submit = function () {
        if (!$scope.isSendingForm && $scope.isAllFilesValid()) {
            $scope.fileUploadErrors = false;
            $scope.isSendingForm = true;

            // Find disabled inputs, and remove the "disabled" attribute
            // This is needed because otherwise disabled fields won't be included in the serialized array
            var disabled = $element.find(':input:disabled').removeAttr('disabled');

            // Serialize the form
            var data = $element.serializeArray(); //serializeArray is a jQuery function

            // Re-disabled the set of inputs that were previously enabled
            //disabled.attr('disabled', 'disabled');

            //console.log("initdata", data);
            //refundFormModel.reset();

            for (var i = 0; i < data.length; i++) {
                //console.log(data[i]);
                setTarget.setIndex($scope, data[i].name, data[i].value);
            }
            setDate($scope.data.issue.date);
            setTime($scope.time.hour, $scope.time.min);
            $scope.data.issue.compensation.travel_card_serial_number = $scope.travel_card.serial_number1 + $scope.travel_card.serial_number2;
            $scope.data.issue.compensation.type.taxi.receipt_number = $scope.fileUploaders[0].reciept_number;

            data = refundFormModel.preparePostData(angular.copy($scope.data));
            // remove files to compensation
            if (typeof (data.issue.compensation.file) !== "undefined") {
                delete data.issue.compensation.file;
            }
            if (typeof (data.issue.compensation.files) !== "undefined") {
                delete data.issue.compensation.files;
            }

            //console.log("submitting form", data);
            var callback = function (response) {
                
                if (typeof(response) === "string" && response.indexOf("Ett fel har inträffat") > -1) {
                    if (typeof ($scope.shopping_cart.data.ValidationErrors.SubmitTravelRefound) === "undefined") {
                        $scope.shopping_cart.data.ValidationErrors.SubmitTravelRefound = {};
                    }
                    $scope.shopping_cart.data.ValidationErrors.SubmitTravelRefound.issue_compensation_file = "Den uppladdade filen är för stor, var god välj ett annat format eller skicka in kvitto på annat sätt";
                    $scope.shopping_cart.errorCallback({}, 500);
                    $scope.isSendingForm = false;
                    return false;
                }

                $scope.isSendingForm = false;
                $scope.showReceipt = true;
                $scope.receipt.issue_number = response.data.issue.issue_number;
                $scope.receipt.body = $sce.trustAsHtml(response.data.issue.body_ext);
                $scope.receipt.files = (typeof (response.data.issue.files) !== "undefined") ? response.data.issue.files : response.data.files;
                refundFormModel.reset();
                $scope.initData();
                setContactInformation();
                scData.formaction = "avslutad";
                window.SiteCatalyst.TrackClient("Forms", scData);
                $timeout(function () {
                    $(".option").each(function () {
                        var select = $(this).closest(".select-container").find("select");
                        //console.log("select", select)
                        setSelectOption(select);
                    });
                });
            };

            var errorCallback = function (response, status, header, config) {
                $scope.shopping_cart.errorCallback(response, status, header, config);
                if (status === 500) {
                    if (typeof ($scope.shopping_cart.data.ValidationErrors.SubmitTravelRefound) === "undefined") {
                        $scope.shopping_cart.data.ValidationErrors.SubmitTravelRefound = {};
                    }
                    $scope.shopping_cart.data.ValidationErrors.SubmitTravelRefound.issue_compensation_file = "Den uppladdade filen är för stor, var god välj ett annat format eller kontakta kundtjänst";
                }
                $scope.isSendingForm = false;
            };

            if ($scope.shopping_cart.data.UserAuthenticated) {
                delete data.issue.contact;
            }
            // This function populates a list with files. Then executes the xhr send method for each file.
            // Url to the upload service
            //$scope.url = '/api/MySL/SubmitTravelRefoundImage';
            $scope.url = "/api/MySL/SubmitTravelRefound";
            // vars.
            var file_reader, form_data = false, xhr, numbers = [], files = [], file, i = 0;

            var returnObject = [];
            var errors = [];
            // file upload fails

            $scope.fileuploadfailed = {};
            $scope.returnobject = [];

            // Length of all selected files
            var len = $scope.fileUploaders.length;
            var k = 0;

            $scope.upload = function (files) {

                $scope.uploading_in_action = true;

                $upload.upload({
                    url: $scope.url,
                    method: 'POST',
                    file: files,
                    fields: data
                }).success(callback).error(errorCallback);


            };
            if ($scope.uploaddisabeled) {
                ajaxHandler.postData($scope.url, data, callback, errorCallback);
            } else {
                if ($scope.data.issue.ext.compensation_type === "taxi" && $scope.fileUploaders[0].model) {
                    $scope.data.issue.compensation.type.taxi.receipt_number = $scope.fileUploaders[0].reciept_number;
                    $scope.upload($scope.fileUploaders[0].model);
                } else {
                    ajaxHandler.postData($scope.url, data, callback, errorCallback);
                }
            }

        }
    };

    $scope.formatDoubleDigit = function (i) {
        return (i < 10 ? "0" + i : i + "");
    };

    var setDate = function (date) {
        if (date != "") {
            $scope.data.issue.date = $scope.dateChoices[date].value;
        }
    };

    var setTime = function (hour, min) {
        if (hour != "" && min != "") {
            $scope.data.issue.time = $scope.hourChoices[hour].value + ":" + $scope.minChoices[min].value;
            $scope.time.hour = $scope.hourChoices[hour].value;
            $scope.time.min = $scope.minChoices[min].value;
        }
    };

    $scope.populateDateAndTimeChoices = function () {

        //Populate minChoices
        var step = 5;
        var limit = 60;
        for (var i = 0; i < limit; i = i + step) {
            $scope.minChoices.push({ name: $scope.formatDoubleDigit(i), value: $scope.formatDoubleDigit(i) });
        }

        //Populate hourChoices
        step = 1;
        limit = 24;
        for (var i = 0; i < limit; i = i + step) {
            $scope.hourChoices.push({ name: $scope.formatDoubleDigit(i), value: $scope.formatDoubleDigit(i) });
        }

        //Populate Dates
        var days = 90;
        var start = new Date();
        var end = new Date(Date.parse($scope.date) - (24 * days) * 3600 * 1000 - 1);
        end.setDate(end.getDate());

        start = new Date(start.setDate(start.getDate()));
        $scope.dateChoices.push({ name: providedValue.today, value: $filter("date")(start, "yyyy-MM-dd") });

        start = new Date(start.setDate(start.getDate() - 1));
        $scope.dateChoices.push({ name: providedValue.yesterday, value: $filter("date")(start, "yyyy-MM-dd") });

        start = new Date(start.setDate(start.getDate() - 1));

        while (start > end) {
            $scope.dateChoices.push({ name: $filter("date")(start, "EEE dd MMM"), value: $filter("date")(start, "yyyy-MM-dd") });
            start = new Date(start.setDate(start.getDate() - 1));
        }
    };

    $scope.populateDateAndTimeChoices();

}]);
