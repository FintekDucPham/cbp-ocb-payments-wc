angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.basket.new.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/payments_basket/basket/status/basket_status.html",
            controller: "PaymentsBasketStatusController"
        });
    })
    .controller('PaymentsBasketStatusController', function ($scope, $state, $timeout, $q, translate) {

        var messageType = {
            error: "error",
            success: "success",
            warning: "warning"
        };

        var messagesList = [];

        var paymentsAmount= {
            ready: null,
            notAccepted: null,
            sum: null,
            messagesKey: []
        };

        var MESSAGE_PROTOTYPE = {
            message: null,
            type: null,
            position: null,
            showRules:{
                list: [],
                add: function(rule){
                    this.list.push(rule);
                    return this;
                }
            }
        };

        var initAmount = function(notAcceptedTransactions, readyTransactions, messagesKey){
            paymentsAmount.ready = readyTransactions;
            paymentsAmount.notAccepted = notAcceptedTransactions;
            paymentsAmount.sum = readyTransactions + notAcceptedTransactions;
            paymentsAmount.messagesKey = messagesKey;
        };

        var registerMessage = function(position, message, type, showRules){
            var messageObj = angular.copy(MESSAGE_PROTOTYPE);
            messageObj.message = message;
            if(showRules){
                messageObj.showRules.list = showRules;
            }
            messageObj.position = position;
            messageObj.type = type;
            messagesList.push(messageObj);
            return messageObj;
        };

        var resolveMessage = function(){
            $scope.messagesListShow = [];
            angular.forEach(messagesList, function(value){
                var show = true;
                angular.forEach(value.showRules.list, function(rule){
                    if(!rule){
                        show = false;
                    }
                });
                if(show){
                    $scope.messagesListShow.push(value);
                }
            });
        };

        var showRules = {
            isMicro: function(){
                if($scope.userContext == 'MICRO'){
                    return true;
                }else {
                    return false;
                }
            },
            hasKey: function(key){
                if(paymentsAmount.messagesKey.indexOf(key) > -1){
                    return true;
                }else {
                    return false;
                }
            },
            notAccepted: function(notAcceptedTransactions){
                if(notAcceptedTransactions>0){
                    return true;
                }else {
                    return false;
                }
            },
            transactionsSubmited: function(isSubmited){
                return isSubmited;
            }
        };

        if(!$scope.basket.item.result.error){
            initAmount($scope.basket.item.result.notAcceptedTransactions, $scope.basket.item.result.readyTransactions, $scope.basket.item.result.messages);

            registerMessage(1,
                translate.property('ocb.payments.basket.status.AMOUNT_EXCEEDED_FUNDS.MICRO', [paymentsAmount.ready, paymentsAmount.sum]), messageType.error)
                .showRules
                .add(showRules.isMicro())
                .add(showRules.hasKey("AMOUNT_EXCEEDED_FUNDS"));
            registerMessage(2,
                translate.property('ocb.payments.basket.status.DAILY_LIMIT_EXCEEDED.MICRO', [paymentsAmount.ready, paymentsAmount.sum]), messageType.error)
                .showRules
                .add(showRules.isMicro())
                .add(showRules.hasKey("DAILY_LIMIT_EXCEEDED"));
            registerMessage(3,
                translate.property('ocb.payments.basket.status.NOT_ACCEPTED_TRANSACTIONS', [paymentsAmount.notAccepted, paymentsAmount.sum]), messageType.warning)
                .showRules
                .add(showRules.isMicro())
                .add(showRules.notAccepted($scope.basket.item.result.notAcceptedTransactions));
            registerMessage(4,
                translate.property('ocb.payments.basket.status.TRANSACTIONS_SUBMITED.MICRO', [paymentsAmount.ready, paymentsAmount.sum]), messageType.success)
                .showRules
                .add(showRules.isMicro())
                .add(showRules.transactionsSubmited($scope.basket.item.result.transactionsSubmited));
            registerMessage(5,
                translate.property('ocb.payments.basket.status.TRANSACTIONS_SUBMITED.DETAL'), messageType.success)
                .showRules
                .add(showRules.transactionsSubmited($scope.basket.item.result.transactionsSubmited));

            resolveMessage();
        }else {
            registerMessage(1,
                translate.property('ocb.payments.basket.delete.status.messages.error'), messageType.error);
        }

    });