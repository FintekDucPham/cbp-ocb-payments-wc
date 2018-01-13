angular.module('ocb-deposits')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.auto_bill.fill', {
            url: "/fill",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/auto_bill/fill/payments_auto_bill_fill.html",
            controller: "AutoBillFillController",
            data: {
                analyticsTitle: 'config.multistepform.labels.step1'
            }
        });
    })
    .controller('AutoBillFillController', function ($scope, bdFillStepInitializer, translate, formService, bdStepStateEvents, viewStateService, initialState) {
        var data = initialState.data;
        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            var form = $scope.autoBillForm;
            if (form.$invalid) {
                formService.dirtyFields(form);
            } else {
                actions.proceed();
            }
        });

        bdFillStepInitializer($scope, {
            formName: 'autoBillForm'
        });
    });