angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.invoobill.resignation', {
            url: "/resignation",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/invoobill/resignation/payments_invoobill_resignation.html",
            controller: "PaymentsInvoobillResignationController",
            params: {
                referenceId: null
            },
            data: {
                analyticsTitle: "ocb.payments.invoobill.activation.header"
            }
        });
    })
    .controller('PaymentsInvoobillResignationController', function ($scope, $state, invoobillPaymentsService, menuService, systemParameterService, translate) {

        $scope.cancel = function() {
            $state.go("payments.invoobill.list");
        };

        $scope.labels = {
            resignationDescription: translate.property('ocb.payments.invoobill.resignation.descrition', [$scope.invbName])
        };


        $scope.resignation = function() {
            invoobillPaymentsService.isResignationAccessStatus().then(function(resignationAccessStatus){
                if(resignationAccessStatus) {
                    //rezygnacja
                    var params = {
                        status: "INACTIVE"
                    };

                    invoobillPaymentsService.setStatus(params).then(function(change) {
                        if(change) {
                            menuService.removeMenuItem('ocb-payments', 'payments.invoobill');

                            var menuItem = {
                                id: "payments.invoobill",
                                label: $scope.invbName,
                                icon: "ocb-icons invoobill",
                                action: "payments.invoobill.activation",
                                priority: 8
                            };
                            menuService.pushMenuItems('ocb-payments', menuItem);

                            $state.go("payments.invoobill.resignationSuccessful");
                        }
                    });

                } else {
                    //brak uprawnien - komunikat
                    $state.go('payments.invoobill.resignationLackPermission');
                }
            });





        };

    });
