const router = require('express').Router();
const pool = require('../databaseconf/psqlconf');
const {getJSONResponse} = require('../functions/responsefunction');
const text = require('../constants/text');
const errorcodes= require('../constants/errorcodes');
const dbconstants = require('../constants/dbconstants');

//------------------------
//------------------------
//-------------------------O N  H O L D-----------------------------------------------------------
//--------------------------
router.get('/partnercorder', (req, res)=>{
    try{
        var {partnerid}= req.headers;
        getCurrentOrderQuery(partnerid, (err, query)=>{
            if(err){
                res.send(getJSONResponse(false, errorcodes.INVALID_REQUEST, text.TEXT_INVALIDREQUEST));
                return;
            }else{
                pool.query(query).then((result)=>{
                   if(result.rowCount>0){
                        res.send(getJSONResponse(true,'',text.TEXT_SUCCESS, result.rows));
                        return;
                    }else{
                        res.send(getJSONResponse(true,'','no order found', {}));
                        return;
                    }
                }).catch((err)=>{
                    console.log(err);
                    res.send(getJSONResponse(false, errorcodes.SOMETHING_WENT_WRONG, text.TEXT_SOMETHINGWENTWRONG));
                    return;
                });
            }
        })
    }catch(er){
        console.log(err);
        res.send(getJSONResponse(false, errorcodes.SOMETHING_WENT_WRONG, text.TEXT_SOMETHINGWENTWRONG));
        return;
    }
});


router.get('/partnerallorder', (req, res)=>{
    try{
        var {partnerid}= req.headers;
        getAllOrderQuery(partnerid, (err, query)=>{
            if(err){
                res.send(getJSONResponse(false, errorcodes.INVALID_REQUEST, text.TEXT_INVALIDREQUEST));
                return;
            }else{
                pool.query(query).then((result)=>{
                   if(result.rowCount>0){
                        res.send(getJSONResponse(true,'',text.TEXT_SUCCESS, result.rows));
                        return;
                    }else{
                        res.send(getJSONResponse(true,'','no order found', {}));
                        return;
                    }
                }).catch((err)=>{
                    console.log(err);
                    res.send(getJSONResponse(false, errorcodes.SOMETHING_WENT_WRONG, text.TEXT_SOMETHINGWENTWRONG));
                    return;
                });
            }
        })
    }catch(er){
        console.log(err);
        res.send(getJSONResponse(false, errorcodes.SOMETHING_WENT_WRONG, text.TEXT_SOMETHINGWENTWRONG));
        return;
    }
});

function getAllOrderQuery(partnerid, cb){
    var query = ``
    if(partnerid){
        query = `select * from orders where oid in (select oid from delpartner_order where partnerid = '${partnerid}');`;
    }else{
        cb(text.TEXT_INVALIDREQUEST);
        return;
    }
    cb(false, query);
    return;
}

function getCurrentOrderQuery(partnerid, cb){
    var query = ``
    if(partnerid){
        query = `select * from orders where oid in (select oid from delpartner_order where partnerid = '${partnerid}' and endtime = 'et');`;
    }else{
        cb(text.TEXT_INVALIDREQUEST);
        return;
    }
    cb(false, query);
    return;
}


module.exports  = router
