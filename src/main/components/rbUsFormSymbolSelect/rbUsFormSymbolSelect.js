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
                items: '='
            },
            compile: function ($element, $attr) {
                attrBinder.bindParams($element.find('ui-select'), $attr);
            },
            controller: function ($scope) {
                $scope.selection = {
                    isSelected: false
                };

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

                    function isOnCurrentList(code){
                        var out = lodash.find($scope.formSymbolList, function(taxForm) {
                            return taxForm.code == code;
                        });
                        return out;
                    }

                    $scope.$watch('formSymbolId', function (symbolId) {
                        update(lodash.find($scope.formSymbolList, {
                            code: symbolId
                        }), symbolId);
                    });

                    function update(item, model) {
                        if(model && isOnCurrentList(item.code)){
                            $scope.formSymbol = item;
                            $scope.formSymbolId = model;
                            $scope.selection.model = model;
                        }else{
                            $scope.formSymbol = null;
                            $scope.formSymbolId = null;
                            $scope.selection.model = null;
                        }
                    }

                    $scope.select = function (item, model) {
                        $scope.onSelect({
                            $oldSymbol: $scope.formSymbol,
                            $symbol: item
                        });
                        update(item, model);
                    };

                    var updateList = function(taxAccountType){

                        if(taxAccountType == null){
                            $scope.formSymbolList = $scope.allFormSymbols;
                        }else{
                            $scope.formSymbolList = lodash.filter($scope.allFormSymbols, function(formSymbol) {
                                return formSymbol.accountType === taxAccountType;
                            });
                        }

                        if($scope.formSymbolList){
                            var taxFormSymbol = lodash.find($scope.formSymbolList, function(taxForm) {
                                return taxForm.code == $scope.formSymbolId;
                            });
                            update(taxFormSymbol, taxFormSymbol ? taxFormSymbol.code : undefined);
                        }
                    };

                    $scope.$watch('items.recipientAccount.taxAccountType', function(taxAccountType,o){
                        if(taxAccountType!==o){
                            updateList(taxAccountType);
                        }
                    });

                    if($scope.items.recipientAccount && $scope.items.recipientAccount.taxAccountType){
                        updateList($scope.items.recipientAccount.taxAccountType);
                    }


                });

            }
        };
    });