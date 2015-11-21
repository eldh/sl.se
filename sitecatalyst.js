if (!window.SiteCatalyst) {

    function SiteCatalystTriggeredTracker() {

        this.TrackClient = function (form, data) {
            if (typeof s == "undefined" || !s || !form) return;
            s.contextData = {};
            var trackingMethod = trackingMethods[form];
            if (trackingMethod) {
                propertyMem = [];
                try {
                    trackingMethod(data);
                } catch (e) {
                    //console.log(e);
                }
            }
        };

        var sendTrackingData = function (title) {
            var tracker = s;

            if (g_user != "") {
                tracker.contextData["user"] = g_user;
            }
            if (title != undefined && title != "pageload") {
                tracker.tl(this, 'o', title);
            } else {
                tracker.t();
            }
            restoreMem();
        };
        
        var propertyMem = null;

        var restoreMem = function () {
            var tracker = s;
            for (var i in propertyMem) {
                tracker.contextData[propertyMem[i].key] = propertyMem[i].oldValue;
            }
        };
       
        var memorizableSet = function (key, value) {
            var tracker = s;
            if (key != "products") {
                propertyMem.push({ key: key, oldValue: s.contextData[key] });
                tracker.contextData[key] = value;
            } else {
                tracker.products = value;
            }
        };

        var parseProducts = function (data) {
            var products = [],
                product,
                alreadyInArray,
                productsString = "",
                name;
            for (var i = 0; i < data.length; i++) {
                alreadyInArray = false;
                for (var j = 0; j < products.length; j++) {
                    if (data[i].Id == products[j].id) {
                        products[j].quantity++;
                        products[j].price = products[j].unitPrice * products[j].quantity;
                        alreadyInArray = true;
                    }
                }
                if (!alreadyInArray) {
                    product = {
                        id: data[i].Id,
                        name: data[i].Name,
                        quantity: 1,
                        price: data[i].PriceIncVat,
                        unitPrice: data[i].PriceIncVat
                    };
                    products.push(product);
                }
            }
            for (var k = 0; k < products.length; k++) {
                name = products[k].name;
                if (name != "Reskassa") {
                    name += " - " + products[k].unitPrice + " kr";
                }
                productsString += ";" + name + ";" + products[k].quantity + ";" + products[k].price;
                if (k != products.length - 1) {
                    productsString += ",";
                }
            }
            return productsString;
        };
        
        var trackingMethods = new Array();

        trackingMethods['PageLoad'] = function (data) {
            memorizableSet("server", data.server);
            memorizableSet("pagename", data.pagename);
            memorizableSet("sitelevel1", data.sitelevel1);
            memorizableSet("sitelevel2", data.sitelevel2);
            memorizableSet("language", data.language);
            if (data.trafficstatus) {
                memorizableSet("trafficstatus", data.trafficstatus);
            }
            if (data.statusinfo) {
                memorizableSet("statusinfo", data.statusinfo);
            }
            if (data.searchpage) {
                memorizableSet('searchphrase', data.searchpage.searchphrase);
                memorizableSet('searchhits', data.searchpage.searchhits);
            }
        };

        trackingMethods['Search'] = function (data) {
            memorizableSet('searchalternative', data);
            sendTrackingData();
        };

        trackingMethods['MapFilter'] = function (id) {
            var data;
            switch (id) {
                case "vendors":
                    data = "forsaljning";
                    break;
                case "zones":
                    data = "zoner";
                    break;
                case "stations":
                    data = "hallplatser";
                    break;
                case "parking":
                    data = "pendelparkering";
                    break;
                default:
                    data = "";
            }
            memorizableSet('mapfilter', data);
            sendTrackingData();
        };

        trackingMethods['ZoomUsage'] = function () {
            memorizableSet('zoomusage', "zoomning");
            sendTrackingData();
        };

        trackingMethods['TimeTable'] = function (data) {
            memorizableSet('downloads', data);
            sendTrackingData();
        };

        trackingMethods['StatusDetails'] = function (data) {
            memorizableSet('statusdetails', data);
            sendTrackingData();
        };

        trackingMethods['Forms'] = function (data) {
            memorizableSet('formname', data.formname);
            memorizableSet('formaction', data.formaction);
            //console.log("formdata", data);
            if (data.send) {
                sendTrackingData();
            }
        };

        trackingMethods['InternalNews'] = function (title) {
            sendTrackingData(title);
        };

        trackingMethods['StatusName'] = function (data) {
            memorizableSet('statusname', data);
            sendTrackingData();
        };

        trackingMethods["ProdView"] = function (data) {
            var name = data.name;
            if (name != "Reskassa") {
                name += " - " + data.price + " kr";
            }
            memorizableSet("prodvisning", "visad");
            memorizableSet("products", ";" + name + ";1;" + data.price);
            sendTrackingData();
        };

        trackingMethods["CartAdd"] = function (data) {
            var name = data.name;
            if (name != "Reskassa") {
                name += " - " + data.price + " kr";
            }
            memorizableSet("cartadd", "tillagd");
            memorizableSet("products", ";" + name + ";1;" + data.price);
            sendTrackingData();
        };

        trackingMethods["CartView"] = function (data) {
            memorizableSet("cartview", "sc visad");
            memorizableSet("products", parseProducts(data));
            sendTrackingData();
        };

        trackingMethods["CartCheckout"] = function (data) {
            memorizableSet("cartcheckout", "kopstart");
            memorizableSet("products", parseProducts(data));
            sendTrackingData();
        };

        trackingMethods["PurchaseType"] = function (data) {
            memorizableSet("koptyp", data);
            sendTrackingData();
        };

        trackingMethods["PaymentMethod"] = function (paymentMethod) {
            var data = "kort";
            if (paymentMethod == 3) {
                data = "bank";
            } 
            memorizableSet("betalsatt", data);
            sendTrackingData();
        };

        trackingMethods["Purchase"] = function (data) {
            memorizableSet("kop", "kop");
            memorizableSet("kopid", data.order_number);
            var products = [],
                product,
                alreadyInArray,
                productsString = "",
                name;
            for (var i = 0; i < data.order_lines.length; i++) {
                alreadyInArray = false;
                for (var j = 0; j < products.length; j++) {
                    if (data.order_lines[i].product.ref == products[j].id) {
                        products[j].quantity++;
                        products[j].price = products[j].unitPrice * products[j].quantity;
                        alreadyInArray = true;
                    }
                }
                if (!alreadyInArray) {
                    product = {
                        id: data.order_lines[i].product.ref,
                        name: data.order_lines[i].product.description,
                        quantity: 1,
                        price: data.order_lines[i].price.amount_incl_vat,
                        unitPrice: data.order_lines[i].price.amount_incl_vat
                    };
                    products.push(product);
                }
            }
            for (var k = 0; k < products.length; k++) {
                name = products[k].name;
                if (name != "Reskassa") {
                    name += " - " + products[k].unitPrice + " kr";
                }
                productsString += ";" + name + ";" + products[k].quantity + ";" + products[k].price;
                if (k != products.length - 1) {
                    productsString += ",";
                }
            }
            memorizableSet("products", productsString);
            sendTrackingData();
        };

        trackingMethods["RegisterAccount"] = function (data) {
            memorizableSet("kontoregistrering", data);
            sendTrackingData();
        };

        trackingMethods["RegisterCard"] = function () {
            memorizableSet("kortregistrering", "registrera");
            sendTrackingData();
        };

        trackingMethods["LossReport"] = function () {
            memorizableSet("forlustanmalan", "forlust");
            sendTrackingData();
        };

        trackingMethods["ExitLink"] = function (data) {
            memorizableSet("exitlink", data);
            sendTrackingData();
        };
    };

    window.SiteCatalyst = new SiteCatalystTriggeredTracker();
}