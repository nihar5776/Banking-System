const express = require('express');
const authController = require("../contollers/auth.controller");


const router = express.Router();


// Post -> /api/auth/Register
router.post("/register",authController.userRegisterController);
router.post("/verify",authController.userOtpVerificationController);
router.post("/login",authController.userLoginContoller);
router.post("/logout",authController.userLogoutContoller);
router.post("/resend",authController.userresendVerificationOtp);
router.post("/resetotp",authController.userPasswordResetOtpGeneration);
router.post("/resetpass",authController.passwordOtpVerification);

module.exports = router; 