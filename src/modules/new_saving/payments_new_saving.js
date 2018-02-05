angular.module('ocb-payments')
       .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.new_saving', {
            url: "/new-saving/:referenceId",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/new_saving/payments_new_saving.html",
            controller: "PaymentsNewSavingController",
            params: {
                payment: {},
                items: {}
            },
            data: {
                analyticsTitle: "payments.submenu.options.saving.header"
            },
            resolve:{
                CURRENT_DATE: ['utilityService', function(utilityService){
                    return utilityService.getCurrentDateWithTimezone();
                }]
            }
        });
    })
    .controller('PaymentsNewSavingController', function ($scope, bdMainStepInitializer, rbPaymentTypes, rbPaymentOperationTypes, pathService, translate, $stateParams, $state, lodash, viewStateService, rbPaymentInitFactory, rbBeforeTransferConstants, CURRENT_DATE, exportService) {

        $scope.beforeTransfer = rbBeforeTransferConstants;
        $scope.CURRENT_DATE = CURRENT_DATE;

        bdMainStepInitializer($scope, 'payment', lodash.extend({
            formName: 'paymentForm',
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
                modifyFromBasket : false
            },
            type: rbPaymentTypes.OWN
        }), {
            formData: {
                addToBasket: false
            }
        });

        if(!angular.equals({}, $stateParams.payment)){
            lodash.assign($scope.payment.formData, $stateParams.payment);
            $stateParams.payment = {};
        }
        if(!angular.equals({}, $stateParams.items)){
            lodash.assign($scope.payment.items,  $stateParams.items);
            $stateParams.items = {};
        }
        $scope.clearForm = function () {
            $scope.payment.formData = {};
            if($scope.payment.meta && $scope.payment.meta.modifyFromBasket){
                $scope.payment.formData.referenceId = $scope.payment.meta.referenceId;
                $scope.payment.formData.addToBasket = true;
            }
            //$scope.payment.items = {};
            $scope.$broadcast('clearForm');
        };

        var alreadySet = false;
        $scope.setDefaultValues = function (value) {
            if (!alreadySet) {
                angular.extend($scope.payment.formData, value, lodash.pick($scope.payment.formData, angular.isDefined));
                alreadySet = true;
            }
        };

        $scope.addAsStandingOrder = function() {

            viewStateService.setInitialState('payments.new', {
                paymentOperationType: rbPaymentOperationTypes.NEW
            });

            $state.transitionTo('payments.new.fill', {
                paymentType: 'standing',
                payment: $scope.payment.standingOrderData
            }, {reload: true}).finally(function() {
                // workaround for paymentType parameter and state reloading problems
                $state.go('payments.new.fill', {
                    paymentType: 'standing',
                    payment: $scope.payment.standingOrderData
                });
            });
        };



        $scope.payment.rbPaymentsStepParams = {
            completeState: 'payments.recipients.list',
            footerType: 'payment',
            onClear: $scope.clearForm,
            printReport: function () {
                window.location.href = exportService.prepareHref({
                    href: "/api/transaction/" + $scope.payment.transferId + "/downloads/pdf.json"
                });
            },
            cancelState: 'payments.recipients.list',
            addAsStandingOrder: $scope.addAsStandingOrder,
            labels : {
                cancel: 'config.multistepform.buttons.cancel',
                change: 'config.multistepform.buttons.change',
                edit: 'config.multistepform.buttons.edit',
                clear: 'config.multistepform.buttons.clear',
                prev: 'config.multistepform.buttons.prev',
                next: 'config.multistepform.buttons.next',
                accept: 'config.multistepform.buttons.accept',
                finalize: 'ocb.payments.new.btn.finalize',
                finalAction: 'ocb.payments.new.btn.final_action',
                printReport: 'ocb.payments.new.btn.print_report'
            },
            visibility:{
                fillReturn: false,
                cancel: true,
                change: true,
                clear: true,
                next: true,
                accept: true,
                finalAction: false,
                finalize: true,
                hideSaveRecipientButton: true,
                printReport: true
            }
        };

        rbPaymentInitFactory($scope);
    }) .constant('rbPaymentAccTypes', {
     "TYPES":[{name:"Accumulate"},{name:"Online"},{name:"Normal"}],
});
