ebankingSharedModule.directive('rbBankSelect', function(pathService, domesticBanksService) {
    'use strict';

    return {
        restrict: 'E',
        templateUrl: pathService.generateTemplatePath('ocb-payments') + '/components/rbBankSelect/rbBankSelect.html',
        require: '?^rbRecipientLocation',
        scope: {
            bankCode: '=rbBankCode',
            bank: '=rbBank',
            placeholder: '@?rbPlaceholder'
        },

        link: function postLink($scope, iElement, iAttrs, locationCtrl) {
            $scope.loading = true;
            $scope.banksList = null;
            $scope.selection = {};

            $scope.loadingPromise = locationCtrl
                ? locationCtrl.loadingPromise.then(function () {
                    $scope.banksList = locationCtrl.banksList;
                })
                : domesticBanksService.search({}).then(function(data) {
                    $scope.banksList =  data.content.map(function (bank) {
                        return {
                            bankCode: bank.unitNo,
                            bankName: bank.nameShort
                        };
                    });
                });

            $scope.loadingPromise.then(function () {
                $scope.$watch('bankCode', function (bankCode) {
                    if (!bankCode) {
                        clearSelection();
                    } else if (!selectBank(bankCode)) {
                        setBank({
                            bankCode: bankCode,
                            bankName: bankCode
                        });
                    }
                });
                $scope.$watch('bank', function (bank) {
                    if (!bank) {
                        clearSelection();
                    } else if (!selectBank(bank.bankCode)) {
                        setBank(bank);
                    }
                });
                $scope.loading = false;
            });


            $scope.selectBank = function (bank) {
                if (!bank) {
                    clearSelection();
                } else {
                    setBank(bank);
                }
            };

            function clearSelection() {
                $scope.selection.bank = null;
                $scope.bankCode = '';
                $scope.bank = null;
                if (locationCtrl) {
                    locationCtrl.setBank(null);
                }
            }

            function setBank(bank) {
                $scope.selection.bank = bank;
                $scope.bankCode = bank.bankCode;
                $scope.bank = bank;
                if (locationCtrl) {
                    locationCtrl.setBank(bank);
                }
            }

            function selectBank(bankCode) {
                return $scope.banksList.some(function (bank) {
                    if (bank.bankCode === bankCode) {
                        setBank(bank);
                        return true;
                    }
                });
            }
        }
    };
});
