
angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.payu_bku', {
            url: "/payu_bku",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/payu_bku/payu_bku_form.html",
            controller: "PayUBKUController",
            abstract: true,
            data: {
                analyticsTitle: null
            }
        });
    })
    .controller('PayUBKUController', function ($scope, bdMainStepInitializer, bdTableConfig, transferBatchService) {

        bdMainStepInitializer($scope, 'payuBku', {
            formName: 'payuBkuForm',
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

        $scope.payuBkuFormParams = {
            completeState:'payments.payu_bku.fill',
            onClear: $scope.clearForm,
            cancelState:'payments.payu_bku.fill',
            footerType: 'payu',
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
        //
        // $scope.paymentsBatchProcessingFormParams.visibility.search = true;
        // $scope.paymentsBatchProcessingFormParams.visibility.accept = false;

    });

