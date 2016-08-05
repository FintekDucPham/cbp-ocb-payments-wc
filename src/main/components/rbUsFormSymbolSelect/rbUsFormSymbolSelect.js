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
                placeholder: "@rbPlaceholder",
                isDisabled: '=rbIsDisabled'
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
                    $scope.allFormSymbols = lodash.sortBy(lodash.map(formSymbols, function(symbol) {
                        return {
                            code: symbol.formCode,
                            periodRequired: symbol.periodRequired,
                            accountType: symbol.taxAccountType
                        };
                    }), 'code');
                    $scope.formSymbolList = $scope.allFormSymbols;
                    update(lodash.find($scope.formSymbolList, {
                        code: $scope.formSymbolId
                    }), $scope.formSymbolId);
                });

                function update(item, model) {
                    console.log('CL:formSymbolSelect1('+item.code+','+model+')');
                    $scope.formSymbol = item;
                    $scope.formSymbolId = model;
                    $scope.selection.model = model;
                }

                $scope.select = function (item, model) {
                    console.log('CL:formSymbolSelect:exe');
                    $scope.onSelect({
                        $oldSymbol: $scope.formSymbol,
                        $symbol: item
                    });
                    update(item, model);
                };

                $scope.$on("filterFormSymbols", function(e, taxAccountType) {
                    console.log('CL:$onFilterFormSymbols:'+taxAccountType);
                    if(taxAccountType == null){
                        $scope.formSymbolList = $scope.allFormSymbols;
                        return;
                    }
                    $scope.formSymbolList = lodash.filter($scope.allFormSymbols, function(formSymbol) {
                       return formSymbol.accountType === taxAccountType;
                    });
                    if (!$scope.formSymbolId) {
                        return;
                    }
                    if(!$scope.formSymbolList){
                        return;
                    }
                    var taxFormSymbol = lodash.find($scope.formSymbolList, function(taxForm) {
                       return taxForm.code == $scope.formSymbolId;
                    });
                    update(taxFormSymbol, taxFormSymbol ? taxFormSymbol.code : undefined);
                });

            }
        };
    });