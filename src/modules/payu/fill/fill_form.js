
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
                    , function ($scope,$state,$stateParams,translate,openAccountOnlineService) {
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
                if(newVal) {
                    var fd = new FormData()
                    fd.append('fileName', newVal.video.name)
                    fd.append('size', newVal.video.size)
                    fd.append('contentType', newVal.video.type)
                    fd.append('content', newVal.video)
                    openAccountOnlineService.uploadData(fd).then(function(data){
                        console.log("openAccountOnlineService.uploadData(fd")
                        console.log(data)
                    })
                }
            })

        });

