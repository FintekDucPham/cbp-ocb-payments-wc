/**
 * Created by Thai Bui on 10/30/2017.
 */
angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.batch_processing', {
            url: "/batch_processing",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/batch_processing/batch_processing_form.html",
            controller: "PaymentsBatchProcessingController",
            abstract: true,
            data: {
                analyticsTitle: null
            }
        });
    })
    .controller('PaymentsBatchProcessingController', function ($scope, bdMainStepInitializer) {

        bdMainStepInitializer($scope, 'paymentsBatchProcessingForm', {
            formName: 'paymentsBatchProcessingFormForm',
            formData: {},
            options: {},
            meta: {},
            validation: {},
            items :{}
        });

        $scope.modify = {
            verify:{
                data: null
            }
        };

        $scope.clearForm = function(){
            $scope.paymentsBatchProcessingForm.formData = {};
            $scope.paymentsBatchProcessingForm.items = {};
            $scope.$broadcast('clearForm');
        };
        $scope.testFormAction = function() {
            console.log("CLick");
        }
        $scope.paymentsBatchProcessingFormParams = {
            completeState:'payments.new.fill',
            onClear:$scope.clearForm,
            cancelState:'dashboard',
            footerType: 'batchprocessing',
            labels:{
                prev:"ocb.payments.buttons.prev",
                testFormButton:'ocb.payments.batch_processing.custom.button',
                next:"ocb.payments.new.btn.next",
                finalize:"ocb.payments.new.btn.finalize"
            },
            visibility:{
            },
            testFormAction: $scope.testFormAction
        }
    });