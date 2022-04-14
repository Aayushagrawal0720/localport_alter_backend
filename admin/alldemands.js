const router = require('express').Router();
const pool = require('../databaseconf/psqlconf');
const {getJSONResponse} = require('../functions/responsefunction');
const text = require('../constants/text');
const errorcodes= require('../constants/errorcodes');
const dbconstants = require('../constants/dbconstants');

router.post('/alldemands', (req, res)=>{
   try{
       var {status} = req.body;

       getAllDemandQuery(status, (err, query)=>{
            if(err){
                res.send(getJSONResponse(false, errorcodes.INVALID_REQUEST, text.TEXT_INVALIDREQUEST));
                return;
            }else{
                pool.query(query).then((result)=>{
                   if(result.rowCount>0){
                        res.send(getJSONResponse(true, '', text.TEXT_SUCCESS, result.rows));
                        return;
                    } else{
                        res.send(getJSONResponse(true, '', 'no record found', {}));
                        return;
                    }
                }).catch((err)=>{
                    console.log(err);
                    res.send(getJSONResponse(false, errorcodes.SOMETHING_WENT_WRONG, text.TEXT_SOMETHINGWENTWRONG));
                    return;
                });
            }
        });
    }catch(exception){
        console.log(exception);
        res.send(getJSONResponse(false, errorcodes.SOMETHING_WENT_WRONG, text.TEXT_SOMETHINGWENTWRONG));
        return;
    }
});

function getAllDemandQuery(status, cb){
    var query = ``;

    if(status){
        if(status==='All'){
            query = query + `SELECT * FROM demands;`;
        }else{
            query = query + `SELECT * FROM demands WHERE did IN (SELECT did FROM demands WHERE key = '${status}');`;
        }
    }else{
        cb(errorcodes.INAVLID_REQUEST);
        return;
    }
    cb(undefined, query);
}



module.exports  = router

