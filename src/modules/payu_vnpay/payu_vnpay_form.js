
angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.payu_vnpay', {
            url: "/payu_vnpay",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/payu_vnpay/payu_vnpay_form.html",
            controller: "PayuVnpayController",
            abstract: true,
            data: {
                analyticsTitle: null
            }
        });
    })
    .controller('PayuVnpayController', function ($scope, bdMainStepInitializer, bdTableConfig, transferBatchService) {

        bdMainStepInitializer($scope, 'payuVnpay', {
            formName: 'payuVnpayForm',
            formData: {},
            options: {},
            meta: {},
            data: {},
            validation: {},
            token: {
                model: null,
                params: {

                }
            },
            items :{}
        });

        $scope.modify = {
            verify:{
                data: null
            }
        };
        $scope.subjectSelected = function () {
            return $scope.payuVnpay.subjectSelected;
        };

        $scope.getOTP = function (event, actions) {
            sendAuthorizationToken();
        }

        function sendAuthorizationToken() {
            //TODO get otp
        };
       $scope.payuVnpayFormParams = {
            completeState:'payments.payu_vnpay.fill',
            onClear: $scope.clearForm,
            cancelState:'payments.payu_vnpay.fill',
            footerType: 'payu',
            subjectSelected: $scope.subjectSelected,
            labels:{
                prev:"ocb.payments.buttons.prev",
                next:"ocb.payments.new.btn.next",
                finalize:"ocb.payments.new.btn.finalize",
                search: 'config.multistepform.buttons.search'
            },
            visibility:{
                search: true,
                change: true,
                clear: true,
                next: true,
                accept: true,
                prev_fill: false
            },
        }

    });

