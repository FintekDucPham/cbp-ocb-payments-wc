angular.module('raiffeisen-payments')
    .directive('rbZusTaxpayerSelect', function (pathService, lodash) {
        return {
            restrict: 'E',
            templateUrl: pathService.generateTemplatePath("raiffeisen-payments") + "/components/rbZusTaxpayerSelect/rbZusTaxpayerSelect.html",
            scope: {
                taxpayerId: '=rbZusTaxpayerId',
                taxpayer: '=rbZusTaxpayer',
                taxpayerList: '=?rbZusTaxpayer'
            },
            controller: function ($scope) {
                $scope.taxpayerList = lodash.times(3, function (i) {
                    return {
                        name: "Platnik ZUS " + i
                    };
                });
            }
        };
    });