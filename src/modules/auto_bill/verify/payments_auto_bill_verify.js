angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.auto_bill.verify', {
            url: "/fill",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/auto_bill/verify/payments_auto_bill_verify.html",
            controller: "AutoBillVerifyController",
            data: {
                analyticsTitle: 'config.multistepform.labels.step2'
            }
        });
    })
    .controller('AutoBillVerifyController', function ($scope, bdFillStepInitializer, translate, formService, bdStepStateEvents, transferBillService) {

        $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
            actions.proceed();
        });

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            $scope.payment.formData.amountLimit = $scope.payment.formData.amountLimit.value;
            transferBillService.createAutoBillTransfer($scope.payment.formData).then(function(status){
                $scope.payment.result = {};
                if(status === "EXECUTED"){
                    setErrorMessage("success", 'ocb.payment.auto_bill.status.success.info');
                } else if (status === "IN_PROCESSING"){
                    setErrorMessage("warning", 'ocb.payment.auto_bill.status.processing.info');
                } else{
                    setErrorMessage("undefined", 'ocb.payment.auto_bill.status.error.info');
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