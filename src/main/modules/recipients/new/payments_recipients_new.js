angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.recipientsnew', {
            url: "/recipientsnew",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/new/payments_recipients_new.html",
            controller: "PaymentsRecipientsNewController"
        });
    })
    .controller('PaymentsRecipientsNewController', function ($scope, $timeout) {

        $scope.activeStep = {
            id: 'fill'
        };
    }
);