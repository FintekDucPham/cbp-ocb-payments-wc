angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.test_form', {
            url: "/test_form",
            abstract: true,
            controller:"TestFormController",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/testForm/test_form.html",
            data: {
                analyticsTitle: null
            }
        });
    }).controller('TestFormController', function ($scope, bdMainStepInitializer) {


    bdMainStepInitializer($scope, 'testForm', {
        formName: 'testFormForm',
        formData: {},
        options: {},
        meta: {},
        validation: {}
    });

    $scope.modify = {
        verify:{
            data: null
        }
    };

    $scope.clearForm = function(){
        $scope.testForm.formData = {};
        $scope.testForm.items = {};
        $scope.$broadcast('clearForm');
    };

    $scope.testFormAction  = function(){
      console.log('click on action');
    };
    $scope.testFormParams = {
        completeState: 'payments.new.fill',
        onClear: $scope.clearForm,
        cancelState: 'dashboard',
        footerType:"test",
        labels:{
            prev: 'ocb.payments.prev',
            testFormButton: 'ocb.payments.testFormButton',
            next:"ocb.payments.next",
            finalize: 'ocb.payments.finalize'
        },
        testFormAction: $scope.testFormAction
    }
});;