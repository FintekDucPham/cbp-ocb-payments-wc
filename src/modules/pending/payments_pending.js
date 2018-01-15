angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.pending', {
            url: "/pending",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/pending/payments_pending.html",
            controller: "PaymentsPendingTransactionController",
            data: {
                analyticsTitle: null
            }
        });
    }) .controller('PaymentsPendingTransactionController', function ($scope,bdMainStepInitializer,customerService,rbPaymentOperationTypes) {

        bdMainStepInitializer($scope, 'pendingTransaction', {
            formName: 'pendingTransactionForm',
            formData: {},
            options: {
                fixedAccountSelection: false
            },
            operation: rbPaymentOperationTypes.NEW,
            token: {
                model: null,
                params: {}
            },
            meta: {},
            validation: {},
            items :[],
            dataObject: $scope.payment
        });


    $scope.returnTrans = function(){
        $scope.pendingTransaction.returnTrans();
    };

    $scope.modifyTrans = function(){
        $scope.pendingTransaction.modifyTrans();
    };

    $scope.deleteTrans = function(){
        $scope.pendingTransaction.deleteTrans();
    };
    $scope.selectedTrans = function () {
        return $scope.pendingTransaction.selectedTrans();
    };
    $scope.clearData = function () {
        $scope.pendingTransaction.clearData();
    };

    // $scope.userRole = "";
    customerService.getCustomerDetails().then(function(data) {
        if (data.customerDetails) {
            $scope.userRole = data.customerDetails.microRole;

            $scope.userActions = {};
            switch ($scope.userRole) {
                case "INPUTTER":
                    $scope.userActions = {
                        MODIFY: true,
                        RETURN: false,
                        APPROVE: false,
                        DELETE: true
                    }
                    break;
                case "CHECKER1":
                    $scope.userActions = {
                        MODIFY: false,
                        RETURN: true,
                        APPROVE: true,
                        DELETE: false
                    }
                    break;
                case "CHECKER2":
                    $scope.userActions = {
                        MODIFY: false,
                        RETURN: true,
                        APPROVE: true,
                        DELETE: false
                    }
                    break;
                case "APPROVER":
                    $scope.userActions = {
                        MODIFY: false,
                        RETURN: true,
                        APPROVE: true,
                        DELETE: false
                    }
                    break;
                case "MASTER":
                    $scope.userActions = {
                        MODIFY: true,
                        RETURN: true,
                        APPROVE: true,
                        DELETE: true
                    }
                    break;
                default:
                    userActions = {
                        MODIFY: false,
                        RETURN: false,
                        APPROVE: false,
                        DELETE: false
                    }
            }

            $scope.statusByUser= {};
            switch ($scope.userRole) {

                case "INPUTTER":
                    $scope.statusByUser = {
                        C1:false,
                        C2:false,
                        RT:true,
                        WA:false
                    }
                    break;
                case "CHECKER1":
                    $scope.statusByUser = {
                        C1:true,
                        C2:false,
                        RT:false,
                        WA:false
                    }
                    break;
                case "CHECKER2":
                    $scope.statusByUser = {
                        C1:false,
                        C2:true,
                        RT:false,
                        WA:false
                    }
                    break;
                case "APPROVER":
                    $scope.statusByUser = {
                        C1:false,
                        C2:false,
                        RT:true,
                        WA:true
                    }
                    break;
                case "MASTER":
                    $scope.statusByUser = {
                        C1:true,
                        C2:true,
                        RT:true,
                        WA:true
                    }
                    break;
                default:
                    $scope.statusByUser = {
                        C1:false,
                        C2:false,
                        RT:false,
                        WA:false
                    }
            }
        }
    })

    $scope.getUserType = function () {
        return $scope.userActions;
    }
    $scope.getStatusByRole = function () {
        return $scope.statusByUser;
    }
    $scope.paymentsPendingTransactionFormParams = {
        completeState:'payments.pending.fill',
        onClear: $scope.clearForm,
        cancelState:'payments.pending.fill',
        footerType: 'pendingTransaction',
        returnTrans: $scope.returnTrans,
        approveTrans: $scope.approveTrans,
        modifyTrans: $scope.modifyTrans,
        deleteTrans: $scope.deleteTrans,
        selectedTrans: $scope.selectedTrans,
        clearData: $scope.clearData,
        getUserType: $scope.getUserType,
        getStatusByRole: $scope.getStatusByRole,
        labels:{

            return:"ocb.payments.pending.list.button.return.label",
            approve:'ocb.payments.pending.list.button.approve.label',
            modify:"ocb.payments.pending.list.button.modify.label",
            delete:"ocb.payments.pending.list.button.delete.label",
            print:"ocb.payments.pending.list.button.print.label",
        },
        visibility:{
            return:false
        },
    }
});