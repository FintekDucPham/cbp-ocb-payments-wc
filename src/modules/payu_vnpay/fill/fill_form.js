
angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.payu_vnpay.fill', {
            url: "/fill?p&s&transid",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/payu_vnpay/fill/fill_form.html",
            controller: "PayuVnpayStep1Controller",
            data: {
                analyticsTitle: "config.multistepform.labels.step1"
            },
            resolve:{
                CURRENT_DATE: ['utilityService', function(utilityService){
                    return utilityService.getCurrentDateWithTimezone();
                }]
            }
        });
    })
    .controller('PayuVnpayStep1Controller'
                    , function ($scope, $filter, lodash, bdFocus, $timeout, bdStepStateEvents, rbAccountSelectParams, $stateParams,
                                                              validationRegexp, systemParameterService, translate, utilityService, accountsService,
                                                              rbBeforeTransferManager,
                                bdTableConfig,ocbConvert,transferBillService,customerService,transferService,CURRENT_DATE,bdFillStepInitializer,$state) {

            console.log($scope.payuVnpay.data);
            bdFillStepInitializer($scope, {
                formName: 'payuVnpayForm',
                dataObject: $scope.payuBku
            });

            if($stateParams.p && $stateParams.transid && $stateParams.s) {
                transferBillService.getBill({
                    providerCode: $stateParams.p,
                    billCode: $stateParams.transid,
                    serviceCode: $stateParams.s
                }).then(function (data) {
                    $scope.payuVnpay.data.paymentInfo = data;
                })
            } else {
                if(!$scope.payuVnpay.data || !$scope.payuVnpay.data.paymentInfo) {
                    $state.go('dashboard');
                }
            }

            customerService.getCustomerDetails().then(function(data) {
                $scope.payuVnpay.meta.customerContext = data.customerDetails.context;
                // $scope.payment.meta.employee = data.customerDetails.isEmployee;
                $scope.payuVnpay.meta.authType = data.customerDetails.authType;
                $scope.payuVnpay.data.remitterId = data.userIdentityId.id
                $scope.payuVnpay.data.fullName = data.customerDetails.fullName;
                // if ($scope.payment.meta.authType == 'HW_TOKEN') {
                //     $scope.formShow = true;
                // }
            }).catch(function(response) {

            });

            transferService.getTransferLimit({paymentType:"PAYU_PAYMENT"}).then(function(limit) {
                $scope.payuVnpay.data.limit = limit.remainingDailyLimit;
            });

            $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
                $scope.$emit('hideWrongCodeLabelEvent');

                var dataToCreate = {
                    "remitterId" : $scope.payuVnpay.data.remitterId,
                    "remitterAccountId" : $scope.payuVnpay.data.remitterAccountId,
                    "billCode" : $scope.payuVnpay.data.paymentInfo.billCode,
                    "providerCode" : $scope.payuVnpay.data.paymentInfo.serviceProvider.providerCode,
                    "providerName" : $scope.payuVnpay.data.paymentInfo.serviceProvider.providerName,
                    "serviceCode" : $scope.payuVnpay.data.paymentInfo.serviceProvider.service.serviceCode,
                    "serviceName" : $scope.payuVnpay.data.paymentInfo.serviceProvider.service.serviceName,
                    "realizationDate" : CURRENT_DATE.time,
                    "amount" : $scope.payuVnpay.data.paymentInfo.amount.value,
                    "amountDesc" : ocbConvert.convertNumberToText($scope.payuVnpay.data.paymentInfo.amount.value,false),
                    "currency" : $scope.payuVnpay.data.remitterInfo.currency,
                    "paymentType" : "VNPAY"
                }
                transferBillService.create('bill',dataToCreate).then(function (data) {
                    $scope.payuVnpay.token.params.resourceId = data.referenceId;
                    $scope.payuVnpay.transferId = data.referenceId;
                    actions.proceed();
                })

            });

        });
