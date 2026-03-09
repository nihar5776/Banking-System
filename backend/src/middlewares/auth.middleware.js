const userModel = require("../models/userModel")
const jwt = require("jsonwebtoken")

async function authMiddleware(req, res, next) {

    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access, token is missing"
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.Jwt_Secret)

        const user = await userModel.findById(decoded.userId)

        if (!user) {
            return res.status(401).json({
                message: "User no longer exists"
            })
        }

        req.user = user

        next()

    } catch (err) {
        return res.status(401).json({
            message: "Unauthorized access, token is invalid"
        })
    }
}

module.exports = { authMiddleware }