angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.recipients.list', {
            url: "/list",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/list/payments_recipients_list.html",
            controller: "PaymentsRecipientsListController"
        });
    }).controller('PaymentsRecipientsListController', function ($scope, $state, bdTableConfig, $timeout, recipientsService, viewStateService, translate, rbRecipientTypes, rbRecipientOperationType, lodash, pathService) {


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
            var dataObject = angular.copy(data);
            var routeObject = {
                recipientType: dataObject.recipientType,
                operation: 'edit'
            };
            var initObject = angular.extend(angular.copy(data), routeObject);
            viewStateService.setInitialState('payments.recipients.manage.edit', initObject);
            $state.go("payments.recipients.manage.edit.fill", routeObject);
        };

        $scope.onRecipientRemove = function(data){
            var dataObject = angular.copy(data);
            var routeObject = {
                recipientType: dataObject.recipientType,
                operation: 'remove'
            };
            var initObject = angular.extend(angular.copy(data), routeObject);
            viewStateService.setInitialState('payments.recipients.manage.remove', initObject);
            $state.go("payments.recipients.manage.remove.verify", routeObject);

        };

        $scope.onRecipientCreate = function(){
            var routeObject = {
                recipientType: rbRecipientTypes.DOMESTIC.code,
                operation: rbRecipientOperationType.NEW.code
            };
            viewStateService.setInitialState('payments.recipients.manage.new', routeObject);
            $state.go("payments.recipients.manage.new.fill", routeObject);

        };

        $scope.onRecipientTransfer = function(data){
            var dataObject = angular.copy(data);
            var routeObject = {
                recipientId: dataObject.recipientId,
                templateId: dataObject.templateId, // todo not used right now - only one template for recipient supported
                paymentType: angular.lowercase(dataObject.recipientType)
            };
            $state.go("payments.new.fill", routeObject);
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
                                    nrb: template.beneficiaryAccountNo
                                }, (function () {
                                    var paymentDetails = template.paymentDetails;
                                    switch (template.templateType) {
                                        case "DOMESTIC":
                                            return {
                                                debitNrb: template.remitterAccountNo,
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
                                                nip: paymentDetails.nip,
                                                nameAndAddress: recipient.recipientName.join(" "),
                                                secondaryIdType: paymentDetails.idtype,
                                                secondaryId: paymentDetails.idnumber,
                                                formSymbol: paymentDetails.formCode,
                                                periodType: paymentDetails.periodType
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