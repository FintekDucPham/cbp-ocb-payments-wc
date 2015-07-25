angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.new.fill', {
            url: "/fill",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/new/fill/payments_new_fill.html",
            controller: "NewPaymentFillController"
        });
    })
    .controller('NewPaymentFillController', function ($scope, lodash, translate, $stateParams, $state, initialState, viewStateService, domService, formService, cardRestrictEvents, NRB_REGEX, RECIPIENT_DATA_REGEX) {

        $scope.NRB_REGEX = new RegExp(NRB_REGEX);
        $scope.RECIPIENT_DATA_REGEX = new RegExp(RECIPIENT_DATA_REGEX);

        angular.extend($scope.payment.formData, {
            executionDate: Date.now()
        });

        $scope.$on('clearForm', function() {
            $scope.payment.options.fixedRecipientSelection = false;
        });

        $scope.$on(cardRestrictEvents.FORWARD_MOVE, function () {
            var form = $scope.paymentForm;
            if (form.$invalid) {
                formService.dirtyFields(form);
            } else {
                $scope.bdStepRemote.next();
            }
        });

    });