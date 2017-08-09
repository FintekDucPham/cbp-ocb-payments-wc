angular.module('ocb-payments')
    .controller('RecipientsManageVerifyTaxController', function ($scope, taxOffices, $state, $timeout, lodash) {
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
        if(!$scope.recipient.items.recipientAccount) {
            taxOffices.search({
                accountNo: $scope.recipient.formData.selectedTaxOfficeId.replace(/ /g, '')
            }).then(function (taxAccounts) {
                $scope.recipient.items.recipientAccount = taxAccounts[0];
            });
        }

    });