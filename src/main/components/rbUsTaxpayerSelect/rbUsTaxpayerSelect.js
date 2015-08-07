angular.module('raiffeisen-payments')
    .directive('rbUsTaxpayerSelect', function (pathService, lodash) {
        return {
            restrict: 'E',
            templateUrl: pathService.generateTemplatePath("raiffeisen-payments") + "/components/rbUsTaxpayerSelect/rbUsTaxpayerSelect.html",
            scope: {
                taxpayerId: '=rbUsTaxpayerId',
                taxpayer: '=rbUsTaxpayer',
                taxpayerList: '=?rbUsTaxpayerList',
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
                    $scope.selection.isSelected = true;
                    var oldTaxpayer = $scope.taxpayer;
                    $scope.taxpayer = $item;
                    $scope.onSelectTaxpayer({
                        $taxpayer: $item,
                        $oldTaxpayer: oldTaxpayer
                    });
                };

                $scope.$watch('taxpayer', function(recipient) {
                    $scope.selection.taxpayer = recipient;
                    $scope.selection.isSelected = !!recipient;
                });

                $scope.taxpayerList = lodash.times(3, function (i) {
                    return {
                        name: "Platnik Us " + i,
                        nip: Math.floor(Math.random() * 1E10),
                        data: 'Platnik Us ul. Smolarzy 91A'
                    };
                });

                $scope.clearSelection = function () {
                    $scope.selection.taxpayer = null;
                    $scope.recipient = null;
                    $scope.onClearTaxpayer();
                    $scope.selection.isSelected = false;
                };

            }
        };
    });