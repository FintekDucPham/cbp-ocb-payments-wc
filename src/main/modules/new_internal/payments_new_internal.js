angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.new_internal', {
            url: "/new-internal",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/new_internal/payments_new_internal.html",
            controller: "PaymentsNewInternalController",
            params: {
                payment: {}
            },
            data: {
                analyticsTitle: "payments.submenu.options.new_internal.header"
            }
        });
    })
    .controller('PaymentsNewInternalController', function ($scope, bdMainStepInitializer, rbPaymentTypes, rbPaymentOperationTypes, pathService, translate, $stateParams, $state, lodash, viewStateService) {

        bdMainStepInitializer($scope, 'payment', lodash.extend({
            formName: 'paymentForm',
            options: {
                fixedAccountSelection: false
            },
            operation: rbPaymentOperationTypes.NEW,
            token: {
                model: null,
                params: {}
            }
        }), {
            formData: {}
        });

        if(!angular.equals({}, $stateParams.payment)){
            lodash.assign($scope.payment.formData, $stateParams.payment);
            $stateParams.payment = {};
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



        $scope.payment.rbMultistepParams = {
            completeState: 'payments.recipients.list',
            footerType: 'payment',
            onClear: $scope.clearForm,
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
                finalize: 'raiff.payments.new.btn.finalize',
                finalAction: 'raiff.payments.new.btn.final_action',
                addAsStandingOrder: 'raiff.payments.new.btn.add_as_standing_order'
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
                addAsStandingOrder: true
            }
        };
    });