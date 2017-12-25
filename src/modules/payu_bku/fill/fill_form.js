
angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.payu_bku.fill', {
            url: "/fill/",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/payu_bku/fill/fill_form.html",
            controller: "PayUBKUStep1Controller",
            data: {
                analyticsTitle: "config.multistepform.labels.step1"
            }
        });
    })
    .controller('PayUBKUStep1Controller'
                    , function ($scope, $filter, lodash, bdFocus, $timeout, bdStepStateEvents, rbAccountSelectParams, $stateParams,
                                                              validationRegexp, systemParameterService, translate, utilityService, accountsService,
                                                              rbBeforeTransferManager,
                                bdTableConfig, ocbConvert, transferBatchService, $cookies, $http, FileUploader, pathService, $location) {


            //todo data test
            $scope.stdCode = "";
            $scope.searchStudent = function () {
                console.log($scope.stdCode);
            }
            $scope.stdInfo = {
                "stdName" : "Nguyen Thuan Phat",
                "stdGen" : "Nam",
                "stdCode" : "2233445566",
                "stdBirth" : "06/10/1997",
                "stdDepart" : "Khoa cong nghe co khi",
                "stdPlaceBirth": "Tp. Ho Chi Minh"
            }
            $scope.account = "";
            $scope.subjectInfo = [
                {
                "paymentCode" : "11111111",
                "amount" : "666444",
                "desc" : "Anh van 2",
                "dueDate" : "18 Dec 2017",
                },
                {
                    "paymentCode" : "22222222",
                    "amount" : "77889",
                    "desc" : "Giao duc quoc phong an ninh",
                    "dueDate" : "15 May 2017",
                },
                {
                    "paymentCode" : "333333",
                    "amount" : "999999999",
                    "desc" : "Ky thuat dien",
                    "dueDate" : "25 May 2017",
                }
            ]
            $scope.amountInfo =
                {
                    "figure" : "1300000",
                    "words" : "Một triệu ba trăm ngàn",

                }
            $scope.remitterInfo =
                {
                    "accName" : "Le Linh Phuong",
                    "ocbBranch" : "Tan Binh",
                    "availFund" : "1350000",
                    "remainDaily" : "9999999999",
                }

            $scope.subjectSelected = [];
            $scope.table = {
                tableConfig : new bdTableConfig({
                    placeholderText: translate.property("ocb.payments.pending.empty_list.label"),
                    pageSize:3,
                    checkBoxIBAction: function(length, item, idx) {
                        // resetErrState();
                        if($scope.subjectSelected  == undefined) {
                            $scope.subjectSelected = [];
                        }
                        //if item existed (unchecked) => remove from list
                        //if item not existed (checked) => add to list
                        if(!_.some( $scope.subjectSelected,item)) {
                            $scope.subjectSelected.push(item)
                        } else {
                            _.remove($scope.subjectSelected,{'id':item.id})
                        }
                    }
                }),
                tableData : {
                     getData: function (defer, $params) {
                         defer.resolve($scope.subjectInfo);

                    }
                },
                tableControl: undefined
            };

            //set variable for account change
            $scope.onAccountChange = function (selectedAcc) {
                $scope.account  = selectedAcc;

            }
            $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
                actions.proceed();
            });

            function isSenderAccountCategoryRestricted(account) {
                if($scope.payment.items.senderAccount){
                    if ($scope.payment.meta.customerContext === 'DETAL') {
                        return $scope.payment.items.senderAccount.category === 1005 && lodash.contains([1101,3000,3008], account.category);
                    } else {
                        return $scope.payment.items.senderAccount.category === 1016 && (('PLN' !== account.currency) || !lodash.contains([1101,3002,3001, 6003, 3007, 1102, 3008, 6004], account.category));
                    }
                }
            }
            console.log($scope.$params)
            function isAccountInvestmentFulfilsRules(account){
                //return account.accountCategories.indexOf('INVESTMENT_ACCOUNT_LIST') < 0 || account.actions.indexOf('create_between_own_accounts_transfer') > -1;
                return account;
            }
        });

