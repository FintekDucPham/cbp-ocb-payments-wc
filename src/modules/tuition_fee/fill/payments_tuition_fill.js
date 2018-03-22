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

        $scope.formInfo = {
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
                }
            };

        //Radio button
        $scope.$watch('tuitionFee.tuitionForm.selectedForm.value', function(newValue, oldValue) {
            switch (newValue){
                case 1:
                    $scope.tuitionFee.tuitionForm.showSemester = true;
                    break;
                case 2:
                    $scope.tuitionFee.tuitionForm.showSemester = false;
                    break;
                case 3:
                    $scope.tuitionFee.tuitionForm.showSemester = false;
                    break;
                case 4:
                    $scope.tuitionFee.tuitionForm.showSemester = false;
                    break;
                default:
                    $scope.tuitionFee.tuitionForm.showSemester = false;
                    break;
            }
        });

        //select account
        $scope.onSenderAccountSelect = function(accountId) {
            if (accountId == $scope.tuitionFee.tuitionForm.remitterAccountId) {
                $scope.tuitionFee.tuitionForm.remitterAccountId = undefined;
            }
            //$scope.recipientSelectParams.update(accountId);
            // transferBillService.getCustomer().then(function (customerDictionary) {
            //     $scope.payment.formData.senderCustomer =  (customerDictionary.content !== undefined) ? customerDictionary.content[0] : [];
            // });

        };

        $scope.$watch('tuitionFee.items.senderAccount', function(account) {
            if(account) {
                $scope.tuitionFee.tuitionForm.balance = account.currentBalance;
                $scope.tuitionFee.tuitionForm.currency = account.currency;
                // $scope.payment.meta.isFuturePaymentAllowed = isFuturePaymentAllowed(account);
                // var lockDateAccountCategories = $scope.payment.meta.extraVerificationAccountList ? $scope.payment.meta.extraVerificationAccountList : [];
                // $scope.payment.meta.dateSetByCategory = lodash.contains(lockDateAccountCategories, account.category);

            }
            // resetRealizationOnBlockedInput();
            // validateBalance();
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
            var university = $scope.tuitionFee.tuitionForm.paymentsTuitionUniversities;
            var selectedForm = $scope.tuitionFee.tuitionForm.selectedForm;
            var stdType = $scope.tuitionFee.tuitionForm.stdCodeType;
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
            } else if (university.code == 1 && selectedForm.value == 1 &&  $scope.tuitionFee.tuitionForm.semester == undefined) {
                //check semester
                $scope.semesterEmpty = true;
            }  else if (university.code == 5 && stdType == undefined) {
                //check studentID or nationalID
                $scope.stdTypeEmpty = true;
            }  else if ( $scope.tuitionFee.tuitionForm.stdCodeID == undefined) {
                //check student ID
                $scope.stdEmpty = true;
            }  else {
                $scope.tuitionFee.tuitionForm.batchInfoSearch = true;

                //check Cao Dang Kinh Te
                if (university.code == 5) {
                    //check StudentID or NationalID
                    if (stdType.name == "MSSV") {
                        $scope.studentID = $scope.tuitionFee.tuitionForm.stdCodeID;
                        $scope.nationalID = null;
                    } else {
                        $scope.nationalID = $scope.tuitionFee.tuitionForm.stdCodeID;
                        $scope.studentID = null;
                    }
                } else {
                    // Only studentID
                    $scope.studentID = $scope.tuitionFee.tuitionForm.stdCodeID;
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
            $scope.tuitionFee.tuitionForm.hideStudent = false;
            $scope.tuitionFee.tuitionForm.paymentsTuitionUniversities = itemSelected;
            if ($scope.tuitionFee.tuitionForm.paymentsTuitionUniversities.code == 1) {
                $scope.tuitionFee.tuitionForm.hideStudentCode = true;
                $scope.tuitionFee.tuitionForm.hideStudent = true;
                $("#semesterID").removeClass("hide-content");
                $("#codeID").addClass("code-txt");
            } else {
                $scope.tuitionFee.tuitionForm.hideStudentCode = false;
                $scope.tuitionFee.tuitionForm.hideStudent = true;
                $("#semesterID").addClass("hide-content");
                $("#codeID").removeClass("code-txt");
            }
            /*Chose Semester from combobox*/
            $scope.tuitionFee.tuitionForm.semester = itemSelected.semester;
        }


        /*Clear button*/
        $scope.rbPaymentTuitionFeeParams.clearForm = function () {
            $scope.tuitionFee.tuitionForm.paymentsTuitionUniversities = {};
            $scope.tuitionFee.tuitionForm.stdCodeID = null;
            $scope.hideStudentCode = false;
            $scope.tuitionFee.tuitionForm.showSemester = false;
            $scope.hideStudent = false;
            $scope.universityEmpty = false;
            $scope.semesterEmpty = false;
            $scope.stdEmpty = false;
            $scope.formEmpty = false;
        }

        /*Back button on fill screen*/
        $scope.rbPaymentTuitionFeeParams.backForm = function () {
            $scope.tuitionFee.tuitionForm.batchInfoSearch = false;
            $scope.rbPaymentTuitionFeeParams.visibility.clear = true;
            $scope.rbPaymentTuitionFeeParams.visibility.search = true;
            $scope.rbPaymentTuitionFeeParams.visibility.next = false;
        }

        /*Next button on fill screen*/
        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            $scope.rbPaymentTuitionFeeParams.visibility.accept = true;
            //Call service save to DB
            //TODO Call service when opened live data
            actions.proceed();
        });


        $scope.tableData = [];

    });