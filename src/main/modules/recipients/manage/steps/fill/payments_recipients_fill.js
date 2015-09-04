angular.module('raiffeisen-payments')
    .directive('rbPaymentRecipientsFill', function (pathService) {
        return {
            restrict: 'E',
            transclude: true,
            templateUrl: pathService.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/manage/steps/fill/payments_recipients_fill.html"
        };
    });

