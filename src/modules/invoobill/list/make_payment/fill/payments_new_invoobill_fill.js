angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.invoobill.new_payment.fill', {
            url: "/fill",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/invoobill/list/make_payment/fill/payments_new_invoobill_fill.html",
            controller: "PaymentsNewInvoobillFillController",
            params: {
                accountId: null,
                recipientId: null
            },
            data: {
                analyticsTitle: "config.multistepform.labels.step1"
            }
        });
    })
    .controller('PaymentsNewInvoobillFillController', function ($scope, $q, rbAccountSelectParams , $stateParams, customerService, rbDateUtils, exchangeRates, translate, $filter, paymentRules, transferService, rbDatepickerOptions, bdFillStepInitializer, bdStepStateEvents, lodash, formService, validationRegexp, rbPaymentOperationTypes, utilityService, invoobillPaymentsService) {

        bdFillStepInitializer($scope, {
            formName: 'paymentForm',
            dataObject: $scope.payment
        });

        var validatorList = [];

        var validatorObjectPrototype = {
            name : null,
            valid: function(){
                return true;
            },
            action: function(){}
        };

        var registerValidator = function(name, validationFunction, actionFunction){
            var validator = angular.copy(validatorObjectPrototype);
            validator.name = name;
            validator.valid = validationFunction;
            validator.action = actionFunction;
            validatorList.push(validator);
        };

        var amountExceedFundsValidator = function(){
            if($scope.payment.invoobill.amount > $scope.payment.items.senderAccount.accessibleAssets){
                return false;
            }else {
                return true;
            }
        };

        var setAmountExceedMessage = function(){
            $scope.payment.meta.validators.fundsExeed = {
                show: true,
                messages: translate.property("ocb.payments.new.domestic.fill.amount.AMOUNT_EXCEEDED_FUNDS")
            };
        };

        registerValidator('amountExceedFunds', amountExceedFundsValidator, setAmountExceedMessage);

        var validate = function(){
            var valid = true;
            angular.forEach(validatorList, function(validator){
                if(!validator.valid()){
                    validator.action();
                    valid = false;
                }
            });
            return valid;
        };

        $scope.$watch('payment.formData.remitterAccountId', function(newVal, oldVal){
            $scope.payment.meta.validators = {};
        });

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            delete $scope.payment.token.params.resourceId;
            var form = $scope.paymentForm;
            if(!validate()){
                return;
            }
            if (form.$invalid) {
                formService.dirtyFields(form);
            }else {
                createPaymentEntity().then(function(data){
                    $scope.payment.meta.referenceId = data;
                    actions.proceed();
                }).catch(function(errorReason){
                    handleValidationErrors(errorReason);
                });
            }
        });

        var handleValidationErrors = function(errorReason){
            if(errorReason.subType == 'validation') {
                for (var i = 0; i < errorReason.errors.length; i++) {
                    var currentError = errorReason.errors[i];
                    if(currentError.field == 'ocb.transfer.amount.exceed') {
                        setAmountExceedMessage();
                    }
                    if(currentError.field == 'ocb.transfer.limit.exceeed') {
                        $scope.payment.meta.validators.limitExceed = {
                            show: true,
                            messages: translate.property("ocb.payments.new.domestic.fill.amount.DAILY_LIMIT_EXCEEDED")
                        };
                    }
                }
            }
        };

        var createPaymentEntity = function(){
            var transfer = angular.extend({}, $scope.payment.invoobill, $scope.payment.formData);
            var params = angular.copy(transfer);
            if(params.beneficiaryName){
                params.beneficiaryName = utilityService.splitTextEveryNSigns(params.beneficiaryName);
            }
            params.title = utilityService.splitTextEveryNSigns(params.title);
            return invoobillPaymentsService.create(params, "create").then(function(data){
                return data;
            });
        };

        $scope.remitterAccountSelectParams = new rbAccountSelectParams({
            showCustomNames: true
        });
    });
