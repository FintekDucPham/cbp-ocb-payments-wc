angular.module('raiffeisen-payments')
    .directive('rbUsFormSymbolSelect', function (pathService, attrBinder, lodash, taxFormSymbols) {
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

                taxFormSymbols.search().then(function(formSymbols) {
                    $scope.formSymbolList = lodash.sortBy(lodash.map(formSymbols, function(symbol) {
                        return {
                            code: symbol.formCode,
                            periodRequired: true
                        };
                    }), 'code');
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