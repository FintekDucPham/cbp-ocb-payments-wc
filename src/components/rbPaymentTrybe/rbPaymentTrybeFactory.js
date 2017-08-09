angular.module('ocb-payments')
    .factory('rbPaymentTrybeFactory', function () {

        var createModel = function(trybesList){
            var out = angular.copy(trybesList);
            angular.forEach(out, function(trybe){
                angular.extend(trybe, {
                    selected: false,
                    active: true
                });
            });
            return out;
        };

        return {
            createModel: createModel
        };
    });