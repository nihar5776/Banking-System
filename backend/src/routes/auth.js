const express = require('express');
const authController = require("../contollers/auth.controller");


const router = express.Router();


// Post -> /api/auth/Register
router.post("/register",authController.userRegisterController);
router.post("/login",authController.userLoginContoller);

module.exports = router; 