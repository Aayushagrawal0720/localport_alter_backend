const router = require('express').Router();
const pool = require('../databaseconf/psqlconf');
const { getJSONResponse } = require('../functions/responsefunction');
const text = require('../constants/text');
const errorcode = require('../constants/errorcodes');
const dbconstants = require('../constants/dbconstants');
const {sendNotificationToDevice} = require('../notifications/sendnotification');
const {fetchWalletBalance} = require('../wallet/wallet_fetch');


router.post('/admincancelorder', (req, res)=>{
    try{
        var {oid} = req.body;
        cancelOrder(oid, (err, result)=>{
            if(err){
                res.send(getJSONResponse(false, '', text.TEXT_INVALIDREQUEST,{}))
                return;
            }else{
                res.send(getJSONResponse(true, '', text.TEXT_SUCCESS, {}))
                return;
            }
        })

    }catch(exception){
         console.log(exception);
         res.send(getJSONResponse(false, errorcode.SOMETHING_WENT_WRONG, text.TEXT_SOMETHINGWENTWRONG));
    }

})

function cancelOrder(oid, cb){
        getOrderDetails(oid, (err, result)=>{
            if(err){
                cb(err)
                return;
            }else{
                var {uid, price, status} = result;
                if(status==='Pending'){
                    var camount="0";
                    fetchWalletBalance(uid, 'wallet', (err, result)=>{
                           if(err){
                                if(err===errorcode.WALLET_NOT_FOUND){
                                    camount='0';
                                }
                                if(err===errorcode.INVALID_REQUEST){
                                    cb(text.TEXT_INVALIDREQUEST)
                                    return;
                                }
                            }else{
                                camount=result['value'];
                            }

                            getStatusNAdditionQuery(uid,'wallet', price, camount,oid, (err, addResult)=>{
                                if(err){
                                    cb(err)
                                }else{
                                    createTransaction(uid, 'wallet', 'order', {oid:oid}, price, 'Success',txnid, (err, txnResult)=>{
                                        if(err){
                                            cb(err)
                                        }else{
                                            cb(false, 'success');
                                        }
                                    })
                                }
                            })
                    })
                }else{
                    cb(`Order is ${status}`);
                    return;
                }
                cb(false, result);
                return;
            }
        })
}


function getOrderDetails(oid, cb){
    if(oid){
        var query = `SELECT * FROM orders WHERE oid = '${oid}' AND (key = 'id' OR key = 'price' OR key = 'status');`;
        pool.query(query).then((result)=>{
            var rows = result.rows;
            var uid;
            var price;
            var status;
            rows.forEach((row)=>{
                if(row.key==='id'){
                    uid = row.value;
                }
                if(row.key==='price'){
                    price= row.value;
                }
                if(row.key==='status'){
                    status= row.value;
                }
            })

            cb(false, {'uid':uid, 'price':price, 'status':status});
            return;
        }).catch((exception)=>{
            console.log('--------/cancelorder-----getOrderDetails----')
            console.log(exception);
            cb(exception)
            return;
        })
    }else{
        cb(true);
        return;
    }
}

function updateWalletBalance(query, cb){
    pool.query(query).then((result)=>{
        if(result.rowCount>0){
            cb(false, result.rows[0])
        }
    }).catch((err)=>{
        cb(err)
    });
}

function getStatusNAdditionQuery(uid, type, amount, camount, oid, cb){
    var query= ``;
    var amt= parseInt(amount.toString()) + parseInt(camount.toString());
    if(amount && camount && oid){
        query = query+ `UPDATE wallet SET value = '${amt}' WHERE uid = '${uid}' AND key = '${type}';`;
        query = query+ `UPDATE orders SET value = 'Cancelled' WHERE oid = '${oid}' AND key = 'status';`;
        query=query+ `UPDATE delpartner_order SET endtime = Now() where oid = '${oid}';`;
    }else{
        cb(errorcode.INVALID_REQUEST);
    }

    updateWalletBalance(query, (err, result)=>{
        if(err){
            cb(errorcode.INVALID_REQUEST);
        }else{
            cb(undefined, result);
        }
    })

}



function createTransaction(uid, dfrom,cto, gateway_result, amount,status,txnid, cb ){
    getTransactionQuery(uid, dfrom,cto, gateway_result, amount, status,txnid, (err, query)=>{
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

function getTransactionQuery(uid, dfrom,cto, gateway_result, amount, status,txnid, cb ){
    var query = ``;
    if(uid && dfrom && cto && gateway_result && amount){
        query = query + `INSERT INTO transactions (txnid, uid, dfrom, cto, amount, datetime, gateway_result, status) VALUES ('${txnid}','${uid}','${dfrom}','${cto}','${amount}','NOW()','${JSON.stringify(gateway_result)}', '${status}')`;
    }else{
        cb(errorcode.INVALID_REQUEST);
        return;
    }
    cb(undefined, query);
}


module.exports = router;
