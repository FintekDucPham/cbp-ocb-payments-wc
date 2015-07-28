angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.new.fill', {
            url: "/fill",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/new/fill/payments_new_fill.html",
            controller: "NewPaymentFillController"
        });
    })
    .controller('NewPaymentFillController', function ($scope, lodash, translate, $stateParams, $state, initialState, viewStateService, domService, formService, paymentEvents, NRB_REGEX, PAYMENT_TITLE_REGEX, RECIPIENT_DATA_REGEX) {

        $scope.NRB_REGEX = new RegExp(NRB_REGEX);
        $scope.RECIPIENT_DATA_REGEX = new RegExp(RECIPIENT_DATA_REGEX);
        $scope.PAYMENT_DESCRIPTION_REGEX = new RegExp(PAYMENT_TITLE_REGEX);

        angular.extend($scope.payment.formData, {
            realizationDate: Date.now()
        });

        $scope.$on('clearForm', function() {
            $scope.payment.options.fixedRecipientSelection = false;
        });

        $scope.$on(paymentEvents.FORWARD_MOVE, function () {
            var form = $scope.paymentForm;
            if (form.$invalid) {
                formService.dirtyFields(form);
            } else {
                $scope.bdStepRemote.next();
            }
        });

    });