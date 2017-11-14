/**
 * Created by Thai Bui on 10/30/2017.
 */
angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.batch_processing.verify', {
            url: "/verify",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/batch_processing/verify/verify_form.html",
            controller: "PaymentsBatchProcessingStep2Controller",
            data: {
                analyticsTitle: "config.multistepform.labels.step2"
            }

        });
    })
    .controller("PaymentsBatchProcessingStep2Controller"
        , function($scope, bdStepStateEvents, formService, translate, $filter) {
        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            actions.proceed();
            console.log("PaymentsBatchProcessingStep2Controller FORWARD_MOVE");
        });
        $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
            actions.proceed();
            var acoount = paymentsBatchProcessingForm.formData.selectedAccount;
            console.log("PaymentsBatchProcessingStep2Controller BACKWARD_MOVE");
        });

        $scope.getCurrentDate = function(isEn) {
            var result = "";
            var date = new Date();
            if(isEn ===true) {
                result =  $filter('date')(date, "MM/dd/yyyy");
            }else {
                result =  $filter('date')(date, "dd/MM/yyyy");
            }
            return result;
        }


    });
