angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.recipients', {
            url: "/recipients",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/payments_recipients.html",
            controller: "PaymentsRecipientsController"
        });
    })
    .controller('PaymentsRecipientsController', function ($scope, bdTableConfig, $timeout) {


        var TYPES = {
            ALL: 'all',
            DEFINED: 'defined',
            UNDEFINED: 'undefined'
        };

        $scope.types = {
            currentType:TYPES.ALL,
            list: [TYPES.ALL, TYPES.DEFINED, TYPES.UNDEFINED]
        };

        $scope.tableConfig = new bdTableConfig({});

        $scope.tableData = {
            getData: function ($promise, $params) {
                $timeout(function () {
                    $promise.resolve([
                        {
                            "customerName": "Pierwszy odbiorca custom",
                            "recipient": "Pierwszy odbiorca",
                            "nrb": "523523452345234535",
                            "address": "address 1",
                            "transferTitle": "title 1",
                            "type": "a"

                        },
                        {
                            "customerName": "2 odbiorca custom",
                            "recipient": "2 odbiorca",
                            "nrb": "223523452345234535",
                            "address": "address 2",
                            "transferTitle": "title 2",
                            "type": "b"

                        }
                    ]);
                });
            }
        };


    }
);