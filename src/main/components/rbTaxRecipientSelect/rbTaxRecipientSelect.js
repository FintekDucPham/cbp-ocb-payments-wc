angular.module('raiffeisen-payments')
    .directive('rbTaxRecipientSelect', function (pathService, recipientsService, lodash) {
        return {
            restrict: 'E',
            templateUrl: pathService.generateTemplatePath("raiffeisen-payments") + "/components/rbTaxRecipientSelect/rbTaxRecipientSelect.html",
            scope: {
                recipientId: '=rbTaxRecipientId',
                recipient: '=rbTaxRecipient',
                recipientList: '=?rbTaxRecipientList',
                placeholderText: '@rbPlaceholderText',
                clearText: '@rbRecipientClearText',
                onSelectRecipient: '&rbOnSelectRecipient',
                onClearRecipient: '&rbOnClearRecipient'
            },
            controller: function ($scope) {

                $scope.selection = {
                    isSelected: false
                };

                $scope.$watch('recipientId', function(recipientId) {
                   if(recipientId) {
                       $scope.searchRecipientsPromise.then(function() {
                           var recipient = lodash.find($scope.recipientList, {
                               templateId: recipientId
                           });
                           if(recipient) {
                               $scope.selectRecipient(recipient);
                           } else {
                                clearRecipient();
                           }
                       });
                   } else {
                       if($scope.selection.isSelected){
                           clearRecipient();
                       }

                   }
                });

                function clearRecipient() {
                    $scope.selection.recipient = null;
                    $scope.recipient = null;
                    $scope.onClearRecipient();
                    $scope.selection.isSelected = false;
                }

                $scope.selectRecipient = function($item) {
                    if($item && $item !== nullOption) {
                        $scope.selection.isSelected = true;
                        var oldRecipient = $scope.recipient;
                        $scope.recipient = $item;
                        $scope.onSelectRecipient({
                            $recipient: $item,
                            $oldRecipient: oldRecipient
                        });
                    } else {
                        $scope.recipient = null;
                        $scope.onClearRecipient();
                    }
                };

                $scope.$watch('recipient', function(recipient) {
                    $scope.selection.recipient = recipient;
                    $scope.selection.isSelected = !!recipient;
                });

                $scope.searchRecipientsPromise = recipientsService.search({
                    filerTemplateType: 'TAX',
                    pageSize: 1000
                }).then(function(data) {
                    $scope.recipientList = lodash.union([ nullOption ], lodash.map(data.content, function(data) {
                        var template = data.paymentTemplates[0];
                        var paymentDetails = template.paymentDetails;
                        return {
                            templateId: data.recipientId,
                            customerName: data.recipientName.join(" "),
                            recipientId: data.recipientId,
                            recipientName: data.recipientAddress,
                            nrb: template.beneficiaryAccountNo,
                            debitNrb: template.remitterAccountNo,
                            secondaryIdType: paymentDetails.idtype,
                            secondaryId: paymentDetails.idnumber,
                            periodType: paymentDetails.periodType,
                            formCode: paymentDetails.formCode
                        };
                    }));
                });

                $scope.clearSelection = function () {
                    $scope.selection.recipient = null;
                    $scope.recipient = null;
                    $scope.onClearRecipient();
                    $scope.selection.isSelected = false;
                };

                var nullOption = $scope.nullOption = {
                    customerName: $scope.placeholderText
                };

            }
        };
    });