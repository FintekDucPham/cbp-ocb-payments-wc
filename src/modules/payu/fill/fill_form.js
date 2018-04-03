
angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.payu.fill', {
            url: "/fill/:university",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/payu/fill/fill_form.html",
            controller: "payuStep1Controller",
            data: {
                analyticsTitle: "config.multistepform.labels.step1"
            }
        });
    })
    .controller('payuStep1Controller'
                    , function ($scope,$state,$stateParams,translate) {
            switch ($stateParams.university) {
                case 'bku':
                    $state.go('payments.payu_bku.fill');
                    break;
                case 'hufi':
                    $state.go('payments.payu_hufi.fill');
                    break;
                case 'vnpay':
                    $state.go('payments.payu_vnpay.fill');
                    break;
                default:
                    $scope.errMsg = translate.property("ocb.payments.payu.err.label");
            }
            $scope.videoModel = {
                data: null
            }
            $scope.$watch("videoModel.data",function (newVal,oldVal) {
                console.log(newVal)
            })

        });

