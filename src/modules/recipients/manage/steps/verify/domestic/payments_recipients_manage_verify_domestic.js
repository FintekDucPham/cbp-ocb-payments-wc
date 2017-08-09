angular.module('ocb-payments')
    .controller('RecipientsManageVerifyDomesticController', function ($scope, accountsService, customerService, lodash, bdStepStateEvents, $state, $timeout) {
        $scope.showVerify = false;
        if(angular.isUndefined($scope.recipient.formData) || lodash.isEmpty($scope.recipient.formData)){
            $timeout(function(){
                $state.go('payments.recipients.manage.new.fill', {
                    recipientType: $scope.recipient.type.code,
                    operation: "new"
                });
            });
        }else{
            $scope.showVerify = true;
        }
        $scope.accountListPromise = accountsService.search().then(function(accountList){
            $scope.accountsList = accountList.content;
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
