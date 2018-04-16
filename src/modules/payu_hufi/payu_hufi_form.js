
angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.payu_hufi', {
            url: "/payu_hufi",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/payu_hufi/payu_hufi_form.html",
            controller: "PayUHufiController",
            abstract: true,
            data: {
                analyticsTitle: null
            }
        });
    })
    .controller('PayUHufiController', function ($scope, bdMainStepInitializer, bdTableConfig, rbPaymentOperationTypes) {

        bdMainStepInitializer($scope, 'payuHufi', {
            formName: 'payuHufiForm',
            formData: {},
            operation: rbPaymentOperationTypes.NEW,
            options: {},
            meta: {},
            token: {
                model: null,
                params: {

                }
            },
            validation: {},
            items :{}
        });

        // $scope.modify = {
        //     verify:{
        //         data: null
        //     }
        // };
        $scope.subjectSelected = function () {
            return $scope.payuHufi.subjectSelected;
        };

        // $scope.getOTP = function (event, actions) {
        //     sendAuthorizationToken();
        // }
        //
        // function sendAuthorizationToken() {
        //     //TODO get otp
        // };
        $scope.payuHufiFormParams = {
            completeState:'dashboard',
            onClear: $scope.clearForm,
            cancelState:'payments.payu_hufi.fill',
            footerType: 'payu',
            subjectSelected: $scope.subjectSelected,
            isChecked: 'true',
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

