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
            url: "/new/:paymentType/:referenceId",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/new/payments_new.html",
            controller: "PaymentsNewController",
            params: {
                paymentType: 'domestic',
                payment: {},
                items: {}
            },
            data: {
                analyticsTitle: ["$stateParams", function($stateParams) {
                    return "raiff.payments.new.types." + $stateParams.paymentType.toUpperCase();
                }]
            }
        });
    })
    .controller('PaymentsNewController', function ($scope, bdMainStepInitializer, rbPaymentTypes, rbPaymentOperationTypes,
                                                   pathService, translate, $stateParams, $state, lodash, validationRegexp,
                                                   standingTransferService, transferService, initialState, viewStateService, rbPaymentInitFactory, menuService) {

        $scope.beforeTransfer = {
            PROTOTYPE: {
                SUGGESTION: {
                    rejected: false,
                    proceedTransferFn: null,
                    displayed: false,
                    resolvedValue: null,
                    checkBundle: null,
                    type: 'SUGGESTION'
                }
            }
        };


        $scope.AMOUNT_PATTERN = validationRegexp('AMOUNT_PATTERN');



            bdMainStepInitializer($scope, 'payment',{
                formName: 'paymentForm',
                type: lodash.find(rbPaymentTypes, {
                    state: $stateParams.paymentType || 'domestic'
                }),
                operation: (initialState && initialState.paymentOperationType) || rbPaymentOperationTypes.NEW,
                formData: {
                    hideSaveRecipientButton: false,
                    sendBySorbnet: false,
                    addToBasket: false
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
                    dateSetByCategory: false,
                    hideSaveRecipientButton: false
                },
                validation: {},
                items: {
                    senderAccount: {
                        accessibleAssets: null
                    },
                    modifyFromBasket : false
                },
                initData: {
                },
                beforeTransfer: {
                    suggestions: {
                        displayed: false,
                        list: []
                    }
                }
            });


        if(!angular.equals({}, $stateParams.payment)){
            $scope.payment.formData = angular.copy($stateParams.payment);
            if($stateParams.payment.paymentId){
                $scope.payment.transferId = $stateParams.payment.paymentId;
                $scope.payment.token.params.resourceId = $scope.payment.transferId;
            }
            if($stateParams.payment.fromMyPayment){
                $scope.payment.meta.hideSaveRecipientButton = true;
            }
            $stateParams.payment = {};
        }
        if(!angular.equals({}, $stateParams.items)){
            lodash.assign($scope.payment.items,  $stateParams.items);
            $stateParams.items = {};
        }
        if(!angular.equals({}, $stateParams.meta)){
            lodash.assign($scope.payment.meta,  $stateParams.meta);
            $stateParams.meta = {};
        }
        if(!angular.equals({}, $stateParams.options)){
            lodash.assign($scope.payment.options,  $stateParams.options);
            $stateParams.options = {};
        }



        $scope.payment.meta.paymentTypes = lodash.where(rbPaymentTypes, {'parentState': $scope.payment.type.parentState});


        $scope.clearFormFunction = null;
        $scope.setClearFormFunction = function(fn){
            $scope.clearFormFunction = fn;
        };

        $scope.clearForm = function() {
            if(!$scope.clearFormFunction){
                $scope.payment.formData = {};
                $scope.payment.items = {};
            }else{
                $scope.clearFormFunction();
            }
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
                var recipientType = $scope.payment.type.state.toLowerCase();
                if(recipientType==='swift' || recipientType==='sepa'){
                    recipientType = 'foreign';
                }
                $state.go("payments.recipients.manage.new.fill", {
                    recipientType: recipientType,
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
            viewStateService.setInitialState('payments.standing.list', {
                returnToPage: (initialState && initialState.returnToPage) ? initialState.returnToPage : null,
                returnToItem: $scope.payment.formData
            });

            $state.go('payments.standing.list');
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
            finalAction: $scope.saveRecipient,
            footerType: 'payment',
            onClear: $scope.clearForm,
            cancelState: 'payments.recipients.list',
            onFillReturn: $scope.onFillReturn,
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
                finalAction: true,
                finalize: true,
                addAsStandingOrder: true
            }
        };

        if ($scope.payment.type.code == rbPaymentTypes.STANDING.code) {
            $scope.payment.rbPaymentsStepParams.visibility.finalAction = false;
            $scope.payment.rbPaymentsStepParams.visibility.fillReturn = false;
            $scope.payment.rbPaymentsStepParams.completeState = 'payments.standing.list';
            $scope.payment.rbPaymentsStepParams.cancelState = 'payments.standing.list';
            $scope.payment.rbPaymentsStepParams.labels.finalize = 'raiff.payments.standing.new.btn.finalize';
            var currentMenuItems = menuService.getCurrentMenuItem().items;
            var subItem = lodash.find(currentMenuItems,{
                id: 'payments.standing.list'
            });
            menuService.setActiveItem(subItem);
        }else if($scope.payment.type.code == rbPaymentTypes.DOMESTIC.code ||
            $scope.payment.type.code == rbPaymentTypes.INSURANCE.code ||
            $scope.payment.type.code == rbPaymentTypes.TAX.code){
            menuService.updateActiveItem('payments.new.fill');
        }else if($scope.payment.type.code == rbPaymentTypes.SWIFT.code ||
            $scope.payment.type.code == rbPaymentTypes.SEPA.code){
            menuService.updateActiveItem('payments.new_foreign.fill');
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

        $scope.getTransferTypeHeader = function () {
            var code = $scope.payment.type.code;
            if (code == 'STANDING') {
                if ($scope.payment.operation.code == 'EDIT') {
                    $scope.payment.header = translate.property("raiff.payments.new.label." + code + ".EDIT.header");
                } else {
                    $scope.payment.header = translate.property("raiff.payments.new.label." + code + ".NEW.header");
                }
                return;
            }
            $scope.payment.header = translate.property("raiff.payments.new.types." + code);
            return;
        };

        $scope.getTransferTypeHeader();

        rbPaymentInitFactory($scope);



    });