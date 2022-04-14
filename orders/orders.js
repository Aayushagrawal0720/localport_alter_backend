const router = require('express').Router();
const pool = require('../databaseconf/psqlconf');
const { getJSONResponse } = require('../functions/responsefunction');
const text = require('../constants/text');
const errorcode = require('../constants/errorcodes');
const dbconstants = require('../constants/dbconstants');
const { v4: uuidv4 } = require('uuid');
const {sendNotificationToAdmin} = require('../notifications/sendnotification');
const {fetchWalletBalance} = require('../wallet//wallet_fetch');


router.post('/placeorder',(req, res) => {
    try {
        var { id, uid,pickuploc, pickuplatlong, droploc, droplatlong, dropname, dropphone, weight, distance, price , delinstruction,pricedistribution, roundtrip} = req.body;
         const oid = uuidv4();
        var camount="0";
        var txnid = uuidv4();
        fetchWalletBalance(uid, 'wallet', (err, result)=>{
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

            if(parseInt(camount.toString()) < parseInt(price.toString())){
               res.send(getJSONResponse(true, '', text.TEXT_SOMETHINGWENTWRONG,{'message':"Insufficient balance"}));
                return;
            }

            getDeductionQuery(uid, 'wallet', price, camount, (err, query)=>{
                if(err){
                   res.send(getJSONResponse(false, errorcode.INVALID_REQUEST, text.TEXT_INVALIDREQUEST, {}))
                   return;
                }else{
                    pool.query(query).then((result)=>{
                        if(result.rowCount>0){

                            createTransaction(uid, 'wallet', 'order', {oid:oid}, price, 'Success',txnid, (err, result)=>{
                                if(err){
                                    getAdditionQuery(uid,'wallet', price, camount, (err, result)=>{
                                      if(err){
                                            console.log(new Date())
                                            console.log('create transaction error');
                                            console.log(err);
                                            res.send(getJSONResponse(false, errorcode.SOMETHING_WENT_WRONG, text.TEXT_SOMETHINGWENTWRONG));
                                            return;
                                        }else{
                                            console.log(new Date())
                                            console.log('create transaction error');
                                            res.send(getJSONResponse(false, errorcode.INVALID_REQUEST, text.TEXT_INVALIDREQUEST, {}))
                                            return
                                        }
                                    });
                                }else{
                                        //----------------------ORDER PLACE CODE------------------------------------------------
                                    getOrderPlaceQuery(oid, id, pickuploc, pickuplatlong,droploc, droplatlong, dropname, dropphone, weight, distance, price, delinstruction,pricedistribution, roundtrip,(err, data, dataSet) => {
                                        if (err) {
                                            getAdditionQuery(uid,'wallet', price, camount, (err, result)=>{
                                                deleteTransaction(txnid, (result)=>{
                                                    console.log(new Date())
                                                    console.log('cgetOrderPlaceQuery error');
                                                    console.log(err);
                                                    res.send(getJSONResponse(false, errorcode.SOMETHING_WENT_WRONG, text.TEXT_SOMETHINGWENTWRONG));
                                                    return;
                                                })
                                            });
                                        } else {
                                            pool.query(data, dataSet).then((result) => {
                                                if (result.rowCount > 0) {
                                                    res.send(getJSONResponse(true, '', text.TEXT_SUCCESS, {}))
                                                    sendNewOrderNotificationToAdmin(pickuploc,droploc);
                                                    return;
                                                }
                                            }).catch((err) => {
                                                console.log(new Date())
                                                  console.log('cgetOrderPlaceQuery error 2');
                                                  console.log(data);
                                                console.log(err);
                                                  getAdditionQuery(uid,'wallet', price, camount, (err, result)=>{
                                                        deleteTransaction(txnid, (result)=>{
                                                              getDeleteQuery(oid, (query) => {
                                                                pool.query(query).then((result) => {
                                                                    res.send(getJSONResponse(false, errorcode.INVALID_REQUEST, text.TEXT_INVALIDREQUEST));
                                                                }).catch((err) => {
                                                                    res.send(getJSONResponse(false, errorcode.INVALID_REQUEST, text.TEXT_INVALIDREQUEST));
                                                                });
                                                            });
                                                        })
                                                    })
                                            });
                                        }
                                    });
                                    //----------------------ORDER PLACE CODE------------------------------------------------
                                }
                            });
                        }else{
                            console.log(new Date())
                            console.log('deductionq uery rowscount else error');
                            console.log(err);
                            res.send(getJSONResponse(false, errorcode.SOMETHING_WENT_WRONG, text.TEXT_SOMETHINGWENTWRONG));
                            return;
                        }
                    }).catch((err)=>{
                        console.log(new Date())
                        console.log('-------/placeorder------getDeductionQuery-----')
                        console.log(err);
                        res.send(getJSONResponse(false, errorcode.INVALID_REQUEST, text.TEXT_INVALIDREQUEST, {}))
                        return;
                    });
                }
            })
        })


    } catch (err) {
        console.log(err);
        res.send(
            getJSONResponse(false, errorcode.SOMETHING_WENT_WRONG, text.TEXT_SOMETHINGWENTWRONG)
        );
    }
});


