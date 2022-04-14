const router = require('express').Router();
const pool = require('../databaseconf/psqlconf');
const { getJSONResponse } = require('../functions/responsefunction');
const text = require('../constants/text');
const errorcode = require('../constants/errorcodes');
const dbconstants = require('../constants/dbconstants');


router.post('/setspecialuser', (req, res)=>{
    try{
        var {uid, specialuser} = req.body;
        getSpecialUserQuery(uid, specialuser, (err, query, dataSet)=>{
            if(err){
                 res.send(getJSONResponse(false, errorcode.INVALID_REQUEST, text.TEXT_INVALIDREQUEST))
                 return;
            }else{
                pool.query(query, dataSet).then((result)=>{
                    if(result.rowCount>0){
                        res.send(getJSONResponse(true, '', text.TEXT_SUCCESS,{}));
                        return;
                    }else{
                        res.send(getJSONResponse(false, errorcode.INVALID_REQUEST, text.TEXT_INVALIDREQUEST));
                        return;
                    }
                }).catch((err) => {
                    console.log(err)
                    res.send(getJSONResponse(false, errorcode.INVALID_REQUEST, text.TEXT_INVALIDREQUEST));
                    return;
                });
            }
        })
    }
    catch(err){
        console.log(err);
         res.send(
            getJSONResponse(false, errorcode.SOMETHING_WENT_WRONG, text.TEXT_SOMETHINGWENTWRONG)
        );
    }
})

function getSpecialUserQuery(uid, specialuser, cb){
    var query = ``;
    var dataSet=[];
    if(uid){
        getSpecialUser(uid, (su)=>{
            if(su){
                query = query + `UPDATE users SET value = $1 WHERE uid = $2 AND key = $3;`;
                dataSet.push(specialuser);
                dataSet.push(uid)
                dataSet.push(dbconstants.DB_SPECIALUSER);
            }else{
                query = query + `INSERT INTO users (uid, key, value) values ($1, $2 , $3);`;
                dataSet.push(uid)
                dataSet.push(dbconstants.DB_SPECIALUSER);
                dataSet.push(specialuser);

            }
            cb(undefined, query, dataSet);
            return;
        })
    }else{
        cb(errorcode.INVALID_REQUEST);
        return;
    }

}


function getSpecialUser(uid, cb){
    var query = `SELECT value FROM users WHERE uid = $1 AND key = $2 LIMIT 1;`;
    pool.query(query, [uid, dbconstants.DB_SPECIALUSER]).then((result)=>{
        if(result.rowCount>0){
            cb(true);
        }else{
            cb(false);
            return;
        }
    }).catch((exception)=>{
        console.log('getSpecialUser--------- catch');
        console.log(exception);
        cb('false');
        return;
    })
}


module.exports = router;

