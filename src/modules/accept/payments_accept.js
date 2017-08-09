angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.accept', {
            url: "/accept",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/accept/payments_accept.html",
            controller: "PaymentsAcceptController",
            data: {
                analyticsTitle: "ocb.payments.new.confirmation.text"
            }
        });
    })
    .controller('PaymentsAcceptController', function ($scope, $rootScope, paymentsService, $filter, transactionService, transactionFilterCriteria, gate, $timeout, customerProductService, blockadesService, $state, $stateParams, searchWrapperService, domService, viewStateService, formService) {
        $scope.backToDesktop = function(){
            $state.go('dashboard');
        };
    });


