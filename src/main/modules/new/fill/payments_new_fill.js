angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.new.fill', {
            url: "/fill",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/new/fill/payments_new_fill.html",
            controller: "NewPaymentFillController"
        });
    })
    .controller('NewPaymentFillController', function ($scope, bdFillStepInitializer, bdStepStateEvents, lodash, formService, NRB_REGEX, PAYMENT_TITLE_REGEX, RECIPIENT_DATA_REGEX) {

        bdFillStepInitializer($scope, {
            formName: 'paymentForm',
            dataObject: $scope.payment
        });

        $scope.NRB_REGEX = new RegExp(NRB_REGEX);
        $scope.RECIPIENT_DATA_REGEX = new RegExp(RECIPIENT_DATA_REGEX);
        $scope.PAYMENT_DESCRIPTION_REGEX = new RegExp(PAYMENT_TITLE_REGEX);

        angular.extend($scope.payment.formData, {
            realizationDate: Date.now()
        });

        $scope.$on('clearForm', function() {
            $scope.payment.options.fixedRecipientSelection = false;
        });

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            var form = $scope.paymentForm;
            if (form.$invalid) {
                formService.dirtyFields(form);
            } else {
                actions.proceed();
            }
        });

    });