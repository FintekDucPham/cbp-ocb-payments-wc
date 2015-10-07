angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.recipients.list', {
            url: "/list",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/list/payments_recipients_list.html",
            controller: "PaymentsRecipientsListController"
        });
    })
    .controller('PaymentsRecipientsListController', function ($scope, $state, bdTableConfig, $timeout, recipientsService,
                                                              viewStateService, customerService, translate, rbRecipientTypes, rbRecipientOperationType, lodash, pathService) {


        customerService.getCustomerDetails().then(function(customerDetails){
            $scope.customerDetails = customerDetails.customerDetails;
        });


        $scope.getAccountByNrb = function(accountNrb){
            return lodash.find($scope.accountList, {
                accountNo: accountNrb
            });
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

        $scope.recipientListPromise = {};

        $scope.onRecipientEdit = function(data){
            $state.go("payments.recipients.manage.edit.fill", {
                recipientType: data.recipientType.toLowerCase(),
                operation: 'edit',
                recipient: angular.copy(data)
            });
        };

        $scope.onRecipientRemove = function(data){
            $state.go("payments.recipients.manage.remove.verify", {
                recipientType: data.recipientType.toLowerCase(),
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

        $scope.onRecipientTransfer = function(data){
            $state.go("payments.new.fill", {
                paymentType: data.recipientType.toLowerCase(),
                recipientId: data.recipientId
            });
        };

        $scope.resolveTemplateType = function (recipientType) {
            return "{0}/modules/recipients/list/details/{1}_recipient_details.html".format(pathService.generateTemplatePath("raiffeisen-payments"), recipientType.toLowerCase());
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

                        params.pageSize = $params.pageSize;
                        params.pageNumber = $params.currentPage;

                        if($scope.types.currentType !== recipientFilterType.ALL){
                            params.filerTemplateType = $scope.types.currentType.code;
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
                                    debitNrb: template.remitterAccountNo
                                }, (function () {
                                    var paymentDetails = template.paymentDetails;
                                    switch (template.templateType) {
                                        case "DOMESTIC":
                                            return {
                                                transferTitle: template.title.join(" "),
                                                recipientAddress: recipient.recipientAddress,
                                                transferTitleTable: template.title
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
                                                nameAndAddress: recipient.recipientName.join(" "),
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