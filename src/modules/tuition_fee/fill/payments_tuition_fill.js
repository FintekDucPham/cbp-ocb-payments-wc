/**
 * Created by Sky on 10-Dec-17.
 */
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
    .controller('TuitionPaymentFillController', function ($scope, $filter, lodash, bdFocus, $timeout, bdStepStateEvents, rbAccountSelectParams, $stateParams,
                                                          validationRegexp, systemParameterService, translate, utilityService,
                                                          rbBeforeTransferManager,
                                                          bdTableConfig, ocbConvert, transferBillService, transferService) {
        // $scope.rbPaymentTuitionFeeParams.visibility.next = false;
        $scope.table = {
            tableConfig: new bdTableConfig({
                placeholderText: translate.property('ocb.payments.tuition.table.placeHolderTable'),
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

        transferBillService.getUniversityList({
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
                    value: 2,
                },
                type3: {
                    name: "PostUniversity",
                    value: 3
                },
                type4: {
                    name: "PartTimeCredit",
                    value: 4
                },
                optionSelected: 1
            };
        }

        //Radio button
        $scope.$watch('tuitionFee.formData.selectedForm.optionSelected', function(newValue, oldValue) {
            switch (newValue){
                case 1:
                    $scope.tuitionFee.formData.showSemester = true;
                    break;
                case 2:
                    $scope.tuitionFee.formData.showSemester = false;
                    break;
                case 3:
                    $scope.tuitionFee.formData.showSemester = false;
                    break;
                case 4:
                    $scope.tuitionFee.formData.showSemester = false;
                    break;
                default:
                    break;
            }
        });

        //select account
        $scope.onSenderAccountSelect = function(accountId) {
            if (accountId == $scope.tuitionFee.formData.remitterAccountId) {
                $scope.tuitionFee.formData.remitterAccountId = undefined;
            }
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

        /*Data mock Student info and payment info*/
        $scope.dataInfo = {
            "studentInfo": {
                "studentCode": "",
                "studentName": "Tran Thi Kieu Chinh",
                "birthday": 1514971234540,
                "gender": "",
                "placeOfBirth": "",
                "nationalId": "123456789",
                "clazz": "Thuong mai",
                "period": "K21",
                "department": "Kinh doanh thuong mai",
                "mssv": "10143004",
                "cmnd": "024210388"
            },
            "paymentInfo": [
                {
                    "subjectId": "KD01",
                    "subjectName": "Kinh doanh thuong mai",
                    "paymentPeriod": "",
                    "amount": 250000,
                    "discount": 0.5,
                    "paymentCode": "",
                    "description": "",
                    "dueDate": "",
                    "paymentItemFeeCode": "",
                    "itemNameDescription": "",
                    "itemTypeFeeType": "",
                    "isrequired": ""
                },
                {
                    "subjectId": "LTM01",
                    "subjectName": "Luat thuong mai",
                    "paymentPeriod": "",
                    "amount": 350000,
                    "discount": 0,
                    "paymentCode": "",
                    "description": "",
                    "dueDate": "",
                    "paymentItemFeeCode": "",
                    "itemNameDescription": "",
                    "itemTypeFeeType": "",
                    "isrequired": ""
                },
                {
                    "subjectId": "KD02",
                    "subjectName": "Xuat nhap khau",
                    "paymentPeriod": "",
                    "amount": 450000,
                    "discount": 0.1,
                    "paymentCode": "",
                    "description": "",
                    "dueDate": "",
                    "paymentItemFeeCode": "",
                    "itemNameDescription": "",
                    "itemTypeFeeType": "",
                    "isrequired": ""
                }
            ],
            "_links": {}
        }

        $scope.studentInfo = $scope.dataInfo.studentInfo;
        $scope.paymentInfo = $scope.dataInfo.paymentInfo;

        /*Calculate Tuition Balance*/
        $scope.tuitionBalance = "15000000";
        /*Calculate Tuition Limit*/
        $scope.tuitionLimit = "50000000";

        /*Calculate Total Amount*/
        $scope.totalAmount = 0;
        for (var i = 0; i < $scope.paymentInfo.length; i++) {
            $scope.totalAmount += ($scope.paymentInfo[i].amount - $scope.paymentInfo[i].amount * $scope.paymentInfo[i].discount);
        }
        $scope.totalAmountInWord = ocbConvert.convertNumberToText( $scope.totalAmount, true);

        /*Check box on payment info*/
        $scope.checkBoxAction =  function(length, item, idx) {
            // TODO Check box
        }

        /*Handle Next Button*/
        //Check empty
        $scope.rbPaymentTuitionFeeParams.showTuitionInfoSearch = function(searchBool, nextBool) {
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
            } else if (university.code == 1 &&  selectedForm == undefined) {
                //check form
                $scope.formEmpty = true;
            } else if (university.code == 1 && selectedForm.value == 1 &&  $scope.tuitionFee.formData.semester == undefined) {
                //check semester
                $scope.semesterEmpty = true;
            }  else if (university.code == 5 && stdType == undefined) {
                //check studentID or nationalID
                $scope.stdTypeEmpty = true;
            }  else if ( $scope.tuitionFee.formData.stdCodeID == undefined) {
                //check student ID
                $scope.stdEmpty = true;
            }  else {
                $scope.tuitionFee.formData.batchInfoSearch = true;

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
                transferBillService.getStudentInfo({
                    universityCode: $scope.universityCode,
                    semesterCode: "",
                    courseType: $scope.courseType,
                    studentCode: $scope.studentID,
                    nationalID: $scope.nationalID
                }).then(function (data) {
                   // $scope.universityList = data.universities;
                   // console.log("Show Student Info");
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
            if ($scope.tuitionFee.formData.paymentsTuitionUniversities.code == 1) {
                $scope.tuitionFee.formData.hideStudentCode = true;
                $scope.tuitionFee.formData.hideStudent = true;
                $("#semesterID").removeClass("hide-content");
                $("#codeID").addClass("code-txt");
            } else {
                $scope.tuitionFee.formData.hideStudentCode = false;
                $scope.tuitionFee.formData.hideStudent = true;
                $("#semesterID").addClass("hide-content");
                $("#codeID").removeClass("code-txt");
            }
            /*Chose Semester from combobox*/
            $scope.tuitionFee.formData.semester = itemSelected.semester;
        }


        /*Clear button*/
        $scope.rbPaymentTuitionFeeParams.clearForm = function () {
            $scope.tuitionFee.formData.paymentsTuitionUniversities = {};
            $scope.tuitionFee.formData.stdCodeID = null;
            $scope.hideStudentCode = false;
            $scope.tuitionFee.formData.showSemester = false;
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

        /*Next button on fill screen*/
        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            $scope.rbPaymentTuitionFeeParams.visibility.accept = true;
            //TODO test to show otp
            $scope.tuitionFee.token.params.resourceId = "NIB-TRA511102121217959bed69dd1aa50b";
            //Call service save to DB
            //TODO Call service when opened live data
            try {
               //setRealizationDateToCurrent();
                transferBillService.create('bill', angular.extend({
                    "remitterId": $scope.tuitionFee.items.globusId
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
                    if(errorReason.subType == 'validation'){
                        for(var i=0; i<=errorReason.errors.length; i++){
                            var currentError = errorReason.errors[i];
                            if(currentError.field == 'ocb.transfer.limit.exceeed'){
                                $scope.limitExeeded = {
                                    show: true,
                                    messages: translate.property("ocb.payments.new.domestic.fill.amount.DAILY_LIMIT_EXCEEDED")
                                };
                            }else if(currentError.field == 'ocb.basket.transfers.limit.exceeed') {
                                $scope.limitBasketExeeded = {
                                    show: true,
                                    messages: translate.property("ocb.payments.basket.add.validation.amount_exceeded")
                                };
                            }
                        }
                    }
                });

            } catch(ex) {
                console.error("Create transfer bill error: ", ex);
            }
            actions.proceed();

        });


        $scope.tableData = [];

    });