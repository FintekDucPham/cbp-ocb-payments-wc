
angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.payu_bku', {
            url: "/payu_bku",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/payu_bku/payu_bku_form.html",
            controller: "PayUBKUController",
            abstract: true,
            data: {
                analyticsTitle: null
            }
        });
    })
    .controller('PayUBKUController', function ($scope, bdMainStepInitializer, bdTableConfig, transferBatchService) {

        bdMainStepInitializer($scope, 'payuBku', {
            formName: 'payuBkuForm',
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
        //
        // $scope.batchProcessing = "batchProcessing";
        //
        // $scope.tableValidContent = [];
        // $scope.tableValidCount = 0;
        // $scope.tableTotalPage = 0;
        // $scope.pageSize_ = 4;
        // $scope.displayBankCode = false;
        //
        // $scope.paymentsBatchProcessingForm.batchInfoSearch = false;
        // $scope.paymentsBatchProcessingForm.validTableShow = false;
        // $scope.paymentsBatchProcessingForm.invalidTableShow = false;
        //
        // $scope.clearForm = function(){
        //     $scope.paymentsBatchProcessingFormParams.formData = {};
        //     $scope.paymentsBatchProcessingFormParams.items = {};
        //     $scope.$broadcast('clearForm');
        // };
        // $scope.showBatchInfoSearch = function(searchBool, nextBool ) {
        //     // if ($scope.payment.formData.billCode !== undefined) {
        //
        //     $("#uploadFile").val("");
        //
        //     $scope.paymentsBatchProcessingForm.batchInfoSearch = !$scope.paymentsBatchProcessingForm.batchInfoSearch;
        //     $scope.paymentsBatchProcessingFormParams.visibility.search = searchBool;//false;
        //     $scope.paymentsBatchProcessingFormParams.visibility.accept = searchBool;//true;
        //     $scope.paymentsBatchProcessingFormParams.visibility.prev_fill = nextBool;//true;
        //     // }
        //     if(searchBool){
        //         $scope.paymentsBatchProcessingForm.showTable(false);
        //         $scope.paymentsBatchProcessingFormParams.visibility.accept = false;
        //         // $scope.paymentsBatchProcessingForm.tableValidCount = 0;
        //         // $scope.paymentsBatchProcessingForm.tableValidContent = [];
        //         // $scope.paymentsBatchProcessingForm.tableTotalPage = 0;
        //         // $scope.paymentsBatchProcessingForm.resetTable();
        //     }
        //     // if($scope.paymentsBatchProcessingForm.tableValidCount > 0){
        //     //     $scope.tableUpload = true;
        //     //     $scope.paymentsBatchProcessingForm.batchInfoSearch = true;
        //     //     $scope.paymentsBatchProcessingFormParams.visibility.search = false;
        //     //     $scope.paymentsBatchProcessingFormParams.visibility.accept = true;
        //     // }
        // };
        //
        // $scope.hideColumnTable = function(isInternal) {
        //     if(isInternal === 1){
        //         $scope.displayBankCode = false;
        //     }else{
        //         $scope.displayBankCode = true;
        //     }
        // }
        //
        // $scope.checkTable = function(){
        //     $scope.paymentsBatchProcessingForm.tableValidCount = 0;
        //     $scope.paymentsBatchProcessingForm.tableValidContent = [];
        //     $scope.paymentsBatchProcessingForm.tableTotalPage = 0;
        // };
        //
        // $scope.numberWithCommas = function (x) {
        //     return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        // }
        $scope.payuBkuFormParams = {
            completeState:'payments.payu_bku.fill',
            onClear: $scope.clearForm,
            cancelState:'payments.payu_bku.fill',
            footerType: 'payu',
            labels:{
                prev:"ocb.payments.buttons.prev",
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
        }
        //
        // $scope.paymentsBatchProcessingFormParams.visibility.search = true;
        // $scope.paymentsBatchProcessingFormParams.visibility.accept = false;

    });

