const router = require('express').Router();
const pool = require('../databaseconf/psqlconf');
const {getJSONResponse} = require('../functions/responsefunction');
const text = require('../constants/text');
const errorcodes= require('../constants/errorcodes');
const dbconstants = require('../constants/dbconstants');



router.post('/fetchdeliveryprice', (req, res)=>{
    try{
        var {weight, distance, vendor, roundtrip, uid}= req.body;
        var finalResponse=[];
        getDeliveryPriceQuery(weight, distance, vendor, uid, (err, query, specialUser)=>{
            if(err){
                 res.send(getJSONResponse(false, errorcodes.INVALID_REQUEST, text.TEXT_INVALIDREQUEST))
            }
            else{
                if(roundtrip===undefined){
                    pool.query(query).then((result)=>{
                        if(result.rowCount>0){
                            var finalResult;
                            if(vendor){
                                finalResult= {'price':result.rows[0].price}
                            }else{
                                finalResult= {'price':result.rows[0].iprice}
                            }
                            res.send(getJSONResponse(true, '', '', finalResult));
                        }else{
                            res.send(getJSONResponse(true, '', '', {price: 100}));
                        }
                    }).catch((err) => {
                        console.log(err)
                        res.send(getJSONResponse(false, errorcodes.INVALID_REQUEST, text.TEXT_INVALIDREQUEST));
                        return;
                    });
                }else{
                    var finalQuery =query;
                    var queryCount=1;
                    if(roundtrip){
                        getRoundtripQuery(roundtrip, finalQuery, (err, roundQuery)=>{
                            if(err){
                                res.send(getJSONResponse(false, errorcodes.INVALID_REQUEST, text.TEXT_INVALIDREQUEST));
                                return;
                            }else{
                                finalQuery=roundQuery;
                                queryCount++;
                            }
                        })
                    }
                      pool.query(finalQuery).then((finalResult)=>{
                            if(queryCount===1){
                                   if(finalResult.rowCount>0){
                                        if(specialUser){
                                            finalResponse.push({'Delivery charge':finalResult.rows[0].spe_price})
                                        }
                                        else if(vendor){
                                            finalResponse.push({'Delivery charge':finalResult.rows[0].price})
                                        }else{
                                            finalResponse.push({'Delivery charge':finalResult.rows[0].iprice})
                                        }
                                    }else{
                                        finalResponse.push({'Delivery charge': 100});
                                    }
                                    res.send(getJSONResponse(true, '', '', finalResponse));
                            }else
                                if(finalResult.length>0){
                                    var delResult= finalResult[0];
                                    var delCharge;
                                    if(delResult.rowCount>0){
                                        if(specialUser){
                                            delCharge=delResult.rows[0].spe_price;
                                            finalResponse.push({'Delivery charge':finalResult.rows[0].spe_price})
                                        }
                                        else if(vendor){
                                            delCharge=delResult.rows[0].price;
                                            finalResponse.push({'Delivery charge':delResult.rows[0].price});
                                        }else{
                                            delCharge=delResult.rows[0].iprice;
                                            finalResponse.push({'Delivery charge':delResult.rows[0].iprice});
                                        }
                                    }else{
                                        finalResponse.push({'Delivery charge': 100});
                                    }
                                    finalResult.forEach((singleResult)=>{
                                        if(finalResult.indexOf(singleResult)>0){
                                            var singleResultRow= singleResult.rows[0];
                                            var operation = singleResultRow['operation'];
                                            var value = singleResultRow['value'];
                                            var key = singleResultRow['key'];
                                            var resultPrice=0;
                                            if(operation==='mul'){
                                                resultPrice= parseFloat(value) * parseFloat(delCharge);
                                            }else if(operation==='add'){
                                                resultPrice= parseFloat(value) + parseFloat(delCharge);
                                            }else if(operation==='div'){
                                                resultPrice= parseFloat(delCharge)/parseFloat(value);
                                            }else if(operation==='sub'){
                                                resultPrice= parseFloat(delCharge)-parseFloat(value);
                                            }else if(operation==='per'){
                                                //TODO
                                            }
                                            var obj ={}
                                            obj[singleResultRow['key']]=resultPrice;
                                            finalResponse.push(obj);
                                        }
                                        if(finalResult.indexOf(singleResult)===finalResult.length-1){
                                            res.send(getJSONResponse(true, '', '', finalResponse));
                                        }
                                    });
                                }else{
                                    res.send(getJSONResponse(false, errorcodes.INVALID_REQUEST, text.TEXT_INVALIDREQUEST));
                                    return;
                                }

                            }).catch((err) => {
                                console.log(err)
                                res.send(getJSONResponse(false, errorcodes.INVALID_REQUEST, text.TEXT_INVALIDREQUEST));
                                return;
                            });
                    /*
                     * if roundtrip
                     *  then create query else check another
                     */
                }
            }
        });

    }catch(err){
        console.log(err);
          res.send(
            getJSONResponse(false, errorcodes.SOMETHING_WENT_WRONG, text.TEXT_SOMETHINGWENTWRONG)
        );
    }
});

function getDeliveryPriceQuery(weight, distance, vendor, uid, cb){
    var query;
    if(uid){
        getSpecialUser(uid, (specialUser)=>{
            specialUser= specialUser==='true';
            if(weight && distance){
                if(specialUser){
                    query = `SELECT spe_price FROM  deliveryprice WHERE weight>=${weight} and distance>=${distance} limit 1;`;
                }
                else if(vendor){
                    query = `SELECT price FROM  deliveryprice WHERE weight>=${weight} and distance>=${distance} limit 1;`;
                }else{
                    query = `SELECT iprice FROM  deliveryprice WHERE weight>=${weight} and distance>=${distance} limit 1;`;
                }
            }else{
                return cb(errorcodes.INVALID_REQUEST)
            }
            return cb(false, query, specialUser);
        })
    }


}

function getSpecialUser(uid, cb){
    var query = `SELECT value FROM users WHERE uid = $1 AND key = $2 LIMIT 1;`;
    pool.query(query, [uid, dbconstants.DB_SPECIALUSER]).then((result)=>{
        if(result.rowCount>0){
            var value = result.rows[0]['value'];
            if(value){
                cb(value);
                return;
            }else{
                cb('false');
                return;
            }
        }else{
            cb('false');
            return;
        }
    }).catch((exception)=>{
        console.log('getSpecialUser--------- catch');
        console.log(exception);
        cb('false');
        return;
    })
}

function getRoundtripQuery(roundtrip, equery, cb){
    var query = equery;
    if(roundtrip){
        query = query + `SELECT * FROM charges where key= '${dbconstants.DB_ROUNDTRIP}';`;
    }else{
        cb(false, query);
        return;
    }
    cb(false, query);
    return;

}

module.exports = router;
