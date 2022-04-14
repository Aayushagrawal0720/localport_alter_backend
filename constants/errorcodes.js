

//LP1*: for user related errors
//LP3*: for server realted errors
//LP4*: for order related errors


module.exports = Object.freeze({
    USER_NOT_FOUND: 'LP1001',
    WALLET_NOT_FOUND: 'LP1003',
    SOMETHING_WENT_WRONG: 'LP3001',
    INVALID_REQUEST: 'LP3002',
    NO_ORDER_FOUND: 'LP4001'
});
