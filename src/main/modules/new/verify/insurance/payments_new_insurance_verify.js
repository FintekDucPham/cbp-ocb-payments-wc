angular.module('raiffeisen-payments')
    .controller('NewZusPaymentVerifyController', function ($scope, lodash, zusPaymentInsurances) {

        $scope.insurances = lodash.sortBy(lodash.forEach($scope.payment.formData.insurancePremiums, function(insurance, insurance_type) {
            insurance.type = insurance_type;
        }), function(insurance) {
            return zusPaymentInsurances.indexOf(insurance.type);
        });

    }).filter('arrayToString', function(lodash){
        return function(items) {
            return lodash.isArray(items) ? items.join("<br />") : items ;
        };
    });
