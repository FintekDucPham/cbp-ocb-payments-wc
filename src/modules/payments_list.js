angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.content', {
            url: "/content",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/payments_list.html",
            controller: "PaymentsListController",
            data: {
                analyticsTitle: "payments.submenu.options.new.header"
            }
        });
    })
    .controller('PaymentsListController', function ($state) {
        $state.go('payments.recipients.list');
    });