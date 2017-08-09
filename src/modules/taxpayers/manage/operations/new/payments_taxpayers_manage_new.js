angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.taxpayers.manage.new', {
            url: "/new",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/taxpayers/manage/operations/new/payments_taxpayers_manage_new.html",
            controller: "PaymentsTaxpayersManageNewController",
            data: {
                analyticsTitle: "ocb.payments.taxpayers.new.label"
            }
        }).state('payments.taxpayers.manage.new.fill', {
            url: "/fill",
            templateUrl: function () {
                return pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/taxpayers/manage/steps/fill/payments_taxpayers_fill.html";
            },
            controller: 'paymentTaxpayersFillController',
            data: {
                analyticsTitle: "config.multistepform.labels.step1"
            }
        }).state('payments.taxpayers.manage.new.verify', {
            url: "/verify",
            templateUrl: function () {
                return pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/taxpayers/manage/steps/verify/payments_taxpayers_verify.html";
            },
            controller: 'TaxpayersManageVerifyController',
            data: {
                analyticsTitle: "config.multistepform.labels.step2"
            }
        }).state('payments.taxpayers.manage.new.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/taxpayers/manage/operations/new/status/payments_taxpayers_manage_new_status.html",
            controller: "TaxpayersManageNewStatusController",
            data: {
                analyticsTitle: "config.multistepform.labels.step3"
            }
        });
    })
    .controller('PaymentsTaxpayersManageNewController', function ($scope, customerService, lodash) {

        $scope.clearForm = function () {
            $scope.$broadcast('clearForm');
        };
        customerService.getCustomerDetails().then(function(userDetails) {
            if(userDetails.customerDetails.context == 'MICRO') {
                $scope.taxpayer.formData.microName = lodash.find(userDetails.customerDetails.customerContexts,{
                    current: true
                }).fullName;
            }
        });

    }
);
