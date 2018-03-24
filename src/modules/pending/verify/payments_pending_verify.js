angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.pending.verify', {
            url: "/verify",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/pending/verify/payments_pending_verify.html",
            controller: "PaymentPendingVerifyController",
            data: {
                analyticsTitle: "config.multistepform.labels.step2"
            }
        });
    })
    .controller('PaymentPendingVerifyController', function ($scope,  $state, bdVerifyStepInitializer,bdStepStateEvents,bdTableConfig,translate,$http,exportService,transferService,rbPaymentOperationTypes,depositsService,fileDownloadService) {

        if(_.isEmpty( $scope.pendingTransaction.selectedTrans)){
            $state.go("payments.pending.fill", {}, {reload: true});
        }

        $scope.idForPrint = null;
        $scope.pendingTransaction.token.params.resourceId = $scope.pendingTransaction.selectedTrans[0].id;
        //list data table define
        $scope.table = {
            tableConfig : new bdTableConfig({
                placeholderText: translate.property("ocb.payments.pending.empty_list.label"),

            }),
            tableData : {
                getData: function (defer, $params) {
                    defer.resolve($scope.pendingTransaction.selectedTrans);
                }
            },
            tableControl: undefined
        };

        $scope.pendingTransaction.billData = {
            paymentType: $scope.pendingTransaction.selectedTrans[0].paymentType,
            amount: $scope.pendingTransaction.selectedTrans[0].account,
            currency: $scope.pendingTransaction.selectedTrans[0].currency
        }
        /*prepare PKI data*/
        $scope.pendingTransaction.token.modelData = function(){
            var expInternal = $interpolate('<paymentType>{{paymentType}}</paymentType>'+
                '<executionDate></executionDate>'+
                '<debitAccount></debitAccount>'+
                '<creditAccount></creditAccount>'+
                '<customerId></customerId>'+
                '<cRefNum></cRefNum>'+
                '<amount>{{amount}}</amount>'+
                '<currency>{{currency}}</currency>'+
                '<sender></sender>'+
                '<recipient></recipient>'+
                '<remarks></remarks>'+
                '<ebUserId></ebUserId>'+
                '<creditAccountBankCode></creditAccountBankCode>'+
                '<creditAccountBankBranchCode></creditAccountBankBranchCode>'+
                '<creditAccountProvinceCode></creditAccountProvinceCode>'+
                '<serviceCode></serviceCode>'+
                '<serviceProviderCode></serviceProviderCode>'+
                '<billCode></billCode>'+
                '<billCodeItemNo></billCodeItemNo>'+
                '<qty></qty>'+
                '<mobilePhoneNumber></mobilePhoneNumber>'+
                '<parValue></parValue>'+
                '<partnerId></partnerId>'+
                '<paymentCode></paymentCode>'+
                '<recipientCardNumber></recipientCardNumber>'+
                '<eWalletPhoneNumber></eWalletPhoneNumber>'+
                '<autoCapitalisation></autoCapitalisation>'+
                '<autoRollover></autoRollover>'+
                '<currency>{{currency}}</currency>'+
                '<dateFirstExecution></dateFirstExecution>'+
                '<description></description>'+
                '<frequencyAmount></frequencyAmount>'+
                '<initialPrincipalAmount></initialPrincipalAmount>'+
                '<interestLiquidationAccount></interestLiquidationAccount>'+
                '<interestPaymentMethod></interestPaymentMethod>'+
                '<interestRateType></interestRateType>'+
                '<periodCount></periodCount>'+
                '<periodFrequency></periodFrequency>'+
                '<periodicDrawdownAccount></periodicDrawdownAccount>'+
                '<periodicTransferDescription></periodicTransferDescription>'+
                '<periodUnit></periodUnit>'+
                '<principalDrawdownAccount></principalDrawdownAccount>'+
                '<principalLiquidationAccount></principalLiquidationAccount>'+
                '<productOwner></productOwner>'+
                '<subProductCode></subProductCode>'+
                '<termPeriodFrequency></termPeriodFrequency>'+
                '<contractNumber></contractNumber>'+
                '<interestLiquidationAccount></interestLiquidationAccount>'+
                '<principalLiquidationAccount></principalLiquidationAccount>');

            var xml = xmlData($scope.pendingTransaction.billData);
            console.log(xml);
            return xml;
        };

        function sendAuthorizationToken() {
            $scope.pendingTransaction.token.params.resourceId = $scope.pendingTransaction.transferId;
        }
        if ($scope.pendingTransaction.operation.code !== rbPaymentOperationTypes.EDIT.code && $scope.pendingTransaction.meta.customerContext === 'DETAL') {
            if ($scope.pendingTransaction.meta.authType !== 'SMS_TOKEN') {
                $scope.pendingTransaction.result.token_error = false;
                sendAuthorizationToken();
            }
        }

        function authorize(doneFn, actions) {
            var listTransID = _.map($scope.pendingTransaction.selectedTrans, 'id');
            var firstTran = $scope.pendingTransaction.selectedTrans[0];

            $scope.idForPrint = listTransID[0];
            if(firstTran.operationStatus !== 'WA') {
                //Approve
                transferService.approve(listTransID
                    , $scope.pendingTransaction.token.model.input.model
                    , $scope.pendingTransaction.token.model.currentToken.data.signedTransactionData).then(function (resultCode) {
                    var parts = resultCode.split('|');
                    $scope.pendingTransaction.result = {
                        code: parts[1],
                        type: parts[0] === 'OK' ? "success" : "error"
                    };
                    if (parts[0] !== 'OK' && !parts[1]) {
                        $scope.pendingTransaction.result.code = 'error';
                    }
                    depositsService.clearDepositCache();
                    $scope.pendingTransaction.result.token_error = false;
                    // paymentsBasketService.updateCounter($scope.pendingTransaction.result.code);
                    doneFn();
                }).catch(function (error) {
                    $scope.pendingTransaction.result.token_error = true;

                    if ($scope.pendingTransaction.token.model && $scope.pendingTransaction.token.model.$tokenRequired) {
                        if (!$scope.pendingTransaction.token.model.$isErrorRegardingToken(error)) {
                            //TODO disable for test
                           // actions.proceed();
                        }
                    } else {
                        //TODO disable for test
                      //  actions.proceed();
                    }

                }).finally(function () {
                    //delete $scope.pendingTransaction.items.credentials;
                    // formService.clearForm($scope.pendingTransactionAuthForm);
                });
            }  else {
                //Realize
                transferService.realize(listTransID[0], $scope.pendingTransaction.token.model.input.model).then(function (resultCode) {
                    var parts = resultCode.split('|');
                    $scope.pendingTransaction.result = {
                        code: parts[1],
                        type: parts[0] === 'OK' ? "success" : "error"
                    };
                    if (parts[0] !== 'OK' && !parts[1]) {
                        $scope.pendingTransaction.result.code = 'error';
                    }
                    depositsService.clearDepositCache();
                    $scope.pendingTransaction.result.token_error = false;
                    // paymentsBasketService.updateCounter($scope.pendingTransaction.result.code);
                    doneFn();
                }).catch(function (error) {
                    $scope.pendingTransaction.result.token_error = true;

                    if ($scope.pendingTransaction.token.model && $scope.pendingTransaction.token.model.$tokenRequired) {
                        if (!$scope.pendingTransaction.token.model.$isErrorRegardingToken(error)) {
                            //TODO disable for test
                           // actions.proceed();
                        }
                    } else {
                        //TODO disable for test
                        //actions.proceed();
                    }

                }).finally(function () {
                    //delete $scope.pendingTransaction.items.credentials;
                    // formService.clearForm($scope.pendingTransactionAuthForm);
                });
            }
        }


        $scope.pendingTransaction.printReport = function () {
            if($scope.idForPrint !== null) {
                var downloadLink =  exportService.prepareHref({
                    href: "/api/transaction/downloads/pdf.json"
                });
                fileDownloadService.startFileDownload(downloadLink + ".json?id=" + $scope.idForPrint);
            }
        }
        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            //TODO disable for test
            //authorize(actions.proceed, actions);
            //actions.proceed();
        });

        $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
            //TODO disable for test
            actions.proceed();
        });

        $scope.pendingTransaction.clearData = function () {
            //reset data after cancel
            $scope.pendingTransaction.selectedTrans = []
            $state.go('payments.pending.fill',{},{reload:true});
        }
    });