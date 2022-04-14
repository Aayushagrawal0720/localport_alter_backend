const router = require('express').Router();
const pool = require('../databaseconf/psqlconf');
const { getJSONResponse } = require('../functions/responsefunction');
const text = require('../constants/text');
const errorcode = require('../constants/errorcodes');
const dbconstants = require('../constants/dbconstants');
const {fetchWalletBalance} = require('./wallet_fetch');


router.post('/gettxn', (req, res)=>{
   try{
       var {uid} = req.body;
       getTxnQuery(uid, (err, query)=>{
            if(err){
                res.send(getJSONResponse(false, err, text.TEXT_INVALIDREQUEST));
                return;
            }else{
                pool.query(query).then((result)=>{
                    if(result.rowCount>0){
                        res.send(getJSONResponse(true, '', text.TEXT_SUCCESS, result.rows));
                        return;
                    }else{
                        res.send(getJSONResponse(true, '', 'No record found', {}));
                        return;
                    }

                }).catch((err)=>{
                    console.log(err);
                    res.send(
                        getJSONResponse(false, errorcode.SOMETHING_WENT_WRONG, text.TEXT_SOMETHINGWENTWRONG)
                    );
                    return;
                });
            }
        });


    }catch(err){
        console.log(err);
         res.send(
            getJSONResponse(false, errorcode.SOMETHING_WENT_WRONG, text.TEXT_SOMETHINGWENTWRONG)
        );
    }
});

function getTxnQuery(uid, cb){
    var query=``;
    if(uid){
        query = query +  `SELECT * FROM transactions WHERE uid = '${uid}'`;
    }else{
        cb(errorcode.INVALID_REQUEST);
        return;
    }
    cb(undefined,query);
    return;
}



module.exports = router;
