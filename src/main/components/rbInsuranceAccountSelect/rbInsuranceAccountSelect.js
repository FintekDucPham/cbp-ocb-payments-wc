angular.module('raiffeisen-payments')
    .directive('rbInsuranceAccountSelect', function (pathService, attrBinder, lodash, insuranceAccounts) {
        return {
            restrict: 'E',
            templateUrl: pathService.generateTemplatePath("raiffeisen-payments") + "/components/rbInsuranceAccountSelect/rbInsuranceAccountSelect.html",
            scope: {
                selectedInsuranceId: '=?rbSelectedInsuranceId',
                selectedInsurance: '=?rbSelectedInsurance',
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

                function clearSelection() {
                    $scope.selectedInsurance = null;
                }

                var insuranceAccountsPromise = insuranceAccounts.search().then(function(insuranceAccounts) {
                    $scope.insuranceAccountList = insuranceAccounts.content;
                });

                $scope.$watch('selectedInsuranceId', function(selectedInsuranceId) {
                    if(selectedInsuranceId) {
                        insuranceAccountsPromise.then(function() {
                            select(lodash.find($scope.insuranceAccountList, {
                                accountNo: selectedInsuranceId
                            }));
                        });
                    } else {
                        clearSelection();
                    }
                });

                function update(item) {
                    $scope.selectedInsurance = item;
                    $scope.selection.model = item;
                    $scope.selectedInsuranceId = !!item ? item.accountNo : null;
                    $scope.selection.isSelected = !!item;
                }

                var select = $scope.select = function (item) {
                    $scope.onSelect({
                        $oldSymbol: $scope.formSymbol,
                        $symbol: item
                    });
                    if(item) {
                        update(item);
                    } else {
                        clearSelection();
                    }
                };

            }
        };
    });