const express = require('express');


const authMiddleware = require("../middlewares/auth.middleware");
const statementController = require("../contollers/statement.controller");

const router = express.Router()

router.get("/:accountId",authMiddleware.authMiddleware,statementController.getAccountStatement)
module.exports = router;