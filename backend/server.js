require("dotenv").config();
const app = require('./src/index');

const mongoDBConnect = require('./src/config/db');

 mongoDBConnect();
app.listen(3000,()=>{
    console.log("Server has been Started ...");
});