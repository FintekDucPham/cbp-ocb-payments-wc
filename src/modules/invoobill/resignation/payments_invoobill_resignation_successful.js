angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.invoobill.resignationSuccessful', {
            url: "/resignationSuccessful",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/invoobill/resignation/payments_invoobill_resignation_successful.html",
            controller: "PaymentsInvoobillResignationSuccessfulController",
            params: {
                referenceId: null
            }
        });
    })
    .controller('PaymentsInvoobillResignationSuccessfulController', function ($scope, $state, translate) {

        $scope.labels = {
            successful: translate.property('ocb.payments.invoobill.resignation.successful', [$scope.invbName])
        };

        $scope.back = function() {
            $state.go('payments.recipients.list');
        };
    });
