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
    .controller('PaymentPendingVerifyController', function ($scope,  $state, bdVerifyStepInitializer,bdStepStateEvents,bdTableConfig,translate,$http,exportService,pendingTransactionService) {

        // if(_.isEmpty( $scope.pendingTransaction.selectedTrans)){
        //     $state.go("payments.pending.fill");
        //     //return;
        // }

        $scope.systemToken = "1234";
        $scope.inputToken = "";

        $scope.token = {
            model :{}
        }
        //list data table define
        $scope.table = {
            tableConfig : new bdTableConfig({
                placeholderText: translate.property("ocb.payments.pending.empty_list.label"),

            }),
            tableData : {
                getData: function (defer, $params) {
                    defer.resolve($scope.pendingTransaction.selectedTrans);
                }
            },
            tableControl: undefined
        };


        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {

            //TODO handling token here
            //........
            $scope.token = "ABC";
            //after token valid, send request to approve api
            var listTransID = _.map($scope.pendingTransaction.selectedTrans, 'id');;
            // var url = exportService.prepareHref('/api/mass_payment/actions/realize');
            // $http({
            //     method: 'POST',
            //     url:  url,
            //     data : {
            //
            //         transferId : listTransID,
            //         credentials : $scope.token
            //     }
            // }).then(function successCallback(response) {
            //     if(response.data.content == "EXECUTED"){
            //         $state.go('payments.pending.status');
            //     } else {
            //         $scope.serviceError = true;
            //     }
            //     actions.proceed();
            //     //reset after proceed OK
            //     $scope.pendingTransaction.selectedTrans = []
            //
            // }, function errorCallback(response) {
            //     $scope.serviceError = true;
            // });

            var approveResult = pendingTransactionService.approveTransaction(listTransID,$scope.token).then(function (d) {
                if(d !== undefined && d.content == "OK"){

                    // $scope.table.tableControl.invalidate();
                    $scope.resetPage = true;
                    $scope.pendingTransaction.selectedTrans = []
                    $state.go('payments.pending.status');
                } else {
                    $scope.serviceError = true;
                }
            });
        });

        $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
            actions.proceed();
        });

        $scope.pendingTransaction.clearData = function () {
            //reset data after cancel
            $scope.pendingTransaction.selectedTrans = []
            $state.go('payments.pending.fill',{},{reload:true});
        }
    });