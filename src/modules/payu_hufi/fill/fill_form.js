
angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.payu_hufi.fill', {
            url: "/fill/",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/payu_hufi/fill/fill_form.html",
            controller: "PayUHufiStep1Controller",
            data: {
                analyticsTitle: "config.multistepform.labels.step1"
            }
        });
    })
    .controller('PayUHufiStep1Controller'
                    , function ($scope, $filter, lodash, bdFocus, $timeout, bdStepStateEvents, rbAccountSelectParams, $stateParams,
                                                              validationRegexp, systemParameterService, translate, utilityService, accountsService,
                                                              rbBeforeTransferManager,
                                bdTableConfig,ocbConvert) {


            if($scope.payuHufi.data == undefined) {
                //todo data test
                $scope.payuHufi.data = {
                    stdCode: "",
                    account: null,
                    stdInfo: null,
                    subjectInfo: null,
                    amountInfo: null,
                    remitterInfo: null
                };
            }

            $scope.searchStudent = function () {
                if(_.trim($scope.payuHufi.data.stdCode) == ''){
                   return;
                }
                //todo data test
                $scope.stdInfo = {
                    "stdName": "Nguyen Thuan Phat",
                    "stdGen": "Nam",
                    "stdCode": "2233445566",
                    "stdBirth": "06/10/1997",
                    "stdDepart": "Khoa cong nghe co khi",
                    "stdBirthPlace": "Tp. Ho Chi Minh"
                }

                $scope.payuHufi.data.stdInfo = $scope.stdInfo;
                $scope.subjectInfo = [
                    {
                        "paymentCode": "11111111",
                        "amount": 666444,
                        "paymentDesc": "Anh van 2",
                        "dueDate": "18 Dec 2017",
                    },
                    {
                        "paymentCode": "22222222",
                        "amount": 77889,
                        "paymentDesc": "Giao duc quoc phong an ninh",
                        "dueDate": "15 May 2017",
                    },
                    {
                        "paymentCode": "333333",
                        "amount": 999999999,
                        "paymentDesc": "Ky thuat dien",
                        "dueDate": "25 May 2017",
                    }
                ]
                $scope.payuHufi.data.subjectInfo = $scope.subjectInfo;
                $scope.remitterInfo =
                    {
                        "accountNo": "Le Linh Phuong",
                        "accountName": "Le Linh Phuong",
                        "ocbBranch": "Tan Binh",
                        "currentBalance": 1350000,
                        "remainDaily": 9999999999,
                    }
                $scope.payuHufi.data.remitterInfo = $scope.remitterInfo;
                $scope.table = {
                    tableConfig: new bdTableConfig({
                        placeholderText: translate.property("ocb.payments.pending.empty_list.label"),
                        pageSize: 3,
                        checkBoxIBAction: function (length, item, idx) {
                            // resetErrState();
                            if ($scope.payuHufi.data.subjectSelected == undefined) {
                                $scope.payuHufi.data.subjectSelected = [];
                            }
                            //if item existed (unchecked) => remove from list
                            //if item not existed (checked) => add to list
                            if (!_.some($scope.payuHufi.data.subjectSelected, item)) {
                                if($scope.payuHufi.data.amountInfo == null ) {
                                    $scope.payuHufi.data.amountInfo = {}
                                    $scope.payuHufi.data.amountInfo.figure = 0;
                                }
                                $scope.payuHufi.data.amountInfo.figure += item.amount;
                                $scope.payuHufi.data.subjectSelected.push(item)
                            } else {
                                $scope.payuHufi.data.amountInfo.figure -= item.amount;
                                _.remove($scope.payuHufi.data.subjectSelected, {'paymentCode': item.paymentCode})
                            }
                            if( $scope.payuHufi.data.amountInfo.figure > 0) {
                                $scope.payuHufi.data.amountInfo.words = ocbConvert.convertNumberToText($scope.payuHufi.data.amountInfo.figure, false);
                            } else {
                                $scope.payuHufi.data.amountInfo.words = '';
                                ;
                            }
                        }
                    }),
                    tableData: {
                        getData: function (defer, $params) {
                            defer.resolve($scope.payuHufi.data.subjectInfo);

                        }
                    },
                    tableControl: undefined
                };
            }
            //init search
            if($scope.payuHufi.data.stdCode !== null && $scope.payuHufi.data.stdCode !== ''){
                $scope.searchStudent();
            }

            $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
                if($scope.payuHufi.data.subjectSelected == undefined || $scope.payuHufi.data.subjectSelected.length == 0){
                    $scope.errMsg = translate.property('ocb.payments.payu_hufi.err_msg_select0.label');
                    return;
                }
                $scope.payuHufi.data.senderAccount = $scope.remitterInfo;
                if($scope.payuHufi.data.senderAccount == null ){
                    $scope.errMsg = translate.property('ocb.payments.payu_hufi.err_msg_account.label');
                    return;
                }

                actions.proceed();
            });
            // $scope.payuHufiForm.subjectSelected
            function isSenderAccountCategoryRestricted(account) {
                if($scope.payment.items.senderAccount){
                    if ($scope.payment.meta.customerContext === 'DETAL') {
                        return $scope.payment.items.senderAccount.category === 1005 && lodash.contains([1101,3000,3008], account.category);
                    } else {
                        return $scope.payment.items.senderAccount.category === 1016 && (('PLN' !== account.currency) || !lodash.contains([1101,3002,3001, 6003, 3007, 1102, 3008, 6004], account.category));
                    }
                }
            }
            console.log($scope.$params)
            function isAccountInvestmentFulfilsRules(account){
                //return account.accountCategories.indexOf('INVESTMENT_ACCOUNT_LIST') < 0 || account.actions.indexOf('create_between_own_accounts_transfer') > -1;
                return account;
            }
        });

