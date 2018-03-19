
angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.payu_bku.fill', {
            url: "/fill/",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/payu_bku/fill/fill_form.html",
            controller: "PayUBKUStep1Controller",
            data: {
                analyticsTitle: "config.multistepform.labels.step1"
            }
        });
    })
    .controller('PayUBKUStep1Controller'
                    , function ($scope, $filter, lodash, bdFocus, $timeout, bdStepStateEvents, rbAccountSelectParams, $stateParams,
                                                              validationRegexp, systemParameterService, translate, utilityService, accountsService,
                                                              rbBeforeTransferManager,
                                bdTableConfig,ocbConvert,payuService) {


            if($scope.payuBku.formData === undefined) {
                //todo data test
                $scope.payuBku.formData = {
                    stdCode: "",
                    account: null,
                    stdInfo: null,
                    subjectInfo: null,
                    amountInfo: null,
                    remitterInfo: null
                };
            }
            //prepare data for list account
            $scope.payuBku.formData.remitterAccountId = $stateParams.accountId;
            $scope.senderSelectParams = new rbAccountSelectParams({});
            $scope.senderSelectParams.payments = true;
            $scope.senderSelectParams.showCustomNames = true;
            $scope.senderSelectParams.accountFilter = function (accounts, $accountId) {
                return lodash.filter(accounts, function(account){
                    return isAccountInvestmentFulfilsRules(account);
                });
            };
            $scope.getAccountByNrb = function(accountList, selectFn) {
                if ($stateParams.accountId) {
                    selectFn(lodash.findWhere(accountList, {
                        accountId: $stateParams.accountId
                    }));
                }
            };

            $scope.searchStudent = function () {
                if(_.trim($scope.payuBku.formData.stdCode) === ''){
                   return;
                }
                $scope.studentInfoParams = {
                    universityCode: 1,
                    studentCode: $scope.payuBku.formData.stdCode
                }
                payuService.getStudentInfo($scope.studentInfoParams).then(function (data) {
                    //TODO get data and fill to FE
                    console.log(data);
                })
                $scope.stdInfo = {
                    "stdName": "Nguyen Thuan Phat",
                    "stdGen": "Nam",
                    "stdCode": "2233445566",
                    "stdBirth": "06/10/1997",
                    "stdDepart": "Khoa cong nghe co khi",
                    "stdPlaceBirth": "Tp. Ho Chi Minh"
                }

                $scope.payuBku.formData.stdInfo = $scope.stdInfo;
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
                $scope.payuBku.formData.subjectInfo = $scope.subjectInfo;
                $scope.remitterInfo =
                    {
                        "accountNo": "Le Linh Phuong",
                        "accountName": "Le Linh Phuong",
                        "ocbBranch": "Tan Binh",
                        "currentBalance": 1350000,
                        "remainDaily":9999999999,
                    }
                $scope.payuBku.formData.remitterInfo = $scope.remitterInfo;
                $scope.table = {
                    tableConfig: new bdTableConfig({
                        placeholderText: translate.property("ocb.payments.pending.empty_list.label"),
                        pageSize: 3,
                        checkBoxIBAction: function (length, item, idx) {
                            if ($scope.payuBku.formData.subjectSelected === undefined) {
                                $scope.payuBku.formData.subjectSelected = [];
                            }
                            //if item existed (unchecked) => remove from list
                            //if item not existed (checked) => add to list
                            if (!_.some($scope.payuBku.formData.subjectSelected, item)) {
                                if($scope.payuBku.formData.amountInfo === null ) {
                                    $scope.payuBku.formData.amountInfo = {}
                                    $scope.payuBku.formData.amountInfo.figure = 0;
                                }
                                $scope.payuBku.formData.amountInfo.figure += item.amount;
                                $scope.payuBku.formData.subjectSelected.push(item)
                            } else {
                                $scope.payuBku.formData.amountInfo.figure -= item.amount;
                                _.remove($scope.payuBku.formData.subjectSelected, {'paymentCode': item.paymentCode})
                            }
                            if( $scope.payuBku.formData.amountInfo.figure > 0) {
                                $scope.payuBku.formData.amountInfo.words = ocbConvert.convertNumberToText($scope.payuBku.formData.amountInfo.figure, false);
                            } else {
                                $scope.payuBku.formData.amountInfo.words = '';
                                ;
                            }
                        }
                    }),
                    tableData: {
                        getData: function (defer, $params) {
                            defer.resolve($scope.payuBku.formData.subjectInfo);

                        }
                    },
                    tableControl: undefined
                };
            }
            //init search
            if($scope.payuBku.formData.stdCode !== null && $scope.payuBku.formData.stdCode !== ''){
                $scope.searchStudent();
            }
            console.log($scope.payuBku.formData.senderAccount)
            $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
                if($scope.payuBku.formData.subjectSelected === undefined || $scope.payuBku.formData.subjectSelected.length === 0){
                    $scope.errMsg = translate.property('ocb.payments.payu_bku.err_msg_select0.label');
                    return;
                }
                //$scope.payuBku.formData.senderAccount = $scope.remitterInfo;
                if($scope.payuBku.formData.senderAccount === null ){
                    $scope.errMsg = translate.property('ocb.payments.payu_bku.err_msg_account.label');
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
                return account;
            }
        });

