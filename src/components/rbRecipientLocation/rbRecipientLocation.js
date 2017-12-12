ebankingSharedModule.directive('rbRecipientLocation', function(domesticBanksService, pathService) {
    'use strict';

    return {
        restrict: 'EA',

        controller: function ($scope) {
            var ctrl = this, banksList = null, branchBankCode = '', branchProvince = '';
            ctrl.banksList = null;
            ctrl.branchesList = null;
            ctrl.loading = true;

            ctrl.loadingPromise = domesticBanksService.search({}).then(function(data) {
                banksList = data.content;
                ctrl.banksList = banksList.map(function (bank) {
                    return {
                        bankCode: bank.unitNo,
                        bankName: bank.nameShort
                    }
                });
                updateBranchList();
            }).finally(function () {
                ctrl.loading = false;
            });

            ctrl.setBank = function (bank) {
                var bankCode = bank ? bank.bankCode : '';
                if (branchBankCode !== bankCode) {
                    branchBankCode = bankCode;
                    if (banksList) {
                        updateBranchList();
                    }
                }
            };

            ctrl.setProvince = function (province) {
                if (branchProvince !== province) {
                    branchProvince = province;
                    if (banksList) {
                        updateBranchList();
                    }
                }
            };

            function updateBranchList() {
                var branchesList = [];
                banksList.forEach(function (bank) {
                    if (branchBankCode === bank.unitNo) {
                        bank.branches.forEach(function (branch) {
                           if (branchProvince === branch.province) {
                               branchesList.push({
                                   branchCode: branch.branchCode,
                                   branchName: branch.branchName
                               });
                           }
                        });
                    }
                });
                ctrl.branchesList = branchesList;
                $scope.$broadcast('BranchesListUpdated');
            }
        }
    };
});
