const router = require('express').Router();
const pool = require('../databaseconf/psqlconf');
const { getJSONResponse } = require('../functions/responsefunction');
const text = require('../constants/text');
const errorcode = require('../constants/errorcodes');
const dbconstants = require('../constants/dbconstants');

router.post('/getuserbyid', (req, res)=>{
   try{
       var {id}= req.body;
       getVendorById(id, (err, query)=>{
           if(err){
                console.log(err);
                res.send(getJSONResponse(false, errorcode.INVALID_REQUEST, text.TEXT_INVALIDREQUEST));
                return;
            }
            pool.query(query).then((result)=>{
                var vendorrows = result.rows;
                vendorrows.forEach((row)=>{
                    if(row.key ==='uid' ){
                        id = row.value;
                    }
                })
                //GETTING USER DETAIL BY UID OBTAINED FROM VENDORS TABLE
                    getUserById(id, (err, query)=>{
                        if(err){
                            console.log(err);
                            res.send(getJSONResponse(false, errorcode.INVALID_REQUEST, text.TEXT_INVALIDREQUEST));
                            return;
                        }
                        pool.query(query).then((result)=>{
                            var userrows = result.rows;

                            userrows.forEach((urow)=>{
                                vendorrows.push(urow);
                            });

                            res.send(getJSONResponse(true, '', '', vendorrows));

                        }).catch((err) => {
                            console.log(err);
                            res.send(getJSONResponse(false, errorcode.INVALID_REQUEST, text.TEXT_INVALIDREQUEST));
                        });
                        });
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

router.post('/allusers', (req, res)=>{
    try{
        var {usertype} = req.body;

        alluserquery(usertype, (err, query)=>{
            if(err){

               res.send(getJSONResponse(false, errorcode.INVALID_REQUEST, text.TEXT_INVALIDREQUEST, {}))
                return;
            }else{
               pool.query(query).then((result)=>{
                   if(usertype!=='Individual'){
                        var urows = result.rows;
                        var uids= [];
                        var uniqueuids=[];
                        var venquery ='';
                        var walletQuery='';
                        urows.forEach((row)=>{
                            uids.push(row.uid);
                        });
                        uniqueuids= uids.filter(onlyUnique);
                        uniqueuids.forEach((uid)=>{
                             getVendorByUid(venquery, uid, (err, finalvquery)=>{
                                if(err){
                                    res.send(getJSONResponse(false, errorcode.SOMETHING_WENT_WRONG, text.TEXT_SOMETHINGWENTWRONG, {}))
                                    return;
                                }else{
                                    venquery= finalvquery;
                                }
                            });

                             fetchWalletQuery(walletQuery, uid, (err,finalWQuery)=>{
                                 if(err){
                                    res.send(getJSONResponse(false, errorcode.SOMETHING_WENT_WRONG, text.TEXT_SOMETHINGWENTWRONG, {}))
                                    return;
                                }else{
                                    walletQuery= finalWQuery;
                                }
                            })


                             if(uniqueuids.indexOf(uid)===uniqueuids.length-1){
                               pool.query(venquery).then((venresult)=>{
                                    venresult.forEach((vendor)=>{
                                        var vendrrows= vendor.rows;
                                        vendrrows.forEach((frow)=>{
                                            urows.push(frow);
                                        });

                                        if(venresult.indexOf(vendor)===venresult.length-1){
                                            //-------------FETCH WALLET BALANCE-----------------
                                            pool.query(walletQuery).then((wResult)=>{
                                                wResult.forEach((wallet)=>{
                                                     if(wallet.rowCount>0){
                                                        var walletRows = wallet.rows;
                                                        walletRows.forEach((wRow)=>{
                                                            urows.push(wRow)
                                                        });
                                                    }
                                                if(wResult.indexOf(wallet)===wResult.length-1){
                                                    res.send(getJSONResponse(true, '', '', urows));
                                                    return;
                                                }
                                            })

                                            }).catch((err) => {
                                                console.log(err);
                                                res.send(getJSONResponse(false, errorcode.INVALID_REQUEST, text.TEXT_INVALIDREQUEST));
                                                return;
                                            });
                                        }
                                    });


                                }).catch((err) => {
                                    console.log(err);
                                    res.send(getJSONResponse(false, errorcode.INVALID_REQUEST, text.TEXT_INVALIDREQUEST));
                                    return;
                                });
                            }

                        })
                    }else{
                        var urows = result.rows;
                        var uids= [];
                        var uniqueuids=[];
                        var walletQuery='';
                        urows.forEach((row)=>{
                            uids.push(row.uid);
                        });
                        uniqueuids= uids.filter(onlyUnique);
                         uniqueuids.forEach((uid)=>{

                            fetchWalletQuery(walletQuery, uid, (err,finalWQuery)=>{
                                if(err){
                                    res.send(getJSONResponse(false, errorcode.SOMETHING_WENT_WRONG, text.TEXT_SOMETHINGWENTWRONG, {}))
                                    return;
                                }else{
                                    walletQuery= finalWQuery;
                                }
                            })

                        if(uniqueuids.indexOf(uid)===uniqueuids.length-1){
                             //-------------FETCH WALLET BALANCE-----------------
                                pool.query(walletQuery).then((wResult)=>{
                                        wResult.forEach((wallet)=>{
                                        if(wallet.rowCount>0){
                                                var walletRows = wallet.rows;
                                                walletRows.forEach((wRow)=>{
                                                urows.push(wRow)
                                            });
                                        }
                                        if(wResult.indexOf(wallet)===wResult.length-1){
                                            res.send(getJSONResponse(true, '', '', urows));
                                            return;
                                        }
                                    })
                                /*else{
                                    if(wResult.rowCount>0){
                                        var walletRows = wResult.rows;
                                        walletRows.forEach((wRow)=>{
                                            urows.push(wRow)
                                        });
                                    }
                                    res.send(getJSONResponse(true, '', '', urows));
                                    return;
                                }*/
                                }).catch((err) => {
                                    console.log('wallet query erro in admin/user.js')
                                    console.log(err);
                                    res.send(getJSONResponse(false, errorcode.INVALID_REQUEST, text.TEXT_INVALIDREQUEST));
                                    return;
                                });
                        }
                        });
                    }
                }).catch((err) => {
                    console.log(err);
                    res.send(getJSONResponse(false, errorcode.INVALID_REQUEST, text.TEXT_INVALIDREQUEST));
                    return;
                });
            }
        });
    }catch(err){
        console.log(err);
         res.send(
            getJSONResponse(false, errorcode.SOMETHING_WENT_WRONG, text.TEXT_SOMETHINGWENTWRONG)
        );
         return;
    }
});

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

function alluserquery(usertype, cb){
    var query ='';
    if(usertype!='null' && usertype!=undefined){
        if(usertype==='Individual'){
            query = `SELECT * FROM users WHERE uid IN (SELECT uid FROM users EXCEPT SELECT uid FROM users WHERE key = '${dbconstants.DB_ISVENDOR}' AND value = 'true')`;
        }else{
            query = `SELECT * FROM users WHERE uid IN (SELECT uid FROM users WHERE key = '${dbconstants.DB_ISVENDOR}' AND value = 'true')`;
        }
    }else{
        return cb(text.TEXT_INVALIDREQUEST)
    }
    return cb(false, query);
}

function getVendorByUid(oquery, uid, cb){
    var query = oquery;
    if(uid){
        query = query + `SELECT * FROM vendors WHERE vid = (SELECT vid FROM vendors WHERE key = 'uid' AND value = '${uid}');`;
    }else{
        return cb(text.TEXT_INVALIDREQUEST)
    }
    return cb(false, query);
}

function getVendorById(id, cb){
    var query = '';
    if(id!=undefined && id!='null'){
        query = query +  `SELECT * FROM vendors WHERE vid = '${id}';`;
    }else{
        return cb(text.TEXT_INVALIDREQUEST)
    }
    return cb(false, query);
}

function getUserById(id, cb){
    var query = '';
    if(id!=undefined && id!='null'){
        query = query +  `SELECT * FROM users WHERE uid = '${id}';`;
    }else{
        return cb(text.TEXT_INVALIDREQUEST)
    }
    return cb(false, query);
}

function fetchWalletQuery(oquery,uid, cb){
    var query=oquery;
    if(uid){
        query = query + `SELECT * FROM wallet WHERE key = 'wallet' and uid = '${uid}';`;
    }else{
        return cb(text.TEXT_INVALIDREQUEST)
    }
    return cb(false, query);
}


module.exports = router;
