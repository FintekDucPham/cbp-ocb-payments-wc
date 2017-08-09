angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.invoobill.activationSuccessful', {
            url: "/activationSuccessful",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/invoobill/activation/payments_invoobill_activation_successful.html",
            controller: "PaymentsInvoobillAcctivationSuccessfulController",
            params: {
                referenceId: null
            }
        });
    })
    .controller('PaymentsInvoobillAcctivationSuccessfulController', function ($scope, $state, translate) {
        $scope.next = function() {
            $state.go('payments.invoobill.list');
        };

        $scope.labels = {
            successful: translate.property('ocb.payments.invoobill.activation.successful', [$scope.invbName])
        };
    });
