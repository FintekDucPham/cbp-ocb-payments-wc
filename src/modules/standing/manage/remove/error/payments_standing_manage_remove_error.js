angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.standing.error', {
            url: "/error",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/standing/manage/remove/error/payments_standing_manage_remove_error.html",
            controller: "PaymentsStandingManageRemoveErrorController",
            data: {
                analyticsTitle: "raiff.payments.standing.manage.remove.title"
            }
        });
    })
    .controller('PaymentsStandingManageRemoveErrorController', function ($scope, initialState, $stateParams, viewStateService,
                                                                    $state, pathService, standingTransferService) {
    }

);