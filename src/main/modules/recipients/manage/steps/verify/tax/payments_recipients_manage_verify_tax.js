angular.module('raiffeisen-payments')
    .controller('RecipientsManageVerifyTaxController', function ($scope, taxOffices) {

        taxOffices.search({
            accountNo: $scope.recipient.formData.recipientAccountNo.replace(/ /g, '')
        }).then(function (taxAccounts) {
            var taxAccount = taxAccounts[0];
            $scope.taxOfficeName = taxAccount.officeName;
            $scope.taxOfficeAddress = taxAccount.officeAddress;
        });

    });