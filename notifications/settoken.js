 const router = require('express').Router();
const pool = require('../databaseconf/psqlconf');
const {getJSONResponse} = require('../functions/responsefunction');
const text = require('../constants/text');
const errorcodes= require('../constants/errorcodes');
const dbconstants = require('../constants/dbconstants');


router.post('/settoken', (req, res)=>{
   try{
    var {uid, token}= req.body;
    getTokenQuery(uid, (err, squery)=>{
        if(err){
                res.send(getJSONResponse(false, errorcodes.INVALID_REQUEST, text.TEXT_INVALIDREQUEST, {}))
                return;
            }else{
                pool.query(squery).then((result)=>{
                    if(result.rowCount>0){
                         getTokenUpdateQuery(uid, token, (err, query)=>{
                            if(err){
                                res.send(getJSONResponse(false, errorcodes.INVALID_REQUEST, text.TEXT_INVALIDREQUEST, {}))
                                return;
                            }
                            else{
                                pool.query(query).then((result)=>{
                                    if(result.rowCount>0){
                                        res.send(getJSONResponse(true, '',text.TEXT_SUCCESS,{}))
                                        return;
                                    }else{
                                        res.send(getJSONResponse(false, errorcodes.INVALID_REQUEST, text.TEXT_INVALIDREQUEST, {}))
                                        return;
                                    }
                                }).catch((err) => {
                                    console.log(err)
                                    res.send(getJSONResponse(false, errorcodes.INVALID_REQUEST, text.TEXT_INVALIDREQUEST));
                                    return;
                                });
                            }
                        });
                    }else{
                        getTokenInsertQuery(uid, token, (err, query)=>{
                            if(err){
                                res.send(getJSONResponse(false, errorcodes.INVALID_REQUEST, text.TEXT_INVALIDREQUEST, {}))
                                return;
                            }
                            else{
                                pool.query(query).then((result)=>{

                                    if(result.rowCount>0){
                                        res.send(getJSONResponse(true, '',text.TEXT_SUCCESS,{}))
                                        return;
                                    }else{
                                        res.send(getJSONResponse(false, errorcodes.INVALID_REQUEST, text.TEXT_INVALIDREQUEST, {}))
                                        return;
                                    }
                                }).catch((err) => {
                                    console.log(err)
                                    res.send(getJSONResponse(false, errorcodes.INVALID_REQUEST, text.TEXT_INVALIDREQUEST));
                                    return;
                                });
                            }
                        });
                    }
                }).catch((err) => {
                    console.log(err)
                    res.send(getJSONResponse(false, errorcodes.INVALID_REQUEST, text.TEXT_INVALIDREQUEST))
                });
            }
    })


    }catch (err) {
        res.send(getJSONResponse(false, errorcodes.SOMETHING_WENT_WRONG, text.TEXT_SOMETHINGWENTWRONG, {}));
    }
});

function getTokenQuery(uid, cb){
    var query = '';
    if(uid && uid!='null' && uid!=undefined){
        query = query +  `SELECT * FROM users WHERE key = '${dbconstants.DB_NOTITOKEN}' AND uid = '${uid}'`;
    } else {
        cb(text.TEXT_INVALIDREQUEST);
    }
    cb(false, query);
}

function getTokenInsertQuery(uid, token, cb){
    var query = '';
    if(uid && token && uid!='null' && uid!=undefined && token!='null' && token!=undefined){
        query = query +  `INSERT INTO users (uid, key, value) VALUES('${uid}', '${dbconstants.DB_NOTITOKEN}','${token}')`;
    } else {
        cb(text.TEXT_INVALIDREQUEST);
    }
    cb(false, query);
}

function getTokenUpdateQuery(uid, token, cb){
     var query = '';
    if(uid && token && uid!='null' && uid!=undefined && token!='null' && token!=undefined){
        query = query +  `UPDATE users SET value ='${token}' WHERE uid = '${uid}' AND key =  '${dbconstants.DB_NOTITOKEN}';`;
    } else {
        cb(text.TEXT_INVALIDREQUEST);
    }

    cb(false, query);
}



module.exports  = router
