angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.recipients.manage.remove', {
            url: "/remove/:recipientType",
            abstract:true,
            params: {
                recipient: null,
                dataConverted: false
            },
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/recipients/manage/operations/remove/payments_recipients_manage_remove.html",
            controller: "PaymentsRecipientsManageRemoveController",
            data: {
                analyticsTitle: ["$stateParams", function($stateParams) {
                    var keys = [];
                    keys.push("ocb.payments.recipients.manage.remove.title");
                    keys.push("ocb.payments.recipients.select.type." + $stateParams.recipientType.toUpperCase());
                    return keys;
                }]
            }
        }).state('payments.recipients.manage.remove.verify', {
            url: "/verify",
            templateUrl: function($stateParams){
                return pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/recipients/manage/steps/verify/"+angular.lowercase($stateParams.recipientType)+"/payments_recipients_manage_verify_"+angular.lowercase($stateParams.recipientType)+".html";
            },
            controller: "RecipientsManageVerifyDomesticController",
            data: {
                analyticsTitle: "config.multistepform.labels.step2"
            }
        }).state('payments.recipients.manage.remove.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/recipients/manage/operations/remove/status/payments_recipients_manage_remove_status.html",
            controller: "RecipientsManageRemoveStatusController",
            data: {
                analyticsTitle: "config.multistepform.labels.step3"
            }
        });
    })
    .controller('PaymentsRecipientsManageRemoveController', function ($scope, initialState, $stateParams, recipientManager, recipientGeneralService, viewStateService, $state, lodash, $timeout) {

        var myRecipientManager = recipientManager($stateParams.recipientType);

        if(!$stateParams.dataConverted) {
            lodash.extend($scope.recipient, $stateParams.recipient ? myRecipientManager.makeEditable($stateParams.recipient) : null, $scope.recipient);
        } else {
            lodash.extend($scope.recipient.formData, $stateParams.recipient, $scope.recipient.formData);
        }
        $scope.clearForm = function () {
            $scope.recipient.formData = {};
            $scope.$broadcast('clearForm');
        };

        $scope.prepareOperation = $scope.create;

        $scope.setRequestOperationConverter(function(data) {
            return angular.extend(data, {
                recipientId: $scope.recipient.formData.recipientId
            });
        });

        $scope.editForm = function(){
            $state.go("payments.recipients.manage.edit.fill", {
                recipientType: $scope.recipient.type.code.toLowerCase(),
                operation: 'edit',
                recipient: angular.copy($scope.recipient.formData),
                dataConverted: true
            });
        };

        $scope.recipient.manageAction = "REMOVE";
        $scope.recipient.multiStepParams.labels.accept = 'ocb.payments.recipients.list.details.remove';
        $scope.recipient.multiStepParams.visibility.clear = false;
    }

);