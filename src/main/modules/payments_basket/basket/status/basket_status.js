angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.basket.new.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/payments_basket/basket/status/basket_status.html",
            controller: "PaymentsBasketStatusController"
        });
    })
    .controller('PaymentsBasketStatusController', function ($scope, $state, $timeout, $q, translate, $filter) {

    });