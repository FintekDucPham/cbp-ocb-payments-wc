angular.module('raiffeisen-payments')
    .directive('rbUsFormSymbolSelect', function (pathService, attrBinder, lodash) {
        return {
            restrict: 'E',
            templateUrl: pathService.generateTemplatePath("raiffeisen-payments") + "/components/rbUsFormSymbolSelect/rbUsFormSymbolSelect.html",
            scope: {
                formSymbolId: '=rbFormSymbolId',
                formSymbol: '=rbFormSymbol',
                formSymbolList: '=?rbFormSymbolList',
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

                $scope.$watch('formSymbolId', function (symbolId) {
                    update(lodash.find($scope.formSymbolList, {
                        code: symbolId
                    }), symbolId);
                });

                $scope.formSymbolList = lodash.times(3, function (i) {
                    return {
                        code: "type" + (i + 1),
                        periodRequired: i % 2 === 0
                    };
                });

                function update(item, model) {
                    $scope.formSymbol = item;
                    $scope.formSymbolId = model;
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