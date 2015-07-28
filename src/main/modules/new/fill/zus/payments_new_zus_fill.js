angular.module('raiffeisen-payments')
    .constant('zusPaymentInsurances', ['sp', 'zd', 'fp_fgsp', 'fep'])
    .constant('zusSuplementaryIds', ['P', 'R', '1', '2'])
    .constant('zusPaymentTypes', "S M U T E A B D".split(' '))
    .controller('NewZusPaymentFillController', function ($scope, lodash, zusPaymentInsurances, zusSuplementaryIds, zusPaymentTypes) {

        angular.extend($scope.payment.meta, {
            zusInsuranceTypes: zusPaymentInsurances,
            zusSuplementaryIds: zusSuplementaryIds,
            zusPaymentTypes: zusPaymentTypes
        });

        $scope.$on('clearForm', function() {
            $scope.payment.formData.insurances = null;
        });

        function calculateInsurancesAmount() {
            return lodash.map(lodash.groupBy(lodash.filter($scope.payment.formData.insurances, function (element) {
                return element.active && !!element.currency;
            }), 'currency'), function (values) {
                var totalAmount = 0;
                lodash.forEach(values, function (value) {
                    totalAmount += value.amount || 0;
                });
                return {
                    currency: values[0].currency,
                    amount: totalAmount
                };
            });
        }

        $scope.totalPaymentAmount = [];

        $scope.$watch('payment.formData.insurances', function () {
            $scope.totalPaymentAmount = calculateInsurancesAmount();
        }, true);

        $scope.clearTaxpayer = function() {
            $scope.payment.items.taxpayer = null;
            $scope.payment.formData.taxpayer = null;
            $scope.payment.formData.taxpayerNip = null;
            $scope.payment.formData.taxpayerData = null;
        };

        $scope.selectTaxpayer = function(taxpayer) {
            $scope.payment.formData.taxpayer = taxpayer.name;
            $scope.payment.formData.taxpayerNip = taxpayer.nip;
            $scope.payment.formData.taxpayerData = taxpayer.data;
        };

    });