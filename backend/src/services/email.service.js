const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
    },
});

// Verify the connection configuration
transporter.verify((error, success) => {
    if (error) {
        console.error('Error connecting to email server:', error);
    } else {
        console.log('Email server is ready to send messages');
    }
});


// Function to send email
const sendEmail = async (to, subject, text, html) => {
    try {
        const info = await transporter.sendMail({
            from: `"Backend Ledger" <${process.env.EMAIL_USER}>`, // sender address
            to, // list of receivers
            subject, // Subject line
            text, // plain text body
            html, // html body
        });

        console.log('Message sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    } catch (error) {
        console.error('Error sending email:', error);
    }
};


async function sendRegistrationEmail(userEmail, name) {
    const subject = 'Welcome to Backend Ledger!';
    const text = `Hello ${name},\n\nThank you for registering at Backend Ledger. We're excited to have you on board!\n\nBest regards,\nThe Backend Ledger Team`;
    const html = `<p>Hello ${name},</p><p>Thank you for registering at Backend Ledger. We're excited to have you on board!</p><p>Best regards,<br>The Backend Ledger Team</p>`;

    await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionEmail(userEmail, name, amount, toAccount) {
    const subject = 'Transaction Successful!';
    const text = `Hello ${name},\n\nYour transaction of $${amount} to account ${toAccount} was successful.\n\nBest regards,\nThe Backend Ledger Team`;
    const html = `<p>Hello ${name},</p><p>Your transaction of $${amount} to account ${toAccount} was successful.</p><p>Best regards,<br>The Backend Ledger Team</p>`;

    await sendEmail(userEmail, subject, text, html);
}

async function receiverTransactionEmail(userEmail, name, amount, toAccount) {
    const subject = 'Transaction Successful!';
    const text = `Hello ${name},\n\nYour Account has been Credited of $ ${amount} from account ${toAccount} was successful.\n\nBest regards,\nThe Backend Ledger Team`;
    const html = `<p>Hello ${name},</p><p>Your Account has been Credited of$${amount} from account ${toAccount} was successful.</p><p>Best regards,<br>The Backend Ledger Team</p>`;

    await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionFailureEmail(userEmail, name, amount, toAccount) {
    const subject = 'Transaction Failed';
    const text = `Hello ${name},\n\nWe regret to inform you that your transaction of $${amount} to account ${toAccount} has failed. Please try again later.\n\nBest regards,\nThe Backend Ledger Team`;
    const html = `<p>Hello ${name},</p><p>We regret to inform you that your transaction of $${amount} to account ${toAccount} has failed. Please try again later.</p><p>Best regards,<br>The Backend Ledger Team</p>`;

    await sendEmail(userEmail, subject, text, html);
}

async function sendRegistrationOtp(userEmail, name, otp) {
    const subject = 'Registration OTP';
    const text = `Hello ${name},Your OTP for registration verification is ${otp}.This OTP is valid for 5 minutes.If you did not request this, please ignore this email.Best regards,The Backend Team`;
    const html = `<p>Hello ${name},</p><p>Your OTP for registration verification is:</p><h2>${otp}</h2><p>This OTP is valid for <b>5 minutes</b>.</p><p>If you did not request this, please ignore this email.</p><br/><p>Best regards,<br>The Backend Team</p>`;
    await sendEmail(userEmail, subject, text, html);
    console.log(userEmail)
}

async function sendResetPasswordOtp(userEmail, name, otp) {
    const subject = 'Password Reset OTP';
    const text = `Hello ${name}, Your OTP for resetting your password is ${otp}. This OTP is valid for 5 minutes. If you did not request a password reset, please ignore this email. Best regards, The Backend Team`;
    const html = `
        <p>Hello ${name},</p>
        <p>Your OTP for password reset is:</p>
        <h2>${otp}</h2>
        <p>This OTP is valid for <b>5 minutes</b>.</p>
        <p>If you did not request a password reset, please ignore this email.</p>
        <br/>
        <p>Best regards,<br>The Backend Team</p>
    `;
    await sendEmail(userEmail, subject, text, html);
    console.log(userEmail);
}

async function sendPasswordChangedEmail(userEmail, name) {
    const subject = "Password Changed Successfully";

    const text = `Hello ${name}, Your password has been successfully changed. If you did not perform this action, please contact support immediately. Best regards, The Backend Team`;

    const html = `
        <p>Hello ${name},</p>
        <p>Your password has been <b>successfully changed</b>.</p>
        <p>If you did not perform this action, please contact support immediately.</p>
        <br/>
        <p>Best regards,<br>The Backend Team</p>
    `;

    await sendEmail(userEmail, subject, text, html);

    console.log("Password change email sent to:", userEmail);
}
module.exports = {
    sendRegistrationEmail,
    sendTransactionEmail,
    sendTransactionFailureEmail,
    receiverTransactionEmail,
    sendRegistrationOtp,
    sendResetPasswordOtp,
    sendPasswordChangedEmail

};