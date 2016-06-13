angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.invoobill.new_payment', {
            url: "/make-payment/:referenceId",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/invoobill/list/make_payment/payments_new_invoobill.html",
            controller: "PaymentsNewInvoobillController",
            params: {
                payment: {},
                items: {}
            },
            resolve:{
                CURRENT_DATE: ['utilityService', function(utilityService){
                    return utilityService.getCurrentDate().then(function(currentDate){
                        return currentDate;
                    });
                }]
            },
            data: {
                analyticsTitle: "raiff.payments.invoobill.new_payment.header"
            }
        });
    })
    .controller('PaymentsNewInvoobillController', function ($scope, bdMainStepInitializer, rbPaymentTypes, rbPaymentOperationTypes, pathService, translate, $stateParams, $state, lodash, CURRENT_DATE, viewStateService, initialState, rbPaymentInitFactory) {

        $scope.CURRENT_DATE = CURRENT_DATE;

        bdMainStepInitializer($scope, 'payment', lodash.extend({
            formName: 'paymentForm',
            invoobill: initialState.invoobillPayment,
            formData: {
            },
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
            items: {
                modifyFromBasket : false
            }
        }), {
            formData: {
                addToBasket: false,
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
            $scope.payment.items = {};
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
            completeState: 'payments.invoobill.list',
            footerType: 'payment',
            onClear: $scope.clearForm,
            cancelState: 'payments.invoobill.list',
            addAsStandingOrder: $scope.addAsStandingOrder,
            labels : {
                cancel: 'config.multistepform.buttons.cancel',
                change: 'config.multistepform.buttons.change',
                edit: 'config.multistepform.buttons.edit',
                clear: 'config.multistepform.buttons.clear',
                prev: 'config.multistepform.buttons.prev',
                next: 'config.multistepform.buttons.next',
                accept: 'config.multistepform.buttons.accept',
                finalize: 'raiff.payments.new.btn.finalize',
                finalAction: 'raiff.payments.new.btn.final_action',
                addAsStandingOrder: 'raiff.payments.new.btn.add_as_standing_order'
            },
            visibility:{
                fillReturn: false,
                cancel: true,
                change: false,
                clear: false,
                next: true,
                accept: true,
                finalAction: false,
                finalize: true,
                hideSaveRecipientButton: true,
                addAsStandingOrder: false
            }
        };

        rbPaymentInitFactory($scope);
    });