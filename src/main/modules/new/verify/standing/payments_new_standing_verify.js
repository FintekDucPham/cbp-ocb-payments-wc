angular.module('raiffeisen-payments')
    .controller('NewStandingPaymentVerifyController', function ($scope, lodash, STANDING_FREQUENCY_TYPES) {
            $scope.payment.token.params.rbOperationType = "MANAGE_STANDING_ORDER";
            $scope.STANDING_FREQUENCY_TYPES = STANDING_FREQUENCY_TYPES;
        //
        //$scope.$watch('payment.formData.recipientSwiftOrBic', function(n,o){
        //    if(n && !angular.equals(n, o)){
        //        $scope.swift.promise = recipientGeneralService.utils.getBankInformation.getInformation(
        //            n,
        //            recipientGeneralService.utils.getBankInformation.strategies.SWIFT
        //        ).then(function(data){
        //                $scope.swift.data = data;
        //                if(data !== undefined && data !== null && data !==''){
        //                    $scope.payment.formData.recipientBankName = data.institution;
        //                    $scope.recipientForm.swift_bic.$setValidity("recipientBankIncorrectSwift", true);
        //                }else{
        //                    $scope.payment.formData.recipientBankName = null;
        //                    $scope.recipientForm.swift_bic.$setValidity("recipientBankIncorrectSwift", false);
        //                }
        //            });
        //    }
        //});
    });