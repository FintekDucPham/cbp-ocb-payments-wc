angular.module('raiffeisen-payments')
    .controller('RecipientsManageVerifyTaxController', function ($scope, taxOffices) {

        if(!$scope.recipient.items.recipientAccount) {
            taxOffices.search({
                accountNo: $scope.recipient.formData.selectedTaxOfficeId.replace(/ /g, '')
            }).then(function (taxAccounts) {
                $scope.recipient.items.recipientAccount = taxAccounts[0];
            });
        }

    });