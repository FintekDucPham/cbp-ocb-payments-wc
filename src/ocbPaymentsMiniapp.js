angular.module('ocb-payments', [
    'ocb-shared',
]).config(function (menuServiceProvider, translationsLoaderProvider, $urlRouterProvider, miniappServiceProvider, pathServiceProvider, stateServiceProvider, privilegesServiceProvider, PRIVILEGES_FUNCTIONALITY, CUSTOMER) {
    'use strict'

    function registerModule() {
        webComponentRegistry['ocb-payments'].simpleName = 'payments'
        webComponentRegistry['ocb-payments'].startState = 'payments.recipients.list'
    }

    function registerComponents() {
        miniappServiceProvider.registerWidget('ocb-payments')
        translationsLoaderProvider.addTranslationsPath(pathServiceProvider.generateRootPath('ocb-payments') + '/i18n/messages_{{language}}.json')
    }

    function registerBaseState() {
        $urlRouterProvider.when('/payments', '/payments/content')
        stateServiceProvider
            .state('payments', {
                url: '/payments',
                abstract: true,
                templateUrl: pathServiceProvider.generateTemplatePath('ocb-payments') + '/layouts/fullscreen/fullscreen_payments.html',
                controller: 'PaymentsViewController',
                data: {
                    analyticsTitle: 'ocb.menu.transfer',
                },
            })
    }

    var restrictedStatesForCbUser = [
        'payments.new_saving.fill',
        'payments.basket.new.fill',
        'payments.tuition_fee.fill',
        'payments.payu.fill',
    ]

    var restrictedStatesForSilverPackage = [
        'payments.external.new.fill',
        'payments.internal.new.fill',
        'payments.fast.new.fill',
        'payments.new_saving.fill',
        'payments.recipients.list',
        'payments.standing.list',
        'payments.auto_bill_list',
        'payments.basket.new.fill',
        'payments.batch_processing.fill',
        'payments.new_bill.fill',
        'payments.bill_history.list',
        'payments.tuition_fee.fill',
        'payments.payu.fill'
    ]

    function registerRestrictedState() {
        privilegesServiceProvider
            .registerRestrictedState('payments')
            .restrictWidget('payments')
            .restrictionRules
            .add(privilegesServiceProvider.createRestriction.ifFunctionalityEnabled(PRIVILEGES_FUNCTIONALITY.PAYMENTS))

        angular.forEach(restrictedStatesForCbUser, function (state) {
            privilegesServiceProvider
                .registerRestrictedState(state)
                .restrictionRules
                .add(privilegesServiceProvider.createRestriction.isNotCbUser())
        })

        angular.forEach(restrictedStatesForSilverPackage, function (state) {
            privilegesServiceProvider
                .registerRestrictedState(state)
                .restrictionRules
                .add(privilegesServiceProvider.createRestriction.hasNotPackageType(CUSTOMER.PACKAGE_TYPE.SILVER));
        })

    }

    registerModule()
    registerComponents()
    registerBaseState()
    registerRestrictedState()

})
    .run(['$q', 'customerService', 'menuService', 'CUSTOMER', 'BANK_NRB_CONSTANTS', 'systemParameterService', function ($q, customerService, menuService, CUSTOMER, BANK_NRB_CONSTANTS, systemParameterService) {
        systemParameterService.getParameterByName('account.bank.prefix.rbpl').then(function (data) {
            BANK_NRB_CONSTANTS.internal_prefix = data.value.split(',')
        })

        $q.all({
            isCbUser: customerService.isCbUser(),
            hasPackageType: customerService.hasPackageType(CUSTOMER.PACKAGE_TYPE.SILVER),
        }).then(function (user) {
            var menuItems = [{
                id: 'payments.external.new.fill',
                label: 'payments.submenu.options.new_external.header',
                icon: 'ocb-icons ocb_przelew',
                action: 'payments.external.new.fill',
                priority: 1,
            }, {
                id: 'payments.internal.new.fill',
                label: 'payments.submenu.options.new_internal.header',
                icon: 'ocb-icons ocb_przelew',
                action: function (item, scope, state) {
                    state.go('payments.internal.new.fill', {
                        recipientId: null,
                    }, {
                        reload: true,
                    })
                },
                priority: 1,
            }, {
                id: 'payments.fast.new.fill',
                label: 'payments.submenu.options.new_fast.header',
                icon: 'ocb-icons ocb_przelew',
                action: function (item, scope, state) {
                    state.go('payments.fast.new.fill', {
                        recipientId: null,
                    }, {
                        reload: true,
                    })
                },
                priority: 1,
            }, {
                id: 'payments.new_saving.fill',
                label: 'ocb.payments.submenu.options.new_saving.header',
                icon: 'ocb-icons ocb_przelew',
                action: 'payments.new_saving.fill',
                priority: 1,
            }, {
                id: 'payments.recipients.list',
                label: 'ocb.payments.recipients.label',
                icon: 'ocb-icons ocb_odbiorcy',
                action: 'payments.recipients.list',
                priority: 3,
            }, {
            // TODO JAKO_DISABLE planned payments
            //     id: 'payments.future.list',
            //     label: 'ocb.payments.future.label',
            //     icon: 'ocb-icons payments_waiting',
            //     action: 'payments.future.list',
            //     priority: 5,
            // }, {
            // TODO JAKO_DISABLE rejected payments
            //     id: 'payments.rejected.list',
            //     label: 'ocb.payments.rejected.label',
            //     icon: 'ocb-icons operation_rejected',
            //     action: 'payments.rejected.list',
            //     priority: 6,
            // }, {
            // TODO JAKO_DISABLE standing orders
            //     id: 'payments.standing.list',
            //     label: 'ocb.payments.standing.label',
            //     icon: 'ocb-icons ocb_zlecenie_stale',
            //     action: 'payments.standing.list',
            //     priority: 7,
            // }, {
            // TODO JAKO_DISABLE auto bill
            //     id: 'payments.auto_bill_list',
            //     label: 'ocb.payments.auto_bill.label',
            //     icon: 'ocb-icons ocb_zlecenie_stale',
            //     action: 'payments.auto_bill_list',
            //     priority: 8,
            // }, {
                id: 'payments.basket.fill',
                label: 'ocb.payments.basket.label',
                icon: 'ocb-icons basket',
                action: 'payments.basket.new.fill',
                priority: 9,
            }
            //, {
            // TODO JAKO_DISABLE batch processing
            //     id: 'payments.batch_processing',
            //     label: 'ocb.payments.batch_processing.label',
            //     icon: 'ocb-icons basket',
            //     action: 'payments.batch_processing.fill',
            //     priority: 10,
            // }, {
            // TODO JAKO_DISABLE bill payment
            //     id: 'payments.new_bill.fill',
            //     label: 'payments.submenu.options.new_bill.header',
            //     icon: 'ocb-icons ocb_przelew',
            //     action: 'payments.new_bill.fill',
            //     priority: 11,
            // }, {
            // TODO JAKO_DISABLE bill history
            //     id: 'payments.bill_history.list',
            //     label: 'ocb.payments.basket.list.details.historyAction',
            //     icon: 'ocb-icons basket',
            //     action: 'payments.bill_history.list',
            //     priority: 12,
            // }, {
            // TODO JAKO_DISABLE tuition fee
            //     id: 'payments.tuition_fee.fill',
            //     label: 'ocb.payments.tuition.label.header',
            //     icon: 'ocb-icons basket',
            //     action: 'payments.tuition_fee.fill',
            //     priority: 13,
            // }, {
            // TODO JAKO_DISABLE CB pending transactions
            //     id: 'payments.pending.fill',
            //     label: 'ocb.payments.pending.label',
            //     icon: 'ocb-icons basket',
            //     action: 'payments.pending.fill',
            //     priority: 14,
            // }, {
            // TODO JAKO_DISABLE payU
            //     id: 'payments.payu',
            //     label: 'ocb.payments.payu.label',
            //     icon: 'ocb-icons basket',
            //     action: 'payments.payu.fill',
            //     priority: 15,
            // }
            ]

            var baseItem ='payments.external.new.fill'
            if (user.hasPackageType === true) {
                // TODO JAKO_DISABLE planned payments
                //baseItem = 'payments.future.list'
            }

            menuService.registerMenu({
                id: 'ocb-payments',
                iconClass: 'payments-icon',
                priority: 200,
                showMain: true,
                baseItem: baseItem,
                title: 'ocb.menu.transfer',
                items: menuItems,
            })

            if (user.isCbUser === true) {
                menuService.removeMenuItem('ocb-payments', 'payments.new_saving.fill')
                menuService.removeMenuItem('ocb-payments', 'payments.basket.fill')
                menuService.removeMenuItem('ocb-payments', 'payments.tuition_fee.fill')
                menuService.removeMenuItem('ocb-payments', 'payments.payu')
            }

            if (user.hasPackageType === true) {
                menuService.removeMenuItem('ocb-payments', 'payments.external.new.fill')
                menuService.removeMenuItem('ocb-payments', 'payments.internal.new.fill')
                menuService.removeMenuItem('ocb-payments', 'payments.fast.new.fill')
                menuService.removeMenuItem('ocb-payments', 'payments.new_saving.fill')
                menuService.removeMenuItem('ocb-payments', 'payments.recipients.list')
                menuService.removeMenuItem('ocb-payments', 'payments.standing.list')
                menuService.removeMenuItem('ocb-payments', 'payments.auto_bill_list')
                menuService.removeMenuItem('ocb-payments', 'payments.basket.fill')
                menuService.removeMenuItem('ocb-payments', 'payments.batch_processing')
                menuService.removeMenuItem('ocb-payments', 'payments.new_bill.fill')
                menuService.removeMenuItem('ocb-payments', 'payments.bill_history.list')
                menuService.removeMenuItem('ocb-payments', 'payments.tuition_fee.fill')
                menuService.removeMenuItem('ocb-payments', 'payments.payu')
            }

        })
    }])
    .value('BANK_NRB_CONSTANTS', {
        internal_prefix: null,
    })
    .filter('arrayFilter', function () {
        return function (items) {
            return angular.isArray(items) ? items.join('') : items
        }
    })
    .constant('REJECTED_CODES', [
        '98',
        '99',
        'error',
        '',
    ])