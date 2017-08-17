describe('forbiddenAccountsService', function() {
    'use strict';

    var forbiddenAccountsService;

    beforeEach(module('ngLodash'));
    beforeEach(module('ebSessionModule'));
    beforeEach(module('ocb-payments'));
    beforeEach(initPlatform);

    beforeEach(inject(function (_forbiddenAccounts_) {
        forbiddenAccountsService = _forbiddenAccounts_;
    }));

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
});
