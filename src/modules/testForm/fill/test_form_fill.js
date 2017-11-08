angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.test_form.fill', {
            url: "/fill",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/testForm/fill/test_form_fill.html",
            controller: "TestFormlStep1Controller",
            data: {
                analyticsTitle: "config.multistepform.labels.step1"
            }
        });
    })
    .controller('TestFormlStep1Controller', function ($scope, bdStepStateEvents) {

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            actions.proceed();

        });

    });