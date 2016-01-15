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
            resolve:{
                CURRENT_DATE: ['utilityService', function(utilityService){
                    return utilityService.getCurrentDate().then(function(currentDate){
                        return currentDate;
                    });
                }]
            }
        });
    })
    .controller('PaymentsNewInternalController', function ($scope, bdMainStepInitializer, rbPaymentTypes, rbPaymentOperationTypes, pathService, translate, $stateParams, $state, lodash, CURRENT_DATE) {

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
            }
        }), {
            formData: $stateParams.payment
        });

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

        $scope.payment.rbMultistepParams = {
            completeState: 'payments.recipients.list',
            onClear: $scope.clearForm,
            cancelState: 'payments.recipients.list',
            labels : {
                change: 'config.multistepform.buttons.change',
                edit: 'config.multistepform.buttons.edit',
                clear: 'config.multistepform.buttons.clear',
                prev: 'config.multistepform.buttons.prev',
                next: 'config.multistepform.buttons.next',
                accept: 'config.multistepform.buttons.accept',
                finalAction: 'raiff.payments.new.btn.final_action',
                finalize: 'raiff.payments.new.btn.finalize'
            },
            visibility: {
                hideSaveRecipientButton: true
            }
        };
    });