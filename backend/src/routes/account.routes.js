const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware")
const  accountController = require("../contollers/account.controller")

const router = express.Router();

router.post("/", authMiddleware.authMiddleware,accountController.createAccountController)

router.post("/system/initial-funds",authMiddleware.authSystemUserMiddleware,)


module.exports = router;