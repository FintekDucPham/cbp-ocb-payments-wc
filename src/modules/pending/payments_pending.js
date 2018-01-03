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
    }) .controller('PaymentsPendingTransactionController', function ($scope,bdMainStepInitializer,pendingTransactionService) {

        bdMainStepInitializer($scope, 'pendingTransaction', {
            formName: 'pendingTransactionForm',
            formData: {},
            options: {},
            meta: {},
            validation: {},
            items :[],
            dataObject: $scope.payment
        });



    $scope.returnTrans = function(){
        $scope.pendingTransaction.returnTrans();
    };


    // $scope.approveTrans = function(){
    //     $scope.pendingTransaction.approveTrans();
    // };
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
    // $scope.selectedTrans = [];
    //todo get user type
    $scope.userRole = "";

    $scope.getUserType = function () {
        var userActions = {};
        switch ($scope.userRole) {

            case "INPUTTER":
                userActions = {
                        MODIFY: true,
                        RETURN: false,
                        APPROVE: false,
                        DELETE: true
                    }
                break;
            case "CHECKER_1":
                userActions = {
                    MODIFY: false,
                    RETURN: true,
                    APPROVE: true,
                    DELETE: false
                }
                break;
            case "CHECKER_2":
                userActions = {
                    MODIFY: false,
                    RETURN: true,
                    APPROVE: true,
                    DELETE: false
                }
                break;
            case "MASTER":
                userActions = {
                    MODIFY: false,
                    RETURN: true,
                    APPROVE: true,
                    DELETE: false
                }
                break;
            default:
                userActions = {
                    MODIFY: true,
                    RETURN: true,
                    APPROVE: true,
                    DELETE: true
                }
        }
        return userActions;
    };
    $scope.getStatusByRole = function () {


        var statusByUser= {};
        switch ($scope.userRole) {

            case "INPUTTER":
                statusByUser = {
                    C1:false,
                    C2:false,
                    RT:true,
                    WA:false
                }
                break;
            case "CHECKER_1":
                statusByUser = {
                    C1:true,
                    C2:false,
                    RT:false,
                    WA:false
                }
                break;
            case "CHECKER_2":
                statusByUser = {
                    C1:false,
                    C2:true,
                    RT:false,
                    WA:false
                }
                break;
            case "MASTER":
                statusByUser = {
                    C1:false,
                    C2:false,
                    RT:true,
                    WA:true
                }
                break;
            default:
                statusByUser = {
                    C1:true,
                    C2:true,
                    RT:true,
                    WA:true
                }
        }
        return statusByUser;


    };
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