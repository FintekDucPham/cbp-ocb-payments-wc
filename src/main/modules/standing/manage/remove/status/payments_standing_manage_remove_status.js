angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.standing.manage.remove.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/standing/manage/remove/status/payments_standing_manage_remove_status.html",
            controller: "PaymentsStandingManageRemoveStatusController"
        });
    })
    .controller('PaymentsStandingManageRemoveStatusController', function ($scope, bdStepStateEvents, translate) {

    });
