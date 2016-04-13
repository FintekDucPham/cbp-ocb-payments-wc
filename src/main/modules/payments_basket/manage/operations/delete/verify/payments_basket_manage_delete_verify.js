angular.module('raiffeisen-payments')
    .controller('PaymentsBasketManageDeleteVerifyController', function($scope, $stateParams, pathService, accountsService){
        accountsService.get($scope.payment.formData.accountId).then(function(data){
            $scope.payment.items.senderAccount = data;
        });

        $scope.getTemplateName = function (stepName) {
            return "{0}/modules/new/{1}/{2}/payments_new_{2}_{1}.html".format(pathService.generateTemplatePath("raiffeisen-payments"), stepName, $stateParams.paymentType);
        };
    });