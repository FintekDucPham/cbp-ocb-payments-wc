angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.standing.manage', {
            url: "/manage",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/future/manage/payments_standing_manage.html",
            controller: "PaymentsStandingManageController"

        });
    })
    .controller('PaymentsStandingManageController', function ($scope, $timeout, lodash, $rootScope, $stateParams,
                                                                pathService, NRB_REGEX, CUSTOM_NAME_REGEX,
                                                                bdMainStepInitializer, validationRegexp,
                                                                rbPaymentTypes) {

        bdMainStepInitializer($scope, 'payment', {
            formName: 'paymentForm',
            type: null,
            operation: null,
            formData: {},
            transferId: {},
            options: {},
            initData: {
                promise: null,
                data: null
            },
            token: {
                model: {},
                params: {}
            },
            meta: {
                recipientTypes: lodash.map(rbPaymentTypes)
            },
            manageAction: ""
        });

        $scope.setRecipientDataExtractor = function(fn) {
            $scope.resolveRecipientData = fn;
        };

        $scope.getTemplateName = function (stepName) {
            if($scope.payment.type){
                return "{0}/modules/new/{1}/{2}/payments_new_{2}_{1}.html".format(pathService.generateTemplatePath("raiffeisen-payments"), stepName, $scope.payment.type.state);
            }else{
                return undefined;
            }
        };
    }
);