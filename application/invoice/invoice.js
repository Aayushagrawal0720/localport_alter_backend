const easyInvoice = require('easyinvoice')
const fs = require('fs');
const pool = require('../../databaseconf/psqlconf');


async function getInvoiceUrl(data, cb){
    try{
        var client = data.client;
        var products =  data.products;
        getInvoiceNumber((err, invoiceNumber)=>{
            if(err){
                cb(err)
                return;
            }else{
                var date = new Date();
                var invoiceDate = `${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()}`;
                var invoiceData ={
                // Customize enables you to provide your own templates
                // Please review the documentation for instructions and examples
                "customize": {
                    //  "template": fs.readFileSync('template.html', 'base64') // Must be base64 encoded html
                },
                "images": {
                    // The logo on top of your invoice
                    "logo": 'https://firebasestorage.googleapis.com/v0/b/localportcloud.appspot.com/o/logo%2Flauncher_icon1.png?alt=media&token=403c2bc8-9146-4d77-94d2-dcb9d32e6b1b',
                    // The invoice background
                    //"background": "https://public.easyinvoice.cloud/img/watermark-draft.jpg"
                },
                // Your own data
                "sender": {
                    "company": "LocalPort",
                    "address": "H. No. 1920, Shanti nagar, near damoh naka",
                    "zip": "482001",
                    "city": "Jabalpur",
                    "country": "India"
                    //"custom1": "custom value 1",
                    //"custom2": "custom value 2",
                    //"custom3": "custom value 3"
                },
                // Your recipient
                "client": {
                    "company": client.name,
                    "address": "Jabalpur",
                    "zip": "482001",
                    "city": "Jabalpur",
                    "country": "India"
                    // "custom1": "custom value 1",
                    // "custom2": "custom value 2",
                    // "custom3": "custom value 3"
                },
                "information": {
                    // Invoice number
                    "number": invoiceNumber,
                    // Invoice data
                    "date": invoiceDate,
                    // Invoice due date
                    //"due-date": "31-12-2021"
                },
                // The products you would like to see on your invoice
                // Total values are being calculated automatically
                "products": products,
                // The message you would like to display on the bottom of your invoice
                "bottom-notice": "sample statement",
                // Settings to customize your invoice
                "settings": {
                    "currency": "INR", // See documentation 'Locales and Currency' for more info. Leave empty for no currency.
                    // "locale": "nl-NL", // Defaults to en-US, used for number formatting (See documentation 'Locales and Currency')
                    "tax-notation": "GST", // Defaults to 'vat'
                    // "margin-top": 25, // Defaults to '25'
                    // "margin-right": 25, // Defaults to '25'
                    // "margin-left": 25, // Defaults to '25'
                    // "margin-bottom": 25, // Defaults to '25'
                    // "format": "A4" // Defaults to A4, options: A3, A4, A5, Legal, Letter, Tabloid
                },
                // Translate your invoice to your preferred language
                "translate": {
                    // "invoice": "FACTUUR",  // Default to 'INVOICE'
                    // "number": "Nummer", // Defaults to 'Number'
                    // "date": "Datum", // Default to 'Date'
                    // "due-date": "Verloopdatum", // Defaults to 'Due Date'
                    // "subtotal": "Subtotaal", // Defaults to 'Subtotal'
                    // "products": "Producten", // Defaults to 'Products'
                    // "quantity": "Aantal", // Default to 'Quantity'
                    // "price": "Prijs", // Defaults to 'Price'
                    // "product-total": "Totaal", // Defaults to 'Total'
                    // "total": "Totaal" // Defaults to 'Total'
                },
            };

        var pdfData;
        easyInvoice.createInvoice(invoiceData, function (result) {
         pdfData =result.pdf.toString();
            createPdf(pdfData, invoiceNumber, client.uid, (err, iv_number)=>{
                if(err){
                    cb(err);
                    return;
                }else{
                    cb(undefined, iv_number)
                    return;
                }
            });
        }).catch((exception)=>{
            console.log(exception)
            console.log('-----')
        });

            }
        })



    }catch(err){
        console.log('ctach 2')
        console.log(err)
    }

}

function createPdf(data,invoiceNumber, uid, cb){
    try{
        if(data){
            fs.writeFileSync(`public/invoice/${invoiceNumber}.pdf`, data, {encoding: 'base64'});
            updateInvoiceNumberToDb(invoiceNumber, uid);
            cb(undefined, invoiceNumber);
            return;
        }
    }catch(err){
        console.log('ctach 2')
        console.log(err)
    }
}

async function getLogo(){
    var logo = await fs.readFileSync('logo.png', {encoding: 'base64'})
    return logo;
}

function getInvoiceNumber(cb){
    var query =`SELECT number FROM invoice ORDER BY index DESC LIMIT 1;`;
    pool.query(query).then((result)=>{
        if(result.rowCount>0){
            var number = result.rows[0].number;
            var finalNumber = number.split('.')[1];
            finalNumber = parseInt(finalNumber) +1;
            var year = new Date().getFullYear()
            var invoiceNumber = year.toString() + `.${finalNumber}`
            cb(undefined, invoiceNumber)
            return;

        }else{
            var year = new Date().getFullYear()
            var invoiceNumber = year.toString() + '.1'
            cb(undefined, invoiceNumber)
            return;
        }
    }).catch((exception)=>{
        console.log('----getInvoiceNumber----- invice.js----')
        console.log(exception);
        cb(exception);
        return;
    })
}

function updateInvoiceNumberToDb(invoiceNumber, uid){
    var query =`INSERT INTO invoice (number, id) VALUES ('${invoiceNumber}','${uid}');`;
    pool.query(query).then((result)=>{
    }).catch((exception)=>{
        console.log('----updateInvoiceNumberToDb----- invice.js----')
        console.log(exception);
        return;
    })
}



module.exports= {getInvoiceUrl:getInvoiceUrl}
