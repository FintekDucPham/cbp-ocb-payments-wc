angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.future.manage', {
            url: "/manage",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/future/manage/payments_future_manage.html",
            controller: "PaymentsFutureManageController",
            data: {
                analyticsTitle: "raiff.payments.future.label"
            }
        });
    })
    .controller('PaymentsFutureManageController', function ($scope, $timeout, lodash, $rootScope, $stateParams,
                                                                pathService, NRB_REGEX, CUSTOM_NAME_REGEX,
                                                                bdMainStepInitializer, validationRegexp,
                                                                rbPaymentTypes, transferService, $state,
                                                                viewStateService, rbPaymentOperationTypes) {

        bdMainStepInitializer($scope, 'payment', {
            formName: 'paymentForm',
            type: null,
            operation: null,
            formData: {},
            transferId: {},
            options: {},
            initData: {
                promise: null,
                data: null
            },
            token: {
                model: {},
                params: {}
            },
            meta: {
                recipientTypes: lodash.map(rbPaymentTypes)
            },
            manageAction: ""
        });

        $scope.setRecipientDataExtractor = function(fn) {
            $scope.resolveRecipientData = fn;
        };

        $scope.getTemplateName = function (stepName) {
            if($scope.payment.type){
                if($scope.payment.type.code === rbPaymentTypes.OWN.code){
                    return "{0}/modules/future/manage/operations/edit/payments_future_manage_edit_internal.html".format(pathService.generateTemplatePath("raiffeisen-payments"));
                }else{
                    return "{0}/modules/new/{1}/{2}/payments_new_{2}_{1}.html".format(pathService.generateTemplatePath("raiffeisen-payments"), stepName, $scope.payment.type.state);
                }
            }else{
                return undefined;
            }
        };

        var alreadySet = false;
        $scope.setDefaultValues = function (value) {
            if (!alreadySet) {
                angular.extend($scope.payment.formData, value, lodash.pick($scope.payment.formData, angular.isDefined));
                alreadySet = true;
            }
        };

        $scope.step = 'fill';
        $scope.getInternalProxyTemplate = function(stepName){
            return "{0}/modules/new_internal/{1}/payments_new_internal_{1}.html".format(pathService.generateTemplatePath("raiffeisen-payments"), stepName);
        };

        $scope.getProperPaymentService = function() {
            return transferService;
        };

        $scope.resolveRecipientData = null;

        $scope.saveRecipient = function() {
            if($scope.resolveRecipientData) {
                var recipientType = $scope.payment.type.state.toLowerCase();
                if(recipientType==='swift' || recipientType==='sepa'){
                    recipientType = 'foreign';
                }
                $state.go("payments.recipients.manage.new.fill", {
                    recipientType: recipientType,
                    operation: 'new',
                    recipient: $scope.resolveRecipientData()
                });
            }
        };


        $scope.addAsStandingOrder = function() {
            viewStateService.setInitialState('payments.new', {
                paymentOperationType: rbPaymentOperationTypes.NEW
            });

            $state.transitionTo('payments.new.fill', {
                paymentType: 'standing',
                payment: $scope.payment.formData
            }, {reload: true}).finally(function() {
                // workaround for paymentType parameter and state reloading problems
                $state.go('payments.new.fill', {
                    paymentType: 'standing',
                    payment: $scope.payment.formData
                });
            });
        };
    }
);