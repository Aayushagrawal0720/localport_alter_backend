const router = require('express').Router();
const pool = require('../databaseconf/psqlconf');
const { getJSONResponse } = require('../functions/responsefunction');
const text = require('../constants/text');
const errorcode = require('../constants/errorcodes');
const dbconstants = require('../constants/dbconstants');
const {sendNotificationToDevice} = require('../notifications/sendnotification');


router.post('/getorderbystatus', (req, res)=>{
        try{
        var {status} = req.body;

        getOrderFromIdQuery(status, (err, query)=>{
            pool.query(query).then((result) => {
                    if (result.rowCount > 0) {
                        res.send(getJSONResponse(true, '', text.TEXT_SUCCESS, result.rows))
                        return;
                    }else{
                        res.send(getJSONResponse(false, errorcode.NO_ORDER_FOUND, text.ORDER_NOORDERFOUND, {}))
                        return;
                    }
                }).catch((err) => {
                    console.log(err);
                    res.send(getJSONResponse(false, errorcode.INVALID_REQUEST, text.TEXT_INVALIDREQUEST));
                });
        });

    }catch(err){
        console.log(err);
         res.send(
            getJSONResponse(false, errorcode.SOMETHING_WENT_WRONG, text.TEXT_SOMETHINGWENTWRONG)
        );
    }
});

router.post('/updateorderstatus', (req, res)=>{
    try{
        var {oid, status, uid} = req.body;
            getstatusupdatequery(oid, status, (err, query)=>{
                if(err){
                    res.send(getJSONResponse(false, errorcode.INVALID_REQUEST, text.TEXT_INVALIDREQUEST, {}))
                    return;
                }else{
                    pool.query(query).then((result)=>{
                        if(result.rowCount>0){

                            sendStatusNotificationToUser(uid, status);
                            res.send(getJSONResponse(true, '', text.TEXT_SUCCESS, {}))

                        }
                    }).catch((err) => {
                        console.log(err);
                        res.send(getJSONResponse(false, errorcode.INVALID_REQUEST, text.TEXT_INVALIDREQUEST));
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

router.post('/setorderpayment', (req, res)=>{
    try{
        var {oid} = req.body;
        getOrderPaymentQuery(oid, (err, query)=>{
            pool.query(query).then((result)=>{
                        if(result.rowCount>0){
                            res.send(getJSONResponse(true, '', text.TEXT_SUCCESS, {}))
                        }
                    }).catch((err) => {
                        console.log(err);
                        res.send(getJSONResponse(false, errorcode.INVALID_REQUEST, text.TEXT_INVALIDREQUEST));
                    });
        });
    }catch(err){
        console.log(err);
         res.send(
            getJSONResponse(false, errorcode.SOMETHING_WENT_WRONG, text.TEXT_SOMETHINGWENTWRONG)
        );
    }
});

function getOrderPaymentQuery(oid, cb){
    var query ='';

    if(oid){
            query = query + `INSERT INTO orders (oid, key, value) VALUES ('${oid}', '${dbconstants.DB_PAYMENT}' , 'done');`;
    }else{
       return cb(text.TEXT_INVALIDREQUEST);
    }
    return cb(false, query);

}

function getstatusupdatequery(oid, status, cb){
    var query ='';
    if(oid!== 'null' && oid!==undefined && status!== 'null' && status!==undefined){
        query = query +  `UPDATE orders SET value = '${status}' WHERE oid = '${oid}' AND key = '${dbconstants.DB_STATUS}';`;
        if(status==='Delivered'){
            query=query+ `UPDATE delpartner_order SET endtime = Now() where oid = '${oid}' and partnerid = '${partnerid}';`;
        }
    }else{
       return cb(text.TEXT_INVALIDREQUEST);
    }
    return cb(false, query);
}

function getOrderFromIdQuery(status, cb){
    var query = '';
    if(status ){
        if(status ==='All'){
            query = query + `SELECT * FROM orders;`;
        }else{
            query = query + `SELECT * FROM orders WHERE oid IN (SELECT oid FROM orders WHERE key = '${dbconstants.DB_STATUS}' AND value = '${status}')`;
        }
    }else{
       return cb(text.TEXT_INVALIDREQUEST);
    }

    return cb(false, query);
}

function sendStatusNotificationToUser(uid, status){
    if(uid && status){
        var tokenQuery= `SELECT * FROM users WHERE uid = '${uid}' AND key = '${dbconstants.DB_NOTITOKEN}'`;
        pool.query(tokenQuery).then((result)=>{
            if(result.rowCount>0){
                var userdata= result.rows[0];
                var token= userdata.value;
                var body= getStatusBody(status);
                if(body===''){
                    return;
                }
                sendNotificationToDevice(token, status, body);
            }else{
                return;
            }
        }).catch((err)=>{
            console.log(err);
            return;
        })
    }else{
        return;
    }
}

function getStatusBody(status){
    if(status==='Way to pick up'){
        return 'Our delivery partner is on the way to your pickup location';
    }else if(status==='On the way'){
        return 'Our delivery partner is on the way to your drop location';
    }else if(status === 'Delivered'){
        return 'Your order is received at its destination';
    }
    return '';
}


module.exports = router;
