angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.invoobill.activation', {
            url: "/activation",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/invoobill/activation/payments_invoobill_activation.html",
            controller: "PaymentsInvoobillActivationController",
            params: {
                referenceId: null
            },
            resolve: {
                parameters: ["$q", "customerService", "systemParameterService", function ($q, customerService, systemParameterService) {
                    return $q.all({
                        linkForDetal: systemParameterService.getParameterByName("page.url.invb.regulations.detal"),
                        linkForMicro: systemParameterService.getParameterByName("page.url.invb.regulations.micro"),
                        customerDetails: customerService.getCustomerDetails()
                    }).then(function (data) {
                        return {
                            micro: {
                                link: data.linkForMicro.value
                            },
                            detal: {
                                link: data.linkForDetal.value
                            },
                            customerDetails: {
                                context: data.customerDetails.customerDetails.context
                            }
                        };
                    });
                }]
            },
            data: {
                analyticsTitle: "raiff.payments.invoobill.activation.header"
            }
        });
    })
    .controller('PaymentsInvoobillActivationController', function ($scope, $sce, $state, parameters, invoobillPaymentsService) {

        $scope.model = {
            regulaminsAccept: false
        };

        $scope.link = parameters.customerDetails.context === 'DETAL' ? parameters.micro.link : parameters.detal.link;

        $scope.accept = function(form){
            form.regulaminsAccept.$setValidity('rulesRegulaminsRequired', $scope.model.regulaminsAccept);
            if (form.$valid) {
                var params = {
                    status: "ACTIVE"
                }
                invoobillPaymentsService.setStatus(params);
                menuService.removeMenuItem('raiffeisen-payments', 'payments.invoobill');

                var menuItem = {
                    id: "payments.invoobill",
                    label: 'raiff.payments.invoobill.label',
                    icon: "raiff-icons invoobill",
                    action: "payments.invoobill.list",
                    priority: 9
                };
                menuService.pushMenuItems('raiffeisen-payments', menuItem);

                $state.go("payments.invoobill.activationSuccessful");
            }
        };

        $scope.notInterested = function () {
            $state.go("payments.recipients.list");
        };

        $scope.onRulesChange = function (form) {
            form.regulaminsAccept.$setValidity('rulesRegulaminsRequired', true);
        }

    });
