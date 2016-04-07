angular.module('raiffeisen-payments').constant('rbPaymentTrybeConstants', {
    DEFAULT_TRYBES:{
        SWIFT:{
            TRYBES:[
                { TRYBE_NAME: 'STANDARD' },
                { TRYBE_NAME: 'EXPRESS' },
                { TRYBE_NAME: 'TARGET' }
            ]
        }
    }
});