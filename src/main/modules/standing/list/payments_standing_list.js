angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.standing.list', {
            url: "/list",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/standing/list/payments_standing_list.html",
            controller: "PaymentsStandingPaymentsListController"
        });
    })
    .controller('PaymentsStandingPaymentsListController', function ($scope, $state, bdTableConfig, $timeout, translate,
                                                                    paymentsService, $filter, pathService, viewStateService,
                                                                    standingTransferService) {
        $scope.dateRange = {};

        $scope.options = {
            "futureDatePanelConfig": {} //parameters TODO: wlasciwe parametry z resolva uzyskac
        };

        $scope.paymentDetailsTemplate = pathService.generateTemplatePath("raiffeisen-payments") + "/modules/standing/list/details/payments_standing_list_detail.html";

        $scope.onOperationsDateSubmit = function() {
            $scope.table.tableData.newSearch = true;
            $scope.table.tableControl.invalidate();
        };

        $scope.onEdit = function(standingPayment) {
            viewStateService.setInitialState('payments.standing.manage.edit', {
                referenceId: standingPayment.id
            });
            $state.go('payments.future.manage.edit.fill');
        };

        $scope.onDelete = function(standingPayment) {
            viewStateService.setInitialState('futurePayments.standing.manage.delete', {
                referenceId: standingPayment.id
            });
            $state.go('payments.future.manage.delete.fill');
        };

        $scope.onBack = function(child) {
            child.$emit('$collapseRows');
        };


        $scope.onNewStandingOrderClick = function() {
            $state.go('payments.new.fill', {
                paymentType: "standing"
            });
        };



        $scope.table = {
            tableConfig: new bdTableConfig({
                placeholderText: translate.property("raiff.payments.standing.list.empty")
            }),
            tableData: {
                getData: function (defer, $params) {
                    var params = {};

                    if($scope.table.tableData.newSearch){
                        params.pageNumber = 1;
                        $scope.table.tableData.newSearch = false;
                    }else{
                        params.pageSize   = $params.pageSize;
                        params.pageNumber = $params.currentPage;
                    }

                    standingTransferService.search(params).then(function (response) {

                        response.content = response.content.map(function(elem) {
                            elem.frequency_nextDate = elem.frequency.nextDate;
                            return elem;
                        });

                        defer.resolve(response.content);
                        $params.pageCount = response.totalPages;
                    });
                }
            },
            tableControl: undefined
        };
    }
);