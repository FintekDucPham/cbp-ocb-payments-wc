angular.module('ocb-payments')
    .directive('rbInfoAccountInvestment', function (pathService, rbAccountOwnNrbService) {
        return {
            restrict: 'E',
            templateUrl: pathService.generateTemplatePath("ocb-payments") + "/components/rbInfoAccountInvestment/rbInfoAccountInvestment.html",
            scope: {
                sourceChoose: '=rbSourceChoose',
                destinationNrb: '=rbDestinationNrb'
            },
            /*controller: function($scope){
             $scope.showHide = {
             info:false
             };
             },*/
            link: function(s,e,a){
                s.showHideInfo = false;

                var showHideInfo = function(){
                    if(s.sourceChoose === 3200){
                        if(s.nrbPrefixMatch){
                            s.showHideInfo = true;
                        }else{
                            s.showHideInfo = false;
                        }
                    }else{
                        s.showHideInfo = false;
                    }
                };
                s.$watch('sourceChoose', function(n,o){
                    showHideInfo();
                });

                s.$watch('destinationNrb', function(n,o){
                    if(n!==o && angular.isString(n)){
                        s.nrbPrefixMatch = rbAccountOwnNrbService.startsWithPrefix(n);
                        showHideInfo();
                    }

                });
            }
        };
    });