require("dotenv").config();
const app = require('./src/index');

const mongoDBConnect = require('./src/config/db');

// console.log("--- Environment Variable Check ---");
// console.log("CLIENT_ID Loaded:", process.env.CLIENT_ID);
// console.log("CLIENT_SECRET Loaded:", process.env.CLIENT_SECRET);
// console.log("EMAIL_USER:", process.env.EMAIL_USER);
// console.log("----------------------------------");



mongoDBConnect();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server has been Started on port ${PORT}...`);
});
