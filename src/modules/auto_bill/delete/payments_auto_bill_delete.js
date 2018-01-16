angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.auto_bill_delete', {
            url: "/delete",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/auto_bill/delete/payments_auto_bill_delete.html",
            controller: "AutoBillDeleteController",
            params: {
                deposit: null
            },
            data: {
                analyticsTitle: 'ocb.payments.delete.label.header'
            }
        });
    }).controller('AutoBillDeleteController', function ($scope, $stateParams, bdMainStepInitializer) {

    bdMainStepInitializer($scope, 'payment', {
        formName: 'autoBillForm',
        formData: {},
        options: {},
        meta: {},
        validation: {}
    });

});
