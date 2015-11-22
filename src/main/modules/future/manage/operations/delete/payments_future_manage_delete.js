angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.future.manage.delete', {
            url: "/delete",
//            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/future/manage/operations/delete/payments_future_manage_delete.html",
            controller: "PaymentsFutureManageDeleteController"
        });
    })
    .constant('CODE_TO_ICONS', {
        "100": "success",
        "99": "error",
        "98": "error",
        "default": "warning"
    })
    .controller('PaymentsFutureManageDeleteController', function ($scope, paymentsService, pathService, $state, gate, viewStateService, RB_TOKEN_AUTHORIZATION_CONSTANTS, CODE_TO_ICONS) {
        // TODO: ideka from initialState wyciagnac
        $scope.paymentDetailsPromise = paymentsService.get('NIB52381010-8eb7-463b-947d-f01cb8@waiting', {});

        $scope.paymentDetailsPromise.then(function(details) {
            // we need such structure and naming because we reuse some templates
            $scope.detailsTemplatePath = pathService.generateTemplatePath("raiffeisen-payments") + "/modules/future/list/details/"+details.transferType+"_future_payment_details.html";
            $scope.$data = {
                details: details
            };
        });

        $scope.token = {
            model: null
        };


        $scope.onProceedButtonClick = function() {

            if($scope.token.model.view.name===RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.FORM) {
                if($scope.token.model.input.$isValid()) {

                    paymentsService.remove($scope.$data.details, {
                        // verifyToken
                        id: $scope.token.model.currentToken.data.id,
                        value: $scope.token.model.input.model
                    }).then(function(resp) {
                        viewStateService.setInitialState('payments.future.manage.delete.status', {
                            status: {
                                code: resp.status.code,
                                icon: CODE_TO_ICONS.hasOwnProperty(resp.status.code) ? CODE_TO_ICONS[resp.status.code] : CODE_TO_ICONS['default']
                            }
                        });
                        $state.go('payments.future.manage.delete.status');
                    });
                }
            }else if($scope.token.model.view.name===RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.ACTION_SELECTION) {
                $scope.token.model.$proceed();
            }


        };

        $scope.onCancelButtonClick = function() {
            $state.go('payments.future.list');
        };
    });