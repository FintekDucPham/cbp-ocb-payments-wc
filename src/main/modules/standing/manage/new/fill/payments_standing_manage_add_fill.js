angular.module('raiffeisen-investments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('investments.confirmed.buy.fill', {
            url: "/fill",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-investments") + "/modules/confirmed/fundBuy/fill/investment_buy_fill.html",
            controller: "InvestmentBuyFillController",
            resolve: {
                identity: ['userService', function(userService) {
                    return userService.getIdentityDetails();
                }],
                nonResidentPaymentLimit: ['systemParameterService', function(systemParameterService) {
                    return systemParameterService.getParamValue("nonresident.payment.limit", 999999999);
                }],
                descriptionExpanded: ['systemParameterService', function(systemParameterService) {
                    return systemParameterService.getParamValue("fund.statement.purchase.expand", "false");
                }]
            }
        });
    })
    .controller('InvestmentBuyFillController', function ($q, cardsService, $scope, bdFillStepInitializer, translate, $state, formService, bdStepStateEvents, initialState, userService, gate, viewStateService, authorizationService, identity, systemParameterService, currencyExchangeService, nonResidentPaymentLimit, descriptionExpanded) {
        $scope.mifidStatamentHtml    = translate.property('raiff.investments.buy.fill.mifidDescriptionHtml').replace('#HREF', $state.href('settings.mifid.report'));

        $scope.descriptionExpanded = descriptionExpanded;

        $scope.nonResidentValidationParams = {
            currencyCalcFn: currencyExchangeService.exchange,
            customerId: identity.id,
            limit: nonResidentPaymentLimit,
            selectedAccount: function() {
                return $scope.investmentBuyContext.items.senderAccount;
            }
        };

        $scope.validators = {
            "fundToBuy": {
                "chooseFund": function(val) {
                    return !!(val && val.id);
                }
            },
            "choosenRegister": {
                "chooseRegister": function(val) {
                    if ($scope.investmentBuyContext.formData.fundToBuy && $scope.investmentBuyContext.formData.fundToBuy.id) {
                        if ($scope.renderData.fundsToRegisters[$scope.investmentBuyContext.formData.fundToBuy.id].length == 1) {
                            return true;
                        }
                        //to znaczy ze user moze wybrac i nalezy sprawdzic czy faktycznie wybral cokolwiek
                        else {
                            return !!val;
                        }
                    }
                    else {
                        return !!val;
                    }
                }
            },
            "amount": {
                "badAmount": function(val) {
                    return !!val;
                },
                "minBuyValue": function(val) {
                    if ($scope.investmentBuyContext.formData.fundToBuy && val) {
                        return val >= $scope.investmentBuyContext.meta.calculatedMinBuyValue;
                    }

                    return true;
                },
                "tooLowAvailableAssets": function(val) {
                    if ($scope.investmentBuyContext.items.senderAccount && val) {
                        return $scope.investmentBuyContext.items.senderAccount.accessibleAssets >= val;
                    }

                    return true;
                }
            },
            "prospectusAccept": {
                "prospectusAcceptRequired": function(val) {
                    return !!val;
                }
            },
            "privacyAccept": {
                "privacyAcceptRequired": function(val) {
                    return !!val;                }
            }
        };

        $scope.amountValidators = $scope.validators.amount;


        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            var form = $scope.investmentBuyForm;

            if (!$scope.investmentBuyContext.formData.fundType || $scope.investmentBuyContext.formData.fundType.showAll) {
                form.fundType.$setValidity('required', false, form);
            }
            else {
                form.fundType.$setValidity('required', true, form);
            }

            //
            if (form.$invalid) {
                form.$setSubmitted(true);
                formService.dirtyFields(form);
            }
            else {
                var formData = {
                    "customerId": identity.id,
                    "firstPurchase": true,
                    "accountId": $scope.investmentBuyContext.items.senderAccount.accountNo,
                    "assetsClass": $scope.investmentBuyContext.formData.fundType.fundType,
                    "participantId": $scope.investmentBuyContext.formData.fundToBuy.participantId ? $scope.investmentBuyContext.formData.fundType.participantId : null,
                    "tfiCodeName": $scope.investmentBuyContext.formData.fundToBuy.tfiCodeName,
                    "fundId": $scope.investmentBuyContext.formData.fundToBuy.id,
                    "fundName": $scope.investmentBuyContext.formData.fundToBuy.fundName,
                    "isNewRegister": !$scope.investmentBuyContext.formData.choosenRegister.registryId,
                    "product": $scope.investmentBuyContext.formData.fundToBuy.fundName,
                    "purchaseType": 'Z',
                    "amount": $scope.investmentBuyContext.formData.amount,
                    "currency": $scope.investmentBuyContext.items.senderAccount.currency,
                    "registryId": null,
                    "registersId": null,
                    "redemptionAccount": null
                };

                if ($scope.investmentBuyContext.formData.choosenRegister && $scope.investmentBuyContext.formData.choosenRegister.registryId) {
                    var regId = $scope.investmentBuyContext.formData.choosenRegister.registryId.split(':');
                    regId = regId[regId.length - 1];

                    // osobno chcemy miec wyslany caly registryId
                    formData.registryId  = $scope.investmentBuyContext.formData.choosenRegister.registryId;
                    // a osobono jego ostatni fragment
                    formData.registersId = regId;
                }

                if ($scope.investmentBuyContext.formData.fundToBuy.redeemAccountRequired || !$scope.investmentBuyContext.formData.choosenRegister.registryId) {
                    formData.redemptionAccount = $scope.investmentBuyContext.items.sellAccount.accountNo;
                }

                // walidacja najpierw w ogole czy przeszla
                gate.command("create_units_purchase", formData).then(function (data) {
                    // if succeed, data.content should be in format like 'EXECUTED_REFID'
                    if (data && data.content && data.content != 'REJECTED') {
                        viewStateService.setInitialState('investments.confirmed.buy.verify', data);
                        actions.proceed();
                    }
                });
            }
        });

        bdFillStepInitializer($scope, {
            formName: 'investmentBuyForm',
            dataObject: $scope.investmentBuyContext
        });

        // resetting fields when someone change account to account in different currency
        var lastSenderAccountCurrency = null;

        $scope.onSenderAccountSelect = function() {
            if ($scope.investmentBuyContext.items.senderAccount.currency != lastSenderAccountCurrency) {
                lastSenderAccountCurrency = $scope.investmentBuyContext.items.senderAccount.currency;
                $scope.clearAllFieldsWithoutAccounts();
            }

            if ($scope.investmentBuyForm.amount) {
                $scope.investmentBuyForm.amount.$validate();
            }
        };

        // $scope.onSellAccountSelect = function() {
        //     if ($scope.investmentBuyContext.items.sellAccount.currency != lastSellAccountCurrency) {
        //         lastSellAccountCurrency = $scope.investmentBuyContext.items.sellAccount.currency;
        //         $scope.clearAllFieldsWithoutAccounts();
        //     }
        // };


        $scope.$on('investmentBuyFormClear', function() {
            $scope.setDefaultValues();
            $scope.onFundToBuyChange();
            $scope.investmentBuyForm.$setPristine();
            $scope.investmentBuyForm.$setUntouched();
        });

        $scope.clearAccountSelects = function() {
            $scope.investmentBuyContext.formData.senderAccountId = ($scope.fullAccountList     && $scope.fullAccountList.length     > 0) ? $scope.fullAccountList[0].accountId     : null;
            $scope.investmentBuyContext.formData.sellAccountId   = ($scope.fullSellAccountList && $scope.fullSellAccountList.length > 0) ? $scope.fullSellAccountList[0].accountId : null;
        };

        $scope.clearAllFieldsWithoutAccounts = function() {

            $scope.investmentBuyContext.formData.fundType = $scope.renderData.fundsTypes[0];
            $scope.investmentBuyContext.formData.choosenRegister = null;
            $scope.investmentBuyContext.formData.fundToBuy = null;
            $scope.investmentBuyContext.formData.amount = null;
            $scope.investmentBuyContext.formData.prospectusAccept = false;
            $scope.investmentBuyContext.formData.privacyAccept = false;
            $scope.investmentBuyContext.formData.mifidStatament = false;

            if ($scope.investmentBuyForm) {
                $scope.investmentBuyForm.$submitted = false;
            }
        };

        $scope.setDefaultValues = function() {
            $scope.clearAccountSelects();
            $scope.clearAllFieldsWithoutAccounts();
        };

        // because we don't want to reset everything when user click "back" button on verify screen
        //$scope.setDefaultValues();
        if (!$scope.investmentBuyContext.formData.fundType) {
            $scope.investmentBuyContext.formData.fundType = $scope.renderData.fundsTypes[0];
        }


        $scope.fundsDataPromise.then(function (d) {
            if (initialState && initialState.fundId) {
                var initialFund = _.find($scope.renderData.fundsArray, function(e) {
                    return e.id == initialState.fundId;
                });

                if (initialFund) {
                    $scope.investmentBuyContext.formData.fundToBuy = initialFund;

                    var fundType = _.find($scope.renderData.fundsTypes, function(e) {
                        return e.fundType == initialFund.fundType;
                    });

                    if (fundType) {
                        $scope.investmentBuyContext.formData.fundType = fundType;
                    }

                    $scope.onFundToBuyChange();
                }
            }
        });
    });