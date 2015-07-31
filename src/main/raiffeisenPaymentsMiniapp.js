angular.module('raiffeisen-payments', [

	'raiffeisen-shared'

]).config(function(menuServiceProvider, translationsLoaderProvider, $urlRouterProvider, miniappServiceProvider, pathServiceProvider, stateServiceProvider) {
    'use strict';

    function registerModule() {
        webComponentRegistry['raiffeisen-payments'].simpleName = "payments";
        webComponentRegistry['raiffeisen-payments'].startState = "payments.content";
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
            priority: 8000,
            baseItem: 'payments.new.fill',
            title: 'payments.title',
            items:[
            {
                id: "payments.new.fill",
                label: 'payments.submenu.options.new.header',
                icon: "raiff-icons raiff_platnosci",
                action: "payments.new.fill({ paymentType: 'internal' })"
            },
            {
                    id: "payments.recipients",
                    label: 'raiff.payments.recipients.label',
                    icon: "raiff-icons raiff_odbiorcy",
                    action: "payments.recipients"
             }
            ]
        });
    }

    registerModule();
    registerComponents();
    registerBaseState();
    registerNavigation();

}).run(function() {

});