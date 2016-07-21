angular.module('raiffeisen-payments').factory('rbBeforeTransferManager', function($q){

    var _resolveSuggestions = function(suggestions, formControl){
        //resolve -> go to verification
        //reject -> display suggestion

        var _dispatchDisplay = function(resolvedSuggestionsList){

            var suggestionToDisplay = null;

            angular.forEach(resolvedSuggestionsList, function(s){
                if(!suggestionToDisplay && !s.rejected &&  s.resolvedValue){
                    suggestionToDisplay = s;
                }
            });
            suggestions.displayed = !!suggestionToDisplay;
            if(suggestionToDisplay){
                suggestionToDisplay.proceedTransferFn = function(){
                    this.displayed = false;
                    this.rejected = true;
                    suggestions.displayed = false;
                    formControl.done();
                    //@ TODO: only one suggestion works now - add recurrence to enable more
                    //_dispatchDisplay();
                };
                suggestionToDisplay.displayed = true;

                return $q.reject(false);//hold on
            }else{
                return $q.when(true);//proceed transfer
            }
        };

        return $q.when((function(){
            var promises = [];
            angular.forEach(suggestions.list, function(suggestion){
                var unitPromise = $q.when(suggestion.checkBundle()).then(function(shouldBeDisplayed){
                    var ret = suggestion;
                    ret.resolvedValue = shouldBeDisplayed;
                    return $q.when(ret);
                });
                promises.push(unitPromise);
            });
            if(promises.length){
                return $q.all(promises).then(function(resolvedSuggestionsList){
                    return _dispatchDisplay(resolvedSuggestionsList);
                });
            }else{
                return $q.when(true);//proceed transfer
            }

        })());
    };

    return {
        suggestions: {
            resolveSuggestions: _resolveSuggestions
        }
    };

});