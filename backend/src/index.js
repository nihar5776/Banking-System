const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');


const accountRouter = require("./routes/account.routes");
const authRouter = require("./routes/auth");
const transactionRouter = require("./routes/transcation.routes");



app.use(express.json());
app.use(cookieParser());


app.use("/api/auth/",authRouter);
app.use("/api/accounts",accountRouter);
app.use("/api/transactions",transactionRouter);


module.exports = app;

