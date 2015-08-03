angular.module('raiffeisen-payments')
    .constant('rbPaymentTypes', {
        "DOMESTIC": {
            code: 'DOMESTIC',
            state: 'domestic',
            service: 'domestic'
        },
        "INTERNAL": {
            code: 'INTERNAL',
            state: 'internal',
            service: 'between_own_accounts'
        },
        "ZUS": {
            code: 'ZUS',
            state: 'zus',
            service: 'zus'
        }
    })
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.new', {
            url: "/new/:paymentType",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/new/payments_new.html",
            controller: "PaymentsNewController"
        });
    })
    .controller('PaymentsNewController', function ($scope, bdMainStepInitializer, rbPaymentTypes, pathService, translate, $stateParams, $state, lodash) {

        bdMainStepInitializer($scope, 'payment', {
            formName: 'paymentForm',
            type: lodash.find(rbPaymentTypes, {
                state: $stateParams.paymentType || 'domestic'
            }),
            formData: {},
            options: {
                fixedAccountSelection: false,
                fixedRecipientSelection: false
            },
            meta: {
                paymentTypes: lodash.map(rbPaymentTypes, function (value) {
                    return value;
                })
            }
        });

        $scope.clearForm = function () {
            //todo ask to clear but do not clear all!
            $scope.payment.formData = {};
            $scope.payment.items = {};
            $scope.$broadcast('clearForm');
        };

        $scope.getTemplateName = function (stepName) {
            return "{0}/modules/new/{1}/{2}/payments_new_{2}_{1}.html".format(pathService.generateTemplatePath("raiffeisen-payments"), stepName, $stateParams.paymentType);
        };

        $scope.changePaymentType = function (type) {
            $state.go('payments.new.fill', {
                paymentType: type.state
            });
        };

    });