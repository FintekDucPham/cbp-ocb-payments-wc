angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.recipients.list', {
            url: "/list",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/list/payments_recipients_list.html",
            controller: "PaymentsRecipientsListController"
        });
    })
    .controller('PaymentsRecipientsListController', function ($scope, $state, bdTableConfig, $timeout, recipientsService, viewStateService) {

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
                templateId: dataObject.templateId,
                paymentType: dataObject.recipientType
            };
            viewStateService.setInitialState('payments.new', dataObject);
            $state.go("payments.new.fill", routeObject);
        };

        $scope.table = {
            tableConfig : new bdTableConfig({}),
            tableData : {
                getData: function ($promise, $params) {

                    $scope.recipientListPromise = $promise.promise;

                    var params = {
                        pageSize: 10
                    };

                    if($scope.types.currentType!==TYPES.ALL){
                        params.filterTemplateType = $scope.types.currentType;
                    }

                    recipientsService.search(params).then(function(data) {

                        var list = [];

                        angular.forEach(data.content, function(recipient){
                            angular.forEach(recipient.paymentTemplates, function(template){
                                list.push(
                                    {
                                        recipientId: recipient.recipientId,
                                        templateId: recipient.templateId,
                                        customerName: template.templateName,
                                        recipient: recipient.recipientName.join(" "),
                                        address: recipient.recipientAddress.join(" "),
                                        nrb: template.beneficiaryAccountNo,
                                        debitNrb: template.debitAccount,
                                        transferTitle: template.title.join(" "),
                                        recipientType: template.templateType
                                    }
                                );
                            });
                        });

                        $promise.resolve(list);
                    });

                }
            },
            tableControl: undefined
        };


    }
);