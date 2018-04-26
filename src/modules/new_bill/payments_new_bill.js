angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.new_bill', {
            url: "/billPayment",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/new_bill/payments_new_bill.html",
            controller: "PaymentNewBillController",
            // params: {
            //     payment: {},
            //     items: {}
            // },
            data: {
                analyticsTitle: null//"payments.submenu.options.new_bill.header"
            },
            resolve:{
                CURRENT_DATE: ['utilityService', function(utilityService){
                    return utilityService.getCurrentDateWithTimezone();
                }]
            }
        });
    })
    .controller('PaymentNewBillController', function ($scope,bdMainStepInitializer,customerService,rbPaymentOperationTypes,exportService,fileDownloadService) {

        // $scope.beforeTransfer = rbBeforeTransferConstants;
        // $scope.CURRENT_DATE = CURRENT_DATE;
        // $scope.billPayment = "billPayment";
        // $scope.tryIt = function () {
        //     console.warn("Thanh Long!!!!!");
        // }
        bdMainStepInitializer($scope, 'payment', {
            formName: 'paymentForm',
            options: {
                fixedAccountSelection: false
            },
            operation: rbPaymentOperationTypes.NEW,
            token: {
                model: null,
                params: {}
            },
            initData: {},
            items: {
                modifyFromBeneficiary: false
            },
            formData: {
                addToBeneficiary: false
            }
        });

        // if(!angular.equals({}, $stateParams.payment)){
        //     lodash.assign($scope.payment.formData, $stateParams.payment);
        //     $stateParams.payment = {};
        // }
        // if(!angular.equals({}, $stateParams.items)){
        //     lodash.assign($scope.payment.items,  $stateParams.items);
        //     $stateParams.items = {};
        // }

        $scope.clearForm = function () {
            return $scope.billPaymentsStepParams.clearForm();
        }

        $scope.showBillInfoSearch = function (searchBool, nextBool) {
            return $scope.billPaymentsStepParams.showBillInfoSearch(searchBool, nextBool);
        }

        $scope.printPdf = function () {
            var downloadLink =  exportService.prepareHref({
                href: "/api/transaction/downloads/pdf.json"
            });
            fileDownloadService.startFileDownload(downloadLink + ".json?id=" +  $scope.payment.transferId);
        }
        $scope.billPaymentsStepParams = {
            completeState: 'payments.bill_history.list',
            footerType: 'billPayment',
            onClear: $scope.clearForm,
            onSearch:  $scope.showBillInfoSearch,
            onGetOTP: $scope.getOTP,
            printPdf:  $scope.printPdf,
            cancelState: 'payments.new_bill.fill',
            labels : {
                cancel: 'config.multistepform.buttons.cancel',
                search: 'config.multistepform.buttons.search',
                change: 'config.multistepform.buttons.change',
                edit: 'config.multistepform.buttons.edit',
                clear: 'config.multistepform.buttons.clear',
                prev: 'config.multistepform.buttons.prev',
                next: 'config.multistepform.buttons.next',
                accept: 'config.multistepform.buttons.accept',
                finalize: 'ocb.payments.new.btn.finalize',
                finalAction: 'ocb.payments.new.btn.final_action',
            },
            visibility:{
                fillReturn: false,
                cancel: true,
                search: true,
                change: true,
                clear: true,
                next: false,
                accept: true,
                finalAction: false,
                finalize: true,
                hideSaveRecipientButton: true,
            }
        };

        $scope.$on('wrongAuthCodeEvent', function () {
            $scope.showWrongCodeLabel = true;
        });
        $scope.$on('hideWrongCodeLabelEvent', function () {
            $scope.showWrongCodeLabel = false;
        });

        // rbPaymentInitFactory($scope);
    });
