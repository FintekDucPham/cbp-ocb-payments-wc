
angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.payu_hufi', {
            url: "/payu_hufi",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/payu_hufi/payu_hufi_form.html",
            controller: "PayuHufiController",
            abstract: true,
            data: {
                analyticsTitle: null
            }
        });
    })
    .controller('PayuHufiController', function ($scope, bdMainStepInitializer, bdTableConfig, transferBatchService) {

        bdMainStepInitializer($scope, 'payuHufi', {
            formName: 'payuHufiForm',
            formData: {},
            options: {},
            meta: {},
            validation: {},
            items :{}
        });

        $scope.modify = {
            verify:{
                data: null
            }
        };
        $scope.subjectSelected = function () {
            return $scope.payuHufi.subjectSelected;
        };
       $scope.payuHufiFormParams = {
            completeState:'payments.payu_hufi.fill',
            onClear: $scope.clearForm,
            cancelState:'payments.payu_hufi.fill',
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

