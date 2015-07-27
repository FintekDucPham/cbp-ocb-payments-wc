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