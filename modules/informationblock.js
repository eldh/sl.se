/*

Created by: Daniel Mårtensson
13 November 2013, 16.07

Standard information listningpage -> informationblock.js
    
View object includes actions, services, templates and utils
The page is supposed to load x items and when you scroll down javascript will supply with some more items.

(not in use) = not in use 

*/

/* 

TODO: Comment

*/

(function ($, document, window, undefined) {

    $(function () {

        var amountToShow = 20,
            pagename,
            $resultListning = $(".result-listning"),
            $ul = $resultListning.children("ul"),
            $shareBlock = $(".share-block"),
            $shareLinks = $shareBlock.children(".share-links"),
            $email = $shareLinks.children(".mail"),
            active = 0, //Page
            searchpage = 1,
            orign = window.location.origin,
            path = window.location.pathname,
            ajaxRequest = true, // If true, ajax request will be executed. if false, nothing will happen.
            lastScrollTop = 0,
            formatedObj, // Store

            view = {
                info: {
                    host: window.location.host
                },

                templatesURL: {
                    SinglePage: '/Resources/mustache/SinglePage/Index.mustache?v=' + site_version,
                    ContentListingBlock: '/Resources/mustache/ContentListingBlock/Index.mustache?v=' + site_version,
                    CategorizableListingBlock: '/Resources/mustache/CategorizableListingBlock/Index.mustache?v=' + site_version,
                    ContentContainer: '/Resources/mustache/ContentContainer/Index.mustache?v=' + site_version,
                    SearchPage: '/Resources/mustache/SearchBlock/index.mustache?v=' + site_version
                },

                templates: {}, // Template Vault

                states: {}, // All states

                services: {
                    GetPageName: function () {

                        var url = orign + path;
                        var params = {
                            type: "GET",
                            url: url,
                            cache: false,
                            dataType: "json",
                            success: function (response) {
                                view.pagename = response.pageName;
                            }
                        };
                        view.actions.Ajax(params);
                    },

                    GetSinglePageInfo: function (target) {

                        var url = $(target).attr("data-url") + "json";
                        var params = {
                            type: "GET",
                            url: url,
                            cache: false,
                            dataType: "json",
                            success: function (response) {
                                response.jsonContent.share = shareTranslate;
                                var obj = { "SinglePage": response.jsonContent };
                                view.actions.PopulatePageWithData(target, obj, view.templates.SinglePage);
                            },
                            complete: function () {

                            }
                        };
                        view.actions.Ajax(params);

                    },
                    // Get FAQ info 
                    GetFAQInfo: function (target) {

                        var url = $(target).attr("data-url") + "json";
                        var params = {
                            type: "GET",
                            url: url,
                            cache: false,
                            dataType: "json",
                            success: function (response) {
                                view.actions.PopulatePageWithData(target, { "FAQContent": response });
                            },
                            complete: function () {

                            }
                        };
                        view.actions.Ajax(params);

                    },
                    // Get more search result when user clicks on "Show more" -button
                    GetMoreSearchResults: function () {

                        searchpage = searchpage + 1;
                        var url = window.location.href;
                        if (window.location.search.length == 0) {
                            url += "?page=" + searchpage;
                        } else {
                            url += "&page=" + searchpage;
                        }

                        var params = {
                            type: "GET",
                            url: url,
                            cache: false,
                            success: function (response) {
                                if (response.length == 0) {
                                    ajaxRequest = false; // Stop ajax requests in the future
                                } else {
                                    var amountinlist = $(".search-listing > ul").children("li").length,
                                        last = amountinlist - 1, // Target the last item in list
                                        responseCount = response.ContentItems.length, // Amount of items in result, depends on the number in EPi
                                        searchCount = response.Count; // Total amount possible to be shown 

                                    if (responseCount > 0) {

                                        var $targ = $(".search-listing > ul").children("li:eq(" + last + ")");
                                        view.actions.PushToView({ "MoreResults": { "ContentItems": response.ContentItems} }, $targ);

                                        // Set focus on the first new article
                                        setTimeout(function () {
                                            $(".search-listing > ul").children("li").eq(amountinlist).find(".button").focus();
                                        });

                                        if (searchCount == (amountinlist + responseCount)) {
                                            ajaxRequest = false;
                                            view.extensions.events();
                                        }

                                    } else {
                                        ajaxRequest = false;
                                        view.extensions.events();
                                    }


                                }
                            },
                            complete: function () {

                            }
                        };
                        view.actions.Ajax(params);
                    },

                    GetItemsByPage: function () {

                        active = active + 1;
                        var page = "page" + active + "/";
                        var url = orign + path + page;

                        var params = {
                            type: "GET",
                            url: url,
                            cache: false,
                            success: function (response) {
                                if (response.length == 0) {
                                    ajaxRequest = false; // Stop ajax requests in the future
                                } else {
                                    view.actions.PushToView(response); // Push to view
                                }
                            },
                            complete: function () {

                            }
                        };
                        view.actions.Ajax(params);

                    },
                    // ContentListingBlock Template (mustache/ContentListingBlock/index.mustache)
                    GetListingTemplate: function () {
                        view.actions.Get(view.templatesURL.ContentListingBlock, function (template, textStatus, jqXhr) { // Fetch external template
                            view.templates.listing = template; // Store template
                        });
                    },
                    // CategorizableListingBlock Template (mustache/CategorizableListingBlock/index.mustache)
                    GetCategorizableListingBlockTemplate: function () {
                        view.actions.Get(view.templatesURL.CategorizableListingBlock, function (template, textStatus, jqXhr) { // Fetch external template
                            view.templates.CategorizableListingBlock = template; // Store template
                        });
                    },
                    // ContentContainer Template (mustache/ContentContainer/index.mustache)
                    GetContentContainerTemplate: function () {
                        view.actions.Get(view.templatesURL.ContentContainer, function (template, textStatus, jqXhr) { // Fetch external template
                            view.templates.ContentContainer = template; // Store template
                        });
                    },
                    // SinglePage Template (mustache/SinglePage/index.mustache)
                    GetSinglePageTemplate: function () {
                        view.actions.Get(view.templatesURL.SinglePage, function (template, textStatus, jqXhr) { // Fetch external template
                            view.templates.SinglePage = template; // Store template
                        });
                    },
                    // Search template (mustache/SearchBlock/index.mustache)
                    GetSearchTemplate: function () {
                        view.actions.Get(view.templatesURL.SearchPage, function (template, textSatus, jqXhr) { // Fetch external template
                            view.templates.Search = template; // Store template
                        });
                    }
                },

                utils: {
                    loader: {
                        // TODO: Create something else or delete 

                        create: function (el, pos) {

                            var gif = "/Resources/img/ajax-loader.gif";
                            var loaderContainer = $("<div />").css({
                                "background": "url(" + gif + ") no-repeat center",
                                "width": "100%",
                                "height": "40px",
                                "top": "0px",
                                "position": "relative"
                            }).addClass("loader");

                            if (pos == "before") {
                                $(el).prepend(loaderContainer);
                            } else {
                                $(el).append(loaderContainer);
                            }

                        },

                        destroy: function () {
                            //console.log("Destroy loader");
                            $(".loader").remove();
                        }
                    },

                    messages: {
                        /* 
                        -- Common messages --
                        Need target and position. Populate it with a message.

                        Pos = After, before, append
                        Targ = $(?)
                        Message = String
                        Config = obj

                        */

                        success: function (targ, pos, message, config) {
                            var message = $("<div />").addClass("message success").text(message);
                            if (pos == "before") {
                                $(targ).before(message);
                            } else if (pos == "after") {
                                $(targ).after(message);
                            } else {
                                $(targ).append(message);
                            }

                        },

                        error: function (targ, pos, message, config) {
                            var message = $("<div />").addClass("message error").text(message);
                            if (pos == "before") {
                                $(targ).before(message);
                            } else if (pos == "after") {
                                $(targ).after(message);
                            } else {
                                $(targ).append(message);
                            }
                        },

                        warning: function (targ, pos, message, config) {
                            var message = $("<div />").addClass("message warning").text(message);
                            if (pos == "before") {
                                $(targ).before(message);
                            } else if (pos == "after") {
                                $(targ).after(message);
                            } else {
                                $(targ).append(message);
                            }
                        },

                        destroy: {
                            everthing: function () {
                                $(".messages").remove();
                            },
                            specific: function (el) {
                                $(el).remove();
                            }
                        }
                    }
                },

                extensions: {
                    events: function () {
                        var self = this,
                            show = 4,
                            $events = $(".landing-page-events-list"),
                            $list = $events.find(".result-listning .no-regular-list").first(),
                            getRange = function (el, start, end) {
                                var elems = [];
                                for (var i = start; i < end; i++) {
                                    elems.push(el.get(i));
                                }
                                return elems;
                            };

                        var selected = getRange($list.children(".hide"), 0, show);

                        $(selected).each(function () {
                            $(this).removeClass("hide");
                        });

                        if ($list.children(".hide").length == 0) {
                            $(".show-more").hide();
                        }
                    }
                },

                actions: {
                    // Ajax calls
                    Ajax: function (params) { $.ajax(params); },
                    Get: function (url, callback) { $.get(url, callback); },
                    GetJSON: function (url, callback) { $.getJSON(url, callback); },

                    RenderJSON: function () { // For debuging

                        $(".json").each(function () {
                            if ($.trim($(this).text()).length > 0) {
                                //console.log($.parseJSON($(this).text()), " : ", $(this).next().text());
                            }
                        });
                    },

                    showMoreBtn: function () {
                        if (view.states.pagename === "search") {
                            if (view.actions.check.maxToBeShown === view.actions.check.amountInView) {
                                $(".show-more").hide();
                            }
                        }
                    },

                    ToggleArias: function ($this) {
                        var $siblingBlocks = $this.closest("li").siblings().children(".information-block");

                        $siblingBlocks.find("[aria-pressed=true]").attr("aria-pressed", false);
                        $siblingBlocks.find("[aria-expanded=true]").attr("aria-expanded", false);

                        $this.attr("aria-pressed", !$this.attr("aria-pressed").convertToBool());
                        $this.closest(".information-block").find(".block-content").attr("aria-expanded", !$this.closest(".information-block").find(".block-content").attr("aria-expanded").convertToBool());
                    },

                    ToggleOpen: function (obj) { // Toggle "open" class to the item container

                        $this = $(obj.targ);

                        if (typeof (obj.before) != "undefined") {
                            obj.before();
                        }

                        $this.closest("li").siblings().children(".information-block").removeClass("open");

                        if (!$this.closest(".information-block").hasClass("open")) {
                            view.utils.loader.create($this.closest(".information-block"), "after");
                            view.actions.scrollTo($this);
                            if (typeof (obj.open) != "undefined") {
                                obj.open();
                            }
                        } else {
                            if (typeof (obj.close) != "undefined") {
                                obj.close();
                            }
                        }
                        if (typeof (obj.success) != "undefined") {
                            obj.success();
                        }

                        $.view.actions.ToggleArias($this);

                        $this.closest(".information-block").toggleClass("open");

                    },
                    check: {
                        maxToBeShown: function () {
                            return parseFloat($(".news-filter h4").html());
                        },
                        amountInView: function () {
                            return $(".search-listing").children("article").length;
                        },
                        introText: function () {

                        },
                        related: function () {
                            var rel = $(".related, .faq, .news");
                            $(rel).each(function () {
                                var self = this;
                                $(this).children("section, ul").each(function () {

                                    if ($.trim($(this).html()) == "" || $.trim($(this).children().html()) == "") {
                                        $(self).remove();
                                    }

                                });
                            });
                        },
                        ie: function () {
                            if (typeof (window.Browser) !== "undefined") {
                                view.info.browser = { name: "ie", version: window.Browser.browserVersion };
                                return true;
                            }
                            return false;
                        },
                        events: function () {
                            $events = $(".landing-page-events-list");
                            $list = $events.find(".result-listning ul").first();
                            var $showMore = $events.find(".show-more");
                            if ($list.children("li").length === 0) {
                                $events.remove();
                            } else {
                                $events.show();
                            }

                            if ($list.children(".hide").length === 0) {
                                $showMore.hide();
                            }
                        },
                        search: function () {
                            var $mainListing = $(".main-listing"),
                                $searchlist = $mainListing.find(".search-listing"),
                                searchcount = $mainListing.attr("data-searchcount"),
                                showingresults = $searchlist.find(".no-regular-list > li").length,
                                $showmore = $searchlist.find(".show-more"),
                                pagename = $mainListing.attr("data-pagename");
                            if (typeof (pagename) != "undefined" && pagename == "search") {
                                view.states.pagename = "search";

                                if (searchcount <= showingresults) {
                                    $showmore.hide();
                                }

                            }
                        }
                    },

                    rebinder: function () {

                        $(".share").unbind("click");
                        $(".share").bind("click", function (e) {
                            e.preventDefault();

                            $(this).siblings(".shareEmailSection").toggle().toggleClass("open");
                            //$(this).siblings(".shareEmailSection").find("input").focus().select();
                            if ($(this).siblings(".shareEmailSection").hasClass("open")) {
                                $(this).siblings(".shareEmailSection").find("input").trigger("click");
                            }
                        });

                        $(".shareEmailSection").find("input")
                            .unbind()
                            .bind("click", function (e) {
                                if (!$(this).hasClass("has-focus")) {
                                    this.selectionStart = 0;
                                    this.selectionEnd = 9999;
                                }
                                $(this).addClass("has-focus");
                            })
                            .bind("blur", function () {
                                $(this).removeClass("has-focus");
                            });

                        // Unbind and bind click event to headers

                        var $listheader = $(".list-header .button");

                        $listheader.unbind("click");
                        $listheader.bind("click", function (event) {

                            event.stopPropagation();
                            var self = this;
                            var $this = $(this);

                            $.view.actions.ToggleOpen({
                                targ: self,
                                before: function () {
                                    view.actions.check.related();
                                },
                                open: function () {
                                    if ($this.parent().parent().parent().parent().hasClass("faqpages")) {
                                        $.view.services.GetFAQInfo(self);
                                    } else {
                                        $.view.services.GetSinglePageInfo(self);
                                    }
                                },
                                close: function () {
                                },
                                success: function () {
                                }
                            });
                        });
                    },

                    scrollTo: function (elem, noAnimation) {

                        // Scroll to specific element
                        if (($('html').scrollTop() != Math.floor($(elem).offset().top) && $('body').scrollTop() == 0) || ($('body').scrollTop() != Math.floor($(elem).offset().top) && $('html').scrollTop() == 0)) {
                            if (noAnimation == true) {
                                $('html, body').scrollTop($(elem).offset().top);
                            } else {
                                $('html, body').animate({
                                    scrollTop: $(elem).offset().top
                                }, 600); 
                            } 
                        }
                    },

                    PushToView: function (json, $targ) {

                        if (view.states.pagename == "search") {
                            json.notfirstpage = true;
                            $targ.after(Mustache.render(view.templates.Search, json)); // Render to view
                        } else {
                            if (typeof (json) != undefined) {
                                $targ.append(Mustache.render($(view.templates.listing).html(), { ContentListingData: json })); // Render to view
                            } else {
                                $targ.append(Mustache.render($(view.templates.listing).html(), { ContentListingData: formatedObj[active] })); // Render to view (Not in use)
                            }
                        }

                        view.Init();
                    },

                    PopulatePageWithData: function (target, json, template) {

                        if (typeof json.SinglePage != "undefined") {
                            // json = json.SinglePage;
                        }
                        if (typeof (template) == "undefined") {
                            template = $(view.templates.listing).html();
                        }

                        var html = Mustache.render(template, json);
                        var $block = $(target).closest(".information-block").find(".block-content");
                        $block.html(html); // Render to page

                        $.view.actions.check.related();
                        $block.show(0, '', function () {
                            view.utils.loader.destroy();
                        });

                        view.actions.rebinder();

                        view.TwitterLinks($(target).closest(".information-block"));

                        if (typeof json.SinglePage !== "undefined" && json.SinglePage.CustomBlock) {
                            registerController("slapp.controllers", "RefundFormCtrl");
                            // compile the new element
                            $('body').injector().invoke(function ($compile, $rootScope) {
                                $compile($('#refundForm'))($rootScope);
                                $rootScope.$apply();
                                $('#refundForm').parent("section").removeAttr("ng-cloak");
                            });

                            registerController("slapp.controllers", "TimetablesCtrl");
                            // compile the new element
                            $('body').injector().invoke(function ($compile, $rootScope) {
                                $compile($('#timetables'))($rootScope);
                                $rootScope.$apply();
                            });
                        }
                    },

                    ReformatObj: function (obj) { // Not in use

                        // Obj is an Array

                        var part = [];
                        var newObj = [];
                        var myArray = obj.Information;
                        newObj.length = 0;

                        while (myArray.length > 0) {
                            part.push(myArray.splice(0, 1)[0]);

                            if (part.length >= amountToShow) {
                                newObj.push(part);
                                part = [];
                            }
                        }

                        if (part.length > 0) {
                            newObj.push(part);
                            delete part;
                        }
                        // x = amountToShow
                        return newObj; // newObj is an Array of Arrays(x amount in each)

                    }
                },

                isScrolledIntoView: function (elem) { // Checks if the recieved element is in view
                    if ($(elem).offset()) {
                        var docViewTop = $(window).scrollTop();
                        var docViewBottom = docViewTop + $(window).height();

                        var elemTop = $(elem).offset().top;
                        var elemBottom = elemTop + $(elem).height();

                        return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
                    }
                },

                TwitterLinks: function (elem) {
                    // Twitter hack for IE7/8
                    if ($("html").hasClass("lte8")) {
                        setTimeout(function () {
                            var $twitter;
                            elem.find(".twitter").each(function () {
                                $twitter = $(this);
                                if (typeof $twitter.attr("href") === "string") {
                                    $twitter.attr("href", $twitter.attr("href").replace("twitter", "mobile.twitter"));
                                }
                            });
                        });
                    }
                },

                Init: function () {

                    view.actions.check.events();
                    view.actions.check.search();
                    view.actions.check.related();
                    view.actions.showMoreBtn();

                    var $last = $(".result-listning .information-block").last(), // Picks the last item in the list 
                        $show = $(".show-more"),
                        $tags = new Tags();

                    $show.unbind("click");
                    $show.bind("click", function () {

                        if (view.states.pagename == "search") {
                            if (ajaxRequest) { // Check if possible fetch more, default is true
                                view.services.GetMoreSearchResults();
                            }
                        } else {
                            $.view.extensions.events();
                        }

                    });
                    $tags.$showTags.unbind("click");
                    $tags.$showTags.bind("click", function (e) {
                        e.preventDefault();
                        var $this = $(this);
                        $tags.showTags($this);
                    });
                    $tags.$tagListing.children("li").each(function () {
                        if ($tags.checkCurrent($(this))) {
                            $(this).find("a").addClass("current");
                        }
                    });
                    if (view.isScrolledIntoView($last) && view.states.pagename != "search") {
                        if (ajaxRequest) { // Check if possible fetch more, default is true
                        }
                    }
                    view.actions.rebinder();
                }
            };


        function Tags() {

            this.$newsFilter = $(".news-filter"),
            this.$tagListing = $(".tags-listing"),
            this.tagsShowing = false,
            this.$showTags = this.$newsFilter.find(".toggleFilter");

        };

        Tags.prototype.showTags = function ($this) {

            var $icon = $this.find(".icon");

            this.$tagListing.toggleClass("hide");

            if (!this.tagsShowing) {
                $icon.removeClass("downIcon").addClass("upIcon");
            } else {
                $icon.removeClass("upIcon").addClass("downIcon");
            }

            $this.find(".display-text").toggleText($this.data("orgtext"), $this.data("open"));

            this.tagsShowing = !this.tagsShowing;

        };
        Tags.prototype.checkCurrent = function ($tag) {

            if (!window.location.origin) {
                window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
            }

            var clean = function () {
                var href = window.location.href;
                var origin = window.location.origin;

                return (href).replace(origin, "");
            };
            var cleanHref = function () {
                var href = $tag.find("a").attr("href");
                var origin = window.location.origin;
                return (href).replace(origin, "");
            };
            if (cleanHref() === clean()) {
                return true;
            }
            return false;

        };
        view.actions.check.ie();

        view.services.GetCategorizableListingBlockTemplate();
        view.services.GetContentContainerTemplate();
        view.services.GetSinglePageTemplate();
        view.services.GetSearchTemplate();

        view.Init();
        view.actions.RenderJSON();

        // Toggle text o = orginal text, t = toggle to

        $.fn.toggleText = function (o, t) {

            return this.each(function (i, obj) {
                if (typeof t != "undefined") {
                    if (($(this).text()).trim() == (o).trim()) {
                        $(this).text(t);
                    } else {
                        $(this).text(o);
                    }
                }
            });

        };

        String.prototype.convertToBool = function () {
            return this == "true" ? true : false;
        };

        $.fn.insideView = function (opt) {

            return this.each(function () {

                if ($(this).offset()) {

                    var docViewTop = $(window).scrollTop();
                    var docViewBottom = docViewTop + $(window).height();

                    var elemTop = $(this).offset().top;
                    var elemBottom = elemTop + $(this).height();
                }

            });

        };

        /*
        Infinite scroll

        When user scoll and the last item in the list is in the view
        Check if possible to render more items, if possible, render more.
    
        */

        $(window).scroll(function () {

            var last = $(".result-listning ul .targ").children(".information-block").last();

            if (view.isScrolledIntoView(last) && view.states.pagename != "search") { // Check if last item is visible
                if (ajaxRequest) { // Check if possible fetch more, default is true
                    view.services.GetItemsByPage();
                }
            }
        });

        $.view = view; // Used for console debbuging. Can reach entire object in console ($.view.<..>)

        view.TwitterLinks($(".share-links"));
    });
})(jQuery, window, document)
