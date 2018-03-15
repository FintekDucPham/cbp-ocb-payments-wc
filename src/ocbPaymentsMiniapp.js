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
            iconClass: 'payments-icon',
            priority: 200,
            showMain: true,
            // TODO JAKO_DISABLE payments - default page
            baseItem: "payments.external.new.fill",
            //baseItem: "payments.recipients.list",
            title: 'ocb.menu.transfer',
            items:[
                {
                    id: "payments.external.new.fill",
                    label: 'payments.submenu.options.new_external.header',
                    icon: "ocb-icons ocb_przelew",
                    action: "payments.external.new.fill",
                    priority: 1
                },
                {
                    id: "payments.internal.new.fill",
                    label: 'payments.submenu.options.new_internal.header',
                    icon: "ocb-icons ocb_przelew",
                    action: function (item, scope, state) {
                        state.go('payments.internal.new.fill', {
                            recipientId: null
                        }, {
                            reload: true
                        });
                    },
                    priority: 1
                },
                {
                    id: "payments.fast.new.fill",
                    label: 'payments.submenu.options.new_fast.header',
                    icon: "ocb-icons ocb_przelew",
                    action: function (item, scope, state) {
                        state.go('payments.fast.new.fill', {
                            recipientId: null
                        }, {
                            reload: true
                        });
                    },
                    priority: 1
                },
                // TODO JAKO_DISABLE accumulative savings
                // {
                //     id: "payments.new_saving.fill",
                //     label: 'ocb.payments.submenu.options.new_saving.header',
                //     icon: "ocb-icons ocb_przelew",
                //     action: "payments.new_saving.fill",
                //     priority: 1
                // },
                {
                    id: "payments.recipients.list",
                    label: 'ocb.payments.recipients.label',
                    icon: "ocb-icons ocb_odbiorcy",
                    action: "payments.recipients.list",
					priority: 3
                },
                // TODO JAKO_DISABLE planned payments
                // {
                //     id: "payments.future.list",
                //     label: 'ocb.payments.future.label',
                //     icon: "ocb-icons payments_waiting",
                //     action: "payments.future.list",
                //     priority: 5
                // },
                {
                    id: "payments.rejected.list",
                    label: 'ocb.payments.rejected.label',
                    icon: "ocb-icons operation_rejected",
                    action: "payments.rejected.list",
                    priority: 6
                },
                // TODO JAKO_DISABLE standing orders
                // {
                //     id: "payments.standing.list",
                //     label: 'ocb.payments.standing.label',
                //     icon: "ocb-icons ocb_zlecenie_stale",
                //     action: "payments.standing.list",
                //     priority: 7
                // },
                // TODO JAKO_DISABLE auto bill
                // {
                //     id: "payments.auto_bill_list",
                //     label: 'ocb.payments.auto_bill.label',
                //     icon: "ocb-icons ocb_zlecenie_stale",
                //     action: "payments.auto_bill_list",
                //     priority: 8
                // },
                {
                    id: "payments.basket.fill",
                    label: "ocb.payments.basket.label",
                    icon: "ocb-icons basket",
                    action: "payments.basket.new.fill",
                    priority: 9
                }
                //,
                // TODO JAKO_DISABLE batch processing
                // {
                //     id: "payments.batch_processing",
                //     label: "ocb.payments.batch_processing.label",
                //     icon: "ocb-icons basket",
                //     action: "payments.batch_processing.fill",
                //     priority: 10
                // }
                // TODO JAKO_DISABLE bill payment
                //,
                // {
                //     id: "payments.new_bill.fill",
                //     label: 'payments.submenu.options.new_bill.header',
                //     icon: "ocb-icons ocb_przelew",
                //     action: "payments.new_bill.fill",
                //     priority: 11
                // },
                // TODO JAKO_DISABLE bill history
                // {
                //     id: "payments.bill_history.list",
                //     label: "ocb.payments.basket.list.details.historyAction",
                //     icon: "ocb-icons basket",
                //     action: "payments.bill_history.list",
                //     priority: 12
                // },
                // TODO JAKO_DISABLE tuition fee
                // {
                //     id: "payments.tuition_fee.fill",
                //     label: "ocb.payments.tuition.label.header",
                //     icon: "ocb-icons basket",
                //     action: "payments.tuition_fee.fill",
                //     priority: 13
                // },
                // TODO JAKO_DISABLE CB pending transactions
                // {
                //     id: "payments.pending.fill",
                //     label: "ocb.payments.pending.label",
                //     icon: "ocb-icons basket",
                //     action: "payments.pending.fill",
                //     priority: 14
                // },
                // TODO JAKO_DISABLE payU
                // {
                //     id: "payments.payu",
                //     label: "ocb.payments.payu.label",
                //     icon: "ocb-icons basket",
                //     action: "payments.payu.fill",
                //     priority: 15
                // }
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

}).run(function (BANK_NRB_CONSTANTS, systemParameterService) {
    systemParameterService.getParameterByName("account.bank.prefix.rbpl").then(function(data){
        BANK_NRB_CONSTANTS.internal_prefix = data.value.split(',');
    });
}).value('BANK_NRB_CONSTANTS', {
    internal_prefix: null
}).filter('arrayFilter', function(){
    return function(items){
        return angular.isArray(items) ? items.join("") : items;
    };
});