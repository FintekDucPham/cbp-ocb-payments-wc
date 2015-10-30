angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.new_internal', {
            url: "/new-internal",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/new_internal/payments_new_internal.html",
            controller: "PaymentsNewInternalController",
            params: {
                payment: {}
            }
        });
    })
    .controller('PaymentsNewInternalController', function ($scope, bdMainStepInitializer, rbPaymentTypes, pathService, translate, $stateParams, $state, lodash) {

        bdMainStepInitializer($scope, 'payment', lodash.extend({
            formName: 'paymentForm',
            options: {
                fixedAccountSelection: false
            },
            token: {
                model: null,
                params: {}
            }
        }), {
            formData: $stateParams.payment
        });

        $scope.clearForm = function () {
            $scope.payment.formData = {};
            $scope.payment.items = {};
            $scope.$broadcast('clearForm');
        };

        var alreadySet = false;
        $scope.setDefaultValues = function (value) {
            if (!alreadySet) {
                angular.extend($scope.payment.formData, value, lodash.pick($scope.payment.formData, angular.isDefined));
                alreadySet = true;
            }
        };

    });