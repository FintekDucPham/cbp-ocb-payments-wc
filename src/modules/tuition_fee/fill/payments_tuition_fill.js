angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.tuition_fee.fill', {
            url: "fill",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/tuition_fee/fill/payments_tuition_fill.html",
            controller: "TuitionPaymentFillController",
            data: {
                analyticsTitle: "config.multistepform.labels.step1"
            }
        });
    })
    .controller('TuitionPaymentFillController', function ($scope, $filter, lodash, CURRENT_DATE, bdFocus, $timeout, bdStepStateEvents, rbAccountSelectParams, $stateParams,
                                                          validationRegexp, systemParameterService, translate, utilityService,
                                                          rbBeforeTransferManager,
                                                          bdTableConfig, ocbConvert, transferTuitionService, transferService) {
        $scope.CURRENT_DATE = CURRENT_DATE;
        // $scope.rbPaymentTuitionFeeParams.visibility.next = false;
        $scope.table = {
            tableConfig: new bdTableConfig({
                placeholderText: translate.property('ocb.payments.tuition.table.placeHolderTable')
            }),
            tableData: {
                getData: function (defer, $param) {
                    defer.resolve([]);
                    $param.pageCount = 4;
                }
            },
            tableControl: undefined
        };

        /*Test start*/
        /*Mock data*/

        transferTuitionService.getUniversityList({
            groupCode: "1"
        }).then(function (data) {
            $scope.universityList = data.universities;
        });

        if ($scope.tuitionFee.formData.selectedForm === undefined) {
            $scope.tuitionFee.formData.selectedForm = {
                type1: {
                    name: "FullTime",
                    value: 1
                },
                type2: {
                    name: "Credit",
                    value: 2
                },
                type3: {
                    name: "PostUniversity",
                    value: 3
                },
                type4: {
                    name: "PartTimeCredit",
                    value: 4
                }
                //optionSelected: 1
            };
        }

        $scope.showSemester = false;
        //Radio button
        $scope.$watch('tuitionFee.formData.selectedForm.optionSelected', function(newValue, oldValue) {
            switch (newValue){
                case 1:
                    $scope.showSemester = true;
                    break;
                case 2:
                    $scope.showSemester = false;
                    break;
                case 3:
                    $scope.showSemester = false;
                    break;
                case 4:
                    $scope.showSemester = false;
                    break;
                default:
                    break;
            }
        });

        //select account
        $scope.onSenderAccountSelect = function(accountId) {
                $scope.tuitionFee.formData.remitterAccountId = accountId;
        };

        $scope.$watch('tuitionFee.items.senderAccount', function(account) {
            if(account) {
                $scope.tuitionFee.formData.balance = account.currentBalance;
                $scope.tuitionFee.formData.currency = account.currency;
            }
        });

        /*Get Remaining Daily Limit*/
        transferService.getTransferLimit({paymentType:"BILL_PAYMENT"}).then(function(limit) {
            $scope.tuitionFee.items.limit = limit;
        });

        /*Student code*/
        $scope.studentCodes = [{name: "MSSV", id: 1},
            {name: "CMND", id: 2}];

        // $scope.studentInfo = $scope.dataInfo.studentInfo;
        // $scope.paymentInfo = $scope.dataInfo.paymentInfo;

        /*Check box on payment info*/
        $scope.checkBoxAction =  function(length, item, idx) {
            // TODO Check box
        }

        /*Handle Next Button*/
        //Check empty
        $scope.rbPaymentTuitionFeeParams.showTuitionInfoSearch = function(searchBool, nextBool) {
            $scope.tuitionFee.formData.batchInfoSearch = false;
            $scope.tuitionFee.formData.paymentEmpty = false;
            $scope.amountNull = false;
            var university = $scope.tuitionFee.formData.paymentsTuitionUniversities;
            var selectedForm = $scope.tuitionFee.formData.selectedForm;
            var stdType = $scope.tuitionFee.formData.stdCodeType;
            $scope.stdEmpty = false;
            $scope.universityEmpty = false;
            $scope.formEmpty = false;
            $scope.semesterEmpty = false;
            $scope.stdTypeEmpty = false;
            if (university == undefined) {
                //check university empty
                $scope.universityEmpty = true;
            } else if (university.code == 1 &&  selectedForm.optionSelected == undefined) {
                //check form
                $scope.formEmpty = true;
            } else if (university.code == 1 && selectedForm.optionSelected == 1 &&  $scope.tuitionFee.formData.semester == undefined) {
                //check semester
                $scope.semesterEmpty = true;
            } else if (university.code == 5 && stdType == undefined) {
                //check studentID or nationalID
                $scope.stdTypeEmpty = true;
            }  else if ( $scope.tuitionFee.formData.stdCodeID == undefined) {
                //check student ID
                $scope.stdEmpty = true;
            }  else {
                //check Cao Dang Kinh Te
                if (university.code == 5) {
                    //check StudentID or NationalID
                    if (stdType.name == "MSSV") {
                        $scope.studentID = $scope.tuitionFee.formData.stdCodeID;
                        $scope.nationalID = null;
                    } else {
                        $scope.nationalID = $scope.tuitionFee.formData.stdCodeID;
                        $scope.studentID = null;
                    }
                } else {
                    // Only studentID
                    $scope.studentID = $scope.tuitionFee.formData.stdCodeID;
                }
                //Call service to get Student's Info
                // validate params
                if (university) {
                    $scope.universityCode = university.code;
                } else {
                    $scope.universityCode = "";
                }

                if (selectedForm) {
                    $scope.courseType = selectedForm.name;
                } else {
                    $scope.courseType = "";
                }
                transferTuitionService.getStudentInfo({
                    universityCode: $scope.universityCode,
                    semesterCode:  $scope.semesterNumber,
                    courseType: $scope.courseType,
                    studentCode: $scope.studentID,
                    nationalID: $scope.nationalID
                }).then(function (data) {
                    $scope.tuitionFee.formData.batchInfoSearch = true;
                    if (data.tuitionPayment == null || data.tuitionPayment.length == 0) {
                        $scope.tuitionFee.formData.paymentEmpty = true;
                    }
                    if (data.tuitionFee == null || data.tuitionFee.length == 0) {
                        $scope.amountNull = true;
                    }
                    if (data.tuitionFee != null) {
                        $scope.tuitionFee.formData.totalAmount = data.tuitionFee.tuitionDebtAmount;
                        $scope.tuitionFee.formData.totalAmountInWord = ocbConvert.convertNumberToText($scope.tuitionFee.formData.totalAmount, true);
                    }
                    if (data.student != null) {
                        $scope.tuitionFee.formData.studentCode = data.student.studentCode;
                        $scope.tuitionFee.formData.studentInfo = data.student;
                    }
                    $scope.paymentInfo = data.tuitionPayment;
                    $scope.rbPaymentTuitionFeeParams.visibility.search = searchBool;
                    $scope.rbPaymentTuitionFeeParams.visibility.clear = searchBool;
                    $scope.rbPaymentTuitionFeeParams.visibility.next = nextBool;
                });
            }
        };

        /*Chose University from combobox*/

        $scope.onTuitionUniversityChange = function (itemSelected) {
            $scope.tuitionFee.formData.hideStudent = false;
            $scope.tuitionFee.formData.paymentsTuitionUniversities = itemSelected;
            $scope.tuitionFee.formData.universityCode = itemSelected.code;
            if ($scope.tuitionFee.formData.universityCode == 1) {
                $scope.tuitionFee.formData.hideStudentCode = true;
                $scope.tuitionFee.formData.hideStudent = true;
                $("#semesterID").removeClass("hide-content");
                $("#codeID").addClass("code-txt");
            } else {
                $scope.showSemester = false;
                $scope.tuitionFee.formData.hideStudentCode = false;
                $scope.tuitionFee.formData.hideStudent = true;
                $("#semesterID").addClass("hide-content");
                $("#codeID").removeClass("code-txt");
            }
            /*Chose Semester from combobox*/
            transferTuitionService.getSemesterList({
                universityCode: $scope.tuitionFee.formData.universityCode
            }).then(function (data) {
                $scope.semesterList = data.semesters;
            })
        };

        $scope.onTuitionSemesterChange = function (itemSelected) {
            $scope.semesterNumber = itemSelected.number;
            $scope.tuitionFee.formData.semester = itemSelected;
        }


        /*Clear button*/
        $scope.rbPaymentTuitionFeeParams.clearForm = function () {
            $scope.tuitionFee.formData.paymentsTuitionUniversities = {};
            $scope.tuitionFee.formData.stdCodeID = null;
            $scope.hideStudentCode = false;
            $scope.showSemester = false;
            $scope.hideStudent = false;
            $scope.universityEmpty = false;
            $scope.semesterEmpty = false;
            $scope.stdEmpty = false;
            $scope.formEmpty = false;
        }

        /*Back button on fill screen*/
        $scope.rbPaymentTuitionFeeParams.backForm = function () {
            $scope.tuitionFee.formData.batchInfoSearch = false;
            $scope.rbPaymentTuitionFeeParams.visibility.clear = true;
            $scope.rbPaymentTuitionFeeParams.visibility.search = true;
            $scope.rbPaymentTuitionFeeParams.visibility.next = false;
        }

        var requestConverter = function (formData) {
            var copiedForm = angular.copy(formData);
            copiedForm.description = utilityService.splitTextEveryNSigns(formData.description);
            copiedForm.amount = (""+formData.amount).replace(",", ".");
            copiedForm.realizationDate = utilityService.convertDateToCurrentTimezone(formData.realizationDate, $scope.CURRENT_DATE.zone);
            return copiedForm;
        };


        var setRealizationDateToCurrent = function () {
            angular.extend($scope.tuitionFee.formData, {
                realizationDate: $scope.CURRENT_DATE.time
            }, lodash.omit($scope.tuitionFee.formData, lodash.isUndefined));
        };

        var resetRealizationOnBlockedInput = function () {
            if($scope.tuitionFee.meta.isFuturePaymentAllowed === false || $scope.tuitionFee.meta.dateSetByCategory) {
                delete $scope.tuitionFee.formData.realizationDate;
                setRealizationDateToCurrent(true);
            }
        };

        /*Next button on fill screen*/
        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
           if ($scope.amountNull === false) {
               try {
                   setRealizationDateToCurrent();
                   transferTuitionService.create('tuition', angular.extend({
                       "remitterId": 0
                   }, requestConverter($scope.tuitionFee.formData)), $scope.tuitionFee.operation.link || false ).then(function (transfer) {
                       $scope.tuitionFee.transferId = transfer.referenceId;
                       $scope.tuitionFee.endOfDayWarning = transfer.endOfDayWarning;
                       $scope.tuitionFee.holiday = transfer.holiday;

                       $scope.tuitionFee.token.params = {
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

               } catch(ex) {
                   console.error("Create transfer bill error: ", ex);
               }
           }
            //TODO test to show otp
            //$scope.tuitionFee.token.params.resourceId = "NIB-TRA511102121217959bed69dd1aa50b";
            //Call service save to DB
            //TODO Call service when opened live data

          //  actions.proceed();

        });


        $scope.tableData = [];

    });