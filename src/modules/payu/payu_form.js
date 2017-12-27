
angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.payu', {
            url: "/payu",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/payu/payu_form.html",
            controller: "PayUController",
            params: {
                university: null,
            },
            abstract: true,
            data: {
                analyticsTitle: null
            }
        });
    })
    .controller('PayUController', function ($scope,bdMainStepInitializer, bdTableConfig, transferBatchService) {

    });

