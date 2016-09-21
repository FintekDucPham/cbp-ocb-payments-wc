angular.module('raiffeisen-payments')
    .directive('rbPaymentTrybe', function (pathService) {
        return {
            restrict: 'E',
            templateUrl: pathService.generateTemplatePath("raiffeisen-payments") + "/components/rbPaymentTrybe/rbPaymentTrybe.html",
            scope: {
                rbTrybes: '=',
                rbModel: '=',
                currency: '=',
                transferType: '=',
                swift:'=',
                costs:'=',
                rbOnPaymentTrybeChanged: '&'
            },
            controller: function($scope){
                $scope.rbTrybesMap = {};
                angular.forEach($scope.rbTrybes, function(v){
                    $scope.rbTrybesMap[v.TRYBE_NAME] = v;
                });
            },
            link: function(s,e,a){
                var isSelectedAny = function(){
                    var out = false;
                    angular.forEach(s.rbTrybes, function(trybe){
                        if(trybe.selected && trybe.active){
                            out = true;
                        }
                    });
                    return out;
                };

                var initialSelection = function(){
                    var selected = false;
                    angular.forEach(s.rbTrybes, function(tr){
                        if (!selected && tr.active) {
                            tr.selected = true;
                            selected = true;
                        }
                    });
                };

                var onChange = function(n, o, trybe){
                    if(n===true){
                        s.rbModel = trybe.TRYBE_NAME;
                        angular.forEach(s.rbTrybes, function(v){
                            if(v.TRYBE_NAME!==trybe.TRYBE_NAME){
                                v.selected = false;
                            }
                        });
                    }else{
                        if(!isSelectedAny()){
                            if(trybe.active){
                                trybe.selected = true;
                            }else{
                                initialSelection();
                            }
                        }
                    }
                    s.rbOnPaymentTrybeChanged();
                };

                angular.forEach(s.rbTrybes, function(trybe){
                    s.$watch('rbTrybesMap.'+trybe.TRYBE_NAME+'.selected', function(n, o){
                        onChange(n, o, trybe);
                    });
                });

                if(!isSelectedAny()){
                    initialSelection();
                }else{
                    angular.forEach(s.rbTrybes, function(tr){
                        if(tr.selected && tr.active){
                            s.rbModel = tr.TRYBE_NAME;
                        }
                    });
                }


                //activity checks
                //moved to smart controller

            }
        };
    });