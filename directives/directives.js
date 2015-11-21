'use strict';

/* Directives */

angular.module('slapp.directives', []).
    directive("toggler", ["$rootScope", "groupService", function ($rootScope, groupService) {
        return {
            restrict: 'A',
            controller: function ($scope) {

                $scope.hideOthers = function (obj) {
                    var others = groupService.getGroupMates(obj.group, obj);
                    for (var item in others) {
                        var tempItem = others[item];
                        if (tempItem != obj) {
                            if (tempItem.element != undefined) {
                                tempItem.element.removeClass('active');
                            }
                            $scope.display[tempItem.target] = false;
                        }
                    }
                };
                $scope.toggle = function (obj) {

                    if ($scope.display[obj.target] == true) {
                        obj.element.removeClass('active');
                        $scope.display[obj.target] = false;
                    } else {
                        obj.element.addClass('active');
                        $scope.display[obj.target] = true;
                        $scope.$apply();
                        $scope.hideOthers(obj);
                    }
                };
                $scope.off = function (obj) {
                };
            },
            link: function (scope, element, attrs) {
                var obj = {};
                //var targetScope = angular.element(attrs.target).scope();
                obj.element = element;
                obj.group = attrs.toggler;
                obj.target = attrs.target;

                if (obj.group.length > 0) {
                    groupService.addToGroup(obj.group, obj);
                }

                element.bind('click', function (event) {
                    event.preventDefault();
                    scope.toggle(obj);
                    scope.$apply();
                });

                scope.$on('windowStateChanged', function (event, windowState) {

                });
            }
        };
    } ]).directive("allowSiblings", function () {
        /* 
        allow siblings false will set aria-hidden to true on all sibling menu items
        */
        return function (scope, element, attrs) {
            element.bind('click', function (event) {
                event.preventDefault();
                var allowSiblings = (attrs.allowSiblings == 'true' ? true : false);
                if (!allowSiblings) {
                    var currentIndex = element.parent().index();
                    element.parent().parent().children().each(function (i, aSibling) {
                        if (currentIndex != i) {
                            var targetElement = angular.element(aSibling).find('ul');
                            targetElement.attr('aria-hidden', 'true');
                        }
                    });
                }
            });
        };
    }).directive("toglee", ["$rootScope", function ($rootScope) {
        return function (scope, element, attrs) {
            var states = JSON.parse(attrs.toglee);
            var target = states.target;
            scope.display[target] = states[$rootScope.windowState];
            scope.$on('windowStateChanged', function (event, windowState) {

                scope.display[target] = states[windowState];
            });
        };
    } ]).directive('eatClick', function () {
        return function (scope, element) {
            element.bind('click', function (event) {
                event.preventDefault();
                return false;
            });
        };
    })
    .directive("showallonnull", function () {
        return function (scope, element, attrs) {

            element.bind('click', function (e) {
                scope.setClicked(attrs.showallonnull, attrs.target);
            });
            scope.setClicked = function (obj, target) {
                var temp = scope.showallonnull[obj];
                scope.showallonnull[obj][target] = !temp[target];
                scope.checkAll(attrs.showallonnull);
                scope.$apply();
            };
            scope.checkAll = function (group) {
                var showAll = true;
                for (var obj in scope.showallonnull[group]) {
                    if (scope.showallonnull[group][obj]) {
                        showAll = false;
                        break;
                    }
                }
                scope.showAll[group] = showAll;
            };
            scope.initShowAll = function (group, target) {
                if (scope.showallonnull == undefined) {
                    scope.showallonnull = {};
                }
                if (scope.showAll == undefined) {
                    scope.showAll = {};
                }
                if (scope.showallonnull[group] == undefined) {
                    scope.showallonnull[group] = {};
                }

                scope.showAll[group] = true; //Show all tabs with content as default;
                scope.showallonnull[group][target] = false;

            };
            scope.$on("newResetSearch", function (e) {
                if (e) {
                    scope.initShowAll(attrs.showallonnull, attrs.target);
                }
            });

            scope.initShowAll(attrs.showallonnull, attrs.target);
        };
    })
    .directive("fade", function () {
        return {
            link: function (scope, element, attrs) {
                scope.$watchCollection(attrs.fade, function () {
                    element.animate({ "opacity": 0 }, "fast").animate({ "opacity": 1 }, "fast");
                });
            }
        };
    })
    .directive('scrollIf', ["stateService", function (stateService) {
        return function (scope, element, attrs) {
            var scrollTo = function (elem, noAnimation) {
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
            };
            scope.$watch(attrs.scrollIf, function (newValue) {
                if (newValue && (attrs.noDesktopScroll == undefined || (attrs.noDesktopScroll != undefined && stateService.getState() == "min"))) {
                    setTimeout(function () {
                        if (attrs.noScrollAnimation != undefined) {
                            scrollTo(element, true);
                        } else {
                            scrollTo(element);
                        }
                    });
                }
            });
        };
    } ])
    .directive('onEnter', function () {
        return function (scope, element, attrs) {
            element.bind("keyup", function (e) {
                if (e.which == 13) {
                    scope[attrs.onEnter]();
                    element.blur();
                    scope.$apply();
                }
            });
        };
    })
    .directive('overlay', ["$timeout", function ($timeout) {
        return function (scope, element, attrs) {
            scope.$watch(attrs.overlay, function (newValue) {
                if (newValue) {
                    element.find(".overlay").height(element.outerHeight());
                    if (attrs.overlayDelay != undefined) {
                        $timeout(function () {
                            element.find(".overlay").height(element.outerHeight());
                        }, attrs.overlayDelay);
                    }
                }
            });
        };
    } ])
    .directive('focusOn', ["$timeout", "stateService", function ($timeout, stateService) {
        return function (scope, element, attrs) {
            scope.$watch(attrs.focusOn, function (newVal) {
                if (newVal && (attrs.noMobileFocus == undefined || (attrs.noMobileFocus != undefined && stateService.getState() == "max"))) {
                    $timeout(function () {
                        var x = window.scrollX, y = window.scrollY;
                        element.focus();
                        window.scrollTo(x, y);
                    });
                }
            });
        };
    } ])
    .directive('setDefaultOption', function () {
        return function (scope, element) {
            setSelectOption(element);
        };
    })
    .directive('validateOnEnter', function () {
        return function (scope, element, attrs) {
            element.bind("keydown", function (event) {
                if (event.keyCode == 13) {
                    if (attrs.validateOnEnter == 'false') {
                        scope.submitForm(attrs.form, false);
                    } else {
                        event.preventDefault();
                        return false;
                    }
                }
            });
        };
    })
    .directive('skipnav', function () {
        return function (scope, element) {
            element.bind("click", function () {
                $("#content").focus();
            });
        };
    })
    .directive('article', function () {
        return function (scope, element) {
            element.find("a").bind("click", function () {
                window.SiteCatalyst.TrackClient("InternalNews", $(this).html());
            });
        };
    })
    .directive('realTimeStations', ["$timeout", function ($timeout) {
        return function (scope, element) {
            scope.setAria = function () {
                $timeout(function () {
                    element.find(".real-time-transports").attr("aria-pressed", "false");
                    element.find(".real-time-details").attr("aria-expanded", "false");
                    element.find(".real-time-transports.active").attr("aria-pressed", "true");
                    element.find(".real-time-transports.active").siblings(".real-time-details").attr("aria-expanded", "true");
                });
            };
        };
    } ])
    .directive("serialNumber", function () {
        return function (scope, element) {
            element.on("keyup", function () {
                if (element.val().length == 5) {
                    element.next("input").focus();
                }
            });
        };
    })
    .directive("noPaste", function () {
        return function (scope, element) {
            element.bind("paste", function (e) {
                e.preventDefault();
            });
        };
    })
    .directive("footerMenu", function () {
        return function (scope, element) {
            element.find("a").bind("click", function (e) {
                var href = $(this).attr("href").replace("http://", "").replace("https://", "");
                if (href.split("b2b.sl.se").length > 1) {
                    window.SiteCatalyst.TrackClient("ExitLink", href);
                }
            });
        };
    })
    .directive('init', function () {
        return function (scope, element, attrs) {
            scope["inactive"] = {};
            var inactive = attrs.init.split(",");
            for (var item in inactive) {
                scope["inactive"][inactive[item]] = true;
            }
        };
    })

