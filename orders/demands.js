const router = require('express').Router();
const pool = require('../databaseconf/psqlconf');
const { getJSONResponse } = require('../functions/responsefunction');
const text = require('../constants/text');
const errorcode = require('../constants/errorcodes');
const dbconstants = require('../constants/dbconstants');
const { v4 : uuidv4 } =require('uuid');

router.post('/makedemand', (req, res)=>{
    try{
        var {demand, uid} = req.body;
        getOnDemandSaveQuery(uid, demand, (err, query)=>{
           if(err){
                res.send(getJSONResponse(false, errorcodes.INVALID_REQUEST, text.TEXT_INVALIDREQUEST))
                return;
            }else{
                pool.query(query).then((result)=>{
                    res.send(getJSONResponse(true, '', text.TEXT_SUCCESS, {}))
                }).catch((err) => {
                    console.log(err)
                    res.send(getJSONResponse(false, errorcodes.INVALID_REQUEST, text.TEXT_INVALIDREQUEST));
                    return;
                });
            }
        });
    }catch(err){
        console.log(err);
          res.send(
            getJSONResponse(false, errorcodes.SOMETHING_WENT_WRONG, text.TEXT_SOMETHINGWENTWRONG)
        );
    }
});

function getOnDemandSaveQuery(uid, demand, cb){
    var query =``;
    var did = uuidv4();
    if(uid && demand){
        query = query + `INSERT INTO demands (did, key, value) values ('${did}', 'uid', '${uid}');`;
        query = query + `INSERT INTO demands (did, key, value) values ('${did}', 'demand', '${demand}');`;
        query = query + `INSERT INTO demands (did, key, value) values ('${did}', 'status', 'Pending');`;
        query = query + `INSERT INTO demands (did, key, value) values ('${did}', 'date', NOW());`;
    }else{
        cb(errorcode.INVALID_REQUEST);
        return;
    }
    cb(undefined, query);
    return;

}

module.exports = router;
