angular.module('raiffeisen-payments')
    .directive('rbAddToBasketSelect', function (pathService, lodash, rbAccountOwnNrbService) {
        return {
            restrict: 'E',
            templateUrl: pathService.generateTemplatePath("raiffeisen-payments") + "/components/rbAddToBasketSelect/rbAddToBasketSelect.html",
            scope: {
                rbModel: '=rbModel',
                rbModifyFromBasket: '=rbModifyFromBasket',
                rbOptions: '=rbOptions'
            },
            controller: function($scope){
                $scope.$watch('rbModifyFromBasket', function(newValue, oldValue){
                    if (newValue != oldValue) {
                        $scope.rbModel.addToBasket = newValue;
                    }
                });

                $scope.settings = {
                    hidden : false
                };

                angular.extend($scope.settings, $scope.rbOptions || []);
            }
        };
    });