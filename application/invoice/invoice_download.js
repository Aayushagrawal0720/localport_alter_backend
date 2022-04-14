const router = require('express').Router();
const pool = require('../../databaseconf/psqlconf');
const { getJSONResponse } = require('../../functions/responsefunction');
const text = require('../../constants/text');
const errorcode = require('../../constants/errorcodes');
const dbconstants = require('../../constants/dbconstants');
const {getInvoiceUrl} = require('./invoice');

router.post('/downloadinvoice', (req, res)=>{
    try{
        var {uid, date}= req.body;
        prepareInvoice(uid, date, (err, result)=>{
            if(err){
                console.log('---------------/getordermonths----------if(err)--')
                console.log(err)
                res.send(getJSONResponse(false, errorcode.SOMETHING_WENT_WRONG, text.TEXT_SOMETHINGWENTWRONG));
                return;
            }else{
                res.send(getJSONResponse(true, '', text.TEXT_SUCCESS, {url: result}));
                return;
            }
        })
    }catch(err){
        console.log('---------------/getordermonths----------catch--')
        console.log(err)
        res.send(getJSONResponse(false, errorcode.SOMETHING_WENT_WRONG, text.TEXT_SOMETHINGWENTWRONG));
        return;
    }
})

function prepareInvoice(uid, date, cb){
    getDateQuery(uid, (err, query, dataSet)=>{
        pool.query(query, dataSet).then((result)=>{
                if(result.rowCount>0){
                   var allDates = result.rows;  //[{ value: date}...]
                   getMonthOids(allDates, date,  (err, orderIds)=>{
                         if(err){
                           cb(err)
                           return;
                        }else{
                            getClient(uid, (err, client)=>{
                                if(err){
                                    cb(err)
                                    return;
                                }else{
                                    getOrders(orderIds, (err, orders)=>{
                                        if(err){
                                            cb(err)
                                            return;
                                        }else{
                                            var finalData = {
                                                client : client,
                                                products : orders
                                            }
                                            getInvoiceUrl(finalData, (err, url)=>{
                                                if(err){
                                                    cb(err);
                                                    return;
                                                }else{
                                                    url= url + '.pdf';
                                                    cb(undefined, url);
                                                    return;
                                                }
                                            })
                                        }
                                    })
                                }
                            })
                    }
                })
                }else{
                    cb(false);
                    return;
                }
        }).catch((exception)=>{
            console.log('----/downloadinvoice----prepareInvoice----')
            console.log(exception);
            cb(exception);
            return;
        })
    })
}

function getDateQuery(uid, cb){
    var query =``;
    var dataSet=[];
    if(uid){
        query = query +`SELECT oid, value FROM orders WHERE key = $1 AND oid IN (SELECT oid FROM orders WHERE key = 'id' AND value = $2);`;
        dataSet.push('date');
        dataSet.push(uid);
    }else{
        cb(errorcode.INVALID_REQUEST);
        return;
    }
    cb(undefined, query, dataSet);
    return;
}

function getMonthInt(name){
    var months=[
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec'
    ];

    return months.indexOf(name)+1
}

function getMonthOids(rows, date, cb){
    var dateList= date.split(' ');
    var month = getMonthInt(dateList[0]);
    var year = parseInt(dateList[1]);
    var oids=[];

    rows.forEach((row)=>{
        var rdate = row['value'];
        var rCDate=  rdate.split(' ')[0];
        var rCDateList = rCDate.split('-');
        var rMonth = parseInt(rCDateList[1])
        var rYear = parseInt(rCDateList[0])
        if(rMonth===month && rYear===year){
            oids.push(row['oid']);
        }

    })

    cb(undefined, oids);
    return;
}

function getClient(uid, cb){
    if(uid){
        var query = `SELECT * FROM users WHERE uid = '${uid}'`;
        var isVendor = false;
        var data = {};
        pool.query(query).then((result)=>{
            if(result.rowCount>0){
                var rows = result.rows;
                rows.forEach((row)=>{
                    if(row.key===dbconstants.DB_ISVENDOR){
                        if(row.value.toString()==='true'){
                            isVendor= true;
                        }
                    }
                })

                if(isVendor){
                    var vquery = `SELECT * FROM vendors WHERE vid = (SELECT vid FROM vendors WHERE key = 'uid' AND value = '${uid}');`;
                    pool.query(vquery).then((vresult)=>{
                        if(vresult.rowCount>0){
                            var vrows = vresult.rows;
                            vrows.forEach((vRow)=>{
                                if(vRow.key===dbconstants.DB_VENDORNAME){
                                    data['name']= vRow.value;
                                    data['uid']= uid;
                                }
                            })
                            cb(undefined, data);
                        }
                    }).catch((exception)=>{
                        console.log('---------/downloadinvoice-----getClient 2-----')
                        console.log(exception);
                        cb(exception)
                        return;
                    })
                }else{
                    var fname = '';
                    var lname = '';
                    rows.forEach((row)=>{
                        if(row.key===dbconstants.DB_FNAME){
                            fname= row.value;
                        }
                        else if(row.key===dbconstants.DB_LNAME){
                            lname= row.value;
                        }
                    })
                    data['name'] = fname + ' ' + lname;
                    data['uid']= uid;
                    cb(undefined, data);
                }
            }
        }).catch((exception)=>{
            console.log('---------/downloadinvoice-----getClient-----')
            console.log(exception);
            cb(exception)
            return;
        })
    }else{
        cb(false)
        return;
    }
}

function getOrders(oids, cb){


    if(oids.length>0){
        var query = `SELECT * FROM orders WHERE (key = '${dbconstants.DB_PRICE}' OR key = '${dbconstants.DB_DISTANCE}' ) AND (`;
        oids.forEach((oid)=>{
            query = query + `oid = '${oid}'`;
            if(oids.indexOf(oid)!==oids.length-1){
                query = query + ' OR ';
            }
        })
        query = query + `);`;
        pool.query(query).then((result)=>{
            var products= {};
            var rows = result.rows;

            var orderMap={};

            rows.forEach((row)=>{
                orderMap[row.oid] = {'description': row.oid,
                    'quantity':1,
                    'tax-rate': 0,
                }
            })

            rows.forEach((row)=>{
                var id = row.oid;
                var temp = orderMap[id];
                if(row.key === 'distance'){
                    var des = temp.description;
                    temp['description'] = des + `(distance: ${row.value})`
                }else{
                    temp[row.key] = row.value;
                }
                orderMap[id] = temp
            })

            cb(undefined,  Object.values(orderMap));
        }).catch((exception)=>{
            console.log('---------/downloadinvoice----getOrders 2----');
            console.log(exception);
            cb(false);
            return;
        })
    }else{
        console.log('---------/downloadinvoice----getOrders----');
        console.log('---------oids length is 0---------');
        cb(false);
        return;

    }
}


module.exports = router;
