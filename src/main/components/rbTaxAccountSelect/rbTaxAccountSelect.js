angular.module('raiffeisen-payments')
    .directive('rbTaxAccountSelect', function (pathService, attrBinder, taxOffices, lodash) {
        return {
            restrict: 'E',
            templateUrl: pathService.generateTemplatePath("raiffeisen-payments") + "/components/rbTaxAccountSelect/rbTaxAccountSelect.html",
            scope: {
                taxOffice: '=?rbTaxOffice',
                taxOfficeId: '=?rbTaxOfficeId',
                onAccountSelect: '&rbOnTaxAccountSelect',
                params: '=?rbTaxOfficeParams',
                rbForbiddenAccounts: '=?rbForbiddenAccounts'
            },
            compile: function ($element, $attr) {
                attrBinder.bindParams($element.find('ui-select'), $attr);
            },
            controller: function ($scope) {

                if ($scope.params instanceof String) {
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

                $scope.select = function (item) {
                    $scope.taxAccountNo = item.accountNo;
                    $scope.model.taxOffice = item;
                    $scope.taxOffice = item;
                    $scope.onAccountSelect({
                        $office: item
                    });
                };

                $scope.$watch('taxOfficeId', function (taxAccountNo) {
                    if (taxAccountNo) {
                        if(!$scope.model.taxOffice || $scope.model.taxOffice && $scope.model.taxOffice.accountNo !== taxAccountNo) {
                            $scope.searchForOffice(taxAccountNo);
                        }
                    } else {
                        $scope.taxOffice = null;
                    }
                });

                $scope.$watch('taxOffice', function (newVal) {
                    if (newVal) {
                        $scope.model.taxOffice = newVal;
                        $scope.isFromList = true;
                        $scope.taxOfficeId = newVal.accountNo;
                    } else {
                        $scope.useCustom();
                    }
                });

                $scope.$watch('model.searchQuery', function (query, oldQuery) {
                    if (query && query.replace(/ /g, '').length == 26 && query !== oldQuery) {
                        $scope.searchForOffice(query);
                    }else {
                        $scope.onAccountSelect({
                            $office: null
                        });
                    }
                });

                $scope.onSearched = function(selectedInput) {
                    $scope.searchForOffice(selectedInput).then(function() {
                        if($scope.taxAccounts.length > 1) {
                            $scope.$broadcast('taxAccountSearched', selectedInput);
                        }
                    });
                };

                $scope.searchForOffice = function(selectedInput) {
                    return taxOffices.search((function (selectedInput) {
                        var regexp = new RegExp('^[0-9 ]+$');
                        if (regexp.test(selectedInput)) {
                            return {
                                accountNo: selectedInput.replace(/ /g, '')
                            };
                        } else {
                            return {
                                officeName: selectedInput
                            };
                        }
                    })(selectedInput)).then(function (result) {
                        if (result.length < 1) {
                            $scope.notFoundList = lodash.union($scope.notFoundList, [$scope.model.searchQuery]);
                            $scope.onAccountSelect({
                                $office: null
                            });
                        } else {
                            $scope.taxAccounts = result;
                            $scope.isFromList = true;
                            $scope.taxOffice = $scope.model.taxOffice = $scope.taxAccounts[0];
                            $scope.onAccountSelect({
                                $office: $scope.taxOffice
                            });
                        }
                    });
                };

                $scope.useCustom = function () {
                    $scope.isFromList = false;
                    $scope.model.taxOffice = null;
                    $scope.model.searchQuery = null;
                };

                $scope.accountValidators = {

                    usNotFound: function (val) {
                        return $scope.model.searchQuery && !lodash.contains($scope.notFoundList, val.replace(/ /g, ''));
                    },
                    notZus: function (val) {
                        if (val) {
                            return !lodash.some($scope.rbForbiddenAccounts, {
                                code: 'notZus',
                                value: val.replace(/ /g, '')
                            });
                        } else {
                            return false;
                        }
                    },
                    notFromList: function (val) {
                        return !val || $scope.isFromList || val.replace(/ /g, '').length !== 26;
                    }
                };

            }
        };
    }).directive('uiSelectPopupTrigger', function () {

        return {
            restrict: 'A',
            require: 'uiSelect',
            link: function ($scope, $element, $attrs, $ctrl) {
                $scope.$on($attrs.uiSelectPopupTrigger, function () {
                    $ctrl.activate();
                });
            }
        };

    });