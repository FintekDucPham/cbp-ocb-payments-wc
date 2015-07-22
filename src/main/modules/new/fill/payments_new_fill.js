angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.new.fill', {
            url: "/fill",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/new/fill/payments_new_fill.html",
            controller: "NewPaymentFillController"
        });
    })
    .controller('NewPaymentFillController', function ($scope, translate, $stateParams, $state, initialState, viewStateService, domService, formService, cardRestrictEvents) {

        angular.extend($scope.payment.formData, {
            realizationDate: Date.now()
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
        
        $scope.selectRecipient = function(recipient) {
            $scope.payment.meta.recipient = recipient;
            $scope.payment.options.fixedRecipientSelection = true;
            $scope.payment.formData.recipientAccountNo = recipient.accountNo;
            $scope.payment.formData.recipientData = recipient.data;
            $scope.payment.formData.title = recipient.title;
        };

        $scope.clearRecipient = function() {
            $scope.payment.options.fixedRecipientSelection = false;
            $scope.payment.formData.recipientAccountNo = null;
            $scope.payment.formData.recipientData = null;
            $scope.payment.formData.title = null;
        };

    });