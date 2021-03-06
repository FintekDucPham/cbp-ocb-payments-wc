angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.future.manage.delete', {
            url: "/delete",
//            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/future/manage/operations/delete/payments_future_manage_delete.html",
            controller: "PaymentsFutureManageDeleteController",
            data: {
                analyticsTitle: "ocb.payments.future.remove.label"
            }
        });
    })
    .constant('CODE_TO_ICONS_PA', {
        "100": "success",
        "99": "error",
        "98": "error",
        "60": "success",
        "default": "warning"
    })
    .controller('PaymentsFutureManageDeleteController', function ($scope, paymentsService, pathService, $state, gate, viewStateService, RB_TOKEN_AUTHORIZATION_CONSTANTS, CODE_TO_ICONS_PA, initialState, rbPaymentTypes, $q, lodash, transferService) {
        // TODO: ideka from initialState wyciagnac
        //$scope.paymentDetailsPromise = paymentsService.get(initialState.paymentId, {});
        $scope.countryList = (initialState || {}).countryList;

        $scope.RB_TOKEN_AUTHORIZATION_CONSTANTS = RB_TOKEN_AUTHORIZATION_CONSTANTS;
        $scope.tokenParams = {
            resourceId: initialState.referenceId
        };
        $scope.$data = initialState.paymentDetails;

        lodash.extend($scope.$data, {
            operationType: 'DELETE'
        });
        $scope.detailsTemplatePath = pathService.generateTemplatePath("ocb-payments") + "/modules/future/list/details/"+$scope.$data.details.transferType.toLowerCase()+"_future_payment_details.html";
        $scope.payment = {
            formData: {},
            meta: {}
        };
       /* $scope.paymentDetailsPromise.then(function(details) {
            console.debug(details);
            details.referenceId = initialState.paymentId;
            // we need such structure and naming because we reuse some templates
            $scope.detailsTemplatePath = pathService.generateTemplatePath("ocb-payments") + "/modules/future/list/details/"+details.transferType+"_future_payment_details.html";
            $scope.$data = {
                operationType: 'DELETE',
                details: details
            };
        });*/

        $scope.token = {
            model: null
        };

        function proceedAction(responseCode){
            viewStateService.setInitialState('payments.future.manage.delete.status', {
                status: {
                    code: responseCode,
                    icon: CODE_TO_ICONS_PA.hasOwnProperty(responseCode) ? CODE_TO_ICONS_PA[responseCode] : CODE_TO_ICONS_PA['default']
                }
            });
            $state.go('payments.future.manage.delete.status');
        }
        $scope.onProceedButtonClick = function() {

            if($scope.token.model.view.name===RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.FORM) {
                if($scope.token.model.input.$isValid()) {
                    transferService.realize( $scope.tokenParams.resourceId, $scope.token.model.input.model).then(function (resultCode) {
                        var parts = resultCode.split("|");
                        var code = parts[1] || "99";
                        proceedAction(code);
                    }).catch(function (error) {
                        if($scope.token.model && $scope.token.model.$tokenRequired){
                            if(!$scope.token.model.$isErrorRegardingToken(error)){
                                proceedAction("99");
                            }
                        }else{
                            proceedAction("99");
                        }
                    });
/*
                    paymentsService.remove(responseObject, {
                        // verifyToken
                        tokenId: $scope.token.model.currentToken.data.id, // TODO: TOKEN ID
                        tokenValue: $scope.token.model.input.model
                    }).then(function(resp) {
                        viewStateService.setInitialState('payments.future.manage.delete.status', {
                            status: {
                                code: resp.status.code,
                                icon: CODE_TO_ICONS_PA.hasOwnProperty(resp.status.code) ? CODE_TO_ICONS_PA[resp.status.code] : CODE_TO_ICONS_PA['default']
                            }
                        });
                        $state.go('payments.future.manage.delete.status');
                    });*/
                }
            }else if($scope.token.model.view.name===RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.ACTION_SELECTION) {
                $scope.token.model.$proceed();
            }
        };

        $scope.onCancelButtonClick = function() {
            // TODO JAKO_DISABLE planned payments
            $state.go('payments.external.new.fill');
            //$state.go('payments.future.list');
        };

    });