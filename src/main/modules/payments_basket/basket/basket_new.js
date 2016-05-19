angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.basket.new', {
            url: "/new",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/payments_basket/basket/basket_new.html",
            controller: "PaymentsBasketNewController",

            resolve: {
                parameters: ["$q", "systemParameterService", "FUTURE_DATE_TYPES", function ($q, systemParameterService) {
                    return $q.all({
                        currencyOrder: systemParameterService.getValueForCurrentContext("nib.accountList.currency.order")

                    }).then( function (data) {
                        var result = {
                            currencyOrder: data.currencyOrder.split(",")
                        };
                        return result;
                    });
                }]

            }

        });
    })
    .controller('PaymentsBasketNewController', function ($scope, bdMainStepInitializer, pathService, translate, $stateParams, $state, lodash, validationRegexp, downloadService, systemParameterService,  lodash, systemParameterService, parameters) {

        bdMainStepInitializer($scope, 'basket',{
            formName: 'basketForm',
            formData: {
            },
            token: {
                model: null,
                params: {}
            },
            validation: {},
            payments: {},
            item: {},
            transactionList:{},
            searchPanel:{},
            meta : {
                newSearch: true,
                correct : false
            },
            summary:{},
            validator:{}
        });


        $scope.getIcon = downloadService.downloadIconImage;

        $scope.systemParameterDefinedName = {};
        systemParameterService.search().then(function(systemParams){
            for(var i=0; i<systemParams.length;i++){
                if(systemParams[i].parameterName == 'nib.access.account.own.name.visible') {
                    $scope.systemParameterDefinedName = systemParams[i];
                }
            }
        });



        $scope.deleteSelected = function(){

        };


        $scope.basket.rbBasketStepParams = {
            completeState: 'payments.basket.new.fill',
            footerType: 'basket',
            labels : {
                prev: 'raiff.payments.basket.multistepform.buttons.cancel',
                next: 'config.multistepform.buttons.next',
                accept: 'config.multistepform.buttons.accept',
                finalize: 'raiff.payments.new.btn.finalize'
            },
            visibility:{
                change: true,
                next: true,
                accept: true,
                finalize: true
            }
        };


        $scope.addPaymentAmountToSummary= function (payment, summary) {
            if (!!payment.currency) {
                if (!summary[payment.currency]) {
                    summary[payment.currency] = {
                        sum: 0,
                        amount: 0
                    };
                }
                summary[payment.currency].sum += payment.amount;
                summary[payment.currency].amount += 1;
            }
        };

        $scope.formSummary= function (sumsPerCurrency) {
            var unsortedSummary = formCurrencyAmountArray(sumsPerCurrency);
            return getSortedSummary(unsortedSummary);

        };

        function formCurrencyAmountArray(sumsPerCurrency) {
            var summary = [];
            for (var currency in sumsPerCurrency) {
                if (sumsPerCurrency.hasOwnProperty(currency)) {
                    summary.push({
                        currency: currency,
                        sum: sumsPerCurrency[currency].sum,
                        amount: sumsPerCurrency[currency].amount
                    });
                }
            }
            return summary;
        }


         function getSortedSummary(summary) {

         return lodash.sortBy(summary, function(currencySum) {

         return this.indexOf(currencySum.currency);
         }, parameters.currencyOrder);

         }



    });