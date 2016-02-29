angular.module('raiffeisen-payments', [

    'raiffeisen-shared'

]).config(function (menuServiceProvider, translationsLoaderProvider, $urlRouterProvider, miniappServiceProvider, pathServiceProvider, stateServiceProvider) {
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
                controller: "PaymentsViewController"
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
                    icon: "raiff-icons raiff_odbiorcy",
                    action: "payments.future.list",
                    priority: 5
                },
                {
                    id: "payments.rejected.list",
                    label: 'raiff.payments.rejected.label',
                    icon: "raiff-icons raiff_operacje_odrzucone",
                    action: "payments.rejected.list",
                    priority: 6
                },
                {
                    id: "payments.standing.list",
                    label: 'raiff.payments.standing.label',
                    icon: "raiff-icons raiff_odbiorcy",
                    action: "payments.standing.list",
                    priority: 7
                },
                {
                    id: "payments.multisign",
                    label: 'raiff.payments.future.label',
                    icon: "raiff-icons raiff_odbiorcy",
                    action: "payments.multisign",
                    priority: 8
                }
            ]
        });
    }

    registerModule();
    registerComponents();
    registerBaseState();
    registerNavigation();

}).run(function (RAIFF_NRB_CONSTANTS, systemParameterService) {
    systemParameterService.getParameterByName("account.bank.prefix.rbpl").then(function(data){
        RAIFF_NRB_CONSTANTS.insternal_prefix = data.value.split(',');/*przy mergu poprawna nazwa to RAIFF_NRB_CONSTANTS*/
    });
}).value('RAIFF_NRB_CONSTANTS', {
    insternal_prefix: null
});