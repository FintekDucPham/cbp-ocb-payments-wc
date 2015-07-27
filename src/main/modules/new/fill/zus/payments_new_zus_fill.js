angular.module('raiffeisen-payments')
    .constant('zusPaymentInsurances', ['sp', 'zd', 'fp_fgsp', 'fep'])
    .controller('NewZusPaymentFillController', function ($scope, lodash, zusPaymentInsurances) {

        $scope.zusInsuranceTypes = zusPaymentInsurances;

        function calculateInsurancesAmount() {
            return lodash.map(lodash.groupBy(lodash.filter($scope.payment.formData.insurances, function (element) {
                return element.active && !!element.currency;
            }), 'currency'), function (values) {
                var totalAmount = 0;
                lodash.forEach(values, function (value) {
                    totalAmount += value.amount;
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

    });