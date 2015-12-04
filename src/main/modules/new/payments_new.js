angular.module('raiffeisen-payments')
    .constant('rbPaymentOperationTypes', {
        "NEW": {
            code: 'NEW',
            state: 'new',
            link: 'create'
        },
        "EDIT": {
            code: 'EDIT',
            state: 'edit',
            link: 'modify'
        },
        "REMOVE": {
            code: 'REMOVE',
            state: 'remove',
            link: 'remove'
        }
    })
    .constant('rbPaymentTypes', {
        "DOMESTIC": {
            code: 'DOMESTIC',
            state: 'domestic',
            parentState: 'new'
        },
        "INTERNAL": {
            code: 'INTERNAL',
            state: 'internal',
            parentState: 'new_internal'
        },
        "INSURANCE": {
            code: 'INSURANCE',
            state: 'insurance',
            parentState: 'new'
        },
        "TAX": {
            code: 'TAX',
            state: 'tax',
            parentState: 'new'
        },
        "SWIFT": {
            code: 'SWIFT',
            state: 'swift',
            parentState: 'new_foreign'
        },
        "SEPA": {
            code: 'SEPA',
            state: 'sepa',
            parentState: 'new_foreign'
        },
        "OWN": {
            code: 'OWN',
            state: 'own',
            parentState: 'new_internal'
        }
    })
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.new', {
            url: "/new/:paymentType",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/new/payments_new.html",
            controller: "PaymentsNewController",
            params: {
                paymentType: 'domestic',
                payment: {}
            }
        });
    })
    .controller('PaymentsNewController', function ($scope, bdMainStepInitializer, rbPaymentTypes, rbPaymentOperationTypes, pathService, translate, $stateParams, $state, lodash, validationRegexp) {
        $scope.AMOUNT_PATTERN = validationRegexp('AMOUNT_PATTERN');

        bdMainStepInitializer($scope, 'payment', lodash.extend({
            formName: 'paymentForm',
            type: lodash.find(rbPaymentTypes, {
                state: $stateParams.paymentType || 'domestic'
            }),
            operation: rbPaymentOperationTypes.NEW,
            formData: {
                hideSaveRecipientButton: false
            },
            token: {
                model: null,
                params: {}
            },
            options: {
                fixedAccountSelection: false,
                fixedRecipientSelection: false
            },
            meta: {
                paymentTypes: [],
                isFuturePaymentAllowed: true,
                dateSetByCategory: false
            },
            validation: {}
        }), {
            formData: $stateParams.payment
        });

        $scope.payment.meta.paymentTypes = lodash.where(rbPaymentTypes, {'parentState': $scope.payment.type.parentState});


        $scope.clearForm = function() {
            $scope.payment.formData = {};
            $scope.payment.items = {};
            $scope.$broadcast('clearForm');
        };

        $scope.getTemplateName = function (stepName) {
            return "{0}/modules/new/{1}/{2}/payments_new_{2}_{1}.html".format(pathService.generateTemplatePath("raiffeisen-payments"), stepName, $stateParams.paymentType);
        };

        $scope.changePaymentType = function (type) {
            var stateToGo = "payments.{0}.fill".format(type.parentState);
            $state.go(stateToGo, {
                paymentType: type.state
            });
        };

        $scope.setRecipientDataExtractor = function(fn) {
            $scope.resolveRecipientData = fn;
        };

        $scope.saveRecipient = function() {
            if($scope.resolveRecipientData) {
                $state.go("payments.recipients.manage.new.fill", {
                    recipientType: $scope.payment.type.state.toLowerCase(),
                    operation: 'new',
                    recipient: $scope.resolveRecipientData()
                });
            }
        };

        var alreadySet = false;
        $scope.setDefaultValues = function (value) {
            if (!alreadySet) {
                angular.extend($scope.payment.formData, value, lodash.pick($scope.payment.formData, angular.isDefined));
                alreadySet = true;
            }
        };


        $scope.payment.rbPaymentsStepParams = {
            completeState: 'payments.recipients.list',
            finalAction: $scope.saveRecipient,
            footerType: 'payment',
            onClear: $scope.clearForm,
            cancelState: 'payments.recipients.list',
            labels : {
                cancel: 'config.multistepform.buttons.cancel',
                change: 'config.multistepform.buttons.change',
                edit: 'config.multistepform.buttons.edit',
                clear: 'config.multistepform.buttons.clear',
                prev: 'config.multistepform.buttons.prev',
                next: 'config.multistepform.buttons.next',
                accept: 'config.multistepform.buttons.accept',
                finalize: 'raiff.payments.new.btn.finalize',
                finalAction: 'raiff.payments.new.btn.final_action'
            },
            visibility:{
                cancel: true,
                change: true,
                clear: true,
                next: true,
                accept: true,
                finalAction: true,
                finalize: true
            }
        };
    });