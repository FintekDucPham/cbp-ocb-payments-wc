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
            transferBillService.createAutoBillTransfer($scope.payment.formData).then(function(createDepositResponse){
                $scope.deposit.result.proxyMsg = {};
                $scope.deposit.result.proxyMsg.show = false;
                // if($scope.deposit.items.sourceAccount.relation == 'PROXY'){
                //     $scope.deposit.result.proxyMsg.show = true;
                //     $scope.deposit.result.proxyMsg.content = deposit.formData.period.powerOfAttorneyInformation;
                // }
                var response = angular.fromJson(createDepositResponse.content);
                if(response.status === "success"){
                    $scope.deposit.result.type = "success";
                    if(response.numOfDeposits == 1){
                        var key = "ocb.deposits.new.status.success.info." + (response.numOfDeposits == 1 ? "one" : "all");
                        $scope.deposit.result.text = translate.property(key);
                    }else{
                        $scope.deposit.result.text =  translate.property('ocb.deposits.new.status.success.info.some')
                            .replace("##deposits##", response.numOfDeposits)
                            .replace("##wholeDeposits##","$scope.deposit.formData.depositQuantity");
                    }
                } else if (response.status === "warning"){
                    $scope.deposit.result.type = "warning";
                    $scope.deposit.result.text =  translate.property('ocb.deposits.new.status.warning.info');
                } else{
                    setErrorMessage(params.numberOfDeposits);
                }
            }).catch(function(error) {
                setErrorMessage(params.numberOfDeposits);
            }).finally(function(params){
                actions.proceed();
            });
        });
    });