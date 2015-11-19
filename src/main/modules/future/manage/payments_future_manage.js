angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.future.manage', {
            url: "/manage",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/future/manage/payments_future_manage.html",
            controller: "PaymentsFutureManageController",
            params: {
                recipientType: 'domestic',
                operation: 'new'
            }
        });
    })
    .controller('PaymentsFutureManageController', function ($scope, $timeout, lodash, $rootScope, $stateParams,
                                                                pathService, NRB_REGEX, CUSTOM_NAME_REGEX,
                                                                bdMainStepInitializer, validationRegexp,
                                                                rbFuturePaymentsTypes, rbFutureOperationType) {

        bdMainStepInitializer($scope, 'future', {
            formName: 'paymentForm',
            type: rbFuturePaymentsTypes[$stateParams.paymentType.toUpperCase()],
            operation: rbFutureOperationType[$stateParams.operation.toUpperCase()],
            formData: {},
            transferId: {},
            options: {},
            token: {
                model: {},
                params: {}
            },
            meta: {
                recipientTypes: lodash.map(rbRecipientTypes)
            },
            manageAction: ""
        });

    }
);