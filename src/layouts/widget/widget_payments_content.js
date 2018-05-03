angular.module('ocb-payments')
    .controller('PaymentsWidgetContentController', function($scope, $rootScope, viewStateService, $location, $timeout,$state, pathService, paymentsService, transactionService, paymentsWidgetMode, rbPaymentTypes) {

        $scope.paymentItemContent = pathService.generateTemplatePath("ocb-payments") + '/layouts/widget/payment_item.html';

        $scope.paymentsWidgetMode = paymentsWidgetMode;

        $scope.enterFullMode = function(mode){
            paymentsWidgetMode.fullMode = mode;
        };

        $scope.context = {};
        $scope.context.options = {
            detailsShown: false
        };

        var parseDataByTransfer = function (details) {
            var responseObject = {
                transferType: details.transferType,
                id: details.id,
                transactionId: details.transactionId,
                remitterAccountId: details.accountId,
                currency: details.currency,
                amount: details.amount,
                realizationDate: details.realizationDate
            };
            responseObject.beneficiaryAccountNo = details.recipientAccountNo;
            responseObject.beneficiaryAccountId = details.recipientAccountNo;
            responseObject.recipientName = details.recipientName;
            responseObject.description = details.recipientName;
            return responseObject;
        };

        function parsePaymentData(payment){
            var selectedPayment = angular.copy(payment);
            selectedPayment.details = payment;
            return selectedPayment;
        }
        $scope.removeOperation = function(evt, payment){
            evt.stopPropagation();
            var selectedPayment = parsePaymentData(payment);
            if (selectedPayment.transferType == rbPaymentTypes.STANDING.code) {
                viewStateService.setInitialState('payments.standing.manage.remove.verify', {
                    payment: selectedPayment.details,
                    returnToPage: 1
                });

                $state.go('payments.standing.manage.remove.verify');
            }
            else {
                var responseObject = parseDataByTransfer(selectedPayment);
                paymentsService.remove(responseObject).then(function(resp) {
                    var responseJson = angular.fromJson(resp.content);
                    var referenceId = responseJson.referenceId;
                    viewStateService.setInitialState('payments.future.manage.delete', {
                        paymentId: selectedPayment.id,
                        referenceId: referenceId,
                        paymentDetails: selectedPayment
                    });
                    $state.go('payments.future.manage.delete.fill');
                });
            }
        };

        $scope.goToDetails = function(evt, payment){
            // TODO JAKO_DISABLE planned payments
            // evt.stopPropagation();
            // evt.preventDefault();
            // var selectedPayment = parsePaymentData(payment);
            // viewStateService.setInitialState('payments.future.list',{
            //     relation: "DETAILS_FROM_WIDGET",
            //     paymentDetails: payment
            // });
            // $state.go('payments.future.list');
        };


        $scope.openCloseActionList = function(evn){
            if(evn.type.indexOf("touch") != -1){
                if(paymentsWidgetMode.fullMode){
                        $scope.enterFullMode(false);
                }else{
                    $scope.enterFullMode(true);
                }
                evn.stopPropagation();
                evn.preventDefault();
            }
        };
    });
