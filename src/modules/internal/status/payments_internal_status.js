angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        var prototype = {
            url: '/status',
            views: {
                '@payments.internal': {
                    templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/internal/status/payments_internal_status.html",
                    controller: "PaymentsInternalStatusController"
                }
            },
            data: {
                analyticsTitle: "config.multistepform.labels.step3"
            }
        };
        stateServiceProvider
            .state('payments.internal.new.status', angular.copy(prototype))
            .state('payments.internal.basket.modify.status', angular.copy(prototype))
            .state('payments.internal.basket.delete.status', angular.copy(prototype))
            .state('payments.internal.future.modify.status', angular.copy(prototype))
            .state('payments.internal.future.delete.status', angular.copy(prototype))
    })
    .controller('PaymentsInternalStatusController', function ($scope, $state, payment, bdStatusStepInitializer) {
        if (!payment.result.type) {
            $state.go($state.$current.data.finalState);
            return;
        }

        var stateData = $state.$current.data;
        $scope.removeFromBasket = stateData.basketPayment && stateData.operation === 'delete';

        $scope.rbPaymentsStepParams.visibility.finalAction = !payment.formData.recipientId;

        bdStatusStepInitializer($scope, {
            formName: 'paymentForm',
            dataObject: payment
        });
    });