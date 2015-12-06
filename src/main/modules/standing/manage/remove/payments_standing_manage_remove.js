angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.standing.manage.remove', {
            url: "/remove",
            abstract:true,
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/standing/manage/remove/payments_standing_manage_remove.html",
            controller: "PaymentsStandingManageRemoveController"
        }).state('payments.standing.manage.remove.verify', {
            url: "/verify",
            templateUrl: function($stateParams){
                return pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/standing/manage/remove/verify/payments_standing_manage_remove_verify.html";
            },
            controller: "PaymentsStandingManageRemoveVerifyController"
        }).state('payments.standing.manage.remove.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/standing/manage/remove/verify/payments_standing_manage_remove_status.html",
            controller: "PaymentsStandingManageRemoveStatusController"
        });
    })
    .controller('PaymentsStandingManageRemoveController', function ($scope, initialState, $stateParams, recipientManager, recipientGeneralService, viewStateService, $state, lodash) {



        $scope.clearForm = function () {
            $scope.recipient.formData = {};
            $scope.$broadcast('clearForm');
        };

        $scope.prepareOperation = $scope.create;


        $scope.editForm = function(){
            //$state.go("payments.recipients.manage.edit.fill", {
            //    recipientType: $scope.recipient.type.code.toLowerCase(),
            //    operation: 'edit',
            //    recipient: angular.copy($scope.recipient.formData),
            //    dataConverted: true
            //});
        };

    }

);