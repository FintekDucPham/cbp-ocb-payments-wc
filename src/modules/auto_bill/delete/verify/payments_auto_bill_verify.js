angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.auto_bill_delete.verify', {
            url: "/fill",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/auto_bill/delete/verify/payments_auto_bill_verify.html",
            controller: "AutoBillDeleteVerifyController",
            data: {
                analyticsTitle: 'config.multistepform.labels.step2'
            }
        });
    })
    .controller('AutoBillDeleteVerifyController', function ($scope, bdFillStepInitializer, translate, formService, bdStepStateEvents, transferBillService, viewStateService, initialState) {

        var initialData = initialState.data;
        if (initialData != null) {
            $scope.payment.formData = initialData;
        }

        $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
            actions.proceed();
        });

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            var params = { orderNumber: $scope.payment.formData.orderNumber}
            transferBillService.deleteAutoBillTransfer(params).then(function(status){
                $scope.payment.result = {};
                if(status === "EXECUTED"){
                    setErrorMessage("success", 'ocb.payment.auto_bill.status.success.info');
                } else if (status === "IN_PROCESSING"){
                    setErrorMessage("success", 'ocb.payment.auto_bill.status.processing.info');
                } else{
                    setErrorMessage("error", 'ocb.payment.auto_bill.status.error.info');
                }
            }).catch(function(error) {
                setErrorMessage("error", 'ocb.payment.auto_bill.status.error.info');
            }).finally(function(params){
                actions.proceed();
            });
        });

        function setErrorMessage(type, message) {
            $scope.payment.result.type = type;
            $scope.payment.result.text = translate.property(message);
        }
    });