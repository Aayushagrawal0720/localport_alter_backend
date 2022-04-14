const admin = require('firebase-admin');

var serviceAccount = require("./localportcloud-admin.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

function sendNotificationToDevice(token, title, body){
    try{

        var message= {
             notification: {
                title: title,
                body: body
            },
            token: token
        };

        admin.messaging().send(message).then((result)=>{
            return;
        }).catch((error)=>{
            console.log(err)
        });
    }catch(err){
        console.log(err)
        return;
    }
}

function sendNotificationToAdmin(topic, title, body){
    try{
        var message= {
            notification: {
                title:title,
                body:body,
            },
            topic:topic
        };
         admin.messaging().send(message).then((result)=>{
            return;
        }).catch((error)=>{
            console.log(err)
        });
    }catch(err){
        console.log(err)
        return;
    }
}


module.exports = {sendNotificationToDevice :sendNotificationToDevice,sendNotificationToAdmin:sendNotificationToAdmin}
