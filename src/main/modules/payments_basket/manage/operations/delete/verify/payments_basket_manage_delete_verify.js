angular.module('raiffeisen-payments')
    .controller('PaymentsBasketManageDeleteVerifyController', function($scope, $stateParams, pathService){
        $scope.$data = {};
        $scope.$data = $scope.payment.basketItem;
        $scope.$data.operationType = $scope.payment.operationType;
        $scope.templateDetails = pathService.generateTemplatePath("raiffeisen-payments") + "/modules/payments_basket/basket/fill/details/basket_details.html";

    });