
angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.payu_bku.verify', {
            url: "/verify",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/payu_bku/verify/verify_form.html",
            controller: "PayUBKUStep2Controller",
            data: {
                analyticsTitle: "config.multistepform.labels.step2"
            }

        });
    })
    .controller("PayUBKUStep2Controller"
        , function($scope, bdStepStateEvents,rbPaymentOperationTypes,bdVerifyStepInitializer) {
            bdVerifyStepInitializer($scope, {
                formName: 'payuBkuForm',
                dataObject: $scope.payuBku
            });
            $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
                if ($scope.payuBku.operation.code !== rbPaymentOperationTypes.EDIT.code) {
                    authorize(actions.proceed, actions);
                    // actions.proceed();
                }
                //clear data after process
                $scope.payuBku.data.stdInfo = {}
                $scope.payuBku.data.amountInfo = {}
                $scope.payuBku.data.paymentInfo = []
                $scope.payuBku.data.remitterInfo = {}
                $scope.payuBku.data.subjectSelected = [];
                 // actions.proceed();
              });

            $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
                actions.proceed();
            });

    });


