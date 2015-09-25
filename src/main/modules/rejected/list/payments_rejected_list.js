angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.rejected.list', {
            url: "/list",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/rejected/list/payments_rejected_list.html",
            controller: "PaymentsRejectedListController",
            resolve: {
                parameters: ["$q","customerService","systemParameterService",function($q, customerService, systemParameterService){
                    return $q.all({
                        detalOffsetMax: systemParameterService.getParameterByName("rejectedOperationList.max.offset.detal"),
                        microOffsetMax: systemParameterService.getParameterByName("rejectedOperationList.max.offset.micro"),
                        detalOffsetDefault: systemParameterService.getParameterByName("rejectedOperationList.default.offset.detal"),
                        microOffsetDefault: systemParameterService.getParameterByName("rejectedOperationList.default.offset.micro"),
                        customerDetails: customerService.getCustomerDetails()
                    }).then(function(data){
                        return {
                            micro: {
                                default: parseInt(data.microOffsetDefault.value),
                                max: parseInt(data.microOffsetMax.value)
                            },
                            detal: {
                                default: parseInt(data.detalOffsetDefault.value),
                                max: parseInt(data.detalOffsetMax.value)
                            },
                            customerDetails: {
                                context: data.customerDetails.customerDetails.context
                            }
                        };
                    });
                }]
            }
        });
    })
    .controller('PaymentsRejectedListController', function ($scope, $q, $timeout, bdTableConfig, translate, parameters) {

        var PERIOD_TYPES = {
            LAST: 'LAST',
            RANGE: 'RANGE'
        };

        var LAST_TYPES = {
            DAYS: "DAYS",
            WEEKS: "WEEKS",
            MONTH: "MONTHS"
        };

        //prepare dates
        var now = new Date();
        var firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        var oneDayMilisecs  = 1000*60*60*24;

        //scope object
        $scope.rejectedList = {
            data : null,
            periodTypes:PERIOD_TYPES,
            parameters: parameters,
            filterData: {
                periodType: {
                    model: parameters.customerDetails.context==='DETAL' ? PERIOD_TYPES.LAST : PERIOD_TYPES.RANGE
                },
                last:{
                    value: parameters.detal.default,
                    type: {
                        selected: LAST_TYPES.DAYS,
                        list: [LAST_TYPES.DAYS, LAST_TYPES.WEEKS, LAST_TYPES.MONTH]
                    }
                },
                range:{
                    dateFrom: new Date(now.getTime()-parameters.detal.default*oneDayMilisecs),
                    dateTo: now
                }
            }
        };

        //if micro
        if(parameters.customerDetails.context==='MICRO'){
            $scope.rejectedList.filterData.last.value = Math.ceil((now.getTime() - firstDayOfCurrentMonth.getTime() + oneDayMilisecs)/oneDayMilisecs);
            $scope.rejectedList.filterData.range.dateFrom = firstDayOfCurrentMonth;
        }

        //table config
        $scope.tableConfig = new bdTableConfig({
            placeholderText: translate.property("raiff.payments.rejected.list.empty.label"),
            range : {dateFrom : 0, dateTo : 0}
        });

        //table def
        $scope.table = {
            tableConfig : $scope.tableConfig,
            tableData : {
                getData: function ($promise, $params) {
                    $timeout(function(){
                        $promise.resolve([{"id":"1","accountNo":"2342423424242342342342434","accountCurrency":"PLN","accountId":"4","accountName":"konto jakies","recipientName":["3534523452345"],"recipientAddress":["fdgsdfgsdfg"],"senderName":["sdfgsdfg"],"senderAddress":["fgjfgjfghj"],"recipientAccountNo":"34523452345234532452345","amount":234,"currency":"PLN","title":["title"],"transferType":"","paymentType":"ZUS","status":"","realizationDate":"date-time","registrationDate":"date-time","paymentDetails":{},"cyclicDefinition":{"beginExecutionDate":"date-time","endExecutionDate":"date-time","previousExecutionDate":"date-time","nextExecutionDate":"date-time","suspensionDateFrom":"date-time","suspensionDateTo":"date-time","isBroken":false,"period":0,"periodType":"","executionDayInMonth":0},"isCyclic":false,"deliveryDate":"date-time","charges":[{"amount":0,"description":"","bonusCount":0,"currency":""}],"lastRealizationDesc":"","realizationDateShiftReason":"","templateId":"","saveTemplate":false,"templateName":""}]);
                    }, 1500);
                }
            },
            tableControl: undefined
        };

        //action
        $scope.onSubmit = function(){
            if($scope.filterForm.$valid){
                $scope.table.tableControl.invalidate();
            }
        };
    });