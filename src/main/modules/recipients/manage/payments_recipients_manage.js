angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.recipients.manage', {
            url: "/manage",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/manage/payments_recipients_manage.html",
            controller: "PaymentsRecipientsManageController",
            params: {
                recipientType: 'domestic',
                operation: 'new'
            }
        });
    })
    .controller('PaymentsRecipientsManageController', function ($scope, $timeout, lodash, $rootScope, $stateParams,
                                                                pathService, NRB_REGEX, CUSTOM_NAME_REGEX,
                                                                bdMainStepInitializer, rbRecipientOperationType,
                                                                validationRegexp, rbRecipientTypes, recipientGeneralService,
                                                                authorizationService, dateFilter, translate) {

        $scope.NRB_REGEX = new RegExp(NRB_REGEX);
        $scope.CUSTOM_NAME_REGEX = new RegExp(CUSTOM_NAME_REGEX);
        $scope.RECIPIENT_DATA_REGEX = validationRegexp('RECIPIENT_DATA_REGEX');
        $scope.RECIPIENT_NAME_REGEX = validationRegexp('RECIPIENT_NAME');
        $scope.PAYMENT_TITLE_REGEX = validationRegexp('PAYMENT_TITLE_REGEX');

        bdMainStepInitializer($scope, 'recipient', {
            formName: 'recipientForm',
            type: rbRecipientTypes[$stateParams.recipientType.toUpperCase()],
            operation: rbRecipientOperationType[$stateParams.operation.toUpperCase()],
            formData: {},
            transferId: {},
            options: {},
            meta: {
                recipientTypes: lodash.map(rbRecipientTypes)
            }
        });

        $scope.getAccountByNrb = function (accountList, selectFn) {
            if (lodash.isString($scope.recipient.formData.debitAccountNo)) {
                var result = lodash.find(accountList, {'accountNo': $scope.recipient.formData.debitAccountNo});
                if (lodash.isPlainObject(result)) {
                    selectFn(result);
                }
            }
            selectFn(accountList[0]);
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

    }
).factory('recipientManager', function (lodash) {

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
                        recipientData: recipient.recipientAddress,
                        description: recipient.transferTitleTable
                    }
                }, recipient);
            },
            insurance: function (recipient) {
                return wrapWithCommonData({
                    formData: {
                        nip: recipient.nip,
                        paymentType: recipient.paymentType,
                        secondaryIdType: recipient.secondaryIdType,
                        secondaryIdNo: recipient.secondaryId,
                        selectedInsuranceId: recipient.nrb
                    }
                }, recipient);
            },
            tax: function (recipient) {
                return wrapWithCommonData({
                    formData: {
                        paymentType: recipient.paymentType,
                        secondaryIdType: recipient.secondaryIdType,
                        idNumber: recipient.secondaryId,
                        periodType: recipient.periodType,
                        formCode: recipient.formSymbol,
                        selectedTaxOfficeId: recipient.nrb,
                        obligationId: recipient.obligationId
                    }
                }, recipient);
            }
        };

        return function (type) {
            return {
                makeEditable: dataConverters[type.toLowerCase()]
            };
        };

    }).factory('notInsuranceAccountGuard', function (lodash, insuranceAccounts) {

        return function (context) {

            function validate(account, doneFn) {
                insuranceAccounts.search().then(function (insuranceAccounts) {
                    context.forbiddenAccounts = lodash.union(context.forbiddenAccounts,
                        lodash.map(insuranceAccounts.content, function (val) {
                            return {
                                code: 'notZus',
                                value: val.accountNo
                            };
                        }));
                }).finally(doneFn);
            }

            function validator(accountNo) {
                if (accountNo) {
                    return !lodash.some(context.forbiddenAccounts, {
                        code: 'notZus',
                        value: accountNo.replace(/ */g, '')
                    });
                } else {
                    return false;
                }
            }

            return {
                getValidator: function () {
                    return validator;
                },
                validate: validate
            };

        };

    }).factory('notTaxAccountGuard', function (lodash, taxOffices) {

        return function (context) {

            function validator(accountNo) {
                if (accountNo) {
                    return !lodash.some(context.forbiddenAccounts, {
                        code: 'notUs',
                        value: accountNo.replace(/ */g, '')
                    });
                } else {
                    return false;
                }
            }

            function validate(account, doneFn) {
                taxOffices.search({
                    accountNo: account.replace(/ */g, '')
                }).then(function (result) {
                    if (result.length > 0) {
                        lodash.forEach(result, function (value) {
                            context.forbiddenAccounts = lodash.union(context.forbiddenAccounts, [
                                {
                                    code: 'notUs',
                                    value: value.accountNo
                                }
                            ]);
                        });
                    }
                }).finally(doneFn);
            }

            return {
                getValidator: function () {
                    return validator;
                },
                validate: validate
            };

        };

    });