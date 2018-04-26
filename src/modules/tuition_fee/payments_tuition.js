/**
 * Created by Sky on 10-Dec-17.
 */
angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.tuition_fee', {
            url: "/tuition:referenceId",
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
    .controller('PaymentTuitionController', function ($scope, bdMainStepInitializer, bdStepStateEvents, rbPaymentTypes, rbPaymentOperationTypes, pathService, translate, $stateParams, $state, lodash) {

        bdMainStepInitializer($scope, 'tuitionFee', lodash.extend({
            formName: 'tuitionForm',
            options: {
                fixedAccountSelection: false
            },
            operation: rbPaymentOperationTypes.NEW,
            token: {
                model: {},
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
            // type: rbPaymentTypes.OWN
        }), {
            formData: {
                addToBeneficiary: false
            }
        });

        $scope.clearForm = function () {
            return $scope.rbPaymentTuitionFeeParams.clearForm();
        }

        $scope.backForm = function () {
            return $scope.rbPaymentTuitionFeeParams.backForm();
        }

        $scope.showTuitionInfoSearch = function (searchBool, nextBool) {
            return $scope.rbPaymentTuitionFeeParams.showTuitionInfoSearch(searchBool, nextBool);
        }

        $scope.$on('wrongAuthCodeEvent', function () {
            $scope.showWrongCodeLabel = true;
        });
        $scope.$on('hideWrongCodeLabelEvent', function () {
            $scope.showWrongCodeLabel = false;
        });
        
        $scope.rbPaymentTuitionFeeParams = {
            completeState: 'dashboard',
            onClear: $scope.clearForm,
            onBack: $scope.backForm,
            cancelState:'dashboard',
            footerType: 'tuitionFee',
            onSearch: $scope.showTuitionInfoSearch,
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
        $scope.rbPaymentTuitionFeeParams.visibility.search = true;
        $scope.rbPaymentTuitionFeeParams.visibility.clear = true;
        // $scope.rbPaymentTuitionFeeParams.visibility.search = true;
        // $scope.rbPaymentTuitionFeeParams.visibility.clear = true;
        //rbPaymentInitFactory($scope);
    });
