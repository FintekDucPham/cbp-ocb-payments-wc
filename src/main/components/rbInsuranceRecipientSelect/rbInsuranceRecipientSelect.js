angular.module('raiffeisen-payments')
    .directive('rbInsuranceRecipientSelect', function (pathService, recipientsService, lodash) {
        return {
            restrict: 'E',
            templateUrl: pathService.generateTemplatePath("raiffeisen-payments") + "/components/rbInsuranceRecipientSelect/rbInsuranceRecipientSelect.html",
            scope: {
                recipientId: '=rbZusRecipientId',
                recipient: '=rbZusRecipient',
                recipientList: '=?rbZusRecipientList',
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
                                $scope.clearSelection();
                            }
                        });
                    } else {
                        $scope.clearSelection();
                    }
                });

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
                    filerTemplateType: 'INSURANCE'
                }).then(function(data) {
                    $scope.recipientList = lodash.union([ nullOption ], lodash.map(data.content, function(data) {
                        var template = data.paymentTemplates[0];
                        var paymentDetails = template.paymentDetails;
                        return {
                            customerName: data.recipientName.join(" "),
                            templateId: data.recipientId,
                            recipient: data.recipientName,
                            recipientName: data.recipientAddress,
                            nrb: template.beneficiaryAccountNo,
                            debitNrb: template.remitterAccountNo,
                            nip: paymentDetails.nip,
                            secondaryIdType: paymentDetails.secondIDType,
                            secondaryId: paymentDetails.secondIDNo,
                            paymentType: paymentDetails.paymentType
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
                    customerName: 'Odbiorca spoza listy'
                };

            }
        };
    });