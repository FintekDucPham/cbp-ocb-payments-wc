angular.module('raiffeisen-payments')
    .constant('rbPaymentTypes', {
        "DOMESTIC": {
            code: 'DOMESTIC',
            state: 'domestic',
            service: 'domestic'
        },
        "INTERNAL": {
            code: 'INTERNAL',
            state: 'internal',
            service: 'own'
        },
        "ZUS": {
            code: 'ZUS',
            state: 'zus',
            service: 'zus'
        }
    })
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.new', {
            url: "/new/:paymentType",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/new/payments_new.html",
            controller: "PaymentsNewController"
        });
    })
    .controller('PaymentsNewController', function (rbPaymentTypes, pathService, $scope, translate, $stateParams, $state, viewStateService, formService, cardsService, cardRestrictEvents, lodash) {

        $scope.payment = angular.extend({
            type: lodash.find(rbPaymentTypes, {state: $stateParams.paymentType || 'domestic'}),
            options: {
                fixedAccountSelection: false,
                fixedRecipientSelection: false
            },
            formData: {},
            items: {},
            meta: {
                paymentTypes: lodash.map(rbPaymentTypes, function (value) {
                    return value;
                })
            }
        }, viewStateService.getFormData('newPaymentForm'));

        function findStepFromState(name) {
            return name.substr(name.lastIndexOf('.') + 1);
        }

        $scope.clearForm = function () {
            $scope.payment.formData = {};
            $scope.payment.items = {};
            $scope.$broadcast('clearForm');
        };

        $scope.activeStep = {
            id: findStepFromState($state.current.name)
        };

        function commitState() {
            //viewStateService.setInitialState($state.current.name, {});
            //viewStateService.appendFormData('cardRestrictForm', $scope.restrict.formData);
            //viewStateService.setInitialState('cards.restrict.verify', $scope.restrict.formData);
        }

        $scope.moveForward = function () {
            commitState();
            $scope.$broadcast(cardRestrictEvents.FORWARD_MOVE);
        };

        $scope.moveBackwards = function () {
            commitState();
            $scope.$broadcast(cardRestrictEvents.BACKWARD_MOVE);
        };

        $scope.getTemplateName = function (stepName) {
            return "{0}/modules/new/{1}/{2}/payments_new_{2}_{1}.html".format(pathService.generateTemplatePath("raiffeisen-payments"), stepName, $stateParams.paymentType);
        };

        $scope.changePaymentType = function (type) {
            $state.go('payments.new.fill', {
                paymentType: type.state
            });
        };

    });