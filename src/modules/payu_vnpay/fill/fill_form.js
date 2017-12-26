
angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.payu_vnpay.fill', {
            url: "/fill/",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/payu_vnpay/fill/fill_form.html",
            controller: "PayuVnpayStep1Controller",
            data: {
                analyticsTitle: "config.multistepform.labels.step1"
            }
        });
    })
    .controller('PayuVnpayStep1Controller'
                    , function ($scope, $filter, lodash, bdFocus, $timeout, bdStepStateEvents, rbAccountSelectParams, $stateParams,
                                                              validationRegexp, systemParameterService, translate, utilityService, accountsService,
                                                              rbBeforeTransferManager,
                                bdTableConfig,ocbConvert) {


            if($scope.payuVnpay.data == undefined) {
                $scope.payuVnpay.data = {
                    paymentInfo: {},
                    remitterInfo: null
                };
            }


            //TODO data test
            $scope.paymentInfo =
                {
                    "paymentCode": "11111111",
                    "billCode": "22323232",
                    "amount": 666444,
                    "provider": "FPT",
                    "distributedBy": "FPT",
                }
            $scope.payuVnpay.data.paymentInfo = $scope.paymentInfo;

            //TODO data test
            $scope.remitterInfo =
                {
                    "accountNo": "Le Linh Phuong",
                    "accountName": "Le Linh Phuong",
                    "ocbBranch": "Tan Binh",
                    "currentBalance": 1350000,
                    "remainDaily":9999999999,
                }
            $scope.payuVnpay.data.remitterInfo = $scope.remitterInfo;

            $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
                $scope.payuVnpay.data.senderAccount = $scope.remitterInfo;
                if($scope.payuVnpay.data.senderAccount == null ){
                    $scope.errMsg = translate.property('ocb.payments.payu_vnpay.err_msg_account.label');
                    return;
                }

                actions.proceed();
            });

            function isSenderAccountCategoryRestricted(account) {
                if($scope.payment.items.senderAccount){
                    if ($scope.payment.meta.customerContext === 'DETAL') {
                        return $scope.payment.items.senderAccount.category === 1005 && lodash.contains([1101,3000,3008], account.category);
                    } else {
                        return $scope.payment.items.senderAccount.category === 1016 && (('PLN' !== account.currency) || !lodash.contains([1101,3002,3001, 6003, 3007, 1102, 3008, 6004], account.category));
                    }
                }
            }
            function isAccountInvestmentFulfilsRules(account){
                //return account.accountCategories.indexOf('INVESTMENT_ACCOUNT_LIST') < 0 || account.actions.indexOf('create_between_own_accounts_transfer') > -1;
                return account;
            }
        });

