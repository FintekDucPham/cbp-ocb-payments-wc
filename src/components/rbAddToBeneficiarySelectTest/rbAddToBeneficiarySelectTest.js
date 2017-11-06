angular.module('ocb-payments')
    .directive('rbAddToBeneficiarySelectTest', function (pathService) {
        return {
            restrict: 'E',
            templateUrl: pathService.generateTemplatePath("ocb-payments") + "/components/rbAddToBeneficiarySelectTest/rbAddToBeneficiarySelectTest.html",
            scope: {
                rbModel: '=rbModel',
                rbModifyFromBeneficiary: '=rbModifyFromBeneficiary',
                rbOptions: '=rbOptions'
            },
            controller: function($scope){
                if ($scope.rbModifyFromBeneficiary === true) {
                    $scope.rbModel.addToBeneficiary = true;
                }

                $scope.settings = {
                    hidden : false
                };

                angular.extend($scope.settings, $scope.rbOptions || []);
            }
        };
    });