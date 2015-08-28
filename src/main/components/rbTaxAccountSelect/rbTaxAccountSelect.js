angular.module('raiffeisen-payments')
    .directive('rbTaxAccountSelect', function (pathService, attrBinder, taxOffices, lodash) {
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

                $scope.notFoundList = [];

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

                $scope.$watch('model.searchQuery', function(query, oldQuery) {
                   if(query && query.replace(/ /g, '').length == 26 && query !== oldQuery) {
                       $scope.searchForOffice(query);
                   }
                });

                $scope.searchForOffice = function(selectedInput) {
                    taxOffices.search((function(selectedInput) {
                        var regexp = new RegExp('^[0-9 ]+$');
                        if(regexp.test(selectedInput)) {
                            return {
                                accountNo: selectedInput.replace(/ /g, '')
                            };
                        } else {
                            return {
                                officeName: selectedInput
                            };
                        }
                    })(selectedInput)).then(function(result) {
                        if(result.length < 1) {
                            $scope.notFoundList = lodash.union($scope.notFoundList, [ $scope.model.searchQuery ]);
                        } else {
                            $scope.taxAccounts = result;
                            $scope.isFromList = true;
                            var office = $scope.model.taxOffice = $scope.taxAccounts[0];
                            $scope.taxOffice = office;
                            $scope.$emit("taxAccountChanged", $scope.model.taxOffice);
                        }
                    });
                };

                $scope.useCustom = function() {
                    $scope.isFromList = false;
                    $scope.model.taxOffice = null;
                };

                $scope.accountValidators = {

                    usNotFound: function(val) {
                        return $scope.model.searchQuery && !lodash.contains($scope.notFoundList, val.replace(/ /g, ''));
                    },

                    notFromList: function(val) {
                        return !val || $scope.isFromList || val.replace(/ /g, '').length !== 26;
                    }

                };

            }
        };
    });