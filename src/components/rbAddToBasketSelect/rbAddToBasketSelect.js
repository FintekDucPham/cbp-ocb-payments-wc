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
                if ($scope.rbModifyFromBasket === true) {
                        $scope.rbModel.addToBasket = true;
                }

                $scope.settings = {
                    hidden : false
                };

                angular.extend($scope.settings, $scope.rbOptions || []);
            }
        };
    });