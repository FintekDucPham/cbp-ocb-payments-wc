angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.accept', {
            url: "/accept",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/accept/payments_accept.html",
            controller: "PaymentsAcceptController"
        });
    })
    .controller('PaymentsAcceptController', function ($scope, $rootScope, paymentsService, $filter, transactionService, transactionFilterCriteria, gate, $timeout, customerProductService, blockadesService, $state, $stateParams, searchWrapperService, domService, viewStateService, formService) {
        $scope.backToDesktop = function(){
            $state.go('dashboard');
        };
    });


