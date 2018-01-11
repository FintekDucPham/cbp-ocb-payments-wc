
/**
 * Created by Tien Bui on 10/30/2017.
 */
angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.batch_processing.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/batch_processing/status/status_form.html",
            controller: "PaymentsBatchProcessingStep3Controller",
            data: {
                analyticsTitle: "config.multistepform.labels.step3"
            }
        });
    })
    .controller("PaymentsBatchProcessingStep3Controller", function($scope, bdStepStateEvents, bdStatusStepInitializer, $timeout) {

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
            formName: 'paymentsBatchProcessingFormForm',
            dataObject: $scope.paymentsBatchProcessingForm
        });

        $scope.paymentsBatchProcessingForm.formData = {};
        $scope.paymentsBatchProcessingForm.transferUpdated = {};
        $scope.paymentsBatchProcessingForm.batchInfoSearch = false;
        $scope.paymentsBatchProcessingForm.validTableShow = false;
        $scope.paymentsBatchProcessingForm.inValidTableShow = false;

        $scope.paymentsBatchProcessingFormParams.visibility.search = true;
        $scope.paymentsBatchProcessingFormParams.visibility.accept = false;
        $scope.paymentsBatchProcessingFormParams.visibility.prev_fill = false;
    });
