const router = require('express').Router();
const pool = require('../databaseconf/psqlconf');
const { getJSONResponse } = require('../functions/responsefunction');
const text = require('../constants/text');
const errorcode = require('../constants/errorcodes');
const dbconstants = require('../constants/dbconstants');
const {fetchWalletBalance} = require('./wallet_fetch');
const { v4 : uuidv4 } =require('uuid');

router.post('/addmoney', (req, res)=>{
    try{

        var {uid,type, amount, dfrom, gateway_result, status} =req.body;

        fetchWalletBalance(uid, type, (err, result)=>{
            var camount= '0';
           if(err){
               if(err===errorcode.WALLET_NOT_FOUND){
                   camount='0';

                }
                if(err===errorcode.INVALID_REQUEST){
                   res.send(getJSONResponse(false, errorcode.INVALID_REQUEST, text.TEXT_INVALIDREQUEST, {}))
                   return;
                }
            }else{
                camount=result['value'];
            }
            getAdditionQuery(uid, type, amount, camount, (err, query)=>{
                if(err){
                  res.send(getJSONResponse(false, errorcode.INVALID_REQUEST, text.TEXT_INVALIDREQUEST, {}))
                  return;
                 }else{
                  updateWalletBalance(query, (err, result)=>{
                    if(err){
                        console.log(err);
                        res.send(
                            getJSONResponse(false, errorcode.SOMETHING_WENT_WRONG, text.TEXT_SOMETHINGWENTWRONG)
                        );
                        return;
                    }
                    else{
                        createTransaction(uid, dfrom,type, gateway_result, amount, status, (err, result)=>{
                            if(err){
                                 res.send(getJSONResponse(false, errorcode.SOMETHING_WENT_WRONG, text.TEXT_SOMETHINGWENTWRONG));
                                 return;
                            }else{
                                 res.send(getJSONResponse(true, '', text.TEXT_SUCCESS, {}))
                                return;
                            }
                        })

                    }
                  });
                 }
            });

        });

    }catch(err){
        console.log(err);
        res.send(
            getJSONResponse(false, errorcode.SOMETHING_WENT_WRONG, text.TEXT_SOMETHINGWENTWRONG)
        );
    }
});

function updateWalletBalance(query, cb){
    pool.query(query).then((result)=>{
        if(result.rowCount>0){
            cb(false, result.rows[0])
        }
    }).catch((err)=>{
        cb(err)
    });
}


function getAdditionQuery(uid, type, amount, camount, cb){
    var query= ``;
    var amt= parseInt(amount.toString()) + parseInt(camount.toString());
    if(amount && camount){
        query = query+ `UPDATE wallet SET value = '${amt}' WHERE uid = '${uid}' AND key = '${type}'`;
    }else{
        cb(errorcode.INVALID_REQUEST);
    }

    cb(undefined, query);
}


function createTransaction(uid, dfrom,cto, gateway_result, amount,status, cb ){
    getTransactionQuery(uid, dfrom,cto, gateway_result, amount, status,(err, query)=>{
       if(err){
            console.log(err)
            cb(err)
            return;
        }else{
            pool.query(query).then((result)=>{
                if(result.rowCount>0){
                    cb(undefined,text.TEXT_SUCCESS)
                }else{
                 cb(true);
                }
            })
            .catch((err)=>{
                console.log(err);
                cb(err)
            })
        }
    });
}

function getTransactionQuery(uid, dfrom,cto, gateway_result, amount, status, cb ){
    var query = ``;
    var txnid = uuidv4();
    if(uid && dfrom && cto && gateway_result && amount){
        query = query + `INSERT INTO transactions (txnid, uid, dfrom, cto, amount, datetime, gateway_result, status) VALUES ('${txnid}','${uid}','${dfrom}','${cto}','${amount}','NOW()','${JSON.stringify(gateway_result)}', '${status}')`;
    }else{
        cb(errorcode.INVALID_REQUEST);
        return;
    }
    cb(undefined, query);
}





module.exports = router;

