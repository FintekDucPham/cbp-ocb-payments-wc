angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.content', {
            url: "/content",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/payments_list.html",
            controller: "PaymentsListController"
        });
    })
    .controller('PaymentsListController', function ($scope, $rootScope, paymentsService, $filter, transactionService, transactionFilterCriteria, gate, $timeout, customerProductService, blockadesService, $state, $stateParams, searchWrapperService, domService, viewStateService) {
        $state.go('payments.recipients.list');
    });