router.post('/getordersfromid', (req, res)=>{
    try{
        var {id, status} = req.body;

        getOrderFromIdQuery(status, id, (err, query)=>{
            pool.query(query).then((result) => {
                    if (result.rowCount > 0) {
                       /* var finaldata = [];
                        var orders = result.rows;
                        orders.forEach((order)=>{
                            console.log(order.oid);
                            //finaldata.push({ordervalues[0]:{ordervalues[1]:ordervalues[2]}});
                            var oid = order.oid;
                            var key = order.key;
                            var value = order.value;
                            finaldata.push({oid : {key: value}})
                        });*/
                        res.send(getJSONResponse(true, '', text.TEXT_SUCCESS, result.rows))
                        return;
                    }else{
                        res.send(getJSONResponse(false, errorcode.NO_ORDER_FOUND, text.ORDER_NOORDERFOUND, {}))
                        return;
                    }
                }).catch((err) => {
                    console.log(new Date())
                    console.log('-------/getordersfromid------getOrderFromIdQuery-----')
                    console.log(err);
                    res.send(getJSONResponse(false, errorcode.INVALID_REQUEST, text.TEXT_INVALIDREQUEST));
                });
        });

    }catch(err){
        console.log(new Date())
        console.log('--------/getordersfromid------catch-----');
        console.log(err);
         res.send(
            getJSONResponse(false, errorcode.SOMETHING_WENT_WRONG, text.TEXT_SOMETHINGWENTWRONG)
        );
    }
});

