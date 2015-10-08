
angular.module('raiffeisen-payments')
    .controller('RecipientsManageVerifyDomesticController', function ($scope, accountsService, customerService, lodash) {

        $scope.accountListPromise = accountsService.search().then(function(accountList){
            $scope.accountsList = accountList.content;
        });

        customerService.getCustomerDetails().then(function(customerDetails){
            $scope.customerDetails = customerDetails.customerDetails;
        });

        $scope.getAccountByNrb = function(accountNumber){
            return lodash.find($scope.accountsList, {
                accountNo: accountNumber
            });
        };
        $scope.formatTextBox = function(array) {
            array = array || [];
            if (array.length < 4) {
                for (var i = 0; i < array.length; i++) {
                    if (array[i].length > 35) {
                        array.splice(i + 1, 0, array[i].substring(35));
                        array[i] = array[i].substr(0, 35);
                    }
                }
            }
            return array.join("\n");
        };

    });
