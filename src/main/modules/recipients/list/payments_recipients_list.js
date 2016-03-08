angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.recipients.list', {
            url: "/list",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/list/payments_recipients_list.html",
            controller: "PaymentsRecipientsListController"
        });
    })
    .controller('PaymentsRecipientsListController', function ($scope, $state, bdTableConfig, $timeout, recipientsService,
                                                              viewStateService, translate, rbRecipientTypes, rbRecipientOperationType, lodash, pathService, customerService, accountsService, bdFillStepInitializer, paymentsService) {



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
            angular.extend(data, {
                recipientData: data.recipientName,
                description: data.transferTitle
            });
            var recipientType = data.recipientType.toLowerCase();
            if(recipientType==='swift'){
                recipientType='foreign';
            }
            $state.go("payments.recipients.manage.remove.verify", {
                recipientType: recipientType,
                operation: 'remove',
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
                    paymentType: 'sepa',
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
                }else {
                    $scope.recipient.item.recipientBankName = null;
                }
            }).catch(function (e) {
                $scope.recipient.item.recipientBankName = null;
            });
        };



        $scope.table = {
            tableConfig : new bdTableConfig({
                placeholderText: translate.property("raiff.payments.recipients.label.empty_list")
            }),
            tableData : {
                getData: function ($promise, $params) {
                    $timeout(function() {
                        var params = {
                            queryString: $scope.table.operationTitle ? encodeURIComponent($scope.table.operationTitle) : $scope.table.operationTitle
                        };

                        if($scope.table.tableData.newSearch){
                            params.pageNumber = 1;
                            $scope.table.tableData.newSearch = false;
                        }else{
                            params.pageSize = $params.pageSize;
                            params.pageNumber = $params.currentPage;
                        }

                        if($scope.types.currentType !== recipientFilterType.ALL){
                            params.filerTemplateType = $scope.types.currentType.code;
                        }

                        if(params.filerTemplateType==='FOREIGN'){
                            params.filerTemplateType = 'SWIFT';
                        }

                        $scope.recipientListPromise = recipientsService.search(params).then(function (data) {
                            var list = $scope.recipientList = lodash.map(data.content, function (recipient) {
                                var template = recipient.paymentTemplates[0];
                                return lodash.extend({
                                    recipientType: template.templateType,
                                    recipientTypeMessage: translate.property('raiff.payments.recipients.new.type.{0}'.format(template.templateType)),
                                    customerName: recipient.recipientName.join(" "),
                                    recipientId: recipient.recipientId,
                                    templateId: recipient.templateId,
                                    recipient: recipient.recipientName.join(" "),
                                    recipientName: recipient.recipientAddress.join(" "),
                                    nrb: template.beneficiaryAccountNo,
                                    debitNrb: template.remitterAccountNo,
                                    ownerList: $scope.getAccountByNrb(template.remitterAccountNo)
                                }, (function () {
                                    var paymentDetails = template.paymentDetails;
                                    switch (template.templateType) {
                                        case "SWIFT":
                                            return {
                                                transferTitle: template.title.join(" "),
                                                bankName: template.paymentDetails.bankDetails[0],
                                                bankData:template.paymentDetails.bankDetails.join(""),
                                                recipientIdentityType: template.paymentDetails.informationProvider,
                                                recipientBankCountry: template.paymentDetails.bankCountry,
                                                recipientCountry: template.paymentDetails.foreignCountryCode,
                                                recipientAddress: recipient.recipientAddress.join(""),
                                                transferTitleTable: template.title.join(""),
                                                swift_bic: template.paymentDetails.recipientSwift
                                            };
                                        case "DOMESTIC":
                                            return {
                                                transferTitle: template.title.join(" "),
                                                recipientAddress: recipient.recipientAddress.join(""),
                                                transferTitleTable: template.title.join("")
                                            };
                                        case "INSURANCE":
                                            return {
                                                nip: paymentDetails.nip,
                                                secondaryIdType: paymentDetails.secondIDType,
                                                secondaryId: paymentDetails.secondIDNo,
                                                paymentType: paymentDetails.paymentType
                                            };
                                        case "TAX":
                                            return {
                                                nameAndAddress: lodash.union(paymentDetails.taxAccountName, recipient.recipientAddress),
                                                secondaryIdType: paymentDetails.idtype,
                                                secondaryId: paymentDetails.idnumber,
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
);