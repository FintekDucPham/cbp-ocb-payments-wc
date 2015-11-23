angular.module('raiffeisen-investments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.standing.manage.new', {
            url: "/new",
            abstract: true,
            controller: "PaymentsStandingManageAddController",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/standing/manage/new/payments_standing_manage_new.html",
            resolve: {
                activeOptions: function () {
                    return {
                        'titleKey': "raiff.investments.buy.label.header",
                        'activeLinks': "investement_buy",
                        'contentClass': "investment-buy",
                        'completeState': "investments.confirmed.content",
                        'cancelState': "investments.confirmed.content",
                        'button': {
                            'labels': {
                                'save': "raiff.investments.buy.button.labels.save",
                                'change': "raiff.investments.buy.button.labels.change"
                            }
                        }
                    };
                }
            }
        });
    })
    .controller('InvestmentBuyController', function ($scope, $state, $stateParams, bdMainStepInitializer, cardsSelectInitializer, activeOptions, pathService, investmentsService, gate, availableAccountsList, ACCOUNT_PARAMS) {
        if (!availableAccountsList || !availableAccountsList.content || (availableAccountsList.content.length <= 0)) {
            $state.go('investments.no_accounts_available');
            return;
        }

        bdMainStepInitializer($scope, 'paymentsStandingManageNewContext', {
            formData: {},
            meta: {},
            items: {},
            formName: 'paymentsStandingManageNewForm'
        });

        $scope.activeOptions = activeOptions;

        $scope.onClear = function () {
            $scope.$broadcast('paymentsStandingManageNewOnClear');
        };

    });