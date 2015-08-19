angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.new.fill', {
            url: "/fill",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/new/fill/payments_new_fill.html",
            controller: "NewPaymentFillController"
        });
    })
    .controller('NewPaymentFillController', function ($scope, translate, $filter, paymentRules, transferService, rbDatepickerOptions, bdFillStepInitializer, bdStepStateEvents, lodash, formService, NRB_REGEX, PAYMENT_TITLE_REGEX, RECIPIENT_DATA_REGEX) {

        bdFillStepInitializer($scope, {
            formName: 'paymentForm',
            dataObject: $scope.payment
        });

        angular.extend($scope.payment.formData, {
            realizationDate: new Date()
        }, lodash.omit($scope.payment.formData, lodash.isUndefined));

        paymentRules.search().then(function (result) {
            angular.extend($scope.payment.meta, result);
            var options = $scope.payment.meta.rbRealizationDateOptions = rbDatepickerOptions({
                minDate: new Date(),
                maxDaysFromNow: result.maxDaysToDelayPayment
            });
            $scope.payment.meta.laterExecutedDateMsg = translate.property('raiff.payments.new.domestic.fill.execution_date.LATER_EXECUTED_DATE').replace('##date##', $filter('date')(options.maxDate, 'shortDate'));
        });

        $scope.NRB_REGEX = new RegExp(NRB_REGEX);
        $scope.RECIPIENT_DATA_REGEX = new RegExp(RECIPIENT_DATA_REGEX);
        $scope.PAYMENT_DESCRIPTION_REGEX = new RegExp(PAYMENT_TITLE_REGEX);

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
            var form = $scope.paymentForm;
            if (form.$invalid) {
                formService.dirtyFields(form);
            } else {
                transferService.create($scope.payment.type.code, angular.extend({
                    "remitterId": $scope.payment.items.senderAccount.ownersList[0].customerId,
                    "transferFromTemplate": false // todo change this
                }, requestConverter($scope.payment.formData))).then(function (transfer) {
                    var responseObj = angular.fromJson(transfer);
                    $scope.payment.transferId = responseObj.referenceId;
                    $scope.payment.endOfDayWarning = responseObj.endOfDayWarning;
                    actions.proceed();
                });
            }
        });

        $scope.$watch('payment.items.senderAccount', function(account) {
            if(account) {
                $scope.payment.meta.isFuturePaymentAllowed = !(account.productType === 'CREDIT' && !$scope.payment.meta.futurePaymentFromCardAllowed);
            }
        });

        $scope.$watchGroup([
            'payment.items.senderAccount.accessibleAssets',
            'payment.meta.maxElixirAmount'
        ], function (newValues) {
            $scope.maxAmountAllowed = Math.min.apply(this, newValues);
        });

    });