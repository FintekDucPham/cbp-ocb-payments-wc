angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.future.manage.edit', {
            url: "/edit",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/future/manage/operations/edit/payments_future_manage_edit.html",
            controller: "PaymentsFutureManageEditController"
        }).state('payments.future.manage.edit.fill', {
            url: "/fill",
            templateUrl: function ($stateParams) {
                return pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/new/fill/payments_new_fill.html";
            },
            controller: 'NewPaymentFillController',
            resolve: {
                CURRENT_DATE: ['utilityService', function(utilityService){
                    return utilityService.getCurrentDate().then(function(currentDate){
                        return currentDate;
                    });
                }]
            }
        }).state('payments.future.manage.edit.verify', {
            url: "/verify",
            templateUrl: function ($stateParams) {
                return pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/new/verify/payments_new_verify.html";
            },
            controller: 'NewPaymentVerifyController'
        }).state('payments.future.manage.edit.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/future/manage/operations/edit/status/payments_future_manage_edit_status.html",
            controller: "NewPaymentStatusController"
        });
    })
    .controller('PaymentsFutureManageEditController', function ($scope, $q, lodash, insuranceAccounts, recipientManager, recipientGeneralService, authorizationService, $stateParams, paymentsService, rbPaymentOperationTypes, rbPaymentTypes, initialState, zusPaymentInsurances) {

        var idTypesMap = {
            "P": "PESEL",
            "N": "NIP",
            "R": "REGON",
            "1": "ID_CARD",
            "2": "PASSPORT",
            "3": "OTHER"
        };

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
        paymentDataResolveStrategy(rbPaymentTypes.INSURANCE.code, function(data){
            angular.forEach(data.paymentDetails, function(val, key){
                data[key] = val;
            });
            data.paymentType = 'TYPE_'+data.secondIDType;
            data.secondaryIdNo = data.secondIDNo;
            data.secondaryIdType = idTypesMap[data.secondIDType];
            data.declarationDate = data.declaration;
            data.realizationDate = new Date(data.realizationDate);
            data.recipientName = data.recipientName.join("\n");
            return insuranceAccounts.search().then(function(accounts){
                var matchedInsurance = lodash.find(accounts.content, {'accountNo': data.recipientAccountNo});
                if(matchedInsurance){
                    data.insurancePremiums = {};
                    data.insurancePremiums[matchedInsurance.insuranceCode] = {
                        currency: data.currency,
                        amount: data.amount
                    };
                }
                return true;
            });

        });

        paymentDataResolveStrategy(rbPaymentTypes.TAX.code, function(data){
            data.taxpayerData = data.senderName.join("\n");
            data.idType = idTypesMap[data.paymentDetails.idtype];
            data.idNumber = data.paymentDetails.idnumber;
            data.formCode = data.paymentDetails.formCode;
            data.periodType = data.paymentDetails.periodType;
            data.periodNo = data.paymentDetails.periodNumber;
            data.periodYear = data.paymentDetails.periodYear;
            data.obligationId = data.paymentDetails.obligationId;
            data.realizationDate = new Date(data.realizationDate);
            return $q.when(true);
        });

        paymentDataResolveStrategy(rbPaymentTypes.DOMESTIC.code, function(data){
            data.recipientName = data.recipientName.join('');
            data.realizationDate = new Date(data.realizationDate);
            return $q.when(true);
        });

        paymentDataResolveStrategy(rbPaymentTypes.OWN.code, function(data){
            data.description = data.title.join("\n");
            data.realizationDate = new Date(data.realizationDate);
            return $q.when(true);
        });

        $scope.payment.meta.transferType = 'loading';

        //dispatch
        $scope.payment.operation = rbPaymentOperationTypes.EDIT;

        $scope.payment.initData.promise = paymentsService.get(initialState.referenceId, {}).then(function(data){
            data.description = data.title;
            $scope.payment.meta.transferType = data.transferType;
            $q.when(paymentDataResolveStrategy(data.transferType)(data)).then(function(){
                lodash.extend($scope.payment.formData, data, $scope.payment.formData);
                $scope.payment.type = rbPaymentTypes[angular.uppercase(data.transferType)];
                $scope.payment.formData.referenceId = initialState.referenceId;
                $scope.payment.rbPaymentsStepParams = {
                    completeState: 'payments.recipients.list',
                    finalAction: $scope.saveRecipient,
                    footerType: 'payment',
                    onClear: $scope.clearForm,
                    cancelState: 'payments.recipients.list',
                    labels : {
                        cancel: 'config.multistepform.buttons.cancel',
                        change: 'config.multistepform.buttons.change',
                        edit: 'config.multistepform.buttons.edit',
                        clear: 'config.multistepform.buttons.clear',
                        prev: 'config.multistepform.buttons.prev',
                        next: 'config.multistepform.buttons.next',
                        accept: 'config.multistepform.buttons.accept',
                        finalize: 'raiff.payments.new.btn.finalize',
                        finalAction: 'raiff.payments.new.btn.final_action'
                    },
                    visibility:{
                        cancel: true,
                        change: true,
                        clear: true,
                        next: true,
                        accept: true,
                        finalAction: true,
                        finalize: true
                    }
                };
            });


        });



        $scope.clearForm = function () {
            $scope.payment.formData = {};
            $scope.$broadcast('clearForm');
        };

        $scope.prepareOperation = $scope.create;

    });