function deleteTransaction(txnid, cb){
    var query = `DELETE FROM transactions WHERE txnid = '${txnid}';`;
    pool.query(query).then((result)=>{
        cb(true);
    }).catch((err)=>{
        cb(false);
    });
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


function getAdditionQuery(uid, type, amount, camount, cb){
    var query= ``;
    var amt= parseInt(amount.toString()) + parseInt(camount.toString());
    if(amount && camount){
        query = query+ `UPDATE wallet SET value = '${amt}' WHERE uid = '${uid}' AND key = '${type}'`;
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

function getDeductionQuery(uid, type, amount, camount, cb){
    var query= ``;
    var amt= parseInt(camount.toString()) - parseInt(amount.toString());
    if(amount && camount){
        query = query+ `UPDATE wallet SET value = '${amt}' WHERE uid = '${uid}' AND key = '${type}'`;
    }else{
        cb(errorcode.INVALID_REQUEST);
    }

    cb(undefined, query);
}


function getOrderFromIdQuery(status, id, cb){
    var query = '';
    if(status && id){
        if(status ==='All'){
            query = query + `SELECT * FROM orders WHERE oid IN (SELECT oid FROM orders WHERE key = 'id' AND value = '${id}');`;
        }else{
            query = query + `SELECT * FROM orders WHERE oid IN (SELECT oid FROM orders WHERE key = 'id' AND value = '${id}' INTERSECT SELECT OID FROM orders WHERE key = '${dbconstants.DB_STATUS}' AND value = '${status}')`;
        }
    }else{
       return cb(text.TEXT_INVALIDREQUEST);
    }

    return cb(false, query);
}


function getOrderPlaceQuery(oid, id, pickuploc, pickuplatlong, droploc, droplatlong, dropname, dropphone, weight, distance, price, delinstruction, pricedistribution,roundtrip,cb) {
    var query = '';
    var dataSet=[];

    if (id) {
        query = query + `INSERT INTO orders (oid, key, value) VALUES ('${oid}','id' ,$1), `;
        dataSet.push(id);
    } else {
        return cb(text.TEXT_INVALIDREQUEST);
    }
    if (pickuploc) {
        query = query + `('${oid}','${dbconstants.DB_PICKUPLOC}' , $2), `;
        dataSet.push(pickuploc);
    } else {
        return cb(text.TEXT_INVALIDREQUEST);
    }
    if (pickuplatlong) {
        query = query + `('${oid}','${dbconstants.DB_PICKUPLATLONG}' , $3), `;
        dataSet.push(pickuplatlong);
    } else {
        return cb(text.TEXT_INVALIDREQUEST);
    }
    if (droploc) {
        query = query + `('${oid}','${dbconstants.DB_DROPLOC}' ,$4), `;
        dataSet.push(droploc);
    } else {
        return cb(text.TEXT_INVALIDREQUEST);
    }
    if (droplatlong) {
        query = query + `('${oid}','${dbconstants.DB_DROPLATLONG}' , $5), `;
        dataSet.push(droplatlong)
    } else {
        return cb(text.TEXT_INVALIDREQUEST);
    }
    if (dropname) {
        query = query + `('${oid}','${dbconstants.DB_DROPNAME}' , $6), `;
        dataSet.push(dropname);
    } else {
        return cb(text.TEXT_INVALIDREQUEST);
    }
    if (dropphone) {
        query = query + `('${oid}','${dbconstants.DB_DROPPHONE}' , $7), `;
        dataSet.push(dropphone);
    } else {
        return cb(text.TEXT_INVALIDREQUEST);
    }

    if (weight) {
        query = query + `('${oid}','${dbconstants.DB_WEIGHT}' , $8), `;
        dataSet.push(weight);
    } else {
        return cb(text.TEXT_INVALIDREQUEST);
    }

    if (distance) {
        query = query + `('${oid}','${dbconstants.DB_DISTANCE}' ,$9), `;
        dataSet.push(distance);
    } else {
        return cb(text.TEXT_INVALIDREQUEST);
    }

    if (price) {
        query = query + `('${oid}','${dbconstants.DB_PRICE}' ,$10), `;
        dataSet.push(price);
    } else {
        return cb(text.TEXT_INVALIDREQUEST);
    }
    if (delinstruction) {
        query = query + `('${oid}','${dbconstants.DB_DELINSTRUCTION}' ,$11), `;
        dataSet.push(delinstruction);
    } else {
        return cb(text.TEXT_INVALIDREQUEST);
    }

    query = query + `('${oid}','${dbconstants.DB_ROUNDTRIPCOL}' , $12), `;
    if(roundtrip){
        dataSet.push(roundtrip);
    }else{
        dataSet.push('false');
    }
    query = query + `('${oid}','${dbconstants.DB_STATUS}' ,$13), `;
    dataSet.push(text.ORDER_PENDING)
    query = query + `('${oid}','date' ,CURRENT_TIMESTAMP), `;
    query = query + `('${oid}', '${dbconstants.DB_PAYMENT}' , 'done'), `;

    if(pricedistribution){
        query = query + `('${oid}','${dbconstants.DB_PRICEDISTRIBUTION}' ,$14) `;
        dataSet.push(pricedistribution)
    }

    query = query + ';';

    return cb(false, query, dataSet);
}

function getDeleteQuery(oid, cb) {
    var query = `DELETE FROM orders WHERE oid = '${oid}'`;
    cb(query);
}


function sendNewOrderNotificationToAdmin(pickup, drop){
    sendNotificationToAdmin('neworder',  `New order`, `New order from ${pickup} to ${drop}`);
}

module.exports = router;
