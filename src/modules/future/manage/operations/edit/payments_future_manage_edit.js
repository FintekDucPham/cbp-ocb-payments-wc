angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.future.manage.edit', {
            url: "/edit",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/future/manage/operations/edit/payments_future_manage_edit.html",
            controller: "PaymentsFutureManageEditController",
            data: {
                analyticsTitle: "ocb.payments.future.edit.label"
            }
        }).state('payments.future.manage.edit.fill', {
            url: "/fill",
            templateUrl: function ($stateParams) {
                return pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/new/fill/payments_new_fill.html";
            },
            controller: 'NewPaymentFillController',
            resolve: {
                CURRENT_DATE: ['utilityService', function(utilityService){
                    return utilityService.getCurrentDateWithTimezone();
                }],
                paymentRulesResolved: ['paymentRules', function(paymentRules){
                    return paymentRules.search();
                }]
            },
            data: {
                analyticsTitle: "config.multistepform.labels.step1"
            }
        }).state('payments.future.manage.edit.verify', {
            url: "/verify",
            templateUrl: function ($stateParams) {
                return pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/new/verify/payments_new_verify.html";
            },
            controller: 'NewPaymentVerifyController',
            data: {
                analyticsTitle: "config.multistepform.labels.step2"
            }
        }).state('payments.future.manage.edit.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/future/manage/operations/edit/status/payments_future_manage_edit_status.html",
            controller: "NewPaymentStatusController",
            data: {
                analyticsTitle: "config.multistepform.labels.step3"
            }
        });
    })
    .controller('PaymentsFutureManageEditController', function ($scope, $q, lodash, formService, recipientManager, authorizationService, $stateParams, paymentsService, rbPaymentOperationTypes, rbPaymentTypes, initialState) {

        //dispatcher
        var paymentDataResolveStrategyStrategies = {};
        function paymentDataResolveStrategy(transferType, strategy){
            if(strategy){
                paymentDataResolveStrategyStrategies[transferType] = strategy;
            }
            if(paymentDataResolveStrategyStrategies[transferType]){
                return paymentDataResolveStrategyStrategies[transferType];
            }else{
                return function(){
                    return $q.when(true);
                };
            }

        }

        //set strategies
        paymentDataResolveStrategy(rbPaymentTypes.DOMESTIC.code, function(data){
            data.recipientName = data.recipientName.join('');
            data.description = data.title.join('');
            data.realizationDate = new Date(data.realizationDate);
            return $q.when(true);
        });

        paymentDataResolveStrategy(rbPaymentTypes.OWN.code, function(data){
            data.description = data.title.join("");
            data.realizationDate = new Date(data.realizationDate);
            return $q.when(true);
        });

        $scope.payment.meta.transferType = 'loading';

        //dispatch
        $scope.payment.operation = rbPaymentOperationTypes.EDIT;

        $scope.clearFormFunction = null;
        $scope.setClearFormFunction = function(fn){
            $scope.clearFormFunction = fn;
        };

        $scope.clearForm = function() {
            if(!$scope.clearFormFunction){
                var referenceId = angular.copy($scope.payment.formData.referenceId);
                $scope.payment.formData = {};
                $scope.payment.formData.referenceId  = referenceId;
            }else{
                $scope.clearFormFunction();
            }
            $scope.$broadcast('clearForm');
        };

        $scope.payment.rbPaymentsStepParams = {
            completeState: 'payments.future.list',
            finalAction: $scope.saveRecipient,
            footerType: 'payment',
            onClear: $scope.clearForm,
            cancelState: 'payments.future.list',
            addAsStandingOrder: $scope.addAsStandingOrder,
            labels : {
                finalAction: 'ocb.payments.new.btn.final_action',
                addAsStandingOrder: 'ocb.payments.new.btn.add_as_standing_order'
            },
            visibility:{
                next: true,
                fillReturn: false,
                finalize: true
            }
        };

        $scope.payment.initData.promise = paymentsService.get(initialState.referenceId, {}).then(function(data){
            data.description = data.title;
            $scope.payment.rbPaymentsStepParams.visibility.addAsStandingOrder = data.transferType == 'OWN' || data.transferType == 'DOMESTIC';
            $scope.payment.meta.transferType = data.transferType;
            $scope.payment.type = rbPaymentTypes[angular.uppercase(data.transferType)];
            $q.when(paymentDataResolveStrategy(data.transferType)(data)).then(function(){
                lodash.extend($scope.payment.formData, data, $scope.payment.formData);
                $scope.payment.type = rbPaymentTypes[angular.uppercase(data.transferType)];
                $scope.payment.formData.referenceId = initialState.referenceId;
                $scope.payment.referenceId = initialState.referenceId;
                $scope.payment.meta.editFuturePayment = true;

                // dla przelewow wlasnych guzik zapisz odbiorce jest niewidczon
                if ($scope.payment.type.code == 'OWN') {
                    $scope.payment.rbPaymentsStepParams.visibility.finalAction = false;
                }

            });
        });


        $scope.prepareOperation = $scope.create;

    });