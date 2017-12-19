angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.pending.verify', {
            url: "/verify",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/pending/verify/payments_pending_verify.html",
            controller: "PaymentPendingVerifyController",
            data: {
                analyticsTitle: "config.multistepform.labels.step2"
            }
        });
    })
    .controller('PaymentPendingVerifyController', function ($scope,  $state, bdVerifyStepInitializer,bdStepStateEvents,bdTableConfig,translate) {

        // if(_.isEmpty( $scope.pendingTransaction.selectedTrans)){
        //     $state.go("payments.pending.fill");
        //     //return;
        // }

        $scope.systemToken = "1234";
        $scope.inputToken = "";


        //list data table define
        $scope.table = {
            tableConfig : new bdTableConfig({
                placeholderText: translate.property("ocb.payments.pending.empty_list.label"),

            }),
            tableData : {
                getData: function (defer, $params) {
                    console.log($scope.pendingTransaction.selectedTrans);
                    defer.resolve($scope.pendingTransaction.selectedTrans);
                }
            },
            tableControl: undefined
        };


        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            //validate token
            if( $scope.inputToken !==  $scope.systemToken){
                //TODO error for mismatch token
                return;
            }
            var url = exportService.prepareHref('/api/mass_payment/actions/realize');
            console.log(url);
            //TODO make approve transaction here
            $http({
                method: 'POST',
                url:  url,
                data : { "transferIDs": listTransID}
            }).then(function successCallback(response) {
                if(response.data.content == "EXECUTED"){
                    console.log(response);
                    $scope.table.tableControl.invalidate();
                    $scope.resetPage = true;
                    $state.go('payments.pending.status');
                } else {
                    $scope.serviceError = true;
                }
            }, function errorCallback(response) {
                console.log(response);
                $scope.serviceError = true;
            });
            console.log("ON FORWARD")
            actions.proceed();
            //reset after proceed OK
            $scope.pendingTransaction.selectedTrans = []
        });

        $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
            console.log("ON BACKWORD")
            actions.proceed();
        });

        $scope.pendingTransaction.cancelApprove = function () {
            //reset data after cancel
            $scope.pendingTransaction.selectedTrans = []
        }
    });