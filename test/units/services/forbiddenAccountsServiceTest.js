describe('forbiddenAccountsService', function() {
    'use strict';

    var forbiddenAccountsService,
        http;

    var US_ACCOUNT_1 = '62101012700043432222000000',
        US_ACCOUNT_2 = '75101000550201212000070000',
        NOT_US_ACCOUNT = '14341380302110252089208287';

    beforeEach(module('ngLodash'));
    beforeEach(module('ebSessionModule'));
    beforeEach(module('raiffeisen-payments'));
    beforeEach(initPlatform);

    beforeEach(inject(function (_forbiddenAccounts_, $httpBackend) {
        forbiddenAccountsService = _forbiddenAccounts_;
        http = $httpBackend;
    }));

    beforeEach(function() {
        http.when('GET', getRequestPath('system_settings')).respond({
            content: [
                {parameterName: 'account.bank.prefix.rbpl', value: ''}
            ]
        });
    });

    it('should be a ZUS account #1', function() {
        expect(forbiddenAccountsService.isZusAccount('78 1010 1023 0000 2613 9520 0000')).toBe(true);
    });

    it('should be a ZUS account #2', function() {
        expect(forbiddenAccountsService.isZusAccount('83101010230000261395100000')).toBe(true);
    });

    it('should be a ZUS account #3', function() {
        expect(forbiddenAccountsService.isZusAccount('68 1010 1023 0000 2613 9540 0000')).toBe(true);
    });

    it('should be a ZUS account #4', function() {
        expect(forbiddenAccountsService.isZusAccount('73 1010 1023 0000 2613 95300000')).toBe(true);
    });

    it('should not be a ZUS account', function() {
        expect(forbiddenAccountsService.isZusAccount('73 2010 1033 0000 2613 9530 0000')).toBe(false);
    });

    it('should be a US account #1', function() {
        http.when('GET', taxOfficeQueryPath(US_ACCOUNT_1)).respond({content: [{}]});

        forbiddenAccountsService.isUsAccount(US_ACCOUNT_1).then(function(result) {
            expect(result).toBe(true);
        });

        http.flush();
    });

    it('should be a US account and then remembered', function() {
        http.when('GET', taxOfficeQueryPath(US_ACCOUNT_2)).respond({content: [{}]});

        forbiddenAccountsService.isUsAccount(US_ACCOUNT_2).then(function(result) {
            expect(result).toBe(true);

            forbiddenAccountsService.isUsAccount(US_ACCOUNT_2).then(function(result) {
                expect(result).toBe(true);
            });

            http.verifyNoOutstandingExpectation();
            http.verifyNoOutstandingRequest();
        });

        http.flush(1);
    });

    it('should not be a US account', function() {
        http.when('GET', taxOfficeQueryPath(NOT_US_ACCOUNT)).respond({content: []});

        forbiddenAccountsService.isUsAccount(NOT_US_ACCOUNT).then(function(result) {
            expect(result).toBe(false);
        });

        http.flush();
    });

    function taxOfficeQueryPath(accountNo) {
        return getRequestPath('tax_office?accountNo=' + accountNo);
    }

    function getRequestPath(mainPart) {
        return createGetRequestPath(mainPart, authDetails.userIdentityId.id);
    }

});
