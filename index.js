const express = require('express');
const app = express();
const port = 3001;
const path = require("path");


const authentication = require('./auth/authentication');
const orders = require('./orders/orders');
const vendor = require('./auth/vendor');
const deliveryprice =  require ('./orders/deliveryprice');
const admin_orders= require('./admin/orders');
const admin_users = require('./admin/users');
const notitoken = require('./notifications/settoken');
const homepage= require('./application/homepage');
const wallet_transaction =require('./wallet/wallet_transaction');
const transaction_fetch= require('./wallet/transaction_fetch');
const balance= require('./wallet/balance');
const getwhatsnew= require('./whatsnew/getwhatsnew');
const del_partner_admin= require('./admin/del_partner');
const partnerorder= require('./delivery_partner/partnerorder');
const partners_order= require('./delivery_partner/partners_orders');
const partnerorderupdate= require('./delivery_partner/update_order');
const specialUserUpdate = require('./admin/special_users');
const userDemand = require('./orders/demands');
const adminDemands=  require('./admin/alldemands')
const getordermonths =require('./application/invoice/invoice_months');
const invoiceDownload = require('./application/invoice/invoice_download')
const adminCancelOrder = require('./admin/order_cancellation');

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', parameterLimit: 50000, extended: true }));
app.use(express.static('public'));
app.use(authentication);
app.use(orders);
app.use(vendor);
app.use(deliveryprice);
app.use(admin_orders);
app.use(admin_users);
app.use(notitoken);
app.use(homepage);
app.use(wallet_transaction);
app.use(transaction_fetch);
app.use(balance);
app.use(getwhatsnew);
app.use(del_partner_admin);
app.use(partnerorder);
app.use(partners_order);
app.use(partnerorderupdate);
app.use(specialUserUpdate);
app.use(userDemand);
app.use(adminDemands);
app.use(getordermonths);
app.use(invoiceDownload);
app.use(adminCancelOrder);

app.get('/',(req, res)=>{
   res.send('Localport')
});

app.listen(port, () => {
    console.log('server is running');
});
