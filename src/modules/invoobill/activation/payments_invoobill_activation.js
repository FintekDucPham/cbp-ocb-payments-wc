angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.invoobill.activation', {
            url: "/activation",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/invoobill/activation/payments_invoobill_activation.html",
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
                analyticsTitle: "ocb.payments.invoobill.activation.header"
            }
        });
    })
    .controller('PaymentsInvoobillActivationController', function ($scope, $sce, $state, parameters, invoobillPaymentsService, menuService, translate) {


        $scope.labels = {
            showCreditors: translate.property('ocb.payments.invoobill.show_creditors', [$scope.invbName]),
            termOfUse: translate.property('ocb.payments.invoobill.activation.link.label', [$scope.invbName]),
            termOfUseRequired: translate.property('ocb.payments.invoobill.activation.regulamins.reqiured', [$scope.invbName])
        };

        $scope.model = {
            regulaminsAccept: false
        };

        $scope.link = parameters.customerDetails.context === 'DETAL' ? parameters.detal.link : parameters.micro.link;

        $scope.accept = function(form){
            form.regulaminsAccept.$setValidity('rulesRegulaminsRequired', $scope.model.regulaminsAccept);
            if (form.$valid) {
                var params = {
                    status: "ACTIVE"
                };
                invoobillPaymentsService.setStatus(params);
                menuService.removeMenuItem('ocb-payments', 'payments.invoobill');

                var menuItem = {
                    id: "payments.invoobill",
                    label: $scope.invbName,
                    icon: "ocb-icons invoobill",
                    action: "payments.invoobill.list",
                    priority: 8
                };
                menuService.pushMenuItems('ocb-payments', menuItem);

                $state.go("payments.invoobill.activationSuccessful");
            }
        };

        $scope.notInterested = function () {
            invoobillPaymentsService.notInterested();
            $state.go("payments.recipients.list");
        };

        $scope.onRulesChange = function (form) {
            form.regulaminsAccept.$setValidity('rulesRegulaminsRequired', true);
        };

    });
