angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.recipients.manage.edit', {
            url: "/edit/:recipientType",
            abstract: true,
            params: {
                recipient: null,
                dataConverted: false
            },
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/recipients/manage/operations/edit/payments_recipients_manage_edit.html",
            controller: "PaymentsRecipientsManageEditController",
            data: {
                analyticsTitle: ["$stateParams", function($stateParams) {
                    var keys = [];
                    keys.push("ocb.payments.recipients.edit.label");
                    keys.push("ocb.payments.recipients.select.type." + $stateParams.recipientType.toUpperCase());
                    return keys;
                }]
            }
        }).state('payments.recipients.manage.edit.fill', {
            url: "/fill",
            templateUrl: function ($stateParams) {
                return pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/recipients/manage/steps/fill/" + angular.lowercase($stateParams.recipientType) + "/payments_recipients_manage_fill_" + angular.lowercase($stateParams.recipientType) + ".html";
            },
            data: {
                analyticsTitle: "config.multistepform.labels.step1"
            }
        }).state('payments.recipients.manage.edit.verify', {
            url: "/verify",
            templateUrl: function ($stateParams) {
                return pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/recipients/manage/steps/verify/" + angular.lowercase($stateParams.recipientType) + "/payments_recipients_manage_verify_" + angular.lowercase($stateParams.recipientType) + ".html";
            },
            data: {
                analyticsTitle: "config.multistepform.labels.step2"
            }
        }).state('payments.recipients.manage.edit.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/recipients/manage/operations/edit/status/payments_recipients_manage_edit_status.html",
            controller: "RecipientsManageEditStatusController",
            data: {
                analyticsTitle: "config.multistepform.labels.step3"
            }
        });
    })
    .controller('PaymentsRecipientsManageEditController', function ($scope, lodash, recipientManager, recipientGeneralService, authorizationService, $stateParams) {

        var myRecipientManager = recipientManager($stateParams.recipientType);

        if(!$stateParams.dataConverted) {
            lodash.extend($scope.recipient, $stateParams.recipient ? myRecipientManager.makeEditable($stateParams.recipient) : null, $scope.recipient);
        } else {
            lodash.extend($scope.recipient.formData, $stateParams.recipient, $scope.recipient.formData);
        }

        lodash.assign($scope.recipient.meta, {
            nonEditableFields: ['debitAccountNo', 'recipientAccountNo', 'recipientId', 'remitterAccountId'],
            forbiddenAccounts: []
        });

        $scope.prepareOperation = $scope.create;

        $scope.setRequestOperationConverter(function(data) {
            return angular.extend(data, {
               recipientId: $scope.recipient.formData.recipientId
            });
        });

        $scope.$on('wrongAuthCodeEvent', function () {
            $scope.showWrongCodeLabel = true;
        });
        $scope.$on('hideWrongCodeLabelEvent', function () {
            $scope.showWrongCodeLabel = false;
        });

    });
