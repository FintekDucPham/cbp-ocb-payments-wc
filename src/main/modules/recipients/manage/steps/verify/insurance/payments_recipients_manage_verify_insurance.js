angular.module('raiffeisen-payments')
    .controller('RecipientsManageVerifyZusController', function ($scope, lodash, zusPaymentInsurances, $state, $timeout) {
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
        $scope.insurances = lodash.sortBy(lodash.forEach($scope.recipient.formData.insurancePremiums, function(insurance, insurance_type) {
            insurance.type = insurance_type;
            if(typeof insurance.amount == 'number'){
                insurance.amount = insurance.amount.toString();
            }
        }), function(insurance) {
            return zusPaymentInsurances.indexOf(insurance.type);
        });

    });
