angular.module('raiffeisen-payments')
    .directive('rbInsuranceAccountSelect', function (pathService, attrBinder, lodash, insuranceAccounts) {
        return {
            restrict: 'E',
            templateUrl: pathService.generateTemplatePath("raiffeisen-payments") + "/components/rbInsuranceAccountSelect/rbInsuranceAccountSelect.html",
            scope: {
                selectedInsurance: '=rbSelectedInsurance',
                insurancesList: '=?rbInsurancesList',
                onSelect: '&rbOnSelect',
                placeholder: "@rbPlaceholder"
            },
            compile: function ($element, $attr) {
                attrBinder.bindParams($element.find('ui-select'), $attr);
            },
            controller: function ($scope) {
                $scope.selection = {
                    isSelected: false
                };

                $scope.$watch('selectedInsurance', function(insurance) {
                    $scope.selection.model = insurance;
                    $scope.selection.isSelected = !!insurance;
                });

                insuranceAccounts.search().then(function(insuranceAccounts) {
                    $scope.insuranceAccountList = insuranceAccounts.content;
                });

                function update(item, model) {
                    $scope.selectedInsurance = item;
                    $scope.selection.model = model;
                }

                $scope.select = function (item, model) {
                    $scope.onSelect({
                        $oldSymbol: $scope.formSymbol,
                        $symbol: item
                    });
                    update(item, model);
                };

            }
        };
    });