const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken");
const emailService = require("../services/email.service");


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
   // If not simply Just Creates the new User 
    const user = await userModel.create({
        email,password,name 
    })
   
   const token = jwt.sign({userId:user._id},process.env.Jwt_Secret,{expiresIn:'2h'});
   res.cookie("token",token);

   res.status(201).json({
    user:{
        _id : user._id,
        email : user.email,
        name : user.name
    },
    token
   })
   
   await emailService.sendRegistrationEmail(user.email,user.name);
} 


module.exports = {
    userRegisterController,
    userLoginContoller
} 