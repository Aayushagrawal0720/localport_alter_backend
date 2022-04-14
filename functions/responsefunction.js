
function getJSONResponse(status, errorcode, message, data) {

    var response = {
        'status': status,
        'errorcode': errorcode ? errorcode : '',
        'message': message ? message : '',
        'data': data ? data : {}
    };

    return response;
}

module.exports = {
    getJSONResponse: getJSONResponse
};