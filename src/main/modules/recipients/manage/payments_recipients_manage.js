angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.recipients.manage', {
            url: "/manage",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/manage/payments_recipients_manage.html",
            controller: "PaymentsRecipientsManageController",
            params: {
                recipientType: 'domestic',
                operation: 'new'
            }
        });
    })
    .controller('PaymentsRecipientsManageController', function ($scope, $timeout, lodash, $rootScope, $stateParams,
                                                                pathService, NRB_REGEX, CUSTOM_NAME_REGEX,
                                                                bdMainStepInitializer, rbRecipientOperationType,
                                                                validationRegexp, rbRecipientTypes) {

        $scope.NRB_REGEX = new RegExp(NRB_REGEX);
        $scope.CUSTOM_NAME_REGEX = new RegExp(CUSTOM_NAME_REGEX);
        $scope.RECIPIENT_DATA_REGEX = validationRegexp('RECIPIENT_DATA_REGEX');
        $scope.RECIPIENT_NAME_REGEX = validationRegexp('RECIPIENT_NAME');
        $scope.PAYMENT_TITLE_REGEX = validationRegexp('PAYMENT_TITLE_REGEX');

        bdMainStepInitializer($scope, 'recipient', {
            type: lodash.find(rbRecipientTypes, {
                state: $stateParams.recipientType
            }),
            operation: lodash.find(rbRecipientOperationType, {
                state: $stateParams.operation
            }),
            formData: {},
            transferId: {},
            options: {},
            meta: {
                recipientTypes: lodash.map(rbRecipientTypes)
            }
        });

        $scope.getAccountByNrb = function (accountList, selectFn) {
            if (lodash.isString($scope.recipient.formData.debitAccountNo)) {
                var result = lodash.find(accountList, {'accountNo': $scope.recipient.formData.debitAccountNo});
                if (lodash.isPlainObject(result)) {
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