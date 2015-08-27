angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.new.fill', {
            url: "/fill",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/new/fill/payments_new_fill.html",
            controller: "NewPaymentFillController",
            params: {
                accountId: null
            }
        });
    })
    .controller('NewPaymentFillController', function ($scope, exchangeRates, translate, $filter, paymentRules, transferService, rbDatepickerOptions, bdFillStepInitializer, bdStepStateEvents, lodash, formService, validationRegexp) {

        bdFillStepInitializer($scope, {
            formName: 'paymentForm',
            dataObject: $scope.payment
        });

        $scope.$on('clearForm', function () {
            if($scope.paymentForm) {
                formService.clearForm($scope.paymentForm);
            }
        });

        angular.extend($scope.payment.formData, {
            realizationDate: new Date()
        }, lodash.omit($scope.payment.formData, lodash.isUndefined));

        angular.extend($scope.payment.meta, {
            recipientForbiddenAccounts: []
        });

        paymentRules.search().then(function (result) {
            angular.extend($scope.payment.meta, result);
            var options = $scope.payment.meta.rbRealizationDateOptions = rbDatepickerOptions({
                minDate: new Date(),
                maxDaysFromNow: result.maxDaysToDelayPayment
            });
            $scope.payment.meta.laterExecutedDateMsg = translate.property('raiff.payments.new.domestic.fill.execution_date.LATER_EXECUTED_DATE').replace('##date##', $filter('date')(options.maxDate, 'shortDate'));
        });

        $scope.RECIPIENT_DATA_REGEX = validationRegexp('RECIPIENT_DATA_REGEX');
        $scope.PAYMENT_DESCRIPTION_REGEX = validationRegexp('PAYMENT_TITLE_REGEX');
        $scope.AMOUNT_PATTERN = validationRegexp('AMOUNT_PATTERN');

        $scope.$on('clearForm', function () {
            $scope.payment.options.fixedRecipientSelection = false;
        });

        var requestConverter = function (formData) {
            return formData;
        };

        $scope.setRequestConverter = function (converterFn) {
            requestConverter = converterFn;
        };

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            var wait = false;

            function done() {
                var form = $scope.paymentForm;
                if (form.$invalid) {
                    formService.dirtyFields(form);
                } else {
                    transferService.create($scope.payment.type.code, angular.extend({
                        "remitterId": $scope.payment.items.senderAccount.ownersList[0].customerId
                    }, requestConverter($scope.payment.formData))).then(function (transfer) {
                        $scope.payment.transferId = transfer.referenceId;
                        $scope.payment.endOfDayWarning = transfer.endOfDayWarning;
                        actions.proceed();
                    });
                }
            }

            $scope.$broadcast(bdStepStateEvents.BEFORE_FORWARD_MOVE, {
                holdOn: function() {
                    wait = true;
                },
                done: done
            });

            if(!wait) {
                done();
            }

            $scope.$on(bdStepStateEvents.AFTER_FORWARD_MOVE);
        });

        $scope.$watch('payment.items.senderAccount', function(account) {
            if(account) {
                $scope.payment.meta.isFuturePaymentAllowed = !(account.productType === 'CREDIT' && !$scope.payment.meta.futurePaymentFromCardAllowed);
            }
        });

        exchangeRates.search().then(function(currencies) {
            $scope.payment.meta.currencies = lodash.indexBy(currencies.content, 'currencySymbol');
        });

        //$scope.$watchGroup([
        //    'payment.items.senderAccount.accessibleAssets',
        //    'payment.meta.maxElixirAmount'
        //], function (newValues) {
        //    $scope.maxAmountAllowed = Math.min.apply(this, newValues);
        //});

    });