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
        },
        "STANDING": {
            code: 'STANDING',
            state: 'standing'
        }
    })
    .constant("rbForeignTransferConstants", {
        TRANSFER_COSTS:{
            OUR: "OUR",
            SHA: "SHA"
        },
        PAYMENT_TYPES:{
            STANDARD: "STANDARD",
            EXPRESS: "EXPRESS"
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
                payment: {},
                items: {}
            }
        });
    })
    .controller('PaymentsNewController', function ($scope, bdMainStepInitializer, rbPaymentTypes, rbPaymentOperationTypes,
                                                   pathService, translate, $stateParams, $state, lodash, validationRegexp,
                                                   standingTransferService, transferService, initialState) {

        $scope.AMOUNT_PATTERN = validationRegexp('AMOUNT_PATTERN');


        bdMainStepInitializer($scope, 'payment',{
            formName: 'paymentForm',
            type: lodash.find(rbPaymentTypes, {
                state: $stateParams.paymentType || 'domestic'
            }),
            operation: (initialState && initialState.paymentOperationType) || rbPaymentOperationTypes.NEW,
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
        });

        if(!angular.equals({}, $stateParams.payment)){
            lodash.assign($scope.payment.formData, $stateParams.payment);
            $stateParams.payment = {};
        }
        if(!angular.equals({}, $stateParams.items)){
            lodash.assign($scope.payment.items,  $stateParams.items);
            $stateParams.items = {};
        }



        $scope.payment.meta.paymentTypes = lodash.where(rbPaymentTypes, {'parentState': $scope.payment.type.parentState});

       // alert("X");
        $scope.clearForm = function() {
            $scope.payment.formData = {};
            $scope.payment.items = {};
            $scope.$broadcast('clearForm');
        };

        $scope.getTemplateName = function (stepName) {
            return "{0}/modules/new/{1}/{2}/payments_new_{2}_{1}.html".format(pathService.generateTemplatePath("raiffeisen-payments"), stepName, $stateParams.paymentType);
        };

        $scope.changePaymentType = function (type) {
            $state.go('payments.'+type.parentState+'.fill', {
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

        // akcja dla guzka "powrot" na ekranie modyfikacji zlcenia stalego
        $scope.onFillReturn = function() {
            $state.go('payments.standing.list');
        };

        $scope.payment.rbPaymentsStepParams = {
            completeState: 'payments.recipients.list',
            finalAction: $scope.saveRecipient,
            footerType: 'payment',
            onClear: $scope.clearForm,
            cancelState: 'payments.recipients.list',
            onFillReturn: $scope.onFillReturn,
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
                fillReturn: false,
                cancel: true,
                change: true,
                clear: true,
                next: true,
                accept: true,
                finalAction: true,
                finalize: true
            }
        };

        if ($scope.payment.type.code == rbPaymentTypes.STANDING.code) {
            $scope.payment.rbPaymentsStepParams.visibility.finalAction = false;
            $scope.payment.rbPaymentsStepParams.visibility.fillReturn = true;
            $scope.payment.rbPaymentsStepParams.completeState = 'payments.standing.list';
            $scope.payment.rbPaymentsStepParams.cancelState = 'payments.standing.list';
            $scope.payment.rbPaymentsStepParams.labels.finalize = 'raiff.payments.standing.new.btn.finalize';
        }


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