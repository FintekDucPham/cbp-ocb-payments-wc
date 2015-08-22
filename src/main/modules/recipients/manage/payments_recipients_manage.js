angular.module('raiffeisen-payments')
    .constant('NEW_RECIPIENT_STEPS', {
        FILL: 'fill'
    })
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.recipients.manage', {
            url: "/manage",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/manage/payments_recipients_manage.html",
            controller: "PaymentsRecipientsManageController"
        });
    })
    .controller('PaymentsRecipientsManageController', function ($scope, validationRegexp, $timeout, lodash, $rootScope, $stateParams, pathService, NRB_REGEX, CUSTOM_NAME_REGEX, RECIPIENT_DATA_REGEX, NEW_RECIPIENT_STEPS, bdStepStateEvents) {

        $scope.NRB_REGEX = new RegExp(NRB_REGEX);
        $scope.CUSTOM_NAME_REGEX = new RegExp(CUSTOM_NAME_REGEX);
        $scope.RECIPIENT_DATA_REGEX = new RegExp(RECIPIENT_DATA_REGEX);
        $scope.RECIPIENT_NAME_REGEX = validationRegexp('RECIPIENT_NAME');
        $scope.PAYMENT_TITLE_REGEX = validationRegexp('PAYMENT_TITLE_REGEX');

        $scope.activeStep = {
            id: $stateParams.step || NEW_RECIPIENT_STEPS.FILL
        };

        $scope.EMPTY_ITEMS = {
            senderAccount: null,
            accountList: null
        };

        $scope.recipient = {
            type: $stateParams.recipientType,
            formData: {},
            items: angular.copy($scope.EMPTY_ITEMS)
        };

        $scope.getAccountByNrb = function(accountList){
            if(lodash.isString($scope.recipient.formData.debitAccountNo)){
                var result = lodash.find(accountList, {'accountNo':$scope.recipient.formData.debitAccountNo});
                if(lodash.isPlainObject(result)){
                    return result;
                }
            }
            return accountList[0];
        };

        $scope.clearForm = function(){
            this.recipient.formData.remitterAccountId = "";
            this.recipient.formData.customName = "";
            this.recipient.formData.recipientAccountNo = "";
            this.recipient.formData.recipientData = "";
            this.recipient.formData.description = "";

            this.recipient.items = {};
            this.$broadcast('clearForm');
        };

    }
);