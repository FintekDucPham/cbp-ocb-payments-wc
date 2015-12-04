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
            state: 'domestic'
        },
        "INTERNAL": {
            code: 'INTERNAL',
            state: 'internal'
        },
        "INSURANCE": {
            code: 'INSURANCE',
            state: 'insurance'
        },
        "TAX": {
            code: 'TAX',
            state: 'tax'
        },
        "SWIFT": {
            code: 'SWIFT',
            state: 'swift'
        },
        "SEPA": {
            code: 'SEPA',
            state: 'sepa'
        },
        "OWN": {
            code: 'OWN',
            state: 'own'
        },
        "STANDING": {
            code: 'STANDING',
            state: 'standing'
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
    .controller('PaymentsNewController', function ($scope, bdMainStepInitializer, rbPaymentTypes, rbPaymentOperationTypes, pathService, translate, $stateParams, $state, lodash, validationRegexp, transferService, standingTransferService) {
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
                paymentTypes: lodash.without(lodash.map(rbPaymentTypes, function (value) {
                    return value;
                }), rbPaymentTypes.INTERNAL, rbPaymentTypes.SWIFT, rbPaymentTypes.SEPA, rbPaymentTypes.OWN, rbPaymentTypes.STANDING),
                isFuturePaymentAllowed: true,
                dateSetByCategory: false
            },
            validation: {}
        }), {
            formData: $stateParams.payment
        });

        $scope.clearForm = function() {
            $scope.payment.formData = {};
            $scope.payment.items = {};
            $scope.$broadcast('clearForm');
        };

        $scope.getTemplateName = function (stepName) {
            return "{0}/modules/new/{1}/{2}/payments_new_{2}_{1}.html".format(pathService.generateTemplatePath("raiffeisen-payments"), stepName, $stateParams.paymentType);
        };

        $scope.changePaymentType = function (type) {
            $state.go('payments.new.fill', {
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


        var getProperRbPaymentStepParams = function() {
            if ($scope.payment.type.code == rbPaymentTypes.STANDING.code) {
                return {
                    completeState: 'payments.standing.list',
                    onClear: $scope.clearForm,
                    cancelState: 'payments.standing.list',
                    labels : {
                        finalize: 'raiff.payments.standing.new.btn.finalize'
                    }
                };
            }


            return {
                completeState: 'payments.recipients.list',
                finalAction: $scope.saveRecipient,
                onClear: $scope.clearForm,
                cancelState: 'payments.recipients.list',
                labels : {
                    finalize: 'raiff.payments.new.btn.finalize',
                    finalAction: 'raiff.payments.new.btn.final_action'
                }
            };
        };


        $scope.payment.rbPaymentsStepParams = getProperRbPaymentStepParams() ;


        $scope.getProperPaymentService = function(paymentType) {
            // unfortunatelly we have different services for different transfer types
            if (paymentType == rbPaymentTypes.STANDING.code) {
                return standingTransferService;
            }
            else {
                return transferService;
            }
        };

    });