
angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.payu_vnpay.verify', {
            url: "/verify",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/payu_vnpay/verify/verify_form.html",
            controller: "PayuVnpayStep2Controller",
            data: {
                analyticsTitle: "config.multistepform.labels.step2"
            }

        });
    })
    .controller("PayuVnpayStep2Controller"
        , function($scope, bdStepStateEvents,translate) {
            $scope.payuVnpay.token = {
                model :{},
                params: {}
            }
            $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
                if($scope.payuVnpay.data.OTP == null || $scope.payuVnpay.data.OTP == ''){
                    $scope.errMsg = translate.property("ocb.payments.payu.err_msg_no_otp.label");
                    return
                }
                //TODO process payment here
                //....
                //clear data after process
                $scope.payuVnpay.data.stdInfo = {}
                $scope.payuVnpay.data.amountInfo = {}
                $scope.payuVnpay.data.paymentInfo = []
                $scope.payuVnpay.data.remitterInfo = {}
                $scope.payuVnpay.data.subjectSelected = [];
                 actions.proceed();
              });

            $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
                $scope.payuVnpay.data.subjectSelected = [];
                actions.proceed();
                //console.log("PaymentsBatchProcessingStep2Controller BACKWARD_MOVE");
            });
        $scope.getOTP = function () {
            $scope.payuVnpay.token.params.resourceId = true;
        }

    });


