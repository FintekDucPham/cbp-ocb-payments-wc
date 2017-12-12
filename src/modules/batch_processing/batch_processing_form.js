/**
 * Created by Tien Bui on 10/30/2017.
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
    .controller('PaymentsBatchProcessingController', function ($scope, bdMainStepInitializer, bdTableConfig, transferBatchService) {

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

        $scope.batchProcessing = "batchProcessing";

        $scope.tableValidContent = [];
        $scope.tableValidCount = 0;
        $scope.tableTotalPage = 0;
        $scope.pageSize_ = 4;
        $scope.displayBankCode = false;

        $scope.paymentsBatchProcessingForm.batchInfoSearch = false;
        $scope.paymentsBatchProcessingForm.validTableShow = false;
        $scope.paymentsBatchProcessingForm.invalidTableShow = false;

        $scope.clearForm = function(){
            $scope.paymentsBatchProcessingFormParams.formData = {};
            $scope.paymentsBatchProcessingFormParams.items = {};
            $scope.$broadcast('clearForm');
        };
        $scope.testFormAction = function() {

        };
        $scope.showBatchInfoSearch = function(searchBool, nextBool ) {
            // if ($scope.payment.formData.billCode !== undefined) {

            $("#uploadFile").val("");

            $scope.paymentsBatchProcessingForm.batchInfoSearch = !$scope.paymentsBatchProcessingForm.batchInfoSearch;
            $scope.paymentsBatchProcessingFormParams.visibility.search = searchBool;//false;
            $scope.paymentsBatchProcessingFormParams.visibility.accept = searchBool;//true;
            $scope.paymentsBatchProcessingFormParams.visibility.prev_fill = nextBool;//true;
            // }
            if(searchBool){
                $scope.paymentsBatchProcessingForm.showTable(false);
                $scope.paymentsBatchProcessingFormParams.visibility.accept = false;
                // $scope.paymentsBatchProcessingForm.tableValidCount = 0;
                // $scope.paymentsBatchProcessingForm.tableValidContent = [];
                // $scope.paymentsBatchProcessingForm.tableTotalPage = 0;
                // $scope.paymentsBatchProcessingForm.resetTable();
            }
            // if($scope.paymentsBatchProcessingForm.tableValidCount > 0){
            //     $scope.tableUpload = true;
            //     $scope.paymentsBatchProcessingForm.batchInfoSearch = true;
            //     $scope.paymentsBatchProcessingFormParams.visibility.search = false;
            //     $scope.paymentsBatchProcessingFormParams.visibility.accept = true;
            // }
        };

        $scope.hideColumnTable = function(isInternal) {
            if(isInternal === 1){
                $scope.displayBankCode = false;
            }else{
                $scope.displayBankCode = true;
            }
        }

        $scope.checkTable = function(){
            $scope.paymentsBatchProcessingForm.tableValidCount = 0;
            $scope.paymentsBatchProcessingForm.tableValidContent = [];
            $scope.paymentsBatchProcessingForm.tableTotalPage = 0;
        };

        $scope.numberWithCommas = function (x) {
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }

        $scope.paymentsBatchProcessingFormParams = {
            completeState:'payments.batch_processing.fill',
            onClear: $scope.clearForm,
            cancelState:'dashboard',
            footerType: 'batchProcessing',
            onSearch: $scope.showBatchInfoSearch,
            onCheckTable: $scope.checkTable,
            labels:{
                prev:"ocb.payments.buttons.prev",
                testFormButton:'ocb.payments.batch_processing.custom.button',
                next:"ocb.payments.new.btn.next",
                finalize:"ocb.payments.new.btn.finalize",
                search: 'config.multistepform.buttons.search'
            },
            visibility:{
                search: true,
                change: true,
                clear: true,
                next: true,
                accept: true,
                prev_fill: false
            },
            testFormAction: $scope.testFormAction
        }

        $scope.paymentsBatchProcessingFormParams.visibility.search = true;
        $scope.paymentsBatchProcessingFormParams.visibility.accept = false;

    });

