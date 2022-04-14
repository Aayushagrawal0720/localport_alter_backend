const router = require('express').Router();
const pool = require('../../databaseconf/psqlconf');
const { getJSONResponse } = require('../../functions/responsefunction');
const text = require('../../constants/text');
const errorcode = require('../../constants/errorcodes');
const dbconstants = require('../../constants/dbconstants');

router.get('/getordermonths', (req, res)=>{
    try{

        var {uid} = req.headers;
        getDateQuery(uid, (err, query, dataSet)=>{
            if(err){
                res.send(getJSONResponse(false, errorcode.INVALID_REQUEST, text.TEXT_INVALIDREQUEST, {}))
                return;
            }else{
                pool.query(query, dataSet).then((result)=>{
                    if(result.rowCount>0){
                        res.send(getJSONResponse(true, '', text.TEXT_SUCCESS, result.rows));
                        return;
                    }else{
                        res.send(getJSONResponse(true, '', 'no record found', {}));
                        return;
                    }
                }).catch((err) => {
                    console.log(err);
                    res.send(getJSONResponse(false, errorcode.INVALID_REQUEST, text.TEXT_INVALIDREQUEST));
                    return;
                });
            }
        })
    }catch(err){
        console.log('---------------/getordermonths----------catch--')
        console.log(err)
        res.send(getJSONResponse(false, errorcode.SOMETHING_WENT_WRONG, text.TEXT_SOMETHINGWENTWRONG));
    }
})


function getDateQuery(uid, cb){
    var query =``;
    var dataSet=[];
    if(uid){
        query = query +`SELECT DISTINCT(value) FROM orders WHERE key = $1 AND oid IN (SELECT oid FROM orders WHERE key = 'id' AND value = $2);`;
        dataSet.push('date');
        dataSet.push(uid);
    }else{
        cb(errorcode.INVALID_REQUEST);
        return;
    }
    cb(undefined, query, dataSet);
    return;
}

module.exports = router;
