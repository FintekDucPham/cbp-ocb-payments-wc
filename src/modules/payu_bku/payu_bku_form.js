
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
    .controller('PayUBKUController', function ($scope, bdMainStepInitializer, bdTableConfig, rbPaymentOperationTypes,exportService,fileDownloadService) {

        bdMainStepInitializer($scope, 'payuBku', {
            formName: 'payuBkuForm',
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
            return $scope.payuBku.subjectSelected;
        };

        // $scope.getOTP = function (event, actions) {
        //     sendAuthorizationToken();
        // }
        //
        // function sendAuthorizationToken() {
        //     //TODO get otp
        // };

        $scope.exportPdf =  function () {
            var downloadLink = exportService.prepareHref({
                href: "/api/transaction/downloads/pdf.json"
            });
            fileDownloadService.startFileDownload(downloadLink + ".json?id=" + $scope.payuBku.transferId);
        }

       $scope.payuBkuFormParams = {
            completeState:'dashboard',
            onClear: $scope.clearForm,
            cancelState:'payments.payu_bku.fill',
            footerType: 'payu',
            subjectSelected: $scope.subjectSelected,
            exportPdf: $scope.exportPdf,
            isChecked: 'true',
            labels:{
                prev:"ocb.payments.payu_vnpay.back.label",
                next:"ocb.payments.new.btn.next",
                finalize:"ocb.payments.payu_vnpay.return.label",
                search: 'config.multistepform.buttons.search',
                export: 'ocb.payments.payu_vnpay.export.label'
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

