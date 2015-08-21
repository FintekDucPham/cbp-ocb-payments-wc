angular.module('raiffeisen-payments')
    .constant('NEW_RECIPIENT_STEPS', {
        FILL: 'fill'
    })
    .constant('operation', {
        "NEW": {
            code: 'NEW',
            state: 'new'
        }
    })
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.recipients.manage', {
            url: "/manage",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/manage/payments_recipients_manage.html",
            controller: "PaymentsRecipientsManageController"
        });
    })
    .controller('PaymentsRecipientsManageController', function ($scope, $timeout, lodash, $rootScope, $stateParams, pathService, NRB_REGEX, CUSTOM_NAME_REGEX, RECIPIENT_DATA_REGEX, NEW_RECIPIENT_STEPS, bdMainStepInitializer) {

        $scope.NRB_REGEX = new RegExp(NRB_REGEX);
        $scope.CUSTOM_NAME_REGEX = new RegExp(CUSTOM_NAME_REGEX);
        $scope.RECIPIENT_DATA_REGEX = new RegExp(RECIPIENT_DATA_REGEX);

        $scope.activeStep = {
            id: $stateParams.step || NEW_RECIPIENT_STEPS.FILL
        };

        $scope.EMPTY_ITEMS = {
            senderAccount: null,
            accountList: null
        };



        bdMainStepInitializer($scope, 'recipient', {
            type: $stateParams.recipientType,
            operation: $stateParams.operation,
            formData: {},
            items: angular.copy($scope.EMPTY_ITEMS),
            transferId: null,
            options:{}
        });



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

        $scope.requestConverter = function (formData) {
            return formData;
        };

        $scope.setRequestConverter = function (converterFn) {
            $scope.requestConverter = converterFn;
        };

    }
);