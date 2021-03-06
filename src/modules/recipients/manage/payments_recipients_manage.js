angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.recipients.manage', {
            url: "/manage",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/recipients/manage/payments_recipients_manage.html",
            controller: "PaymentsRecipientsManageController",
            params: {
                recipientType: 'domestic',
                recipientTypeObj: null,
                operation: 'new'
            },
            data: {
                analyticsTitle: "ocb.payments.recipients.label"
            },
            resolve: {
                paymentRulesResolved: ['paymentRules', function(paymentRules){
                    return paymentRules.search();
                }]
            }
        });
    })
    .controller('PaymentsRecipientsManageController', function ($scope, $timeout, lodash, $rootScope, $stateParams,
                                                                pathService, NRB_REGEX, CUSTOM_NAME_REGEX,
                                                                bdMainStepInitializer, rbRecipientOperationType,
                                                                validationRegexp, rbRecipientTypes, recipientGeneralService,
                                                                authorizationService, dateFilter, translate, customerService, paymentsService, recipientsService, paymentRulesResolved) {

        $scope.paymentRulesResolved = paymentRulesResolved;

        $scope.actualRecipientList = null;

        $scope.clearForm = function () {
            //$scope.recipient.formData = {};
            $scope.recipient.meta.bankName = {
                recipientBankName:null,
                bankNamePromise:null
            };
            $scope.$broadcast('clearForm');
        };

        $scope.NRB_REGEX = new RegExp(NRB_REGEX);
        $scope.CUSTOM_NAME_REGEX = new RegExp(CUSTOM_NAME_REGEX);
        $scope.RECIPIENT_DATA_REGEX = validationRegexp('RECIPIENT_DATA_REGEX');
        $scope.RECIPIENT_NAME_REGEX = validationRegexp('RECIPIENT_NAME');//CR_318
        $scope.PAYMENT_TITLE_REGEX = validationRegexp('PAYMENT_TITLE_REGEX');
        bdMainStepInitializer($scope, 'recipient', {
            formName: 'recipientForm',
            type: {
                code: 'DOMESTIC',
                state: 'domestic'
            },
            operation: rbRecipientOperationType[$stateParams.operation.toUpperCase()],
            formData: {
                recipientType: $stateParams.recipientTypeObj,
                paymentTarget: 'ACCOUNT'
            },
            transferId: {},
            options: {},
            token: {
                model: {},
                params: {}
            },
            meta: {
                nonEditableFields: [],
                recipientTypes: lodash.map(rbRecipientTypes),
                bankName: {
                    recipientBankName:null,
                    bankNamePromise:null
                },
                operation: null
            },
            items:{
                actualRecipientList: recipientsService.search({pageSize: 2000}).then(function(recipientList){
                    return lodash.map(recipientList.content, function(entry) {
                        var paymentTemplate = entry.paymentTemplates[0];
                        return {
                            recipientId: entry.recipientId,
                            templateType: paymentTemplate.templateType,
                            name: entry.recipientName.join(' '),
                            accountNo: paymentTemplate.beneficiaryAccountNo,
                            srcAccountNo: paymentTemplate.remitterAccountNo,
                            details: paymentTemplate.paymentDetails || null

                        };
                    });
                })
            },
            multiStepParams:{
                completeState: 'payments.recipients.list',
                onClear: $scope.clearForm,
                footerType: 'recipient',
                cancelState: 'payments.recipients.list',
                labels:{
                    cancel:'ocb.payments.new.btn.cancel',
                    clear:'ocb.payments.new.btn.clear',
                    next: 'ocb.payments.new.btn.next',
                    change:'ocb.payments.new.btn.change',
                    accept:'ocb.payments.new.btn.accept',
                    finalize:'ocb.payments.new.btn.finalize'
                },
                visibility:{
                    cancel: true,
                    change: true,
                    accept: true
                }
            },
            manageAction: ""
        });

        customerService.getCustomerDetails().then(function(customerDetails){
            $scope.customerDetails = customerDetails.customerDetails;
        });

        $scope.getAccountByNrb = function (accountList, selectFn) {
            if (lodash.isString($scope.recipient.formData.debitAccountNo)) {
                var result = lodash.find(accountList, {'accountNo': $scope.recipient.formData.debitAccountNo});
                if (lodash.isPlainObject(result)) {
                    selectFn(result);
                }
            }
        };

        /**
         * This should be used to convert form data into format expected for the particular payment type.
         * @param formData
         * @returns {*}
         */
        $scope.requestConverter = function (formData) {
            return formData;
        };

        $scope.setRequestConverter = function (converterFn) {
            $scope.requestConverter = converterFn;
        };

        /**
         * This should be used to convert data to satisfy current operation type. For instance recipientId is required
         * for modification but forbidden for addition
         *
         * 'new'
         * @param data
         * @returns {*}
         */
        $scope.convertRequestOperation = function (data) {
            return data;
        };

        $scope.setRequestOperationConverter = function (converterFn) {
            $scope.convertRequestOperation = converterFn;
        };

        $scope.create = function (actions) {
            recipientGeneralService.create($scope.recipient.operation.code, $scope.recipient.type.code.toLowerCase(),
                $scope.convertRequestOperation($scope.requestConverter($scope.recipient.formData))).then(function (recipient) {
                    $scope.recipient.transferId = recipient;
                    actions.proceed();
                });
        };

        $scope.getBankName = function(account){
            return paymentsService.getBankName(account).then(function (response) {
                return response;
            });
        };

    }
).factory('recipientManager', function (lodash, $filter) {

        function calculateInsurancesSummary(insurancePremiums) {
            return lodash.map(lodash.groupBy(insurancePremiums, 'currency'), function (values) {
                var totalAmount = 0;
                lodash.forEach(values, function (value) {
                    totalAmount += value.amount ? parseFloat((""+value.amount).replace( /,/, '.')) : 0;
                });
                return {
                    currency: values[0].currency,
                    amount: totalAmount
                };
            });
        }

        function wrapWithCommonData(data, recipient) {
            return lodash.merge(data, {
                formData: {
                    recipientId: recipient.recipientId,
                    customName: recipient.customerName,
                    recipientAccountNo: recipient.nrb,
                    debitAccountNo: recipient.debitNrb
                }
            });
        }

        var dataConverters = {
            domestic: function (recipient) {
                return wrapWithCommonData({
                    formData: {
                        recipientData: angular.isArray(recipient.recipientAddress) ? recipient.recipientAddress.join(" ") : recipient.recipientAddress,
                        description: angular.isArray(recipient.transferTitleTable) ? recipient.transferTitleTable.join( "") : recipient.transferTitleTable,
                        recipientType: recipient.recipientType,
                        province: recipient.province,
                        bankCode: recipient.bankCode,
                        branchCode: recipient.branchCode,
                        cardNumber: recipient.cardNumber,
                        paymentTarget: recipient.cardNumber ? 'CARD' : 'ACCOUNT'
                    },
                    items: recipient.items || {}
                }, recipient);
            },
            insurance: function (recipient) {
                return wrapWithCommonData({
                    formData: {
                        nip: recipient.nip,
                        paymentType: recipient.paymentType,
                        secondaryIdType: recipient.secondaryIdType,
                        secondaryIdNo: recipient.secondaryId,
                        selectedInsuranceId: recipient.nrb,
                        insurancePremiums: recipient.insurancePremiums
                    },
                    meta: {
                        amountSummary: calculateInsurancesSummary(recipient.insurancePremiums)
                    }
                }, recipient);
            }
        };

        return function (type) {
            return {
                makeEditable: dataConverters[type.toLowerCase()]
            };
        };
    });