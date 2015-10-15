angular.module('raiffeisen-payments')
    .directive('rbTaxpayerSelect', function (pathService, taxpayersService, rbTaxpayerTypes, lodash, systemParameterService) {
        return {
            restrict: 'E',
            templateUrl: pathService.generateTemplatePath("raiffeisen-payments") + "/components/rbTaxpayerSelect/rbTaxpayerSelect.html",
            scope: {
                taxpayerId: '=rbTaxpayerId',
                taxpayer: '=rbTaxpayer',
                taxpayerList: '=?rbTaxpayerList',
                placeholderText: '@rbPlaceholderText',
                clearText: '@rbTaxpayerClearText',
                onSelectTaxpayer: '&rbOnSelectTaxpayer',
                onClearTaxpayer: '&rbOnClearTaxpayer',
                taxpayerType: '@rbTaxpayerType'
            },
            controller: function ($scope) {

                if(lodash.isUndefined($scope.taxpayerType)) {
                    $scope.taxpayerType = rbTaxpayerTypes.INSURANCE.code;
                }

                $scope.selection = {
                    isSelected: false
                };

                $scope.selectTaxpayer = function($item) {
                    if($item && $item !== nullOption) {
                        $scope.selection.isSelected = true;
                        var oldTaxpayer = $scope.taxpayer;
                        $scope.taxpayer = $item;
                        $scope.onSelectTaxpayer({
                            $taxpayer: $item,
                            $oldTaxpayer: oldTaxpayer
                        });
                    } else {
                        clearSelection();
                        $scope.onClearTaxpayer();
                    }
                };

                $scope.$watch('taxpayer', function(taxpayer) {
                    $scope.selection.taxpayer = taxpayer;
                    $scope.selection.isSelected = !!taxpayer;
                });

                $scope.$watch('taxpayerId', function(taxpayerId) {
                    if(taxpayerId) {
                        waitForTaxpayers.then(function() {
                            var taxpayerToSelect = lodash.find($scope.taxpayerList, {
                                taxpayerId: taxpayerId
                            });
                            if(taxpayerToSelect) {
                                $scope.selectTaxpayer(taxpayerToSelect);
                            } else {
                                clearSelection();
                            }
                        });
                    } else {
                        clearSelection();
                    }
                });

                var waitForTaxpayers = taxpayersService.search({
                    filerTemplateType: $scope.taxpayerType
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

                var clearSelection = $scope.clearSelection = function () {
                    $scope.selection.taxpayer = null;
                    $scope.taxpayer = null;
                    $scope.onClearTaxpayer();
                    $scope.selection.isSelected = false;
                };

                var nullOption = $scope.nullOption = {
                    customerName: 'Płatnik spoza listy'
                };

                systemParameterService.getParameterByName("payer.name.combo.length").then(function(data) {
                    $scope.payerNameLength = parseInt(data.value);
                });

            }
        };
    });