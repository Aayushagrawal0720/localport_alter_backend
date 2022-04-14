const router = require('express').Router();
const pool = require('../databaseconf/psqlconf');
const {getJSONResponse} = require('../functions/responsefunction');
const text = require('../constants/text');
const errorcodes= require('../constants/errorcodes');
const dbconstants = require('../constants/dbconstants');


router.post('/getorderpartner', (req, res)=>{
   try{
       var {oid} = req.body;
        getOrderPartnerQuery(oid, (err, query)=>{
            if(err){
                res.send(getJSONResponse(false, errorcodes.INVALID_REQUEST, text.TEXT_INVALIDREQUEST));
                return;
            }else{
                pool.query(query).then((result)=>{
                    if(result.rowCount>0){
                        res.send(getJSONResponse(true,'',text.TEXT_SUCCESS, result.rows));
                        return;
                    }else{
                        res.send(getJSONResponse(true, '', 'partner not assigned', {}));
                        return;
                    }
                }).catch((err)=>{
                    console.log(err);
                    res.send(getJSONResponse(false, errorcodes.SOMETHING_WENT_WRONG, text.TEXT_SOMETHINGWENTWRONG));
                    return;
                })
            }
        });

    }catch(err){
        console.log(err);
        res.send(getJSONResponse(false, errorcodes.SOMETHING_WENT_WRONG, text.TEXT_SOMETHINGWENTWRONG));
        return;
    }
});

function getOrderPartnerQuery(oid, cb){
    var query =``;
    if(oid){
        query = `SELECT * FROM users WHERE uid = (SELECT partnerid FROM delpartner_order WHERE oid = '${oid}');`;
    }else{
        cb(text.TEXT_INVALIDREQUEST);
        return;
    }
    cb(false, query);
}



module.exports  = router
