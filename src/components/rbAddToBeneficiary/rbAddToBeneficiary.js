angular.module('ocb-payments')
    .directive('rbAddToBeneficiary.html', function (pathService, lodash, rbAccountOwnNrbService) {
        return {
            restrict: 'E',
            templateUrl: pathService.generateTemplatePath("ocb-payments") + "/components/rbAddToBeneficiary/rbAddToBeneficiary.html",
            scope: {
                rbModel: '=rbModel',
                rbModifyFromBeneficiary: '=rbModifyFromBeneficiary',
                rbOptions: '=rbOptions'
            },
            controller: function($scope){
                if ($scope.rbModifyFromBeneficiary === true) {
                        $scope.rbModel.AddToBeneficiary = true;
                }

                $scope.settings = {
                    hidden : false
                };

                angular.extend($scope.settings, $scope.rbOptions || []);
            }
        };
    });