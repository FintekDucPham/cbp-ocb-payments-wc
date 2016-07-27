angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.invoobill.reject_payment.fill', {
            url: "/fill",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/invoobill/list/reject_payment/fill/payments_reject_invoobill_fill.html",
            controller: "PaymentsRejectInvoobillFillController",
            data: {
                analyticsTitle: "config.multistepform.labels.step1"
            }
        });
    })
    .controller('PaymentsRejectInvoobillFillController', function ($scope, bdStepStateEvents, invoobillPaymentsService) {

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            delete $scope.payment.token.params.resourceId;
            var form = $scope.paymentForm;
            if (form.$invalid) {
                formService.dirtyFields(form);
            } else {
                createPaymentEntity().then(function(data){
                    $scope.payment.meta.referenceId = data;
                    actions.proceed();
                });
            }
        });

        var createPaymentEntity = function(){
            return invoobillPaymentsService.create({
                messageId : $scope.payment.invoobill.refId,
                rejectedReason : $scope.payment.formData.reason,
                paymentStatus : $scope.payment.invoobill.paymentStatus
            }, "reject").then(function(data){
                return data;
            });
        };

    });