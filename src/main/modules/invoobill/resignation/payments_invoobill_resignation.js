angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.invoobill.resignation', {
            url: "/resignation",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/invoobill/resignation/payments_invoobill_resignation.html",
            controller: "PaymentsInvoobillResignationController",
            params: {
                referenceId: null
            },
            data: {
                analyticsTitle: "raiff.payments.invoobill.activation.header"
            }
        });
    })
    .controller('PaymentsInvoobillResignationController', function ($scope, $state, invoobillPaymentsService, menuService) {

        $scope.cancel = function() {
            $state.go("payments.invoobill.list");
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
                            menuService.removeMenuItem('raiffeisen-payments', 'payments.invoobill');

                            var menuItem = {
                                id: "payments.invoobill",
                                label: 'raiff.payments.invoobill.label',
                                icon: "raiff-icons invoobill",
                                action: "payments.invoobill.activation",
                                priority: 9
                            };
                            menuService.pushMenuItems('raiffeisen-payments', menuItem);

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
