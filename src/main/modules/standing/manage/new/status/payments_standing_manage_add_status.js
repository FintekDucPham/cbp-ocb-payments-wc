angular.module('raiffeisen-investments')
    .constant('CODE_TO_ICONS', {
        "100": "success",
        "99": "error",
        "98": "error",
        "default": "warning"
    })
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('investments.confirmed.buy.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-investments") + "/modules/confirmed/fundBuy/status/investment_buy_status.html",
            controller: "InvestmentBuyStatusController"
        });
    })
    .controller('InvestmentBuyStatusController', function ($scope, bdStatusStepInitializer, $state, bdStepStateEvents, initialState, CODE_TO_ICONS) {
        $scope.status = initialState.status;
        $scope.code   = initialState.code;

        $scope.icon = CODE_TO_ICONS.default;

        if (initialState && initialState.status) {
            if (CODE_TO_ICONS.hasOwnProperty(initialState.code)) {
                $scope.icon = CODE_TO_ICONS[initialState.code];
            }
        }

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function () {
            $state.go('investments.content');
        });

        bdStatusStepInitializer($scope, {
            formName: 'investmentBuyForm',
            dataObject: $scope.investmentBuyContext
        });
    });