const router = require('express').Router();
const pool = require('../databaseconf/psqlconf');
const {getJSONResponse} = require('../functions/responsefunction');
const text = require('../constants/text');
const errorcodes= require('../constants/errorcodes');
const dbconstants = require('../constants/dbconstants');


router.get('/allpartners', (req, res)=>{
    try{
        var query = `SELECT * FROM users WHERE uid in (SELECT uid FROM users WHERE key = '${dbconstants.DB_DELPARTNER}' AND value = 'true');`;
        pool.query(query).then((result)=>{
            if(result.rowCount>0){
                res.send(getJSONResponse(true, '', text.TEXT_SUCCESS, result.rows));
                return;
            }
        }).catch((err)=>{
            console.log(err)
            res.send(getJSONResponse(false, errorcodes.SOMETHING_WENT_WRONG, text.TEXT_SOMETHINGWENTWRONG));
        });
    }catch(err){
        console.log(err);
        res.send(getJSONResponse(false, errorcodes.SOMETHING_WENT_WRONG, text.TEXT_SOMETHINGWENTWRONG));
        return;
    }
});

router.post('/setdelpartner', (req, res)=>{
    try{
        var {oid, partnerid} = req.body;
        getPartnerOrderQuery(oid, partnerid, (err, query)=>{
            if(err){
                res.send(getJSONResponse(false, errorcodes.INVALID_REQUEST, text.TEXT_INVALIDREQUEST));
                return;
            }else{
                pool.query(query).then((result)=>{
                    if(result.rowCount>0){
                        res.send(getJSONResponse(true, '', text.TEXT_SUCCESS, result.rows));
                        return;
                    }else{
                        res.send(getJSONResponse(false, errorcodes.SOMETHING_WENT_WRONG, text.TEXT_SOMETHINGWENTWRONG));
                        return;
                    }
                }).catch((err)=>{
                    console.log(err);
                    res.send(getJSONResponse(false, errorcodes.SOMETHING_WENT_WRONG, text.TEXT_SOMETHINGWENTWRONG));
                    return;
                });
            }
        })
    }
    catch(err){
        console.log(err);
        res.send(getJSONResponse(false, errorcodes.SOMETHING_WENT_WRONG, text.TEXT_SOMETHINGWENTWRONG));
        return;
    }
});

function getPartnerOrderQuery(oid, pid, cb){
    var query = ``;
    if(oid && pid){
        query = `INSERT INTO delpartner_order (oid, partnerid, starttime) VALUES ('${oid}', '${pid}', NOW())`;
    }else{
        cb(text.TEXT_INVALIDREQUEST);
        return;
    }

    cb(false, query);
}




module.exports  = router
