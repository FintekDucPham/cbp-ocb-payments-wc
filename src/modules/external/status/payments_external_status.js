angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        var prototype = {
            url: '/status',
            views: {
                '@payments.external': {
                    templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/external/status/payments_external_status.html",
                    controller: "PaymentsExternalStatusController"
                }
            },
            data: {
                analyticsTitle: "config.multistepform.labels.step3"
            }
        };
        stateServiceProvider
            .state('payments.external.new.status', angular.copy(prototype))
            .state('payments.external.basket.modify.status', angular.copy(prototype))
            .state('payments.external.basket.delete.status', angular.copy(prototype))
            .state('payments.external.future.modify.status', angular.copy(prototype))
            .state('payments.external.future.delete.status', angular.copy(prototype))
    })
    .controller('PaymentsExternalStatusController', function ($scope, $state, payment, bdStatusStepInitializer, translate) {
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