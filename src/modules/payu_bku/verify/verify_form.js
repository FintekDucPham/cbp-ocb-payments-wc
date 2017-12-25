
angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.payu_bku.verify', {
            url: "/verify",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/payu_bku/verify/verify_form.html",
            controller: "PayUBKUStep2Controller",
            data: {
                analyticsTitle: "config.multistepform.labels.step2"
            }

        });
    })
    .controller("PayUBKUStep2Controller"
        , function($scope, bdStepStateEvents, formService, translate, $filter, bdTableConfig, transferBatchService) {
        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            // transferBatchService.createBatchTransfer(params).then(function(data) {
            //     resultResponse(data.content.referenceId);
            //     actions.proceed();
            // });
            actions.proceed();
        });
        $scope.paymentInfo = [
            {
            "paymentCode" : "1123545464",
            "paymentDesc" : "Cau truc du lieu va giai thuat"
            },
            {
                "paymentCode" : "32422323",
                "paymentDesc" : "ngon ngu lap trinh huong doi tuong"
            },

            {
                "paymentCode" : "32422323",
                "paymentDesc" : "Automat"
            }
        ]
        $scope.amountInfo =
            {
                "figure" : "1300000",
                "words" : "Một triệu ba trăm ngàn",

            }
        $scope.remitterInfo =
            {
                "accNum" : "12121343434",
                "accName" : "Le Linh Phuong",
                "ocbBranch" : "Tan Binh",
                "availFund" : "1350000",
                "remainDaily" : "9999999999",
            }
        $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
            actions.proceed();

            //console.log("PaymentsBatchProcessingStep2Controller BACKWARD_MOVE");
        });


    });


