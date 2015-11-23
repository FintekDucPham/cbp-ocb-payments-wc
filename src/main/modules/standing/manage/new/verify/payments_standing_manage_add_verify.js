angular.module('raiffeisen-investments')

    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('investments.confirmed.buy.verify', {
            url: "/verify",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-investments") + "/modules/confirmed/fundBuy/verify/investment_buy_verify.html",
            controller: "InvestmentBuyVerifyController",
            resolve: {
                identity: ['userService', function(userService) {
                    return userService.getIdentityDetails();
                }]
            }
        });
    })
    .constant('SUPPORTED_CODES', [99,20,40,60,100,98])
    .controller('InvestmentBuyVerifyController', function ($scope, bdVerifyStepInitializer, translate, $stateParams, $state, initialState, viewStateService, domService, formService, cardsService, bdStepStateEvents, lodash, initialState, authorizationService, identity, gate, SUPPORTED_CODES) {
        // we do not want to show this page if someone enter url directly to the broweser
        if (!initialState || !initialState.content) {
            $state.go('investments.confirmed.buy.fill');
            return;
        }

        $scope.token = {
            model: null
        };

        $scope.resourceId = initialState.content;
        $scope.identity  = identity;

        var forwardMove = function (actions) {
            gate.command('realize_investment_operation', {
                referenceId: initialState.content,
                customerId: identity.id,
                credentials: $scope.token.model.input.model
            }).then(function (data) {
                var parts = [];

                if (data && data.content) {
                    parts = data.content.split('|');
                    if (parts.length >= 2) {
                        if (_.indexOf(SUPPORTED_CODES, parseInt(parts[1], 10)) != -1) {

                            viewStateService.setInitialState('investments.confirmed.buy.status', {
                                status:  (parts[0] == "OK" ? "OK" : "REJECTED"),
                                code: parts[1]
                            });
                            actions.proceed();
                        }
                    }
                }
            }, function() {
                $scope.token.model.$proceed();
            });
        };

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            if ($scope.token.model.view.name === 'FORM') {
                if ($scope.token.model.input.$isValid()) {
                    forwardMove(actions);
                }
            }
            else {
                $scope.token.model.$proceed();
            }
        });

        bdVerifyStepInitializer($scope, {
            formName: 'investmentBuyForm',
            dataObject: $scope.investmentBuyContext
        });
    });