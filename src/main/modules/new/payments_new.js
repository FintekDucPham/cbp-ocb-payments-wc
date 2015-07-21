angular.module('raiffeisen-payments')
    .constant('rbPaymentTypes', {
        "DOMESTIC" : {
            code: 'DOMESTIC',
            state: 'domestic'
        },
        "INTERNAL" : {
            code: 'INTERNAL',
            state: 'internal'
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
            type: lodash.find(rbPaymentTypes, { state: $stateParams.paymentType || 'domestic' }),
            options: {
                fixedAccountSelection: false,
                fixedRecipientSelection: false
            },
            formData: {
                senderAccountId: null,
                recipientAccountNo: null,
                recipientData: null,
                title: null,
                amount: null,
                executionDate: null
            },
            items: {

            },
            meta: {
                restrictReasons: ["LOST", "STOLEN"],
                cardList: [],
                paymentTypes: lodash.map(rbPaymentTypes, function(value) {
                    return value;
                })
            }
        }, viewStateService.getFormData('newPaymentForm'));

        function findStepFromState(name) {
            return name.substr(name.lastIndexOf('.') + 1);
        }

        $scope.clearForm = function() {
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
            return pathService.generateTemplatePath("raiffeisen-payments") + '/modules/new/' + stepName + '/payments_new_' + $stateParams.paymentType + '_' + stepName + '.html';
        };

        $scope.changePaymentType = function(type) {
            $state.go('payments.new.fill', {
                paymentType: type.state
            });
        };

    });