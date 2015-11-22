angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.future.manage.delete', {
            url: "/delete",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/future/manage/operations/delete/payments_future_manage_delete.html",
            controller: "PaymentsFutureManageDeleteController"
            //resolve: {
            //    paymentDetails: ["initialState", function(initialState) {
            //        paymentsService.get('NIBabdf874f-9bce-49d6-9245-3fee49@waiting', {}).then(function(resp) {
            //            payment.details = resp;
            //        });
            //    }]
            //}
        })
    })
    .controller('PaymentsFutureManageDeleteController', function ($scope, lodash, recipientManager, recipientGeneralService, authorizationService, $stateParams, manageData, paymentsService) {


    });