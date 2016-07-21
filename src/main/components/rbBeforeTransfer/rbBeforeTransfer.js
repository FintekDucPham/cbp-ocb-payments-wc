angular.module('raiffeisen-payments')
    .directive('rbBeforeTransfer', function (pathService) {
        return {
            restrict: 'E',
            scope: {
                rbBeforeTransferPrototype: "=",
                rbBeforeTransferModel: "="
            },
            controller: function($scope){

                $scope.prototypeInstance = angular.copy($scope.rbBeforeTransferPrototype);

                this.getModel = function(){
                    return $scope.prototypeInstance;
                };
                this.getPrototype = function(){
                    return $scope.rbBeforeTransferPrototype;
                };

                this.setOnForwardCheckBundle = function(bundle){
                    $scope.prototypeInstance.checkBundle = bundle;
                };

                //register

                //resolve list by type
                var listToRegisterIn = null;
                if($scope.rbBeforeTransferPrototype.type==='SUGGESTION'){
                    listToRegisterIn = $scope.rbBeforeTransferModel.beforeTransfer.suggestions.list;
                }

                //register if list found
                if(listToRegisterIn){
                    listToRegisterIn.push($scope.prototypeInstance);
                    //do we need a queue trigger factory function here? hmmm...
                }
            }
        };
    });