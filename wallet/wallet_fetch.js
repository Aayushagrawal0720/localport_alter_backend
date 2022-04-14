const pool = require('../databaseconf/psqlconf');
const errorcode = require('../constants/errorcodes');


function fetchWalletBalance(uid, type, cb){
    try{
        getWalletQuery(uid, type, (err,query)=>{
           if(err){
               cb(err);
               return;
            }else{
                pool.query(query).then((result)=>{
                    if(result.rowCount>0){
                        cb(undefined, result.rows[0]);
                        return;
                    }else{
                        createWallet(uid,type);
                        cb(errorcode.WALLET_NOT_FOUND);
                        return;
                    }
                }).catch((err)=>{
                    console.log(err);
                    cb(errorcode.INVALID_REQUEST);
                    return;
                });
            }
        });
    }catch(err){
        console.log(err);
        cb(errorcode.INVALID_REQUEST);
        return;
    }
}

function getWalletQuery(uid, type, cb){
    var query= '';
    if(uid){
        if(type){
                query= `SELECT * FROM wallet WHERE key = '${type}' AND uid = '${uid}';`;
        }else{
            cb(errorcode.INVALID_REQUEST);
            return;
        }
    }else{
        cb(errorcode.INVALID_REQUEST);
        return;
    }

    cb(undefined,query);
}

function createWallet(uid, type){
    var query= `INSERT INTO wallet (uid, key, value) VALUES ('${uid}', '${type}', '0')`;
    pool.query(query).then((result)=>{
        if(result.rowCount>0){
        }
    }).catch((result)=>{
        console.log(result);
    });
}


module.exports= {
    fetchWalletBalance : fetchWalletBalance
}
