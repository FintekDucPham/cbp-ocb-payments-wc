/**
 * Created by marek.koronski on 2015-05-20.
 */
describe('accounts', function() {


    beforeEach(function(){
        browser.get('/#/accounts');
    });


    it('should open the list of accounts', function() {

        element(by.binding("account.accountNo")).getText().then(function(text){
            expect(text).toBe("03 1910 1048 2101 2599 5999 0001");
        });

    });

    it("should redirecting to history", function(){
        element.all(by.repeater("account in accounts")).then(function(list){
            var link = list[0].element(by.xpath('//a[@ui-sref="accounts.transactions.list"]'));
            link.click();

            browser.getCurrentUrl().then(function(url){
                var spl = url.split('#');
                expect(spl[1]).toBe("/accounts/transactions//list");
            });

            element(by.binding("description")).getText().then(function(text){
                expect(text).toBe("rachunek bieżacytest");
            });
        });
    });

    it("should redirecting to details", function(){
        element.all(by.repeater("account in accounts")).then(function(list){
            var link = list[0].element(by.xpath('//a[@ui-sref="^.details"]'));
            link.click();

            element(by.binding("description")).getText().then(function(text){
                expect(text).toBe("rachunek bieżacytest");
            });

            element(by.binding("details.accountNo")).getText().then(function(text){
                expect(text).toBe("03 1910 1048 2101 2599 5999 0001");
            });

        });
    });


});