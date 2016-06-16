angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.invoobill.activationSuccessful', {
            url: "/activationSuccessful",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/invoobill/activation/payments_invoobill_activation_successful.html",
            controller: "PaymentsInvoobillAcctivationSuccessfulController",
            params: {
                referenceId: null
            }
        });
    })
    .controller('PaymentsInvoobillAcctivationSuccessfulController', function ($scope, $state) {
        $scope.next = function() {
            $state.go('payments.invoobill.list');
        };

        $scope.cancel = function() {
            $state.go('payments.recipients.list');
        };
    });