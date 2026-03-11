const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');


const accountRouter = require("./routes/account.routes");
const authRouter = require("./routes/auth");
const transactionRouter = require("./routes/transcation.routes");
const statementRouter = require("./routes/statement.routes");


app.use(express.json());
app.use(cookieParser());


app.use("/api/auth/",authRouter);
app.use("/api/accounts",accountRouter);
app.use("/api/transactions",transactionRouter);
app.use("/api/statements",statementRouter);


module.exports = app;

