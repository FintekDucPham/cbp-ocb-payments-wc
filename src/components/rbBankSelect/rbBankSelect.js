ebankingSharedModule.directive('rbBankSelect', function(pathService, $timeout) {
    'use strict';

    return {
        restrict: 'E',
        templateUrl: pathService.generateTemplatePath('ocb-payments') + '/components/rbBankSelect/rbBankSelect.html',
        require: '^rbRecipientLocation',
        scope: {
            bankCode: '=rbBankCode',
            bank: '=rbBank',
            //onSelect: '&rbOnBankSelect',
        },

        link: function postLink($scope, iElement, iAttrs, locationCtrl) {
            $scope.locationCtrl = locationCtrl;
            $scope.selection = {};

            locationCtrl.loadingPromise.then(function () {
                $scope.$watch('bank', function (bankToSelect) {
                    $scope.bankCode = bankToSelect.bankCode;
                    $scope.selection.bank = bankToSelect;
                    locationCtrl.bankList.some(function (bank) {
                        if (bank.bankCode === bankToSelect.bankCode) {
                            $scope.bank = bank;
                            $scope.selection.bank = bank;
                            return true;
                        }
                    });
                });
            });

            $scope.selectBank = function (bank) {
                $scope.bankCode = bank.bankCode;
                $scope.bank = bank;
                $scope.selection.bank = bank;
                $timeout(function() {
                    // $scope.onSelect({
                    //     $bank: bank
                    // });
                });
            };
        }
    };
});
