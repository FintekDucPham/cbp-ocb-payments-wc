angular.module('raiffeisen-payments')
    .directive('rbSorbnetSelection', function (pathService, lodash, rbAccountOwnNrbService, paymentsService, dateFilter, utilityService) {
        return {
            restrict: 'E',
            templateUrl: pathService.generateTemplatePath("raiffeisen-payments") + "/components/rbSorbnetSelection/rbSorbnetSelection.html",
            scope: {
                rbModel: '=rbModel',
                destinationNrb: '=rbDestinationNrb'
            },
            controller: function($scope){

                $scope.model = {
                    sendByElixir: !$scope.rbModel,
                    sendBySorbnet: $scope.rbModel
                };

            },
            link: function(s,e,a){

                s.model.sendByElixir = !s.rbModel;
                s.model.sendBySorbnet = s.rbModel;

                var startsWithPrefix = function(string, prefixArray){
                    var match = false;
                    if(string.length>5){
                        var orginPrefix = string.replace(" ","").substr(2,4);
                        if(prefixArray && prefixArray.length) {
                            angular.forEach(prefixArray, function (val) {
                                if(angular.equals(orginPrefix,val)){
                                    match=true;
                                }
                            });
                        }
                    }
                    return match;
                };

                var postSelectionCheck = function(){
                    if(!s.model.sendByElixir && !s.model.sendBySorbnet){
                        s.model.sendByElixir = true;
                    }

                    s.rbModel = s.model.sendBySorbnet && !s.nrbPrefixMatch;
                };

                s.$watch('model.sendByElixir', function(n,o){
                    if(n!==o){
                        if(n===true){
                            s.model.sendBySorbnet = false;
                        }
                        postSelectionCheck();
                    }
                });

                s.$watch('model.sendBySorbnet', function(n,o){
                    if(n!==o){
                        if(n===true){
                            s.model.sendByElixir = false;
                        }
                        postSelectionCheck();
                    }

                });

                var refreshSorbnetHours = function() {
                    return utilityService.getCurrentDateWithTimezone().then(function(currentDate){
                        var today = currentDate.time;
                        return paymentsService.getCutOffTimeInfo('00000000', 'DOMESTIC', 'SORBNET', utilityService.convertDateToCurrentTimezone(today , currentDate.zone)).then(function (data) {
                            s.sorbnetHours = {
                                start: dateFilter(data.otbTime, 'HH:00'),
                                end: dateFilter(data.cotTime, 'HH:00')
                            };
                            return s.sorbnetHours;
                        });
                    });
                };

                s.nrbPrefixMatch= false;
                s.$watch('destinationNrb', function(n,o){
                    if(n!==o && angular.isString(n)){
                        s.nrbPrefixMatch = rbAccountOwnNrbService.startsWithPrefix(n);
                        postSelectionCheck();
                    }

                });

                if (s.destinationNrb) {
                    s.nrbPrefixMatch = rbAccountOwnNrbService.startsWithPrefix(s.destinationNrb);
                    postSelectionCheck();
                }

                refreshSorbnetHours();

            }
        };
    });