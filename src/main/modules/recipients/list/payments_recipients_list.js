angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.recipients.list', {
            url: "/list",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/list/payments_recipients_list.html",
            controller: "PaymentsRecipientsListController"
        });
    })
    .controller('PaymentsRecipientsListController', function ($scope, $state, bdTableConfig, $timeout, recipientsService, recipient_edit) {

        var TYPES = {
            ALL: 'ALL',
            DOMESTIC: 'DOMESTIC'
        };

        $scope.types = {
            currentType:TYPES.ALL,
            list: [TYPES.ALL, TYPES.DOMESTIC]
        };

        $scope.onRecipientEdit = function(data){
            var dataObject = angular.copy(data);
            var transferObject = {
                recipientType: data.recipientType,
                recipientId: data.recipientId,
                templateId: data.templateId
            };

            recipient_edit.data = dataObject;
            $state.go("payments.recipients.manage.edit.fill", transferObject, dataObject);
        };

        $scope.onRecipientRemove = function(){
            console.log(this);
        };

        $scope.table = {
            tableConfig : new bdTableConfig({}),
            tableData : {
                getData: function ($promise, $params) {

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