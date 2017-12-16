angular.module('ocb-payments')
    .constant('rbRecipientOperationType', {
        "NEW": {
            code: 'NEW',
            state: 'new'
        },
        "EDIT": {
            code: 'EDIT',
            state: 'edit'
        },
        "REMOVE": {
            code: 'REMOVE',
            state: 'remove'
        }
    })
    .constant('rbRecipientTypes', {
        "DOMESTIC": {
            code: 'DOMESTIC',
            state: 'domestic'
        }
    })
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.pending', {
            url: "/pending",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/pending/payments_pending.html",
            controller: "PaymentsPendingTransactionController",
            data: {
                analyticsTitle: null
            }
        });
    }) .controller('PaymentsPendingTransactionController', function ($scope,bdMainStepInitializer) {

        bdMainStepInitializer($scope, 'pendingTransaction', {
            formName: 'pendingTransactionForm',
            formData: {},
            options: {},
            meta: {},
            validation: {},
            items :[],
        });



    $scope.returnTrans = function(){
        $scope.pendingTransaction.returnTrans();
    };


    $scope.approveTrans = function(){
        $scope.pendingTransaction.approveTrans();
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
    $scope.selectedTrans = [];
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