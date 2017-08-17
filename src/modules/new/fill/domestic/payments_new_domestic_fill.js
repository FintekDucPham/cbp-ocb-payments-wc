angular.module('ocb-payments')
    .controller('NewDomesticPaymentFillController', function ($scope, $filter, lodash, bdFocus, $timeout, bdStepStateEvents, rbAccountSelectParams,
                                                              validationRegexp, systemParameterService, translate, utilityService,
                                                              rbBeforeTransferManager) {

        $scope.AMOUNT_PATTERN = validationRegexp('AMOUNT_PATTERN');
        $scope.currencyList = [];
        $scope.remote = {
            model: {}
        };

        $scope.selectRecipient = function (recipient) {
            $scope.payment.items.recipient = recipient;
            $scope.payment.options.fixedRecipientSelection = true;
            $scope.payment.formData.recipientAccountNo = $filter('nrbIbanFilter')(recipient.accountNo);
            $scope.payment.formData.recipientName = recipient.data.join('');
            $scope.payment.formData.description = recipient.title.join('');
        };

        $scope.setDefaultValues({
            description: translate.property('ocb.payments.new.internal.fill.default_description'),
            realizationDate: $scope.CURRENT_DATE.time
        });

        $scope.clearRecipient = function () {
            $scope.payment.options.fixedRecipientSelection = false;
            $scope.payment.items.recipient = null;
            $scope.payment.formData.templateId = null;
            $scope.payment.formData.recipientAccountNo = null;
            $scope.payment.formData.recipientName = null;
            $scope.payment.formData.description = null;
            $scope.payment.formData.transferFromTemplate = false;
            $scope.payment.formData.recipientAccountName=null;
            bdFocus('recipientAccountNo');
        };

        function recalculateCurrency() {
            var senderAccount = $scope.payment.items.senderAccount;
            $scope.payment.formData.currency = 'PLN';
            $scope.payment.meta.convertedAssets = senderAccount.accessibleAssets;
            if($scope.paymentForm){
                $scope.paymentForm.amount.$validate();
            }
        }

        $scope.onSenderAccountSelect = function () {
            recalculateCurrency();
            $scope.validateBalance();
            recipientFilter.filter();
            if($scope.paymentForm){
                $scope.paymentForm.amount.$validate();
            }
        };

        $scope.setClearFormFunction(function () {
            $scope.payment.formData.sendBySorbnet = false;
            $scope.payment.items.recipient = undefined;
            $scope.payment.formData.recipientAccountNo = undefined;
            $scope.remote.model.resetToDefault();
            $scope.payment.formData.recipientAccountNo = null;

            bdFocus('recipientAccountNo');
            $timeout(function(){
                recalculateCurrency();
                $scope.paymentForm.recipientAccountNo = $setPristine();
                $scope.payment.formData.description = translate.property('ocb.payments.new.internal.fill.default_description');
                $scope.payment.formData.realizationDate = $scope.CURRENT_DATE.time;
            });
        });

        $scope.setRequestConverter(function(formData) {
            var copiedForm = angular.copy(formData);
            formData.amount = (""+formData.amount).replace(",",".");
            copiedForm.amount = (""+formData.amount).replace(",", ".");
            copiedForm.recipientName = utilityService.splitTextEveryNSigns(formData.recipientName);
            copiedForm.description = utilityService.splitTextEveryNSigns(formData.description);
            copiedForm.sendBySorbnet = formData.sendBySorbnet;
            copiedForm.toSendSorbnet = formData.sendBySorbnet;
            copiedForm.realizationDate = utilityService.convertDateToCurrentTimezone(formData.realizationDate, $scope.CURRENT_DATE.zone);
            return copiedForm;
        });

        $scope.$on(bdStepStateEvents.AFTER_FORWARD_MOVE, function(event, control){
            var recipientData = angular.copy({
                customName: translate.property('ocb.payments.recipients.new.label'),
                remitterAccountId: $scope.payment.formData.remitterAccountId,
                recipientAccountNo: $scope.payment.formData.recipientAccountNo,
                recipientData: $scope.payment.formData.recipientName,
                description: $scope.payment.formData.description
            });

            $scope.setRecipientDataExtractor(function() {
                return recipientData;
            });
        });

        $scope.$on(bdStepStateEvents.BEFORE_FORWARD_MOVE, function (event, control) {
            var recipient = lodash.find($scope.payment.meta.recipientList, {
                templateType: 'DOMESTIC',
                accountNo: $scope.payment.formData.recipientAccountNo.replace(/\s+/g, "")
            });
            $scope.payment.meta.hideSaveRecipientButton = !!recipient;
            $scope.payment.rbPaymentsStepParams.visibility.finalAction = !!recipient;

            control.holdOn();
                if($scope.payment.beforeTransfer) {//future doesnt use it
                    rbBeforeTransferManager.suggestions.resolveSuggestions($scope.payment.beforeTransfer.suggestions, control).then(function () {
                        control.done();
                    }).catch(function () {
                        console.log('false');
                    });
                }else{
                    control.done();
                }
        });

        function isAccountInvestmentFulfilsRules(account){
            if(account.accountCategories.indexOf('INVESTMENT_ACCOUNT_LIST') > -1 ){
                return account.actions.indexOf('create_domestic_transfer') > -1;
            }
            return true;
        }

        $scope.remitterAccountSelectParams = new rbAccountSelectParams({
            alwaysSelected: true,
            showCustomNames: true,
            accountFilter: function (accounts) {
                return lodash.filter(accounts,  function(account){
                    return account.currency == 'PLN' &&  isAccountInvestmentFulfilsRules(account);
                });
            },
            payments: true
        });

        $scope.recipientAccountValidators = {
            sameSourceAccount: function(accountNo){
                if(!$scope.payment.items.senderAccount || !accountNo){
                    return true;
                }
                accountNo = accountNo.replace(/ /g, '');
                return $scope.payment.items.senderAccount.accountNo !== accountNo;
            }
        };

        var recipientFilter = $scope.recipientFilter = {
            doesMatch: function (recipient) {
                return true;
                // todo recipients should be displayed regardless of their source account
                //var senderAccount = $scope.payment.items.senderAccount;
                //return senderAccount && recipient.srcAccountNo === senderAccount.accountNo.replace(/ /g, '');
            }
        };

        $scope.$watch('payment.formData.sendBySorbnet', function(n, o){
            if(n===true && o===false){//to sorbnet
                    $scope.payment.formData.realizationDate = $scope.CURRENT_DATE.time;
            }

            // quick fix - OZK224542
            $timeout(function() {
                $scope.paymentForm.amount.$validate();
            });
        });
    });