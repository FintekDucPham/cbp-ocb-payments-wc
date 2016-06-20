angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.invoobill.resignationSuccessful', {
            url: "/resignationSuccessful",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/invoobill/resignation/payments_invoobill_resignation_successful.html",
            controller: "PaymentsInvoobillResignationSuccessfulController",
            params: {
                referenceId: null
            }
        });
    })
    .controller('PaymentsInvoobillResignationSuccessfulController', function ($scope, $state) {

        $scope.back = function() {
            $state.go('payments.recipients.list');
        };
    });
