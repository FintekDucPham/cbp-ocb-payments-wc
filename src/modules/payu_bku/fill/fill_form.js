
angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.payu_bku.fill', {
            url: "/fill/",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/payu_bku/fill/fill_form.html",
            controller: "PayUBKUStep1Controller",
            data: {
                analyticsTitle: "config.multistepform.labels.step1"
            },
            resolve:{
            CURRENT_DATE: ['utilityService', function(utilityService){
                return utilityService.getCurrentDateWithTimezone();
            }]
        }
        });
    })
    .controller('PayUBKUStep1Controller'
                    , function ($scope, $filter, lodash, bdFocus, $timeout, bdStepStateEvents, rbAccountSelectParams, $stateParams,
                                                              validationRegexp, systemParameterService, translate, utilityService, accountsService,
                                                              rbBeforeTransferManager,
                                bdTableConfig,ocbConvert,transferTuitionService,CURRENT_DATE,bdFillStepInitializer,transferService,customerService) {

            bdFillStepInitializer($scope, {
                formName: 'payuBkuForm',
                dataObject: $scope.payuBku
            });
            $scope.CURRENT_DATE = CURRENT_DATE;

            if($scope.payuBku.data == undefined) {
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

            $scope.$watch('payuBku.data.remitterInfo',function (newVal) {
                console.log(newVal);
            })

            //TODO mock data
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

            customerService.getCustomerDetails().then(function(data) {
                $scope.payuBku.meta.customerContext = data.customerDetails.context;
                // $scope.payment.meta.employee = data.customerDetails.isEmployee;
                $scope.payuBku.meta.authType = data.customerDetails.authType;
                $scope.payuBku.data.remitterId = data.userIdentityId.id
                $scope.payuBku.data.fullName = data.customerDetails.fullName;
                // if ($scope.payment.meta.authType == 'HW_TOKEN') {
                //     $scope.formShow = true;
                // }
            }).catch(function(response) {

            });

            transferService.getTransferLimit({paymentType:"PAYU_PAYMENT"}).then(function(limit) {
                $scope.payuBku.data.limit = limit.remainingDailyLimit;
            });

            $scope.searchStudent = function () {
                if(_.trim($scope.payuBku.data.stdCode) == ''){
                   return;
                }
                //TODO assign code for BKU
                $scope.payuBku.data.universityCode = "1"; // 1 = dhkt
                var paramsGetStd = {
                    universityCode: $scope.payuBku.data.universityCode,
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
                    //todo mock
                    $scope.payuBku.data.subjectInfo = $scope.subjectInfo;
                    $scope.payuBku.data.universityCode = 1;
                    if(stdData.tuitionFee){
                        $scope.payuBku.data.amountInfo = stdData.tuitionFee;
                        $scope.payuBku.data.amountInfo.words = ocbConvert.convertNumberToText($scope.payuBku.data.amountInfo.tuitionAmount,false)
                        $scope.payuBku.data.amountInfo.currency = "VND";
                        $scope.payuBku.data.totalAmount = stdData.tuitionFee.tuitionAmount
                        $scope.payuBku.data.currency = "VND";

                    }
                })

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


            var requestConverter = function (formData) {
                var copiedForm = angular.copy(formData);
                copiedForm.description = utilityService.splitTextEveryNSigns(formData.description);
                copiedForm.amount = (""+formData.amount).replace(",", ".");
                copiedForm.realizationDate = utilityService.convertDateToCurrentTimezone(formData.realizationDate, $scope.CURRENT_DATE.zone);
                return copiedForm;
            };
            $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
                $scope.$emit('hideWrongCodeLabelEvent');
                // if($scope.payuBku.data.subjectSelected === undefined || $scope.payuBku.data.subjectSelected.length === 0){
                //     $scope.errMsg = translate.property('ocb.payments.payu_bku.err_msg_select0.label');
                //     return;
                // }

                $scope.payuBku.data.senderAccount = $scope.remitterInfo;
                // if($scope.payuBku.data.senderAccount === null ){
                //     $scope.errMsg = translate.property('ocb.payments.payu_bku.err_msg_account.label');
                //     return;
                // }
                //
                var setRealizationDateToCurrent = function () {
                    angular.extend($scope.payuBku.data, {
                        realizationDate: $scope.CURRENT_DATE.time
                    }, lodash.omit($scope.payuBku.data, lodash.isUndefined));
                };
                setRealizationDateToCurrent();

                console.log($scope.payuBku.data)
                transferTuitionService.create('tuition', angular.extend({
                    "remitterId": 0
                }, requestConverter($scope.payuBku.data))).then(function (transfer) {
                    $scope.payuBku.endOfDayWarning = transfer.endOfDayWarning;
                    $scope.payuBku.holiday = transfer.holiday;
                    $scope.payuBku.transferId = transfer.referenceId;
                    $scope.payuBku.token.params = {
                        resourceId:transfer.referenceId
                    }
                    setRealizationDateToCurrent();
                    actions.proceed();
                }).catch(function(errorReason){

                    console.error("create tuitionFee failed: ", errorReason);
                    actions.proceed();
                });

            });

        });
