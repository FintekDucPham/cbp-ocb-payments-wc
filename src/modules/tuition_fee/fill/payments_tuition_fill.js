/**
 * Created by Sky on 10-Dec-17.
 */
angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.tuition_fee.fill', {
            url: "/fill",
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
                                                          bdTableConfig, ocbConvert, transferBatchService, $cookies, $http, FileUploader, pathService, $location) {

        $scope.universities = [{name: "Cao dang Kinh te Da Nang", id: 1},
                                {name: "Cao dang Kinh te doi ngoai", id: 2}];

        $scope.semesters = [{name: "Le phi du thi", id: 1},
            {name: "Le phi hk1", id: 2}];

        $scope.studentCodes = [{name: "MSSV", id: 1},
            {name: "CMND", id: 2}];

        $scope.tableValidData = {
            content: []
        };

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

        $scope.tableData = [];

    });