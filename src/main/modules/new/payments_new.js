angular.module('raiffeisen-payments')
    .constant('rbPaymentTypes', {
        "DOMESTIC": {
            code: 'DOMESTIC',
            state: 'domestic'
        },
        "INTERNAL": {
            code: 'INTERNAL',
            state: 'internal'
        },
        "INSURANCE": {
            code: 'INSURANCE',
            state: 'insurance'
        },
        "TAX": {
            code: 'TAX',
            state: 'tax'
        },
        "SWIFT": {
            code: 'SWIFT',
            state: 'swift'
        },
        "SEPA": {
            code: 'SEPA',
            state: 'sepa'
        }
    })
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.new', {
            url: "/new/:paymentType",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/new/payments_new.html",
            controller: "PaymentsNewController",
            params: {
                paymentType: 'domestic'
            }
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
            },
            validation: {}
        });

        $scope.clearForm = function () {
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


        var alreadySet = false;
        $scope.setDefaultValues = function (value) {
            if (!alreadySet) {
                angular.extend($scope.payment.formData, value, lodash.pick($scope.payment.formData, angular.isDefined));
                alreadySet = true;
            }
        };

    });