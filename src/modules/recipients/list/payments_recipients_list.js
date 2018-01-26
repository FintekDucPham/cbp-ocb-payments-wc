angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.recipients.list', {
            url: "/list",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/recipients/list/payments_recipients_list.html",
            controller: "PaymentsRecipientsListController",
            data: {
                analyticsTitle: "ocb.payments.recipients.label"
            }
        });
    })
    .controller('PaymentsRecipientsListController', function ($scope, $state, bdTableConfig, $timeout, recipientsService,
                                                              viewStateService, translate, rbRecipientTypes, rbRecipientOperationType, lodash, pathService, customerService, accountsService, bdFillStepInitializer, paymentsService, $filter,
                                                              provincesService, domesticBanksService) {
        $scope.recipient = {
            item: {}
        };

        accountsService.search().then(function(accountList){
            $scope.accountList = accountList.content;
        });
        customerService.getCustomerDetails().then(function(customerDetails){
            $scope.customerDetails = customerDetails.customerDetails;
        });

        $scope.getAccountByNrb = function(accountNrb){
            return lodash.find($scope.accountList, {
                accountNo: accountNrb
            });
        };

        $scope.searchRecipient = function(){
            $scope.table.tableData.newSearch = true;
            $scope.table.tableControl.invalidate();
        };

        var recipientFilterType = angular.extend({}, rbRecipientTypes, {
            ALL : {
                code: 'ALL'
            }
        });

        $scope.types = {
            currentType: recipientFilterType.ALL,
            availableTypes: recipientFilterType,
            availableTypesList: lodash.map(recipientFilterType)
        };


        $scope.getAccountByNrb = function(accountNrb){
            return lodash.find($scope.accountList, {
                accountNo: accountNrb
            });
        };

        $scope.recipientListPromise = {};

        $scope.onRecipientEdit = function(data){
            data.bankName = $scope.recipient.item.recipientBankName;
            $state.go("payments.recipients.manage.edit.fill", {
                recipientType: data.recipientType.state,
                operation: 'edit',
                recipient: angular.extend(angular.copy(data), {debitAccountNo: data.debitNrb})
            });
        };

        $scope.onRecipientRemove = function(data){
            var items = {};
            angular.extend(data, {
                recipientData: data.recipientName,
                description: data.transferTitle
            });
            if (data.recipientType.code === 'EXTERNAL'){
                data.items = angular.extend({
                    province: {
                        name: data.provinceName
                    },
                    bank: {
                        bankName: data.bankName
                    },
                    branch: {
                        branchName: data.branchName
                    }
                }, data.items);
            }
            if (data.recipientType.code === 'FAST' && data.bankCode) {
                data.items = angular.extend({
                    bank: {
                        bankName: data.bankName
                    }
                }, data.items);
            }
            if (data.recipientType.code === 'insurance'){
                var senderAccount = $scope.getAccountByNrb(data.debitNrb);
                items = {
                    senderAccount: senderAccount
                };
            }
            $state.go("payments.recipients.manage.remove.verify", {
                recipientType: data.recipientType.state,
                operation: 'remove',
                items: angular.copy(items),
                recipient: angular.copy(data)
            });
        };

        $scope.onRecipientCreate = function(){
            $state.go("payments.recipients.manage.new.fill", {
                operation: rbRecipientOperationType.NEW.code,
                recipientTypeObj: $scope.types.currentType !== recipientFilterType.ALL ? $scope.types.currentType : null
            });
        };


        $scope.onRecipientTransfer = function(data) {
            $state.go(data.recipientType.transferState, {
                recipientId: data.recipientId
            });
        };

        $scope.resolveTemplateType = function (recipientType) {
            return "{0}/modules/recipients/list/details/{1}_recipient_details.html".format(pathService.generateTemplatePath("ocb-payments"), recipientType.state);
        };

        $scope.trimTable = lodash.memoize(function(table) {
            return lodash.without(table, null);
        });

        $scope.resolveBankNamePromise = function(account){
            $scope.recipient.item.recipientBankNamePromise = paymentsService.getBankName(account).then(function(bankName){
                if(bankName) {
                    $scope.recipient.item.recipientBankName = bankName.fullName || bankName.shortName;
                    $scope.recipient.item.recipientBankName += ", " + bankName.address+ ", "+ bankName.town;

                }else {
                    $scope.recipient.item.recipientBankName = null;
                }
            }).catch(function (e) {
                $scope.recipient.item.recipientBankName = null;
            });
        };

        $scope.resolveProvinceName = function (data){
            return provincesService.list().then(function (provincesList) {
                provincesList.some(function (province) {
                    if (province.code === data.province) {
                        data.provinceName = province.name;
                        return true;
                    }
                })
            });
        };

        $scope.resolveBranchName = function (data){
            return domesticBanksService.search({}).then(function (info) {
                var banksList = info.content;
                banksList.some(function (bank) {
                    if (bank.unitNo === data.bankCode) {
                        return bank.branches.some(function (branch) {
                           if (branch.branchCode === data.branchCode) {
                               data.branchName = branch.branchName;
                               return true;
                           }
                        });
                    }
                });
            });
        };

        function prepareQueryParams($params) {
            var params = {};
            params.pageSize = $params.pageSize;
            params.pageNumber = $params.currentPage;

            if($scope.types.currentType !== recipientFilterType.ALL){
                params.filerTemplateType = $scope.types.currentType.code;
            }
            if($scope.table.tableData.newSearch){
                $scope.table.tableData.newSearch = false;
                $scope.table.tableConfig.currentPage = 1;
                params.pageNumber = 1;
                params.queryString = $scope.table.operationTitle ? encodeURIComponent($scope.table.operationTitle) : $scope.table.operationTitle;
            }

            return params;
        }

        $scope.table = {
            tableConfig : new bdTableConfig({
                placeholderText: translate.property("ocb.payments.recipients.label.empty_list"),
                makeTransfer: $scope.onRecipientTransfer
            }),
            tableData : {
                getData: function ($promise, $params) {
                    $timeout(function() {

                        var params = prepareQueryParams($params);

                        $scope.recipientListPromise = recipientsService.search(params).then(function (data) {
                            var list = $scope.recipientList = lodash.map(data.content, function (recipient) {
                                var template = recipient.paymentTemplates[0];
                                if (!template) {
                                    return {};
                                }
                                return lodash.extend({
                                    recipientType: rbRecipientTypes[template.templateType],
                                    recipientTypeCode:rbRecipientTypes[template.templateType].code,
                                    customerName: $filter('arrayFilter')(recipient.recipientName),
                                    recipientId: recipient.recipientId,
                                    templateId: recipient.templateId,
                                    recipient: $filter('arrayFilter')(recipient.recipientName),
                                    recipientName: $filter('arrayFilter')(recipient.recipientAddress),
                                    bankName: recipient.bankName,
                                    debitNrb: template.remitterAccountNo,
                                    ownerList: $scope.getAccountByNrb(template.remitterAccountNo)
                                }, (function () {
                                    switch (template.templateType) {
                                        case 'EXTERNAL':
                                        case 'INTERNAL':
                                        case 'FAST':
                                            return {
                                                transferTitle: $filter('arrayFilter')(template.title),
                                                recipientAddress: $filter('arrayFilter')(recipient.recipientAddress),
                                                transferTitleTable: $filter('arrayFilter')(template.title),
 												nrb: template.beneficiaryAccountNo,
                                                province: template.province,
                                                bankCode: template.bankCode,
                                                branchCode: template.branchCode,
                                                cardNumber: template.cardNumber,
                                                paymentTarget: template.cardNumber ? 'CARD' : 'ACCOUNT'
                                            };
                                    }
                                })());
                            });
                            $params.pageCount = data.totalPages;
                            return list;

                        });
                        $promise.resolve($scope.recipientListPromise);
                    });

                }
            },
            tableControl: undefined
        };

    }
);