/*chosen test*/
    .directive('chosen', function () {
        var linker = function (scope, element, attrs) {
            var model = attrs['ngModel'];
            scope.$watch('recipientsList', function () {
                element.trigger('liszt:updated');
            });
            scope.$watch('recipients', function () {
                element.trigger('liszt:updated');
            });
            /* Added this in so as to preselect items */
            scope.$watch(model, function () {
                element.trigger("liszt:updated");
            });
            element.chosen();
        };
        return {
            restrict: 'A',
            link: linker
        };
    })
    .directive('selectOnClick', ["$timeout", function ($timeout) {
        return function (scope, element, attrs) {
            var selected = false;
            element.click(function () {
                if (!selected) {
                    element[0].selectionStart = 0;
                    element[0].selectionEnd = 9999;
                    selected = true;
                }
            });
            element.on('blur', function (e) {
                selected = false;
            });
            $timeout(function () {
                if (attrs.selectOnFocus != undefined) {
                    element.click();
                }
            });
        };
    } ])
    .directive('triggerClickOn', ["$timeout", function ($timeout) {
        return function (scope, element, attrs) {
            scope.$watch(attrs.triggerClickOn, function (newVal) {
                if (newVal) {
                    $timeout(function () {
                        element.click();
                        element.focus();
                    });
                }
            });
        };
    } ]);