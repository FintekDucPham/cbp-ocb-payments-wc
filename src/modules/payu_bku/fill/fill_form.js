
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
                                bdTableConfig,ocbConvert,transferTuitionService) {


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
            $scope.onAccountChange = function (account) {
                console.log(account)
                // $scope.payuBku.data.remitterInfo = selectedAcc;
            }
            $scope.searchStudent = function () {
                if(_.trim($scope.payuBku.data.stdCode) == ''){
                   return;
                }
                //TODO assign code for BKU
                $scope.universityCode = "1"; // 1 = dhkt
                var paramsGetStd = {
                    universityCode: $scope.universityCode,
                    studentCode: $scope.payuBku.data.stdCode,
                    semesterCode:96013,
                    groupCode: 2
                }

                transferTuitionService.getStudentInfo(paramsGetStd).then(function (stdData) {
                    console.log(stdData)
                    if(stdData.student){
                        $scope.payuBku.data.stdInfo = stdData.student
                    }
                    if(stdData.tuitionPayment){
                        $scope.payuBku.data.subjectInfo = stdData.tuitionPayment
                    }
                    //TODO mock data
                    $scope.payuBku.data.subjectInfo = $scope.subjectInfo;


                    if(stdData.tuitionFee){
                        $scope.payuBku.data.amountInfo = stdData.tuitionFee;
                        $scope.payuBku.data.amountInfo.words = ocbConvert.convertNumberToText($scope.payuBku.data.amountInfo.tuitionAmount,false)
                        $scope.payuBku.data.amountInfo.currency = "VND";

                    }
                })


                $scope.checked = 1;
                $scope.subjectInfo = [
                    {
                        "itemCode": "11111111",
                        "amount": 666444,
                        "description": "Anh van 2",
                        "dueDate": "18 Dec 2017",
                    },
                    {
                        "itemCode": "11111111",
                        "amount": 666444,
                        "description": "Anh van 2",
                        "dueDate": "18 Dec 2017",
                    },
                    {
                        "itemCode": "11111111",
                        "amount": 666444,
                        "description": "Anh van 2",
                        "dueDate": "18 Dec 2017",
                    }
                ]

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
                                    $scope.payuBku.data.amountInfo.tuitionAmount = 0;
                                }
                                $scope.payuBku.data.amountInfo.tuitionAmount += item.amount;
                                $scope.payuBku.data.subjectSelected.push(item)
                            } else {
                                $scope.payuBku.data.amountInfo.tuitionAmount -= item.amount;
                                _.remove($scope.payuBku.data.subjectSelected, {'itemCode': item.paymentCode})
                            }
                            if( $scope.payuBku.data.amountInfo.tuitionAmount > 0) {
                                $scope.payuBku.data.amountInfo.words = ocbConvert.convertNumberToText($scope.payuBku.data.amountInfo.tuitionAmount, false);
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
                // if($scope.payuBku.data.subjectSelected === undefined || $scope.payuBku.data.subjectSelected.length === 0){
                //     $scope.errMsg = translate.property('ocb.payments.payu_bku.err_msg_select0.label');
                //     return;
                // }
                $scope.payuBku.data.senderAccount = $scope.remitterInfo;
                if($scope.payuBku.data.senderAccount === null ){
                    $scope.errMsg = translate.property('ocb.payments.payu_bku.err_msg_account.label');
                    return;
                }
                $scope.creatParams = {

                }
                transferTuitionService.create('tuition').then(function (transfer) {
                    $scope.payuBku.data.transferId = transfer.referenceId;
                    $scope.payuBku.data.endOfDayWarning = transfer.endOfDayWarning;
                    $scope.payuBku.data.holiday = transfer.holiday;

                    $scope.payuBku.token.params = {
                        resourceId:transfer.referenceId
                    }
                    setRealizationDateToCurrent();
                    actions.proceed();
                }).catch(function(errorReason){
                    // if(errorReason.subType == 'validation'){
                    //     for(var i=0; i<=errorReason.errors.length; i++){
                    //         var currentError = errorReason.errors[i];
                    //         if(currentError.field == 'ocb.transfer.limit.exceeed'){
                    //             $scope.limitExeeded = {
                    //                 show: true,
                    //                 messages: translate.property("ocb.payments.new.domestic.fill.amount.DAILY_LIMIT_EXCEEDED")
                    //             };
                    //         }else if(currentError.field == 'ocb.basket.transfers.limit.exceeed') {
                    //             $scope.limitBasketExeeded = {
                    //                 show: true,
                    //                 messages: translate.property("ocb.payments.basket.add.validation.amount_exceeded")
                    //             };
                    //         }
                    //     }
                    // }
                    console.error("create tuitionFee failed: ", errorReason);
                });
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

