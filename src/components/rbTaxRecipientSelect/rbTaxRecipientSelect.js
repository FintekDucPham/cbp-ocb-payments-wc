angular.module('ocb-payments')
    .directive('rbTaxRecipientSelect', function (pathService, recipientsService, lodash) {
        return {
            restrict: 'E',
            templateUrl: pathService.generateTemplatePath("ocb-payments") + "/components/rbTaxRecipientSelect/rbTaxRecipientSelect.html",
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
                   if (recipientId) {
                       $scope.searchRecipientsPromise.then(function() {
                           var recipient = lodash.find($scope.recipientList, {
                               templateId: recipientId
                           });
                           if(recipient) {
                               $scope.selectRecipient(recipient);
                           } else {
                               if($scope.selection.isSelected) {
                                   clearRecipient();
                               }
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
                        var oldRecipient = $scope.recipient;
                        if (oldRecipient && ($item.recipientId == oldRecipient.recipientId)) {
                            return;
                        }
                        $scope.selection.isSelected = true;
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
                    pageSize: 9999
                }).then(function(data) {
                    $scope.recipientList = lodash.union([ nullOption ], lodash.map(data.content, function(data) {
                        var template = data.paymentTemplates[0];
                        var paymentDetails = template.paymentDetails;

                        var nameArr = data.recipientAddress;
                        if(paymentDetails && paymentDetails.taxAccountName && paymentDetails.taxAccountName.length){
                            nameArr = [].concat(paymentDetails.taxAccountName, data.recipientAddress);
                        }

                        return {
                            templateId: data.recipientId,
                            customerName: data.recipientName.join(" "),
                            recipientId: data.recipientId,
                            recipientName: nameArr,
                            nrb: template.beneficiaryAccountNo,
                            secondaryIdType: paymentDetails.idtype,
                            secondaryId: paymentDetails.idnumber,
                            periodType: paymentDetails.periodType,
                            formCode: paymentDetails.formCode,
                            obligationId: paymentDetails.obligationId
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