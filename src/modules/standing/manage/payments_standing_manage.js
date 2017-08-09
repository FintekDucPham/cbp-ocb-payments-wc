angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.standing.manage', {
            url: "/manage",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/standing/manage/payments_standing_manage.html",
            controller: "PaymentsStandingManageController",
            data: {
                analyticsTitle: "ocb.payments.standing.label"
            }
        });
    })
    .controller('PaymentsStandingManageController', function ($scope, $timeout, lodash, $rootScope, $stateParams,
                                                                pathService, NRB_REGEX, CUSTOM_NAME_REGEX,
                                                                bdMainStepInitializer, validationRegexp,
                                                                rbPaymentTypes) {

        bdMainStepInitializer($scope, 'payment', {
            formName: 'paymentForm',
            formData: {},
            options: {},
            token: {
                model: {},
                params: {}
            },
            meta: {
            }
        });

    }
);