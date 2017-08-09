angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.invoobill', {
            url: "/invoobill",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/invoobill/payments_invoobill.html",
            controller: "PaymentsInvoobillController",
            abstract: true,
            resolve: {
                parameters: ["$q", "customerService", "systemParameterService", function ($q, customerService, systemParameterService) {
                    return $q.all({
                        invbName: systemParameterService.getParameterByName("INVB.name")
                    }).then(function (data) {
                        return {
                            invbName: data.invbName.value

                        };
                    });
                }]
            },
            data: {
                analyticsTitle: null
            }
        });
    })
    .controller("PaymentsInvoobillController", function($scope, translate, parameters) {

        $scope.invbName = parameters.invbName;

        $scope.invbHeader = translate.property('ocb.payments.invoobill.activation.header', [$scope.invbName]);



    });
