const router = require('express').Router();
const pool = require('../databaseconf/psqlconf');
const { getJSONResponse } = require('../functions/responsefunction');
const text = require('../constants/text');
const errorcode = require('../constants/errorcodes');
const dbconstants = require('../constants/dbconstants');
const {fetchWalletBalance} = require('./wallet_fetch');


router.post('/getbalance', (req, res)=>{
   try{
       var {uid, type}= req.body;
       getBalanceQuery(uid, type, (err, query)=>{
           if(err){
               res.send(getJSONResponse(false, errorcode.INVALID_REQUEST, text.TEXT_INVALIDREQUEST));
               return;
            } else{
                pool.query(query).then((result)=>{
                    if(result.rowCount>0){
                        res.send(getJSONResponse(true, '', text.TEXT_SUCCESS, result.rows));
                        return;
                    }else{
                        res.send(getJSONResponse(true, '', text.TEXT_SUCCESS, [{uid:uid, key:'wallet', value:'0'}]));
                        walletCreateQuery(uid, (err, iquery)=>{
                            if(err){
                                console.log(uid);
                                console.log(err)
                            }else{
                                pool.query(iquery).then((result)=>{

                                }).catch((err)=>{
                                    console.log(err);
                                });
                            }
                        });
                        return;
                    }
                }).catch((err)=>{
                    console.log(err);
                    res.send(getJSONResponse(false, errorcode.SOMETHING_WENT_WRONG, text.TEXT_SOMETHINGWENTWRONG));
                    return;
                })
            }
        });
    }catch(err) {
        console.log(err);
        res.send(getJSONResponse(false, errorcode.SOMETHING_WENT_WRONG, text.TEXT_SOMETHINGWENTWRONG));
        return;
    }
});


function getBalanceQuery(uid, type, cb){
    var query =``;
    if(uid){
        if(type){
            query= query + `SELECT * FROM wallet WHERE uid = '${uid}' AND key ='${type}';`;
        }else{
            query= query + `SELECT * FROM wallet WHERE uid = '${uid}';`;
        }
    }else{
        cb(errorcode.INVALID_REQUEST);
        return;
    }

    cb(undefined, query);
    return;
}

function walletCreateQuery(uid, cb){
    var query =``;
    if(uid){
        query = `INSERT INTO wallet (uid, key, value) VALUES ('${uid}', 'wallet', '0')`;
    }else{
        cb(errorcode.INVALID_REQUEST)
    }
    cb(undefined, query);
}


module.exports = router;
