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
                    var toSelect = null;
                    angular.forEach(s.rbTrybes, function(tr){
                        if(!toSelect && tr.active){
                            toSelect = tr;
                        }
                    });
                    toSelect.selected = true;
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

                var obtainActivity = function(){
                    var avail = {};
                    angular.forEach(s.transferType, function(v){
                        if(v.currency=== s.currency.currency){
                            avail[v.transferType]=true;
                        }
                    });

                    //target
                    var targetAv = true;
                    if(s.costs!=='SHA'){
                        targetAv=false;
                    }
                    if(s.currency.currency!=='EUR'){
                        targetAv=false;
                    }
                    if(!(s.swift.data && swift.data.target)){
                        targetAv=false;
                    }

                    //finalize - merge
                    angular.forEach(s.rbTrybes, function(tr){
                        if(avail[tr.TRYBE_NAME]){
                            tr.active = true;
                        }else{
                            tr.active = false;
                        }
                    });

                    //check selection
                    if(!isSelectedAny()){
                        initialSelection();
                    }
                };


                s.$watch('costs', obtainActivity);
                s.$watch('swift.data.target', obtainActivity);
                s.$watch('currency', obtainActivity);
            }
        };
    });