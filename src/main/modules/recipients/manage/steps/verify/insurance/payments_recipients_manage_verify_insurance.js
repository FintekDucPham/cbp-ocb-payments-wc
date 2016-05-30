angular.module('raiffeisen-payments')
    .controller('RecipientsManageVerifyZusController', function ($scope, lodash, zusPaymentInsurances) {

        $scope.insurances = lodash.sortBy(lodash.forEach($scope.recipient.formData.insurancePremiums, function(insurance, insurance_type) {
            insurance.type = insurance_type;
            if(typeof insurance.amount == 'number'){
                insurance.amount = insurance.amount.toString();
            }
        }), function(insurance) {
            return zusPaymentInsurances.indexOf(insurance.type);
        });

    });
