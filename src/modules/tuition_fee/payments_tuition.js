/**
 * Created by Sky on 10-Dec-17.
 */
angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.tuition_fee', {
            url: "/tuition/:referenceId",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/tuition_fee/payments_tuition.html",
            controller: "PaymentTuitionController",
            params: {
                payment: {},
                items: {}
            },
            data: {
                analyticsTitle: "payments.submenu.options.new_bill.header"
            },
            resolve:{
                CURRENT_DATE: ['utilityService', function(utilityService){
                    return utilityService.getCurrentDateWithTimezone();
                }]
            }
        });
    })
    .controller('PaymentTuitionController', function ($scope, bdMainStepInitializer, bdStepStateEvents, rbPaymentTypes, rbPaymentOperationTypes, pathService, translate, $stateParams, $state, lodash, viewStateService, rbPaymentInitFactory, rbBeforeTransferConstants, CURRENT_DATE , bdTableConfig, transferBillService, ocbConvert) {

        bdMainStepInitializer($scope, 'payment', lodash.extend({
            formName: 'paymentsTutitionForm',
            options: {
                fixedAccountSelection: false
            },
            operation: rbPaymentOperationTypes.NEW,
            token: {
                model: null,
                params: {}
            },
            initData: {
            },
            beforeTransfer: {
                suggestions: {
                    displayed: false,
                    list: []
                }
            },
            items: {
                // senderService : {
                //     serviceId: "NET",
                //     serviceName: "ADSL – Internet ADSL bill",
                //     providers: {
                //         providerId: "VNPTLD",
                //         providerName: "Lam Dong VNPT"
                //     }
                // },
                modifyFromBeneficiary : false
            },
            type: rbPaymentTypes.OWN
        }), {
            formData: {
                addToBeneficiary: false
            }
        });

        /*Test start*/
        /*Mock data*/
        $scope.tuitionData = {
            "content": [
                {
                    "universityCode": "1",
                    "universityName": "Đại Học Kinh Tế TP.HCM",
                    "paymentPolicy": "",
                    "universityAbbreviation": "DHKT",
                    "universitySemester": [
                        {
                            "semester": "Le phi du thi tot nghiep Dai Hoc",
                            "schoolYear": "2017",
                            "university": null
                        },
                        {
                            "semester": "Le phi du thi nghien cuu sinh Dai Hoc",
                            "schoolYear": "2017",
                            "university": null
                        },
                        {
                            "semester": "Le phi tham du gian hang IT Dai Hoc",
                            "schoolYear": "2018",
                            "university": null
                        }
                    ],
                    "_links": {}
                },
                {
                    "universityCode": "5",
                    "universityName": "Cao đẳng Kinh Tế Kế Hoạch (Đà Nẵng)",
                    "paymentPolicy": "",
                    "universityAbbreviation": "CDKT Da Nang",
                    "universitySemester": [
                        {
                            "semester": "Le phi du thi tot nghiep Cao Dang",
                            "schoolYear": "2017",
                            "university": null
                        },
                        {
                            "semester": "Le phi du thi nghien cuu sinh Cao Dang",
                            "schoolYear": "2017",
                            "university": null
                        },
                        {
                            "semester": "Le phi tham du gian hang IT Cao Dang",
                            "schoolYear": "2018",
                            "university": null
                        }
                    ],
                    "_links": {}
                }
            ],
            "numberOfElements": 7,
            "sortOrder": null,
            "totalPages": 0,
            "pageSize": 0,
            "pageNumber": 0,
            "sortDirection": null,
            "totalElements": 0,
            "firstPage": false,
            "lastPage": true,
        }

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
        $scope.stdEmpty = false;
        $scope.universityEmpty = false;
        $scope.showTuitionInfoSearch = function(searchBool, nextBool ) {
             if ($scope.paymentsTuitionUniversities == undefined) {
                 //check university empty
                 $scope.universityEmpty = true;
             } else if ($scope.paymentsTuitionUniversities.universityCode == 1 && $scope.formSelected == undefined) {
                 //check form
                 $scope.universityEmpty = false;
                 $scope.formEmpty = true;
             } else if ($scope.paymentsTuitionUniversities.universityCode == 1 && $scope.formSelected == 'Full time' && $scope.payment.formData.semester == undefined) {
                 $scope.formEmpty = false;
                 $scope.semesterEmpty = true;
             } else if ($scope.payment.formData.stdCodeID == undefined) {
                 $scope.semesterEmpty = false;
                 $scope.stdEmpty = true;
             } else {
                 $scope.batchInfoSearch = true;
                 $scope.formEmpty = false;
                 $scope.universityEmpty = false;
                 $scope.semesterEmpty = false;
                 $scope.stdEmpty = false;
                 $scope.payment.rbPaymentTuitionFeeParams.visibility.search = searchBool;
                 $scope.payment.rbPaymentTuitionFeeParams.visibility.clear = searchBool;
                 $scope.payment.rbPaymentTuitionFeeParams.visibility.next = nextBool;
                //Call service to search
                //TODO call service
            }
        };

        /*Chose University from combobox*/
        $scope.hideStudent = false;
        $scope.onTuitionUniversityChange = function (itemSelected) {
            $scope.paymentsTuitionUniversities = itemSelected;
            if ($scope.paymentsTuitionUniversities.universityCode == 1) {
                $scope.hideStudentCode = true;
                $scope.hideStudent = true;
                $("#semesterID").removeClass("hide-content");
                $("#codeID").addClass("code-txt");
            } else {
                $scope.hideStudentCode = false;
                $scope.hideStudent = true;
                $("#semesterID").addClass("hide-content");
                $("#codeID").removeClass("code-txt");
            }
            /*Chose Semester from combobox*/
            $scope.paymentsTuitionSemesters = itemSelected.universitySemester;
        }

        $scope.checkValue = function () {
            $scope.testForm = $scope.rbForm;
        }

        $scope.formSelected = undefined;
        $scope.RadioChange = function (s) {
            $scope.formSelected = s;
            /*Semester config*/
            if ($scope.formSelected == 'Full time') {
                $scope.showSemester = true;
            } else {
                $scope.showSemester = false;
            }
        };
        /*Test End*/
      /*  var alreadySet = false;
        $scope.setDefaultValues = function (value) {
            if (!alreadySet) {
                angular.extend($scope.payment.formData, value, lodash.pick($scope.payment.formData, angular.isDefined));
                alreadySet = true;
            }
        };*/
        /*Clear button*/
        $scope.clearForm = function () {
            $scope.payment.formData.paymentsTuitionUniversities = {};
            $scope.payment.formData.stdCodeID = null;
            $scope.hideStudentCode = false;
            $scope.showSemester = false;
            $scope.hideStudent = false;
            $scope.universityEmpty = false;
            $scope.semesterEmpty = false;
            $scope.stdEmpty = false;
            $scope.formEmpty = false;
        }

        /*Back button on fill screen*/
        $scope.backForm = function () {
            $scope.batchInfoSearch = false;
            $scope.payment.rbPaymentTuitionFeeParams.visibility.clear = true;
            $scope.payment.rbPaymentTuitionFeeParams.visibility.search = true;
            $scope.payment.rbPaymentTuitionFeeParams.visibility.next = false;
        }

        $scope.payment.rbPaymentTuitionFeeParams = {
            completeState:'payments.batch_processing.fill',
            onClear: $scope.clearForm,
            onBack: $scope.backForm,
            cancelState:'dashboard',
            footerType: 'tuitionFee',
            onSearch: $scope.showTuitionInfoSearch,
            moveNext: $scope.moveNext,
            onCheckTable: $scope.checkTable,
            labels:{
                prev:"ocb.payments.buttons.prev",
                next:"ocb.payments.new.btn.next",
                finalize:"ocb.payments.new.btn.finalize",
                search: 'config.multistepform.buttons.search'
            },
            visibility:{
                search: false,
                change: false,
                clear: false,
                next: false,
                accept: false,
                prev: true
            }
        };
        $scope.payment.rbPaymentTuitionFeeParams.visibility.search = true;
        $scope.payment.rbPaymentTuitionFeeParams.visibility.clear = true;
        //rbPaymentInitFactory($scope);
    });
