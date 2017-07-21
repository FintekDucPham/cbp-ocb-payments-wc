angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.recipients.list', {
            url: "/list",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/list/payments_recipients_list.html",
            controller: "PaymentsRecipientsListController",
            data: {
                analyticsTitle: "raiff.payments.recipients.label"
            },
            resolve: {
                insuranceAccountList : ["insuranceAccounts", function(insuranceAccounts) {
                    return insuranceAccounts.search().then(function (insuranceAccounts) {
                        return insuranceAccounts.content;
                    });
                }]
            }
        });
    })
    .controller('PaymentsRecipientsListController', function ($scope, $state, bdTableConfig, $timeout, recipientsService,
                                                              viewStateService, translate, rbRecipientTypes, rbRecipientOperationType, lodash, pathService, customerService, accountsService, bdFillStepInitializer, paymentsService, insuranceAccountList, $filter) {



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
            currentType: recipientFilterType.DOMESTIC,
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
            var recipientType = data.recipientType.toLowerCase();
            data.bankName = $scope.recipient.item.recipientBankName;
            if(recipientType==='swift'){
                recipientType='foreign';
            }
            $state.go("payments.recipients.manage.edit.fill", {
                recipientType: recipientType,
                operation: 'edit',
                recipient: angular.extend(angular.copy(data), {debitAccountNo: data.debitNrb})
            });
        };

        $scope.onRecipientRemove = function(data){
            data.bankName = $scope.recipient.item.recipientBankName;
            var items = {};
            angular.extend(data, {
                recipientData: data.recipientName,
                description: data.transferTitle
            });
            var recipientType = data.recipientType.toLowerCase();
            if(recipientType==='swift'){
                recipientType='foreign';
            }
            if(recipientType === 'insurance'){
                var senderAccount = $scope.getAccountByNrb(data.debitNrb);
                items = {
                    senderAccount: senderAccount
                };
            }
            $state.go("payments.recipients.manage.remove.verify", {
                recipientType: recipientType,
                operation: 'remove',
                items: angular.copy(items),
                recipient: angular.copy(data)
            });
        };

        $scope.onRecipientCreate = function(){
            $state.go("payments.recipients.manage.new.fill", {
                recipientType: rbRecipientTypes.DOMESTIC.code.toLowerCase(),
                operation: rbRecipientOperationType.NEW.code
            });
        };


        $scope.onRecipientTransfer = function(data) {
            // dla przelewow do odbiorcow walutowych potrzebna osobna logika
            if (data.recipientType.toLowerCase() == 'swift') {
                $state.go('payments.new_foreign.fill', {
                    paymentType: 'SMART'.toLowerCase(),
                    recipientId: data.recipientId
                });
            }
            else {
                $state.go("payments.new.fill", {
                    paymentType: data.recipientType.toLowerCase(),
                    recipientId: data.recipientId
                });
            }

        };

        $scope.resolveTemplateType = function (recipientType) {
            return "{0}/modules/recipients/list/details/{1}_recipient_details.html".format(pathService.generateTemplatePath("raiffeisen-payments"), recipientType.toLowerCase());
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

        $scope.prepareNameAndAddress = function(name, address){
          var parsedName = $filter('arrayFilter')(name);
            if(address){
                parsedName += ", "+address;
            }
            return parsedName;
        };
        function getInsurancePremiums(recipient){
           return lodash.reduce(recipient.paymentTemplates, function(result, value){
                var insuranceCode = lodash.find(insuranceAccountList, {accountNo : value.beneficiaryAccountNo}).insuranceCode;
                result[insuranceCode] = {amount : value.amount, code:insuranceCode, currency : value.currency, nrb : value.beneficiaryAccountNo};
                return result;
            }, {});
        }

        function prepareQueryParams($params) {
            var params = {};
            params.pageSize = $params.pageSize;
            params.pageNumber = $params.currentPage;

            if($scope.types.currentType !== recipientFilterType.ALL){
                params.filerTemplateType = $scope.types.currentType.code;
            }
            if(params.filerTemplateType==='FOREIGN'){
                params.filerTemplateType = 'SWIFT';
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
                placeholderText: translate.property("raiff.payments.recipients.label.empty_list"),
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
                                    recipientType: template.templateType,
                                    recipientTypeMessage: translate.property('raiff.payments.recipients.new.type.{0}'.format(template.templateType)),
                                    customerName: $filter('arrayFilter')(recipient.recipientName),
                                    recipientId: recipient.recipientId,
                                    templateId: recipient.templateId,
                                    recipient: $filter('arrayFilter')(recipient.recipientName),
                                    recipientName: $filter('arrayFilter')(recipient.recipientAddress),
                                    debitNrb: template.remitterAccountNo,
                                    ownerList: $scope.getAccountByNrb(template.remitterAccountNo)
                                }, (function () {
                                    var paymentDetails = template.paymentDetails;
                                    switch (template.templateType) {
                                        case "SWIFT":
                                            return {
                                                transferTitle: $filter('arrayFilter')(template.title),
                                                bankName: template.paymentDetails.bankDetails[0],
                                                bankData:$filter('arrayFilter')(template.paymentDetails.bankDetails),
                                                recipientIdentityType: template.paymentDetails.informationProvider,
                                                recipientBankCountry: template.paymentDetails.bankCountry,
                                                recipientCountry: template.paymentDetails.foreignCountryCode,
                                                recipientAddress: $filter('arrayFilter')(recipient.recipientAddress),
                                                nrb: template.beneficiaryAccountNo,
 												transferTitleTable: $filter('arrayFilter')(template.title),                                                swift_bic: template.paymentDetails.recipientSwift
                                            };
                                        case "DOMESTIC":
                                            return {
                                                transferTitle: $filter('arrayFilter')(template.title),
                                                recipientAddress: $filter('arrayFilter')(recipient.recipientAddress),
                                                transferTitleTable: $filter('arrayFilter')(template.title),
 												nrb: template.beneficiaryAccountNo                                            };
                                        case "INSURANCE":

                                            return {
                                                nip: paymentDetails.nip,
                                                secondaryIdType: paymentDetails.secondIDType,
                                                secondaryId: paymentDetails.secondIDNo,
                                                paymentType: paymentDetails.paymentType,
                                                nrb: (function(){
                                                    var insurancePremiums = getInsurancePremiums(recipient);
                                                    var recipientListFiltered  = $filter('insurancesDisplayOrder')(insurancePremiums);
                                                    return recipientListFiltered[0].nrb;
                                                })(),
                                                insurancePremiums: getInsurancePremiums(recipient),
                                                insurancePremiusSumary: (function(){
                                                    var sum = 0;
                                                    angular.forEach(recipient.paymentTemplates, function(v){
                                                        sum+= v.amount;
                                                    });
                                                    return sum;
                                                })()
                                            };
                                        case "TAX":
                                            return {
                                                nameAndAddress: $scope.prepareNameAndAddress(paymentDetails.taxAccountName, recipient.recipientAddress),
                                                secondaryIdType: paymentDetails.idtype,
                                                secondaryId: paymentDetails.idnumber,
                                                nrb: template.beneficiaryAccountNo,
                                                formSymbol: paymentDetails.formCode,
                                                periodType: paymentDetails.periodType,
                                                obligationId: paymentDetails.obligationId
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
).filter('insurancesDisplayOrder', function() {
    return function(items) {
        var codeOrders={
            SOCIAL: 1,
            HEALTH: 2,
            FPIFGSP:3,
            PENSION:4
        };
        var filtered = [];
        angular.forEach(items, function(item) {
            filtered.push(item);
        });
        filtered.sort(function (a, b) {
            return (codeOrders[a.code] > codeOrders[b.code] ? 1 : -1);
        });
        return filtered;
    };
});
