angular.module('raiffeisen-payments')
    .directive('rbTaxAccountSelect', function (pathService, attrBinder, taxOffices) {
        return {
            restrict: 'E',
            templateUrl: pathService.generateTemplatePath("raiffeisen-payments") + "/components/rbTaxAccountSelect/rbTaxAccountSelect.html",
            scope: {
                taxOffice: '=rbTaxOffice',
                params: '=?rbTaxOfficeParams'
            },
            compile: function ($element, $attr) {
                attrBinder.bindParams($element.find('ui-select'), $attr);
            },
            controller: function ($scope) {

                if($scope.params instanceof String) {
                    $scope.params = $scope.$eval($scope.params);
                }

                angular.extend($scope, {
                    isFromList: false,
                    model: {
                        taxOffice: null,
                        searchQuery: null
                    }
                });

                $scope.select = function(item) {
                    $scope.taxAccountNo = item.accountNo;
                    $scope.model.taxOffice = item;
                    $scope.taxOffice = item;
                };

                $scope.$watch('taxOffice', function(newVal) {
                    if(newVal) {
                        $scope.model.taxOffice = newVal;
                        $scope.isFromList = true;
                    } else {
                        $scope.useCustom();
                    }
                });

                $scope.searchForOffice = function(selectedInput) {
                    taxOffices.search((function(selectedInput) {
                        var regexp = new RegExp('^[0-9 ]+$');
                        if(regexp.test(selectedInput)) {
                            return {
                                accountNo: selectedInput
                            };
                        } else {
                            return {
                                officeName: selectedInput
                            };
                        }
                    })(selectedInput)).then(function(result) {
                        $scope.taxAccounts = result;
                        $scope.isFromList = true;
                        $scope.model.taxOffice = $scope.taxAccounts[0];
                    });
                };

                $scope.useCustom = function() {
                    $scope.isFromList = false;
                    $scope.model.taxOffice = null;
                };

            }
        };
    });