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
            controller: 'NewPaymentFillController'
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
            data.declarationDate = data.declaration;
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

        paymentDataResolveStrategy(rbPaymentTypes.OWN.code, function(data){
            data.description = data.title.join("\n");
            return $q.when(true);
        });



        //dispatch
        $scope.payment.operation = rbPaymentOperationTypes.EDIT;

        $scope.payment.initData.promise = paymentsService.get(initialState.referenceId, {}).then(function(data){
            data.description = data.title;

            $q.when(paymentDataResolveStrategy(data.transferType)(data)).then(function(){
                lodash.extend($scope.payment.formData, data, $scope.payment.formData);
                $scope.payment.type = rbPaymentTypes[angular.uppercase(data.transferType)];
                $scope.payment.formData.referenceId = initialState.referenceId;
            });


        });

        $scope.clearForm = function () {
            $scope.payment.formData = {};
            $scope.$broadcast('clearForm');
        };

        $scope.prepareOperation = $scope.create;

    });