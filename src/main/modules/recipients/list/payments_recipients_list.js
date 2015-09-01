angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.recipients.list', {
            url: "/list",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/list/payments_recipients_list.html",
            controller: "PaymentsRecipientsListController"
        });
    })
    .controller('PaymentsRecipientsListController', function ($scope, $state, bdTableConfig, $timeout, recipientsService,
                                                              viewStateService, translate) {

        var TYPES = {
            ALL: 'ALL',
            DOMESTIC: 'DOMESTIC'
        };

        $scope.types = {
            currentType:TYPES.ALL,
            list: [TYPES.ALL, TYPES.DOMESTIC]
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
                recipientType: 'DOMESTIC',
                operation: 'new'
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

                        if($scope.types.currentType!==TYPES.ALL){
                            params.filterTemplateType = $scope.types.currentType;
                        }

                        $scope.recipientListPromise = recipientsService.search(params).then(function(data) {

                            var list = $scope.recipientList = [];

                            angular.forEach(data.content, function(recipient){
                                angular.forEach(recipient.paymentTemplates, function(template){
                                    list.push(
                                        {
                                            recipientId: recipient.recipientId,
                                            templateId: recipient.templateId,
                                            customerName: recipient.recipientName.join(" "),
                                            recipient: recipient.recipientName.join(" "),
                                            address: recipient.recipientAddress.join(" "),
                                            nrb: template.beneficiaryAccountNo,
                                            debitNrb: template.remitterAccountNo,
                                            transferTitle: template.title.join(" "),
                                            recipientType: template.templateType,
                                            recipientAddress : recipient.recipientAddress,
                                            recipientName : recipient.recipientName,
                                            transferTitleTable : template.title
                                        }
                                    );
                                });
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