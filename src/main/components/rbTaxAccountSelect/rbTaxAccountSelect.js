angular.module('raiffeisen-payments')
    .directive('rbTaxAccountSelect', function (pathService, attrBinder, taxOffices, lodash) {
        return {
            restrict: 'E',
            templateUrl: pathService.generateTemplatePath("raiffeisen-payments") + "/components/rbTaxAccountSelect/rbTaxAccountSelect.html",
            scope: {
                taxOffice: '=?rbTaxOffice',
                taxOfficeId: '=?rbTaxOfficeId',
                onAccountSelect: '&rbOnTaxAccountSelect',
                params: '=?rbTaxOfficeParams'
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

                $scope.$watch('taxOfficeId', function (taxOfficeId) {
                    if (taxOfficeId) {
                        if(!$scope.model.taxOffice || $scope.model.taxOffice && $scope.model.taxOffice.taxOfficeId !== taxOfficeId) {
                            searchForOffice(taxOfficeId);
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
                    }
                });

                $scope.onSearched = function(selectedInput) {
                    searchForOffice(selectedInput).then(function() {
                        if($scope.taxAccounts.length > 1) {
                            $scope.$broadcast('taxAccountSearched', selectedInput);
                        }
                    });
                };

                function searchForOffice(selectedInput) {
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
                        } else {
                            $scope.taxAccounts = result;
                            $scope.isFromList = true;
                            $scope.taxOffice = $scope.model.taxOffice = $scope.taxAccounts[0];
                        }
                    });
                }

                $scope.useCustom = function () {
                    $scope.isFromList = false;
                    $scope.model.taxOffice = null;
                    $scope.model.searchQuery = null;
                };

                $scope.accountValidators = {

                    usNotFound: function (val) {
                        return $scope.model.searchQuery && !lodash.contains($scope.notFoundList, val.replace(/ /g, ''));
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