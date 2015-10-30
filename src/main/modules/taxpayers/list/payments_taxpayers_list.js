angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.taxpayers.list', {
            url: "/list",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/taxpayers/list/payments_taxpayers_list.html",
            controller: "PaymentsTaxpayersListController"
        });
    })
    .controller('PaymentsTaxpayersListController', function ($scope, $state, bdTableConfig, $timeout, taxpayersService,
                                                             viewStateService, translate, rbTaxpayerTypes, rbTaxpayerOperationType, lodash) {

        var taxpayerFilterType = angular.extend({}, rbTaxpayerTypes, {
            ALL: {
                code: 'ALL'
            }
        });

        $scope.types = {
            currentType: taxpayerFilterType.ALL,
            availableTypes: taxpayerFilterType,
            availableTypesList: lodash.map(taxpayerFilterType)
        };

        $scope.taxpayerListPromise = {};

        $scope.onBack = function(childScope) {
            childScope.$emit('$collapseRows');
        };

        $scope.onTransfer = function(taxpayer) {
            $state.go("payments.new.fill", {
                paymentType: taxpayer.taxpayerType.state,
                taxpayerId: taxpayer.taxpayerId
            });
        };

        function goToOperation(operationType, data, operationStep) {
            if(!operationStep) {
                operationStep = 'fill';
            }
            var copiedData = angular.copy(data);
            $state.go("payments.taxpayers.manage.{0}.{1}".format(operationType, operationStep), {
                taxpayerType: data.taxpayerType.code.toLowerCase(),
                operation: operationType,
                taxpayer: {
                    "taxpayerId": copiedData.taxpayerId,
                    "customName": copiedData.customerName,
                    "secondaryIdType": copiedData.secondaryIdType,
                    "secondaryIdNo": copiedData.secondaryId,
                    "nip": copiedData.nip,
                    "taxpayerData": copiedData.data,
                    "taxpayerType": copiedData.taxpayerType.code
                }
            });
        }

        $scope.onTaxpayerEdit = function (data) {
            goToOperation('edit', data);
        };

        $scope.onTaxpayerRemove = function (data) {
            goToOperation('remove', data, 'verify');
        };

        $scope.onTaxpayerCreate = function () {
            $state.go("payments.taxpayers.manage.new.fill", {
                operation: rbTaxpayerOperationType.NEW.code
            });
        };

        $scope.table = {
            tableConfig: new bdTableConfig({
                placeholderText: translate.property("raiff.payments.taxpayers.label.empty_list")
            }),
            tableData: {
                getData: function ($promise, $params) {
                    $timeout(function () {
                        var params = {
                            queryString: $scope.table.operationTitle ? encodeURIComponent($scope.table.operationTitle) : $scope.table.operationTitle
                        };

                        params.pageSize = $params.pageSize;
                        params.pageNumber = $params.currentPage;

                        if ($scope.types.currentType !== taxpayerFilterType.ALL) {
                            params.filerTemplateType = $scope.types.currentType.code;
                        } else {
                            delete params.filerTemplateType;
                        }

                        $scope.taxpayerListPromise = taxpayersService.search(params).then(function (data) {

                            var list = $scope.taxpayerList = lodash.map(data.content, function (taxpayer) {
                                return {
                                    taxpayerType: rbTaxpayerTypes[taxpayer.payerType],
                                    taxpayerTypeMessage: translate.property('raiff.payments.taxpayers.list.type.{0}'.format(taxpayer.payerType)),
                                    customerName: taxpayer.name,
                                    taxpayerId: taxpayer.id,
                                    secondaryIdType: taxpayer.secondaryIdType,
                                    secondaryId: taxpayer.secondaryId,
                                    nip: taxpayer.nip,
                                    data: taxpayer.data,
                                    dataShort: taxpayer.data.join(' ').substring(0, 70)
                                };
                            });
                            $params.pageCount = data.totalPages;
                            return list;

                        });
                        $promise.resolve($scope.taxpayerListPromise);
                    });

                }
            },
            tableControl: undefined
        };


    }
);