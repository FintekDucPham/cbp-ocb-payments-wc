angular.module('ocb-payments')
    .constant('FREQUENCY_TYPES', {
        "DAILY": {
            code: "DAILY",
            symbol: "D"
        },
        "WEEKLY": {
            code: "WEEKLY",
            symbol: "W"
        },
        "MONTHLY": {
            code: "MONTHLY",
            symbol: "M"
        },
        "YEARLY": {
            code: "YEARLY",
            symbol: "Y"
        }
    })
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.auto_bill_modify.verify', {
            url: "/fill",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/auto_bill/modify/verify/payments_auto_bill_verify.html",
            controller: "AutoBillVerifyController",
            data: {
                analyticsTitle: 'config.multistepform.labels.step2'
            }
        });
    })
    .controller('AutoBillVerifyController', function ($scope, bdFillStepInitializer, translate, formService,
            bdStepStateEvents, transferBillService, FREQUENCY_TYPES, RB_TOKEN_AUTHORIZATION_CONSTANTS) {

        $scope.payment.formData.frequencyPeriodUnit = FREQUENCY_TYPES[$scope.payment.formData.frequencyType].symbol;
        $scope.payment.formData.nextExecutionDate = getNextExecutionDate();
        $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
            actions.proceed();
        });

        $scope.payment.meta.token.modelData = function(){
            var context = {
                refnum: '$refnum$',
                userId: '$cifnum$',
                clientCode: '$cifnum$',
                branchCode: '$cifnum$',
                orderNumber: '$cifnum$',
                fromAccount: '$cifnum$',
                cifNum: '$cifnum$',
                frequencyPeriodCount: '$cifnum$',
                frequencyPeriodUnit: '$cifnum$',
                customerId: '$cifnum$',
                firstExecutionDate: '$cifnum$',
                serviceCode: '$cifnum$',
                serviceProviderCode: '$cifnum$',
                paymentSetting: '$cifnum$',
                amountLimit: '$cifnum$'
            };

            var exp = $interpolate('<transactionInfo>' +
                '<cRefNum>{{refnum}}</cRefNum>' +
                '  <userId>{{userId}}</userId>' +
                '  <clientCode>{{clientCode}}</clientCode>' +
                '  <branchInfo>' +
                '    <branchCode>{{branchCode}}</branchCode>' +
                '  </branchInfo>' +
                '</transactionInfo>' +
                '<autoBillPayment>' +
                '  <orderNumber>{{orderNumber}}</orderNumber>' +
                '  <orderName></orderName>' +
                '  <fromAccount>{{fromAccount}}</fromAccount>' +
                '  <CIFNum>{{cifNum}}</CIFNum>' +
                '  <frequencyPeriodCount>{{frequencyPeriodCount}}</frequencyPeriodCount>' +
                '  <frequencyPeriodUnit>{{frequencyPeriodUnit}}</frequencyPeriodUnit>' +
                '  <customerId>{{customerId}}</customerId>' +
                '  <firstExecutionDate>{{firstExecutionDate}}</firstExecutionDate>' +
                '  <serviceCode>{{serviceCode}}</serviceCode>' +
                '  <serviceProviderCode>{{serviceProviderCode}}</serviceProviderCode>' +
                '  <paymentSetting>{{paymentSetting}}</paymentSetting>' +
                '  <amountLimit>{{amountLimit}}</amountLimit>' +
                '  <recurringPeriod></recurringPeriod>' +
                '  <finishDate></finishDate>' +
                '</autoBillPayment>');

            return exp(context);
        };

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {


            var callParams = $scope.payment.formData;
            callParams.resourceId = $scope.payment.meta.token.params.resourceId;
            callParams.credentials = $scope.payment.meta.token.model.input.model;

            if($scope.payment.meta.token.model.view.name===RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.FORM) {
                if ($scope.payment.meta.token.model.input.$isValid()) {

                    if (callParams.actionType.code == "NEW") {
                        transferBillService.createAutoBillTransfer(callParams).then(function (status) {
                            setMessage(status);
                        }).catch(function (error) {
                            setErrorMessage("error", 'ocb.payment.auto_bill.status.error.info');
                        }).finally(function (params) {
                            actions.proceed();
                        });
                    }
                    if (callParams.actionType.code == "EDIT") {
                        callParams.amountLimit = callParams.amountLimit.value;
                        transferBillService.modifyAutoBillTransfer(callParams).then(function (status) {
                            setMessage(status);
                        }).catch(function (error) {
                            setErrorMessage("error", 'ocb.payment.auto_bill.status.error.info');
                        }).finally(function (params) {
                            actions.proceed();
                        });
                    }

                }
            } else if ($scope.payment.meta.token.model.view.name === RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.ACTION_SELECTION) {
                $scope.payment.meta.token.model.$proceed();
            }
        });

        function getNextExecutionDate() {
            var nextExecutionDate = new Date($scope.payment.formData.firstExecutionDate)

            switch($scope.payment.formData.frequencyPeriodUnit) {
                case "D": {
                    nextExecutionDate.setDate(nextExecutionDate.getDate() + $scope.payment.formData.frequencyPeriodCount);
                    break;
                }
                case "W": {
                    nextExecutionDate.setDate(nextExecutionDate.getDate() + $scope.payment.formData.frequencyPeriodCount * 7);
                    break;
                }
                case "M": {
                    nextExecutionDate.addMonths($scope.payment.formData.frequencyPeriodCount);
                    break;
                }
                case "Y": {
                    nextExecutionDate.addMonths(Number($scope.payment.formData.frequencyPeriodCount) * 12)
                    break;
                }
            }

            return nextExecutionDate;
        }

        function setMessage(status) {
            $scope.payment.result = {};
            if(status === "EXECUTED"){
                setErrorMessage("success", 'ocb.payment.auto_bill.status.success.info');
            } else if (status === "IN_PROCESSING"){
                setErrorMessage("warning", 'ocb.payment.auto_bill.status.processing.info');
            } else{
                setErrorMessage("undefined", 'ocb.payment.auto_bill.status.error.info');
            }
        }

        function setErrorMessage(type, message) {
            $scope.payment.result.type = type;
            $scope.payment.result.text = translate.property(message);
        }
    });