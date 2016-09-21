angular.module('raiffeisen-payments').directive('rbNrbInputFormatter', function () {
    return {
        require: 'ngModel',
        link: function (s,e,a, model) {
            model.$parsers.push(function(v){
                var n = v;
                if(v){
                    n = v.toUpperCase().replace(/\s+/g,'');
                    if(n!==v){
                        model.$setViewValue(n);
                        model.$render();
                    }
                }
                return n;
            });
        }
    };
});