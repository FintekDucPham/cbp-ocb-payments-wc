
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
        , function($scope, bdStepStateEvents,translate) {
            $scope.payuBku.token = {
                model :{},
                params: {}
            }
            $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
                if($scope.payuBku.data.OTP == null || $scope.payuBku.data.OTP == ''){
                    $scope.errMsg = translate.property("ocb.payments.payu.err_msg_no_otp.label");
                    return
                }
                //TODO process payment here
                //....
                //clear data after process
                $scope.payuBku.data.stdInfo = {}
                $scope.payuBku.data.amountInfo = {}
                $scope.payuBku.data.paymentInfo = []
                $scope.payuBku.data.remitterInfo = {}
                $scope.payuBku.data.subjectSelected = [];
                 actions.proceed();
              });

            $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
                $scope.payuBku.data.subjectSelected = [];
                actions.proceed();
            });
        $scope.getOTP = function () {
            $scope.payuBku.token.params.resourceId = true;
        }

    });


