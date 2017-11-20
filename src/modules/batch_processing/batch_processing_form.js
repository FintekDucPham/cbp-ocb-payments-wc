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

        $scope.batchInfoSearch = false;
        $scope.tableUpload = false;

        $scope.clearForm = function(){
            $scope.paymentsBatchProcessingFormParams.formData = {};
            $scope.paymentsBatchProcessingFormParams.items = {};
            $scope.$broadcast('clearForm');
        };
        $scope.testFormAction = function() {
            console.log("CLick");
        };
        $scope.showBatchInfoSearch = function(searchBool, nextBool ) {
            // if ($scope.payment.formData.billCode !== undefined) {
            $scope.batchInfoSearch = !$scope.batchInfoSearch;
            $scope.paymentsBatchProcessingFormParams.visibility.search = searchBool;//false;
            $scope.paymentsBatchProcessingFormParams.visibility.accept = searchBool;//true;
            $scope.paymentsBatchProcessingFormParams.visibility.prev_fill = nextBool;//true;
            // }
            if(searchBool){
                $scope.tableUpload = false;
                $scope.paymentsBatchProcessingFormParams.visibility.accept = false;
            }
        };
        $scope.tableContent = [];
        $scope.tableCount = 0;
        $scope.tableTotalPage = 0;
        $scope.pageSize_ = 4;
        $scope.displayBankCode = false;

        $scope.hideColumnTable = function(isInternal) {
            // var bankCodeHeaderElement = document.querySelectorAll('[bd-table-heading=third]')[0];
            // bankCodeHeaderElement.style = isInternal?"display:none !important;":"display:block";
            // var bankCodeRowElements = document.querySelectorAll('[bd-table-cell=third]');
            // for(var i=0; i<bankCodeRowElements.length; i++) {
            //     bankCodeRowElements[i].style = isInternal?"display:none !important;":"display:block";
            // }
            if(isInternal === 1){
                $scope.displayBankCode = false;
            }else{
                $scope.displayBankCode = true;
            }
        }

        $scope.numberWithCommas = function (x) {
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }

        $scope.paymentsBatchProcessingFormParams = {
            completeState:'payments.batch_processing.fill',
            onClear: $scope.clearForm,
            cancelState:'dashboard',
            footerType: 'batchProcessing',
            onSearch: $scope.showBatchInfoSearch,
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

