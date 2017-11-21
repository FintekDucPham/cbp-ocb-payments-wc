<!--create by long.tran on 2017-11-21-->
angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state("payments.bill_history", {
            url: "/bill_history",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/bill_history/payments_bill_history.html",
            controller: "PaymentsBillHistoryController",
            data: {
                analyticsTitle: null
            }
        });
    })
    .controller('PaymentsBillHistoryController', function ($scope) {

        bdMainStepInitializer($scope, 'paymentsBatchProcessingForm', {
            formName: 'paymentsBatchProcessingFormForm',
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

        //Download

        $scope.export = function() {
            html2canvas(document.getElementById('exportthis'), {
                onrendered: function (canvas) {
                    var data = canvas.toDataURL();
                    var docDefinition = {
                        content: [{
                            image: data,
                            width: 500,
                        }]
                    };
                    pdfMake.createPdf(docDefinition).download("test.pdf");
                }
            });
        };



    });