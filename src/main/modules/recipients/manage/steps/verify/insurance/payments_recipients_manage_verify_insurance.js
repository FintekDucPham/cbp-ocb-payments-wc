angular.module('raiffeisen-payments')
    .controller('RecipientsManageVerifyZusController', function ($scope, lodash, insuranceAccounts, translate, customerService) {


        customerService.getCustomerDetails().then(function(userDetails) {
            $scope.customerDetails = userDetails.customerDetails;
            if($scope.customerDetails.context == 'MICRO') {
                $scope.recipient.formData.microName = $scope.customerDetails.fullName;
            }
        });

        if(!$scope.recipient.items.selectedInsurance) {
            insuranceAccounts.search().then(function(insuranceAccounts) {
                $scope.recipient.items.selectedInsurance = lodash.find(insuranceAccounts.content, {
                    accountNo : $scope.recipient.formData.selectedInsuranceId
                });
                $scope.recipient.items.selectedInsurance.translatedValue = translate.property("raiff.payments.insurances.type."+
                    $scope.recipient.items.selectedInsurance.insuranceCode);
            });
        }else{
            $scope.recipient.items.selectedInsurance.translatedValue = translate.property("raiff.payments.insurances.type."+
                $scope.recipient.items.selectedInsurance.insuranceCode);
        }

    });
