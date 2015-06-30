angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.new', {
            url: "/new",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/new/payments_new.html",
            controller: "PaymentsNewController"
        });
    })
    .controller('PaymentsNewController', function ($scope, $rootScope, paymentsService, $filter, transactionService, transactionFilterCriteria, gate, $timeout, customerProductService, blockadesService, $state, $stateParams, searchWrapperService, domService, viewStateService, formService) {
        $scope.formData = {
            exchangeMessageHidden: true
        };

        $scope.submit = function(form){
            console.debug(form);
            if (!form.$valid) {
                formService.dirtyFields(form);
            }else{
                var error = false;
                console.debug($scope.formData.formModel.recipientAccountNo);
                if(!$scope.validateNrbNumber($scope.formData.formModel.recipientAccountNo)){
                    error = true;
                    form.recipientAccountNo.$error.invalid = true;
                    form.recipientAccountNo.$dirty = true;
                }else{
                    form.recipientAccountNo.$error.invalid = false;
                    form.recipientAccountNo.$dirty = false;
                }
                if(!error) {
                    $scope.formData.formModel.remitterId = 1008020;
                    $scope.formData.formModel.transferFromTemplate = false;
                   // $scope.formData.formModel.remitterAccountId = 0;
                    $scope.formData.formModel.recipientAccountNo = $scope.formData.formModel.recipientAccountNo.split(" ").join("");
                    paymentsService.action($scope.formData.formModel, 'create_domestic_transfer').then(function(data) {
                     $state.go('payments.accept', {
                     dispositionId: data.content
                     });
                     });
                }
            }

        };

        $scope.validateNrbNumber = function(nrb){
            nrb = nrb.replace(/[^0-9]+/g,'');
            var Wagi = new Array(1,10,3,30,9,90,27,76,81,34,49,5,50,15,53,45,62,38,89,17, 73,51,25,56,75,71,31,19,93,57);
            if(nrb.length == 26) {
                nrb = nrb + "2521";
                nrb = nrb.substr(2) + nrb.substr(0,2);
                var Z =0;
                for (var i=0;i<30;i++) {
                    Z += nrb[29-i] * Wagi[i];
                }
                if (Z % 97 == 1) {
                    return true;
                }else{
                    return false;
                }
            }else{
                return false;
            }

        };

    });