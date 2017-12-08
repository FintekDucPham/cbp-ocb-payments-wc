ebankingSharedModule.directive('rbRecipientLocation', function(domesticBanksService, pathService) {
    'use strict';

    return {
        restrict: 'EA',

        controller: function () {
            var ctrl = this;
            ctrl.loadingPromise = domesticBanksService.search({
            }).then(function(data) {
                ctrl.bankList = data.content.map(function (bank) {
                    return {
                        bankCode: bank.unitNo,
                        bankName: bank.nameShort
                    }
                });
            }).finally(function () {
                ctrl.loadingPromise = null;
            });
        }
    };
});
