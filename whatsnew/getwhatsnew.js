const router = require('express').Router();
const pool = require('../databaseconf/psqlconf');
const { getJSONResponse } = require('../functions/responsefunction');
const text = require('../constants/text');
const errorcode = require('../constants/errorcodes');
const dbconstants = require('../constants/dbconstants');



router.post('/getwhatsnew', (req, res)=>{
    try{
        var {version} = req.body;
        getWatsNewQuery(version, (err, query)=>{
            if(err){
                res.send(getJSONResponse(false, errorcode.INVALID_REQUEST, text.TEXT_INVALIDREQUEST));
                return;
            }else{
                pool.query(query).then((result)=>{
                    if(result.rowCount>0){
                        res.send(getJSONResponse(true, '', text.TEXT_SUCCESS, result.rows));
                        return;
                    }else{
                        res.send(getJSONResponse(true, '', 'version not found', {}));
                    }
                }).catch((err)=>{
                    res.send(getJSONResponse(false, errorcode.SOMETHING_WENT_WRONG, text.TEXT_SOMETHINGWENTWRONG));
                    return;
                })
            }
        })
    }catch(err){
        console.log(err);
        res.send(getJSONResponse(false, errorcode.SOMETHING_WENT_WRONG, text.TEXT_SOMETHINGWENTWRONG));
        return;
    }
});


function getWatsNewQuery(version, cb){
    var query = ``;
    if(version){
        query = query + `SELECT * FROM whatsnew WHERE version = '${version}';`;
    }else{
        cb(errorcode.INVALID_REQUEST);
        return;
    }
    cb(false, query);
    return;
}



module.exports = router;

