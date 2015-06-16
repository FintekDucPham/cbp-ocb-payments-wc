describe('ACCOUNT_TRANSACTIONS_LIST', function(){

    //================================init platform
    beforeEach(module('platform'));
    beforeEach(module('ebFilterModule'));
    beforeEach(module('ebUtilityModule'));
    beforeEach(module('raiffeisen-accounts'));
    beforeEach(module('ui.router'));
    beforeEach(setInitialState({}));

    //================================prepare components to test
    var accountListController, $rootScope, $scope, $httpBackend, viewStateServiceMock;
    beforeEach(inject(function($controller, _$rootScope_, _$httpBackend_, _viewStateService_){
        $rootScope = _$rootScope_;

        $scope = $rootScope.$new();
        $scope.$parent.selected = {};
        viewStateServiceMock = _viewStateService_;
        accountListController = $controller("AccountsTransactionsController", {
            $scope : $scope
        });

        $httpBackend = _$httpBackend_;
    }));

    beforeEach(initPlatform());

    //================================test

    beforeEach(function(){

        viewStateServiceMock.setInitialState("accounts", {transactions:{}});
        $httpBackend.when('GET','/frontend-web/api/transaction?customerId=1932680&dateFrom=2015-04-22&dateTo=2015-05-22&operationType=&periodCount=30&periodDefinitionType=last&periodUnitType=days')
            .respond(staticApiFixture('transaction&accountId=139343&customerId=1932680&pageNumber=1&pageSize=1.json'));

        $httpBackend.flush();

    });

    /*
    it('fetch and pass account history list to scope', function(){

        expect($scope.accountHistoryList.content.length).toBe(1);
        expect($scope.accountHistoryList.content[0].accountNo).toBe("03191010482101259959990001");
        expect($scope.accountHistoryList.content[0].side).toBe("DEBIT");

    });

    it('clear filters', function(){

        $scope.filterParams.dateFrom  = "2014-04-22";
        $scope.clearFilter();
        expect($scope.filterParams).toEqual({ dateFrom : "2015-04-22" , dateTo : "2015-05-22" , operationTitle : null , operationType : "" , periodCount : 30, periodDefinitionType : "last" , periodUnitType : "days" });

    });

    it('apply filters and send request', function(){

        $scope.filterParams = { dateFrom : "2015-04-22" , dateTo : "2015-05-22" , operationAmountFrom : 3, operationAmountTo : 5, operationTitle : "test" , operationType : "" , periodCount : 11, periodDefinitionType : "last" , periodUnitType : "days" };

        $scope.submit(undefined, $scope.filterParams, undefined);

        $httpBackend.expect("GET", "/frontend-web/api/storage_items/ebplatform-frontend-web?customerId=1932680&dateFrom=5&dateTo=2015-05-22&operationAmountFrom=3&operationAmountTo=5&operationTitle=test&operationType=&periodCount=11&periodDefinitionType=last&periodUnitType=days")
            .respond(staticApiFixture('transaction&accountId=139343&customerId=1932680&pageNumber=1&pageSize=1.json'));
        $httpBackend.flush();

    });

    //================================check requests
    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });
    */
});