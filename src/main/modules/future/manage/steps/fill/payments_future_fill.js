angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.future.manage.edit.template', {
            url: "/template",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/future/manage/steps/fill/payments_future_fill.html",
            controller: ['$scope', 'bdFillStepInitializer', 'bdStepStateEvents', 'formService', function($scope, bdFillStepInitializer, bdStepStateEvents, formService){


            }]
        });
    });



