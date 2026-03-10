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

async function authSystemUserMiddleware(req,res,next){
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access, token is missing"
        })
    }
    
    try{

        const decoded = jwt.verify(token, process.env.Jwt_Secret)

        const user = await userModel.findById(decoded.userId).select("+systemUser")
        if (!user.sytemUser) {
            return res.status(403).json({
                message: "not a System User"
            })
        }
        req.user = user

        return next()

    }
    catch(err){
        res.status(401).json({
            message : "Unauthorized Access,token is Invalid"
        })
    }

}

module.exports = { authMiddleware,authSystemUserMiddleware }