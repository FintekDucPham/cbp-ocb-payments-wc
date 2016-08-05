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
                       console.log("CL:watch0");
                       $scope.searchRecipientsPromise.then(function() {
                           console.log("CL:watch0.5");
                           var recipient = lodash.find($scope.recipientList, {
                               templateId: recipientId
                           });
                           console.log("CL:watch1");
                           if(recipient) {
                               console.log("CL:watch2a");
                               $scope.selectRecipient(recipient);
                           } else {
                               console.log("CL:watch2b");
                               if($scope.selection.isSelected) {
                                   console.log("CL:watch2b->true");
                                   clearRecipient();
                               }
                           }
                       });
                   } else {
                       console.log("CL:watch3");
                       if($scope.selection.isSelected){
                           console.log("CL:watch4");
                           clearRecipient();
                       }

                   }
                });

                function clearRecipient() {
                    console.log("CL:exe");
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
                        console.log("CL:exe2");
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
                        console.log("CL:reci:0:formCode:"+paymentDetails.formCode);
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
                    console.log("CL3:exe");
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