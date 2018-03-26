angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.auto_bill_modify', {
            url: "/auto_bill",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/auto_bill/modify/payments_auto_bill.html",
            controller: "PaymentsAutoBillController",
            data: {
                analyticsTitle: null
            }
        });
    })
    .controller('PaymentsAutoBillController', function($scope, bdMainStepInitializer) {
        bdMainStepInitializer($scope, 'payment', {
            formName: 'autoBillForm',
            formData: {},
            options: {},
            validation: {}
        });

        $scope.clearForm = function(){
            // todo
            $scope.$broadcast('clearForm');
        };
    });