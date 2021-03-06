angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.standing.manage.remove', {
            url: "/remove",
            abstract:true,
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/standing/manage/remove/payments_standing_manage_remove.html",
            controller: "PaymentsStandingManageRemoveController",
            data: {
                analyticsTitle: "ocb.payments.standing.manage.remove.title"
            }
        });
    })
    .controller('PaymentsStandingManageRemoveController', function ($scope, initialState, $stateParams, viewStateService,
                                                                    $state, pathService, standingTransferService) {
        $scope.detailsTemplatePath = pathService.generateTemplatePath("ocb-payments") + "/modules/standing/list/details/payments_standing_list_detail.html";


        $scope.params = {
            operationType: "DELETE"
        };
    }

);