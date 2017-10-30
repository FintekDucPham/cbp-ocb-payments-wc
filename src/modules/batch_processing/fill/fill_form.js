/**
 * Created by Thai Bui on 10/30/2017.
 */
angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.batch_processing.fill', {
            url: "/fill",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/batch_processing/fill/fill_form.html",
            controller: "PaymentsBatchProcessingController",
            abstract: false,
            data: {
                analyticsTitle: null
            }
        });
    })
    .controller("PaymentsBatchProcessingController", function($scope) {
        $scope.setClearFormFunction = function(fn){
            $scope.clearFormFunction = fn;
        };
    });
