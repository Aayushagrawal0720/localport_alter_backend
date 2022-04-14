const router = require('express').Router();
const pool = require('../databaseconf/psqlconf');
const {getJSONResponse} = require('../functions/responsefunction');
const text = require('../constants/text');
const errorcode= require('../constants/errorcodes');
const dbconstants = require('../constants/dbconstants');
const {sendNotificationToDevice} = require('../notifications/sendnotification');


router.post('/partnerupdateorderstatus', (req, res)=>{
    try{
        var {oid, status, uid, partnerid} = req.body;
            getstatusupdatequery(oid, status, partnerid,(err, query)=>{
                if(err){
                    res.send(getJSONResponse(false, errorcode.INVALID_REQUEST, text.TEXT_INVALIDREQUEST, {}))
                    return;
                }else{
                    pool.query(query).then((result)=>{
                         sendStatusNotificationToUser(uid, status);
                         res.send(getJSONResponse(true, '', text.TEXT_SUCCESS, {}))
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


function getstatusupdatequery(oid, status,partnerid, cb){
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




module.exports  = router
