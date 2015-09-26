angular.module('raiffeisen-payments')
    .directive('rbInsuranceTaxpayerSelect', function (pathService, taxpayersService, lodash) {
        return {
            restrict: 'E',
            templateUrl: pathService.generateTemplatePath("raiffeisen-payments") + "/components/rbInsuranceTaxpayerSelect/rbInsuranceTaxpayerSelect.html",
            scope: {
                taxpayerId: '=rbZusTaxpayerId',
                taxpayer: '=rbZusTaxpayer',
                taxpayerList: '=?rbZusTaxpayerList',
                placeholderText: '@rbPlaceholderText',
                clearText: '@rbTaxpayerClearText',
                onSelectTaxpayer: '&rbOnSelectTaxpayer',
                onClearTaxpayer: '&rbOnClearTaxpayer'
            },
            controller: function ($scope) {

                $scope.selection = {
                    isSelected: false
                };

                $scope.selectTaxpayer = function($item) {
                    if($item) {
                        $scope.selection.isSelected = true;
                        var oldTaxpayer = $scope.taxpayer;
                        $scope.taxpayer = $item;
                        $scope.onSelectTaxpayer({
                            $taxpayer: $item,
                            $oldTaxpayer: oldTaxpayer
                        });
                    } else {
                        $scope.taxpayer = null;
                        $scope.onClearTaxpayer();
                    }
                };

                $scope.$watch('taxpayer', function(taxpayer) {
                    $scope.selection.taxpayer = taxpayer;
                    $scope.selection.isSelected = !!taxpayer;
                });

                taxpayersService.search({
                    filerTemplateType: 'INSURANCE'
                }).then(function(data) {
                    $scope.taxpayerList = lodash.union([ nullOption ], lodash.map(data.content, function(data) {
                        return {
                            customerName: data.name,
                            taxpayerId: data.id,
                            secondaryIdType: data.secondaryIdType,
                            secondaryId: data.secondaryId,
                            nip: data.nip,
                            data: data.data
                        };
                    }));
                });

                $scope.clearSelection = function () {
                    $scope.selection.taxpayer = null;
                    $scope.taxpayer = null;
                    $scope.onClearTaxpayer();
                    $scope.selection.isSelected = false;
                };

                var nullOption = $scope.nullOption = {
                    customerName: 'Odbiorca spoza listy'
                };

            }
        };
    });