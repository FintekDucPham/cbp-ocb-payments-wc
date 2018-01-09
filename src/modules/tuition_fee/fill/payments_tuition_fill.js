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
                                                          bdTableConfig, ocbConvert, transferBatchService, $cookies, $http, FileUploader, pathService, $location) {
        /*Next button on fill screen*/
        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            $scope.payment.rbPaymentTuitionFeeParams.visibility.accept = true;
            //Call service save to DB
            //TODO Call service when opened live data
            actions.proceed();
        });

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