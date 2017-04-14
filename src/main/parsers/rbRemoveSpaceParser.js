/**
 * Created by marek.koronski on 2017-03-02.
 */
angular.module('raiffeisen-payments').directive('rbRemoveSpaceParser', function(){
    return {
        require: 'ngModel',
        link: function(scope, element, attrs, modelCtrl) {

            modelCtrl.$parsers.push(function (inputValue) {

                var transformedInput = attrs.rbRemoveSpaceParser === "UPPERCASE" ? inputValue.toUpperCase().replace(/ /g, '') : inputValue.toLowerCase().replace(/ /g, '');

                if (transformedInput!=inputValue) {
                    modelCtrl.$setViewValue(transformedInput);
                    modelCtrl.$render();
                }

                return transformedInput;
            });
        }
    };
});