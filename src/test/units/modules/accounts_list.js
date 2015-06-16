describe('ACCOUNT_LIST', function(){

    //================================init platform
    beforeEach(module('platform'));
    beforeEach(module('ebFilterModule'));
    beforeEach(module('ebUtilityModule'));
    beforeEach(module('raiffeisen-accounts'));
    beforeEach(setInitialState({}));

    //================================prepare components to test
    var accountListController, $rootScope, $scope, $httpBackend;
    beforeEach(inject(function($controller, _$rootScope_, _$httpBackend_){
        $rootScope = _$rootScope_;
        $httpBackend = _$httpBackend_;
        $scope = $rootScope.$new();
        $scope.$parent.selected = {};
        accountListController = $controller("AccountsListController", {
            $scope : $scope
        });
    }));
    beforeEach(initPlatform());

    //================================test
    it('should fetch and pass account list to scope', function(){

        $httpBackend.when('GET','/frontend-web/api/account?customerId=1932680&pageSize=10000').respond(staticApiFixture('account&customerId=1932680&pageSize=10000.json'));
        $httpBackend.when('GET','/frontend-web/api/customer_settings?accessProfileId=100001480&customerId=1932680&productType=ACCOUNT').respond(staticApiFixture('customer_settings&accessProfileId=100001480&customerId=1932680&productType=ACCOUNT.json'));
        $httpBackend.flush();

        expect($scope.accountList.content.length).toBe(4);

    });



    //================================check requests
    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

});