angular.module('ocb-payments', [
    'ocb-shared'
]).config(function (menuServiceProvider, translationsLoaderProvider, $urlRouterProvider, miniappServiceProvider, pathServiceProvider, stateServiceProvider, privilegesServiceProvider, PRIVILEGES_FUNCTIONALITY) {
    'use strict';

    function registerModule() {
        webComponentRegistry['ocb-payments'].simpleName = "payments";
        webComponentRegistry['ocb-payments'].startState = "payments.recipients.list";
    }

    function registerComponents() {
        miniappServiceProvider.registerWidget("ocb-payments");
        translationsLoaderProvider.addTranslationsPath(pathServiceProvider.generateRootPath("ocb-payments") + "/i18n/messages_{{language}}.json");
    }

    function registerBaseState() {
        $urlRouterProvider.when('/payments', '/payments/content');
        stateServiceProvider
            .state('payments', {
                url: "/payments",
                abstract: true,
                templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/layouts/fullscreen/fullscreen_payments.html",
                controller: "PaymentsViewController",
                data: {
                    analyticsTitle: "ocb.menu.transfer"
                }
            });
    }

    function registerNavigation() {
        menuServiceProvider.registerMenu({
            id: 'ocb-payments',
            priority: 200,
            showMain: true,
            baseItem: "payments.recipients.list",
            title: 'ocb.menu.transfer',
            items:[
                {
                    id: "payments.new.fill",
                    label: 'payments.submenu.options.new.header',
                    icon: "ocb-icons ocb_przelew",
                    action: function(item, scope, state){
                        state.reload('payments.new.fill').then(function(){
                            state.transitionTo("payments.new.fill",{ paymentType: 'domestic', referenceId: undefined }, {reload: true}).finally(function() {
                                state.go('payments.new.fill', {
                                    paymentType: 'domestic',
                                    referenceId: undefined
                                });
                            });
                        });
                    },
                    priority: 1
                },
                {
                    id: "payments.new_foreign.fill",
                    label: 'payments.submenu.options.new_foreign.header',
                    icon: "ocb-icons ocb_przelew",
                    action: "payments.new_foreign.fill({ paymentType: 'smart' })",
                    priority: 2
                },
                {
                    id: "payments.new_internal.fill",
                    label: 'payments.submenu.options.new_internal.header',
                    icon: "ocb-icons ocb_przelew",
                    action: "payments.new_internal.fill",
                    priority: 1
                },
                {
                    id: "payments.recipients.list",
                    label: 'ocb.payments.recipients.label',
                    icon: "ocb-icons ocb_odbiorcy",
                    action: "payments.recipients.list",
					priority: 3
                },
                {
                    id: "payments.taxpayers.list",
                    label: 'ocb.payments.taxpayers.label',
                    icon: "ocb-icons ocb_odbiorcy",
                    action: "payments.taxpayers.list",
                    priority: 4
                },
                {
                    id: "payments.future.list",
                    label: 'ocb.payments.future.label',
                    icon: "ocb-icons payments_waiting",
                    action: "payments.future.list",
                    priority: 5
                },
                {
                    id: "payments.rejected.list",
                    label: 'ocb.payments.rejected.label',
                    icon: "ocb-icons operation_rejected",
                    action: "payments.rejected.list",
                    priority: 6
                },
                {
                    id: "payments.standing.list",
                    label: 'ocb.payments.standing.label',
                    icon: "ocb-icons ocb_zlecenie_stale",
                    action: "payments.standing.list",
                    priority: 7
                },
                {
                    id: "payments.basket.fill",
                    label: 'ocb.payments.basket.label',
                    icon: "ocb-icons basket",
                    action: "payments.basket.new.fill",
                    priority: 9
                }
            ]
        });
    }
    function registerRestrictedState(){
        privilegesServiceProvider.registerRestrictedState('payments').restrictWidget('payments').restrictionRules.add(privilegesServiceProvider.createRestriction.ifFunctionalityEnabled(PRIVILEGES_FUNCTIONALITY.PAYMENTS));
    }

    registerModule();
    registerComponents();
    registerBaseState();
    registerNavigation();
    registerRestrictedState();

}).run(function (BANK_NRB_CONSTANTS, systemParameterService, customerService, SEGMENT_TYPES, menuService, invoobillPaymentsService) {
    systemParameterService.getParameterByName("account.bank.prefix.rbpl").then(function(data){
        BANK_NRB_CONSTANTS.internal_prefix = data.value.split(',');
    });

    systemParameterService.getParameterByName("INVB.name").then(function(paramName) {
        customerService.getCustomerDetails().then(function (userDetails) {
            var customerDetails = userDetails.customerDetails;
            var customerBusinessLine = customerDetails.businessLine;

            var menuItem = {
                id: "payments.invoobill",
                label: paramName.value,
                icon: "ocb-icons invoobill",
                priority: 8
            };

            //pobranie parametru access.invb
            systemParameterService.getParameterByName("access.invb").then(function (param) {
                var acceessParameter = param.value.split(',').map(function (item) {
                    return item.trim();
                });

                var visible = false;

                //kontekst DETAL
                if (acceessParameter.indexOf('D') != -1 &&
                    (customerBusinessLine == SEGMENT_TYPES.DETAIL_AFFLUENT ||
                    customerBusinessLine == SEGMENT_TYPES.DETAIL_CSB)) {
                    visible = true;
                    //kontekst MICRO
                } else if (acceessParameter.indexOf('M') != -1 &&
                    customerBusinessLine == SEGMENT_TYPES.MICRO) {
                    invoobillPaymentsService.getVisibleInvoobill().then(function (visible) {
                        if (visible) {
                            invoobillPaymentsService.getStatus().then(function (status) {
                                var action = "";
                                if (status) {
                                    menuItem.action = "payments.invoobill.list";
                                    menuService.pushMenuItems('ocb-payments', menuItem);
                                } else {
                                    invoobillPaymentsService.isAccess().then(function (access) {
                                        if (access) {
                                            action = "payments.invoobill.activation";
                                        } else {
                                            action = "payments.invoobill.formalIdLack";
                                        }
                                        menuItem.action = action;
                                        menuService.pushMenuItems('ocb-payments', menuItem);
                                    });

                                }
                            });
                        }
                    });
                    //FWR
                } else if (acceessParameter.indexOf('F') != -1 &&
                    customerBusinessLine == SEGMENT_TYPES.DETAIL_FWR) {
                    visible = true;
                    //Pracownik
                } else if (acceessParameter.indexOf('P') != -1 &&
                    customerDetails.isEmployee) {
                    visible = true;
                }

                if (visible) {
                    invoobillPaymentsService.getStatus().then(function (status) {
                        var action = "";
                        if (status) {
                            menuItem.action = "payments.invoobill.list";
                            menuService.pushMenuItems('ocb-payments', menuItem);
                        } else {
                            invoobillPaymentsService.isAccess().then(function (access) {
                                if (access) {
                                    action = "payments.invoobill.activation";
                                } else {
                                    action = "payments.invoobill.formalIdLack";
                                }
                                menuItem.action = action;
                                menuService.pushMenuItems('ocb-payments', menuItem);
                            });

                        }
                    });
                }

            });

        });
    });

}).value('BANK_NRB_CONSTANTS', {
    internal_prefix: null
}).filter('arrayFilter', function(){
    return function(items){
        return angular.isArray(items) ? items.join("") : items;
    };
});