
angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.payu_hufi.verify', {
            url: "/verify",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/payu_hufi/verify/verify_form.html",
            controller: "PayuHufiStep2Controller",
            data: {
                analyticsTitle: "config.multistepform.labels.step2"
            }

        });
    })
    .controller("PayuHufiStep2Controller"
        , function($scope, bdStepStateEvents,translate) {

            $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
                $scope.payuHufi.token = {
                    model :{},
                    params: {}
                }

                //TODO check if otp not input
                if($scope.payuHufi.data.OTP == null || $scope.payuHufi.data.OTP == ''){
                    $scope.errMsg = translate.property("ocb.payments.payu.err_msg_no_otp.label");
                    return
                }
                //TODO process payment here
                //....
                //clear data after process
                $scope.payuHufi.data.stdInfo = {}
                $scope.payuHufi.data.amountInfo = {}
                $scope.payuHufi.data.paymentInfo = []
                $scope.payuHufi.data.remitterInfo = {}
                $scope.payuHufi.data.subjectSelected = [];
                 actions.proceed();
              });

            $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
                $scope.payuHufi.data.subjectSelected = [];
                actions.proceed();
                //console.log("PaymentsBatchProcessingStep2Controller BACKWARD_MOVE");
            });
            $scope.getOTP = function () {
                $scope.payuHufi.token.params.resourceId = true;
            }

    });


