const express = require('express');


const authMiddleware = require("../middlewares/auth.middleware");
const statementController = require("../contollers/statement.controller");

const router = express.Router()

router.get("/:accountId",statementController.getAccountStatement)
router.get("/history/:accountId", statementController.getAccountTransactions)
module.exports = router;