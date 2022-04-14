const router = require('express').Router();
const pool = require('../databaseconf/psqlconf');
const {getJSONResponse} = require('../functions/responsefunction');
const text = require('../constants/text');
const errorcodes= require('../constants/errorcodes');
const dbconstants = require('../constants/dbconstants');


router.post('/login', (req, res) => {
    try {
        var { mobile } = req.body;
        getLoginQuery(mobile, (err, query) => {
            if (err) {
                res.send(getJSONResponse(false, errorcodes.INVALID_REQUEST, text.TEXT_INVALIDREQUEST));
                return;
            } else {
                pool.query(query).then((result) => {
                    if (result.rowCount > 0) {
                        var rows = result.rows;
                        var isvendor= false;
                        rows.forEach((row)=>{
                            if(row.key === 'isvendor' && row.value==='true'){
                                isvendor= true;
                                var uid = row.uid;
                                getVendorQuery(uid, (vendorquery)=>{
                                    pool.query(vendorquery).then((result)=>{
                                        if(result.rowCount>0){
                                            result.rows.forEach((vrow)=>{
                                               rows.push(vrow);
                                            });
                                            res.send(getJSONResponse(true, '', '', rows));
                                            return;
                                        }

                                    }).catch((err) => {
                                        res.send(getJSONResponse(false, errorcodes.INVALID_REQUEST, text.TEXT_INVALIDREQUEST));
                                        return;
                                    });
                                })
                            }
                            if(rows.indexOf(row)=== rows.length-1){
                                if(!isvendor){
                                    res.send(getJSONResponse(true, '', '', rows));
                                    return;
                                }
                            }
                        });

                    } else {
                        res.send(getJSONResponse(false, errorcodes.USER_NOT_FOUND, text.TEXT_USERNOTFOUND, {}));
                        return;
                    }
                }).catch((err) => {
                    console.log(err)
                    res.send(getJSONResponse(false, errorcodes.INVALID_REQUEST, text.TEXT_INVALIDREQUEST));
                    return;
                });
            }
        });

    } catch (err) {
        res.send(
            getJSONResponse(false, errorcodes.SOMETHING_WENT_WRONG, text.TEXT_SOMETHINGWENTWRONG)
        );
        return;
    }
});


function vendorCheck(rows){

}



router.post('/register', (req, res) => {
    try {
        var { fname, lname, uid, mobile, delivery_partner } = req.body;
        getRegisterQuery(fname, lname, mobile, uid, delivery_partner, (err, query) => {
            if (err) {
                console.log(err);
                res.send(getJSONResponse(false, errorcodes.INVALID_REQUEST, text.TEXT_INVALIDREQUEST, {}))
                return;
            } else {
                pool.query(query).then((result) => {
                    if (result.length > 0) {
                        res.send(getJSONResponse(true, '', text.TEXT_SUCCESS, {}))
                        return;
                    }
                }).catch((err) => {
                                    console.log(err);

                    getDeleteQuery(uid, (query) => {
                        pool.query(query).then((result) => {
                            res.send(getJSONResponse(false, errorcodes.INVALID_REQUEST, text.TEXT_INVALIDREQUEST));
                            return;
                        }).catch((err)=>{
                            res.send(getJSONResponse(false, errorcodes.INVALID_REQUEST, text.TEXT_INVALIDREQUEST));
                            return;
                        });
                    });
                });
            }
        });

    } catch (err) {
        console.log(err);
        res.send(getJSONResponse(false, errorcodes.SOMETHING_WENT_WRONG, text.TEXT_SOMETHINGWENTWRONG, {}));
    }
});

function getRegisterQuery(fname, lname, mobile, uid, delivery_partner,cb) {
    console.log(fname, lname, mobile, uid, delivery_partner)
    var query = ``;
    if (uid) {
        if (fname) {
            query = query + `INSERT INTO users (uid, key, value) VALUES ('${uid}', '${dbconstants.DB_FNAME}', '${fname}');`;
        }
        else {
            return cb(text.TEXT_INVALIDREQUEST)
        }
        if (lname) {
            query = query + `INSERT INTO users (uid, key, value) VALUES ('${uid}', '${dbconstants.DB_LNAME}', '${lname}');`;
        } else {
            return cb(text.TEXT_INVALIDREQUEST)
        }
        if (mobile) {
            query = query + `INSERT INTO users (uid, key, value) VALUES ('${uid}', '${dbconstants.DB_MOBILE}', '${mobile}');`;
        }
        else {
            return cb(text.TEXT_INVALIDREQUEST)
        }
        if(delivery_partner){
            if(delivery_partner===true){
               query = query + `INSERT INTO users (uid, key, value) VALUES ('${uid}', '${dbconstants.DB_DELPARTNER}', '${delivery_partner}');`;
            }
        }
 /*       if (usertype) {
            query = query + `INSERT INTO users (uid, key, value) VALUES ('${uid}', '${dbconstants.DB_USERTYPE}', '${usertype}');`;
        }
        else {
            return cb(text.TEXT_INVALIDREQUEST)
        }*/
         query = query + `INSERT INTO wallet (uid, key, value) VALUES ('${uid}', 'wallet', '0');`;
         query = query + `INSERT INTO users (uid, key, value) VALUES ('${uid}','${dbconstants.DB_ISVENDOR}','false');`
         query = query + `INSERT INTO users (uid, key, value) VALUES ('${uid}','${dbconstants.DB_JOINNINGDATE}',Now());`


    } else {
        return cb(text.TEXT_INVALIDREQUEST)
    }
    return cb(false, query);
}

function getDeleteQuery(uid, cb) {
    var query = `DELETE FROM users WHERE uid = '${uid}'`;
    cb(query);
}

function getLoginQuery(mobile, cb) {
    if (mobile) {
        var query = `SELECT * FROM users WHERE uid = (SELECT uid FROM users WHERE key = '${dbconstants.DB_MOBILE}' AND value = '${mobile}' LIMIT 1)`;
        cb(false, query);
     } else {
        cb(text.TEXT_INVALIDREQUEST);
     }
}

function getVendorQuery(uid, cb){
    var query = '';
    query = query + `SELECT * FROM vendors WHERE vid = (SELECT vid FROM vendors WHERE key = 'uid' AND value = '${uid}')`;
    return cb(query);
}

module.exports  = router
