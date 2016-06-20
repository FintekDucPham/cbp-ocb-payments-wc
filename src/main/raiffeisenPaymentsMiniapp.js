angular.module('raiffeisen-payments', [

    'raiffeisen-shared'

]).config(function (menuServiceProvider, translationsLoaderProvider, $urlRouterProvider, miniappServiceProvider, pathServiceProvider, stateServiceProvider, privilegesServiceProvider, PRIVILEGES_FUNCTIONALITY) {
    'use strict';

    function registerModule() {
        webComponentRegistry['raiffeisen-payments'].simpleName = "payments";
        webComponentRegistry['raiffeisen-payments'].startState = "payments.recipients.list";
    }

    function registerComponents() {
        miniappServiceProvider.registerWidget("raiffeisen-payments");
        translationsLoaderProvider.addTranslationsPath(pathServiceProvider.generateRootPath("raiffeisen-payments") + "/i18n/messages_{{language}}.json");
    }

    function registerBaseState() {
        $urlRouterProvider.when('/payments', '/payments/content');
        stateServiceProvider
            .state('payments', {
                url: "/payments",
                abstract: true,
                templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/layouts/fullscreen/fullscreen_payments.html",
                controller: "PaymentsViewController",
                data: {
                    analyticsTitle: "raiff.menu.transfer"
                }
            });
    }

    function registerNavigation() {
        menuServiceProvider.registerMenu({
            id: 'raiffeisen-payments',
            priority: 200,
            showMain: true,
            baseItem: "payments.recipients.list",
            title: 'raiff.menu.transfer',
            items:[
                {
                    id: "payments.new.fill",
                    label: 'payments.submenu.options.new.header',
                    icon: "raiff-icons raiff_przelew",
                    action: "payments.new.fill({ paymentType: 'domestic' })",
                    priority: 1
                },
                {
                    id: "payments.new_foreign.fill",
                    label: 'payments.submenu.options.new_foreign.header',
                    icon: "raiff-icons raiff_przelew",
                    action: "payments.new_foreign.fill({ paymentType: 'sepa' })",
                    priority: 2
                },
                {
                    id: "payments.new_internal.fill",
                    label: 'payments.submenu.options.new_internal.header',
                    icon: "raiff-icons raiff_przelew",
                    action: "payments.new_internal.fill",
                    priority: 1
                },
                {
                    id: "payments.recipients.list",
                    label: 'raiff.payments.recipients.label',
                    icon: "raiff-icons raiff_odbiorcy",
                    action: "payments.recipients.list",
					priority: 3
                },
                {
                    id: "payments.taxpayers.list",
                    label: 'raiff.payments.taxpayers.label',
                    icon: "raiff-icons raiff_odbiorcy",
                    action: "payments.taxpayers.list",
                    priority: 4
                },
                {
                    id: "payments.future.list",
                    label: 'raiff.payments.future.label',
                    icon: "raiff-icons payments_waiting",
                    action: "payments.future.list",
                    priority: 5
                },
                {
                    id: "payments.rejected.list",
                    label: 'raiff.payments.rejected.label',
                    icon: "raiff-icons operation_rejected",
                    action: "payments.rejected.list",
                    priority: 6
                },
                {
                    id: "payments.standing.list",
                    label: 'raiff.payments.standing.label',
                    icon: "raiff-icons raiff_zlecenie_stale",
                    action: "payments.standing.list",
                    priority: 7
                },
                {
                    id: "payments.basket.fill",
                    label: 'raiff.payments.basket.label',
                    icon: "raiff-icons basket",
                    action: "payments.basket.new.fill",
                    priority: 8
                }/*,
                {
                    id: "payments.invoobill",
                    label: 'raiff.payments.invoobill.label',
                    icon: "raiff-icons invoobill",
                    action: "payments.invoobill.list",
                    priority: 9
                }*/
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

}).run(function (RAIFF_NRB_CONSTANTS, systemParameterService, customerService, SEGMENT_TYPES, menuService, invoobillPaymentsService) {
    systemParameterService.getParameterByName("account.bank.prefix.rbpl").then(function(data){
        RAIFF_NRB_CONSTANTS.insternal_prefix = data.value.split(',');/*przy mergu poprawna nazwa to RAIFF_NRB_CONSTANTS*/
    });


    customerService.getCustomerDetails().then(function(userDetails){
        var customerDetails = userDetails.customerDetails;
        var customerBusinessLine = customerDetails.businessLine;

        var menuItem = {
            id: "payments.invoobill",
            label: 'raiff.payments.invoobill.label',
            icon: "raiff-icons invoobill",
            priority: 9
        };

        //pobranie parametru access.invb
        systemParameterService.getParameterByName("access.invb").then(function (param) {
            var acceessParameter = param.value.split(',').map(function (item) {
                return item.trim();
            });

            var visible = false;

            //kontekst DETAL
            if(acceessParameter.indexOf('D') != -1 &&
                (customerBusinessLine == SEGMENT_TYPES.DETAIL_AFFLUENT ||
                customerBusinessLine ==  SEGMENT_TYPES.DETAIL_CSB)){
                visible = true;
            //kontekst MICRO
            } else if(acceessParameter.indexOf('M') &&
                customerBusinessLine == SEGMENT_TYPES.MICRO) {
                visible = true;
            //FWR
            } else if(acceessParameter.indexOf('F') &&
                customerBusinessLine == SEGMENT_TYPES.DETAIL_FWR) {
                visible = true;
            //Pracownik
            } else if(acceessParameter.indexOf('P') &&
                customerDetails.isEmployee) {
                visible = true;
            }

            if(visible) {
                //sprawdzenie dostepnosci uslugi
                invoobillPaymentsService.isAccess().then(function(access) {
                    if(access) {
                        invoobillPaymentsService.getStatus().then(function(status) {
                           var action = "";
                           if(status) {
                               action = "payments.invoobill.list";
                           }  else {
                               action = "payments.invoobill.activation";
                           }

                           menuItem.action = action;
                           menuService.pushMenuItems('raiffeisen-payments', menuItem);
                        });
                    } else {
                        menuItem.action = "payments.invoobill.formalIdLack";
                        menuService.pushMenuItems('raiffeisen-payments', menuItem);
                    }


                });
            }

        });

    });

}).value('RAIFF_NRB_CONSTANTS', {
    insternal_prefix: null
}).filter('arrayFilter', function(){
    return function(items){
        return angular.isArray(items) ? items.join("") : items;
    };
});