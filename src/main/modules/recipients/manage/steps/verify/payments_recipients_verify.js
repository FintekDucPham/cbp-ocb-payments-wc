angular.module('raiffeisen-payments')
    .directive('rbPaymentRecipientsVerify', function (pathService) {
        return {
            restrict: 'E',
            transclude: true,
            templateUrl: pathService.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/manage/steps/verify/payments_recipients_verify.html"
        };
    });

