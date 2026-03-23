const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken");
const emailService = require("../services/email.service");
const tokenBlackListModel = require("../models/tokenBlackListModel")


const userLoginContoller = async (req,res) =>{
    
   // Assign the Credentials from the User
    const {email,password} = req.body;
    // Getting the User Data From the Db based on the email
     const user = await userModel.findOne({
         email:email
     }).select("+password")
     // Checking Wether there Exists a User Acc With the Given Email
     if(!user){
       return res.status(401).json({
            status :"Failed",
            message : "InValid Email Address"
        })
     }
 // validating the Password using the method of the userModel
   const validPassword =  user.passwordCompare(password);
     if(!validPassword){
         return res.status(401).json({
            status : "Faild",
            message : "Invalid Password "

         })
     }

     if (!user.isVerified) {
        return res.status(403).json({
            message: "Please verify OTP first"
         });
     }

     // If the Password is Valid Generating a jwt token
     const token = jwt.sign({userId:user._id},process.env.Jwt_Secret,{expiresIn : '2h'});
     //Place the token in the cookie
      res.cookie("token",token);
     
     
      res.status(200).json({
        user:{
           _id : user._id,
            email : user.email,
            name : user.name
        },
        token
    })
}



// Post Handeller Function 
const userRegisterController = async (req,res)=>{
   
    const {email , password , name} = req.body;

    const isExists = await userModel.findOne({
        email:email
    })
  // Check Wether already give email is in Use
    if(isExists){
       return res.status(422).json({
            status :"Failed",
            message : "User Already Exits With this Email"
        })
    }

    const otp = userModel.generateOtp();

   // If not simply Just Creates the new User 
    const user = await userModel.create({
        email,password,name,otp,
        otpExpiry: Date.now() + 5 * 60 * 1000
    })

    console.log(otp);
   
//    const token = jwt.sign({userId:user._id},process.env.Jwt_Secret,{expiresIn:'2h'});
//    res.cookie("token",token);

   res.status(201).json({
    user:{
        _id : user._id,
        email : user.email,
        name : user.name
    },
    //token
   })
   
   await emailService.sendRegistrationOtp(user.email,user.name,otp);
} 


async function userLogoutContoller(req,res){
    const token = req.cookies.token || req.headers.authorization?.split(" ")[ 1 ]
     if(!token)
         return res.status(400).json({
         message: "Please Login First"
    })

    //res.cookie("token", "");

    await tokenBlackListModel.create({
        token : token
    })
    res.clearCookie("token")
    res.status(200).json({
      message: "user Logged Out successfuly"  
    },
    otp)
}

async function userOtpVerificationController(req, res) {
    const { email, otp } = req.body;

    try {
        const user = await userModel.findOne({ email }).select("+password +otp +otpExpiry");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (!user.otp || !user.otpExpiry) {
            return res.status(400).json({
                message: "No OTP found. Please request a new one."
            });
        }

        if (user.otpExpiry < Date.now()) {
            return res.status(401).json({
                message: "Oops! OTP is expired"
            });
        }


        if (otp !== user.otp) {
            return res.status(401).json({
                message: "Please enter correct OTP"
            });
        }

        const isVerified = true;
        const name = user.name;
        const password = user.password;

       await userModel.findOneAndDelete({
         email : email
       })

       const newUser = await userModel.create({
        email : email,
        password :password,
        isVerified :true
       })

        await emailService.sendRegistrationEmail(user.email, user.name);

        return res.status(200).json({
            message: "OTP verified successfully. User registered."
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

 async function userresendVerificationOtp(req,res){
      const email = req.body.email;
      const user = await userModel.findOne({
         email : email
      }).select("+otp +otpExpiry")

      if(!user){
         return res.status(404).json({
            status: "Failed",
            message:"User does'nt Exist .Please Register First"
         })
      }

      const otp = userModel.generateOtp();
       user.otp = otp
       user.otpExpiry =  Date.now() + 5 * 60 * 1000
       user.save()
         
      if(!user.otp || !user.otpExpiry){
         return res.status(400).json({
            status : "Failed",
            message : " otp or otp Expiry is Missing int DB"
         })
      }
     await emailService.sendRegistrationOtp(user.email,user.name,user.otp)
     return res.status(200).json({
         status : "Success",
         message : "Opt is successfully resend"
     })
    }

module.exports = {
    userRegisterController,
    userLoginContoller,
    userLogoutContoller,
    userOtpVerificationController,
    userresendVerificationOtp
} 