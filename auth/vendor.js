const router = require('express').Router();
const pool = require('../databaseconf/psqlconf');
const {getJSONResponse} = require('../functions/responsefunction');
const text = require('../constants/text');
const errorcodes= require('../constants/errorcodes');
const dbconstants = require('../constants/dbconstants');
const { v4 : uuidv4 } =require('uuid');

router.post('/registervendor', (req, res)=>{
    try{
        var {uid, vendorname, about, logo} = req.body;
        var vid = uuidv4();
        getVendorRegistrationQuery(vid, uid, vendorname, about,logo, (err, query)=>{
            if(err){
                res.send(getJSONResponse(false, errorcodes.INVALID_REQUEST, text.TEXT_INVALIDREQUEST, {}))
                return;
            }else{
                  pool.query(query).then((result) => {
                    if (result.length > 0) {
                        res.send(getJSONResponse(true, '', text.TEXT_SUCCESS, {vid :vid}))
                        return;
                    }
                }).catch((err) => {
                    console.log(err);
                    getDeleteQuery(vid, uid, (query) => {
                        pool.query(query).then((result) => {
                            res.send(getJSONResponse(false, errorcodes.INVALID_REQUEST, text.TEXT_INVALIDREQUEST));
                        }).catch((err)=>{
                            console.log(err);
                            res.send(getJSONResponse(false, errorcodes.INVALID_REQUEST, text.TEXT_INVALIDREQUEST));
                        });
                    });
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


function getVendorRegistrationQuery(vid, uid, vendorname, about,logo, cb){
    var query = '';
    if(vid){
        query = query + `UPDATE users SET value = 'true' WHERE uid = '${uid}' and key = '${dbconstants.DB_ISVENDOR}';`
        if(uid){
            query = query + `INSERT INTO vendors (vid, key, value) VALUES ('${vid}', 'uid', '${uid}');`;
        }else{
            return cb(text.TEXT_INVALIDREQUEST);
        }
        if(vendorname){
            query = query + `INSERT INTO vendors (vid, key, value) VALUES ('${vid}', '${dbconstants.DB_VENDORNAME}', '${vendorname}');`;
        }else{
            return cb(text.TEXT_INVALIDREQUEST);
        }
        if(about){
            query = query + `INSERT INTO vendors (vid, key, value) VALUES ('${vid}', '${dbconstants.DB_VENDORABOUT}', '${about}');`;
        }
        else{
            return cb(text.TEXT_INVALIDREQUEST);
        }
         if(logo){
            query = query + `INSERT INTO vendors (vid, key, value) VALUES ('${vid}', '${dbconstants.DB_VENDORLOGO}', '${logo}');`;
        }
        else{
            return cb(text.TEXT_INVALIDREQUEST);
        }
    }else{
        return cb(text.TEXT_INVALIDREQUEST);
    }
    return cb(false, query);
}

function getDeleteQuery(vid, uid, cb) {
    var query = `DELETE FROM vendors WHERE vid = '${vid}';`;
    query = query + `DELETE FROM users WHERE uid = '${uid}' AND key = '${dbconstants.DB_ISVENDOR}';`
    return cb(query);
}




module.exports  = router
