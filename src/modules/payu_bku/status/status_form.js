
angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.payu_bku.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/payu_bku/status/status_form.html",
            controller: "PayUBKUStep3Controller",
            data: {
                analyticsTitle: "config.multistepform.labels.step3"
            }
        });
    })
    .controller("PayUBKUStep3Controller", function($scope, bdStepStateEvents, bdStatusStepInitializer, $timeout) {

        /*function autoReloadValidTable() {
            if($scope.paymentsBatchProcessingForm.result && $scope.paymentsBatchProcessingForm.result.code){
                $scope.result.code = $scope.paymentsBatchProcessingForm.result.code;
                $scope.result.type = $scope.paymentsBatchProcessingForm.result.type;
            }else{
                $timeout(autoReloadValidTable, 500);
            }
        }
        $timeout(autoReloadValidTable, 500);*/

        bdStatusStepInitializer($scope, {
            formName: 'payUBKUFormParams',
            dataObject: $scope.paymentsBatchProcessingForm
        });

        $scope.payUBKUFormParams.formData = {};
        // // $scope.payUBKUFormParams.batchInfoSearch = false;
        // $scope.payUBKUFormParams.validTableShow = false;
        // $scope.payUBKUFormParams.inValidTableShow = false;
        //
        // $scope.paymentsBatchProcessingFormParams.visibility.search = true;
        // $scope.paymentsBatchProcessingFormParams.visibility.accept = false;
        // $scope.paymentsBatchProcessingFormParams.visibility.prev_fill = false;
    });
