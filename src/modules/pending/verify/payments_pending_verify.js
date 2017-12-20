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
    .controller('PaymentPendingVerifyController', function ($scope,  $state, bdVerifyStepInitializer,bdStepStateEvents,bdTableConfig,translate,$http,exportService) {

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
                    console.log($scope.pendingTransaction.selectedTrans);
                    defer.resolve($scope.pendingTransaction.selectedTrans);
                }
            },
            tableControl: undefined
        };


        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {

            //TODO handling token here
            //........

            //after token valid, send request to approve api
            var listTransID = _.map($scope.pendingTransaction.selectedTrans, 'id');;
            var url = exportService.prepareHref('/api/mass_payment/actions/realize');
            console.log(url);
            $http({
                method: 'POST',
                url:  url,
                data : {
                    transferId : "NIB-TRA065003121217ab4749d234afa3ff",
                    credentials : "78962788"
                }
            }).then(function successCallback(response) {
                console.log("SUCCESS")
                if(response.data.content == "EXECUTED"){
                    console.log(response);
                    $state.go('payments.pending.status');
                } else {
                    $scope.serviceError = true;
                }
                console.log("ON FORWARD")
                actions.proceed();
                //reset after proceed OK
                $scope.pendingTransaction.selectedTrans = []

            }, function errorCallback(response) {
                console.log("FAILED")
                console.log(response);
                $scope.serviceError = true;
            });
        });

        $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
            console.log("ON BACKWORD")
            actions.proceed();
        });

        $scope.pendingTransaction.clearData = function () {
            //reset data after cancel
            $scope.pendingTransaction.selectedTrans = []
            $state.go('payments.pending.fill',{},{reload:true});
        }
    });