angular.module('ocb-payments')
    .directive('rbAddToBeneficiarySelect', function (pathService) {
        return {
            restrict: 'E',
            templateUrl: pathService.generateTemplatePath("ocb-payments") + "/components/rbAddToBeneficiarySelect/rbAddToBeneficiarySelect.html",
            scope: {
                rbModel: '=rbModel',
                rbModifyFromBeneficiary: '=rbModifyFromBeneficiary',
                rbOptions: '=rbOptions',
                onCheck: '&onCheck'
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