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

                $scope.selectRecipient = function($item) {
                    if($item) {
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

                recipientsService.search({
                    filerTemplateType: 'INSURANCE'
                }).then(function(data) {
                    $scope.recipientList = lodash.union([ nullOption ], lodash.map(data.content, function(data) {
                        var template = data.paymentTemplates[0];
                        var paymentDetails = template.paymentDetails;
                        return {
                            customerName: data.recipientName.join(" "),
                            recipientId: data.recipientId,
                            templateId: data.templateId,
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