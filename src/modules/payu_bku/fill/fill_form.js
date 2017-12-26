
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
                                bdTableConfig,ocbConvert) {


            if($scope.payuBku.data == undefined) {
                //todo data test
                $scope.payuBku.data = {
                    stdCode: "",
                    account: null,
                    stdInfo: null,
                    subjectInfo: null,
                    amountInfo: null,
                    remitterInfo: null
                };
            }

            $scope.searchStudent = function () {
                if(_.trim($scope.payuBku.data.stdCode) == ''){
                   return;
                }
                $scope.stdInfo = {
                    "stdName": "Nguyen Thuan Phat",
                    "stdGen": "Nam",
                    "stdCode": "2233445566",
                    "stdBirth": "06/10/1997",
                    "stdDepart": "Khoa cong nghe co khi",
                    "stdPlaceBirth": "Tp. Ho Chi Minh"
                }

                $scope.payuBku.data.stdInfo = $scope.stdInfo;
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
                $scope.payuBku.data.subjectInfo = $scope.subjectInfo;
                $scope.remitterInfo =
                    {
                        "accountNo": "Le Linh Phuong",
                        "accountName": "Le Linh Phuong",
                        "ocbBranch": "Tan Binh",
                        "currentBalance": 1350000,
                        "remainDaily":9999999999,
                    }
                $scope.payuBku.data.remitterInfo = $scope.remitterInfo;
                $scope.table = {
                    tableConfig: new bdTableConfig({
                        placeholderText: translate.property("ocb.payments.pending.empty_list.label"),
                        pageSize: 3,
                        checkBoxIBAction: function (length, item, idx) {
                            if ($scope.payuBku.data.subjectSelected == undefined) {
                                $scope.payuBku.data.subjectSelected = [];
                            }
                            //if item existed (unchecked) => remove from list
                            //if item not existed (checked) => add to list
                            if (!_.some($scope.payuBku.data.subjectSelected, item)) {
                                if($scope.payuBku.data.amountInfo == null ) {
                                    $scope.payuBku.data.amountInfo = {}
                                    $scope.payuBku.data.amountInfo.figure = 0;
                                }
                                $scope.payuBku.data.amountInfo.figure += item.amount;
                                $scope.payuBku.data.subjectSelected.push(item)
                            } else {
                                $scope.payuBku.data.amountInfo.figure -= item.amount;
                                _.remove($scope.payuBku.data.subjectSelected, {'paymentCode': item.paymentCode})
                            }
                            if( $scope.payuBku.data.amountInfo.figure > 0) {
                                $scope.payuBku.data.amountInfo.words = ocbConvert.convertNumberToText($scope.payuBku.data.amountInfo.figure, false);
                            } else {
                                $scope.payuBku.data.amountInfo.words = '';
                                ;
                            }
                        }
                    }),
                    tableData: {
                        getData: function (defer, $params) {
                            defer.resolve($scope.payuBku.data.subjectInfo);

                        }
                    },
                    tableControl: undefined
                };
            }
            //init search
            if($scope.payuBku.data.stdCode !== null && $scope.payuBku.data.stdCode !== ''){
                $scope.searchStudent();
            }

            $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
                if($scope.payuBku.data.subjectSelected == undefined || $scope.payuBku.data.subjectSelected.length == 0){
                    $scope.errMsg = translate.property('ocb.payments.payu_bku.err_msg_select0.label');
                    return;
                }
                $scope.payuBku.data.senderAccount = $scope.remitterInfo;
                if($scope.payuBku.data.senderAccount == null ){
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

