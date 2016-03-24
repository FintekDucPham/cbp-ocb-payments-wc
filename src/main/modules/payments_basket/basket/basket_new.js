angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.basket.new', {
            url: "/new",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/payments_basket/basket/basket_new.html",
            controller: "PaymentsBasketNewController"
        });
    })
    .controller('PaymentsBasketNewController', function ($scope, bdMainStepInitializer, pathService, translate, $stateParams, $state, lodash, validationRegexp, downloadService, systemParameterService) {

        bdMainStepInitializer($scope, 'basket',{
            formName: 'basketForm',
            formData: {
            },
            token: {
                model: null,
                params: {}
            },
            validation: {},
            payments: {},
            item: {}
        });

        $scope.getIcon = downloadService.downloadIconImage;

        $scope.systemParameterDefinedName = {};
        systemParameterService.search().then(function(systemParams){
            for(var i=0; i<systemParams.length;i++){
                if(systemParams[i].parameterName == 'nib.access.account.own.name.visible') {
                    $scope.systemParameterDefinedName = systemParams[i];
                }
            }
        });



        $scope.deleteSelected = function(){

        };


        $scope.basket.rbBasketStepParams = {
            completeState: 'payments.basket.new.fill',
            footerType: 'basket',
            onDeleteSelected: $scope.deleteSelected,
            labels : {
                delete: 'raiff.payments.basket.multistepform.buttons.delete',
                prev: 'config.multistepform.buttons.change',
                next: 'config.multistepform.buttons.next',
                accept: 'config.multistepform.buttons.accept',
                finalize: 'raiff.payments.new.btn.finalize'
            },
            visibility:{
                change: true,
                next: true,
                accept: true,
                finalize: true
            }
        };





    });