
angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.payu_hufi.fill', {
            url: "/fill/",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/payu_hufi/fill/fill_form.html",
            controller: "PayuHufiStep1Controller",
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
    .controller('PayuHufiStep1Controller'
        , function ($scope, $filter, lodash, bdFocus, $timeout, bdStepStateEvents, rbAccountSelectParams, $stateParams,
                    validationRegexp, systemParameterService, translate, utilityService, accountsService,
                    rbBeforeTransferManager,
                    bdTableConfig,ocbConvert,transferTuitionService,CURRENT_DATE,bdFillStepInitializer,transferService,customerService) {

            bdFillStepInitializer($scope, {
                formName: 'payuHufiForm',
                dataObject: $scope.payuHufi
            });
            $scope.CURRENT_DATE = CURRENT_DATE;

            if($scope.payuHufi.data == undefined) {
                $scope.payuHufi.data = {
                    stdCode: "",
                    account: null,
                    stdInfo: null,
                    subjectInfo: null,
                    amountInfo: null,
                    remitterInfo: null
                };
            }


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
                $scope.payuHufi.meta.customerContext = data.customerDetails.context;
                // $scope.payment.meta.employee = data.customerDetails.isEmployee;
                $scope.payuHufi.meta.authType = data.customerDetails.authType;
                $scope.payuHufi.data.remitterId = data.userIdentityId.id
                $scope.payuHufi.data.fullName = data.customerDetails.fullName;
                // if ($scope.payment.meta.authType == 'HW_TOKEN') {
                //     $scope.formShow = true;
                // }
            }).catch(function(response) {

            });

            transferService.getTransferLimit({paymentType:"PAYU_PAYMENT"}).then(function(limit) {
                $scope.payuHufi.data.limit = limit.remainingDailyLimit;
            });

            $scope.searchStudent = function () {
                if(_.trim($scope.payuHufi.data.stdCode) == ''){
                    return;
                }
                //TODO assign code for BKU
                $scope.payuHufi.data.universityCode = "1"; // 1 = dhkt
                var paramsGetStd = {
                    universityCode: $scope.payuHufi.data.universityCode,
                    studentCode: $scope.payuHufi.data.stdCode,
                    semesterCode:96013,
                    groupCode: 2
                }

                transferTuitionService.getStudentInfo(paramsGetStd).then(function (stdData) {
                    console.log(stdData)
                    if(stdData.student){
                        $scope.payuHufi.data.stdInfo = stdData.student
                    }
                    if(stdData.tuitionPayment){
                        $scope.payuHufi.data.subjectInfo = stdData.tuitionPayment
                    }
                    //todo mock
                    $scope.payuHufi.data.subjectInfo = $scope.subjectInfo;
                    $scope.payuHufi.data.universityCode = 1;
                    if(stdData.tuitionFee){
                        $scope.payuHufi.data.amountInfo = stdData.tuitionFee;
                        $scope.payuHufi.data.amountInfo.words = ocbConvert.convertNumberToText($scope.payuHufi.data.amountInfo.tuitionAmount,false)
                        $scope.payuHufi.data.amountInfo.currency = "VND";
                        $scope.payuHufi.data.totalAmount = stdData.tuitionFee.tuitionAmount
                        $scope.payuHufi.data.currency = "VND";

                    }
                })

                $scope.table = {
                    tableConfig: new bdTableConfig({
                        placeholderText: translate.property("ocb.payments.pending.empty_list.label"),
                        pageSize: 3,
                        checkBoxIBAction: function (length, item, idx) {
                            if ($scope.payuHufi.data.subjectSelected == undefined) {
                                $scope.payuHufi.data.subjectSelected = [];
                            }
                            //if item existed (unchecked) => remove from list
                            //if item not existed (checked) => add to list
                            if (!_.some($scope.payuHufi.data.subjectSelected, item)) {
                                if($scope.payuHufi.data.amountInfo == null ) {
                                    $scope.payuHufi.data.amountInfo = {}
                                    $scope.payuHufi.data.amountInfo.tuitionAmount = 0;
                                }
                                $scope.payuHufi.data.amountInfo.tuitionAmount += item.amount;
                                $scope.payuHufi.data.subjectSelected.push(item)
                            } else {
                                $scope.payuHufi.data.amountInfo.tuitionAmount -= item.amount;
                                _.remove($scope.payuHufi.data.subjectSelected, {'itemCode': item.paymentCode})
                            }
                            if( $scope.payuHufi.data.amountInfo.tuitionAmount > 0) {
                                $scope.payuHufi.data.amountInfo.words = ocbConvert.convertNumberToText($scope.payuHufi.data.amountInfo.tuitionAmount, false);
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


            var requestConverter = function (formData) {
                var copiedForm = angular.copy(formData);
                copiedForm.description = utilityService.splitTextEveryNSigns(formData.description);
                copiedForm.amount = (""+formData.amount).replace(",", ".");
                copiedForm.realizationDate = utilityService.convertDateToCurrentTimezone(formData.realizationDate, $scope.CURRENT_DATE.zone);
                return copiedForm;
            };
            $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
                $scope.$emit('hideWrongCodeLabelEvent');
                // if($scope.payuHufi.data.subjectSelected === undefined || $scope.payuHufi.data.subjectSelected.length === 0){
                //     $scope.errMsg = translate.property('ocb.payments.payu_hufi.err_msg_select0.label');
                //     return;
                // }

                $scope.payuHufi.data.senderAccount = $scope.remitterInfo;
                // if($scope.payuHufi.data.senderAccount === null ){
                //     $scope.errMsg = translate.property('ocb.payments.payu_hufi.err_msg_account.label');
                //     return;
                // }
                //
                var setRealizationDateToCurrent = function () {
                    angular.extend($scope.payuHufi.data, {
                        realizationDate: $scope.CURRENT_DATE.time
                    }, lodash.omit($scope.payuHufi.data, lodash.isUndefined));
                };
                setRealizationDateToCurrent();

                console.log($scope.payuHufi.data)
                transferTuitionService.create('tuition', angular.extend({
                    "remitterId": 0
                }, requestConverter($scope.payuHufi.data))).then(function (transfer) {
                    $scope.payuHufi.endOfDayWarning = transfer.endOfDayWarning;
                    $scope.payuHufi.holiday = transfer.holiday;
                    $scope.payuHufi.transferId = transfer.referenceId;
                    $scope.payuHufi.token.params = {
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
