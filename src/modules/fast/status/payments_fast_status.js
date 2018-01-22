angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        var prototype = {
            url: '/status',
            views: {
                '@payments.fast': {
                    templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/fast/status/payments_fast_status.html",
                    controller: "PaymentsFastStatusController"
                }
            },
            data: {
                analyticsTitle: "config.multistepform.labels.step3"
            }
        };
        stateServiceProvider
            .state('payments.fast.new.status', angular.copy(prototype))
            .state('payments.fast.basket.modify.status', angular.copy(prototype))
            .state('payments.fast.basket.delete.status', angular.copy(prototype));
    })
    .controller('PaymentsFastStatusController', function ($scope, $state, payment, bdStatusStepInitializer) {
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