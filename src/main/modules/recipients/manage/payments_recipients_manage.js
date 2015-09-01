angular.module('raiffeisen-payments')
    .constant('NEW_RECIPIENT_STEPS', {
        FILL: 'fill'
    })
    .constant('operation', {
        "NEW": {
            code: 'NEW',
            state: 'new'
        },
        "EDIT": {
            code: 'EDIT',
            state: 'edit'
        },
        "REMOVE": {
            code: 'REMOVE',
            state: 'remove'
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
    .controller('PaymentsRecipientsManageController', function ($scope, $timeout, lodash, $rootScope, $stateParams, pathService, NRB_REGEX, CUSTOM_NAME_REGEX, NEW_RECIPIENT_STEPS, bdMainStepInitializer, operation, validationRegexp, bdStepStateEvents) {

        $scope.NRB_REGEX = new RegExp(NRB_REGEX);
        $scope.CUSTOM_NAME_REGEX = new RegExp(CUSTOM_NAME_REGEX);
        $scope.RECIPIENT_DATA_REGEX = validationRegexp('RECIPIENT_DATA_REGEX');
        $scope.RECIPIENT_NAME_REGEX = validationRegexp('RECIPIENT_NAME');
        $scope.PAYMENT_TITLE_REGEX = validationRegexp('PAYMENT_TITLE_REGEX');

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
            transferId: {},
            options:{}
        });

        $scope.getOpertaionType = function(operationType){
            return lodash.find(operation, {
                state: operationType
            });
        };



        $scope.getAccountByNrb = function(accountList, selectFn){
            if(lodash.isString($scope.recipient.formData.debitAccountNo)){
                var result = lodash.find(accountList, {'accountNo':$scope.recipient.formData.debitAccountNo});
                if(lodash.isPlainObject(result)){
                    selectFn(result);
                }
            }
            selectFn(accountList[0]);
        };

        $scope.requestConverter = function (formData) {
            return formData;
        };

        $scope.setRequestConverter = function (converterFn) {
            $scope.requestConverter = converterFn;
        };

    }
);