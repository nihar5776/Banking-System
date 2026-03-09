const mongoose = require("mongoose")

const accountSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref : "user",
        required : [true,"Account must be associated with a User"],
        index : true,
    },
    status: {
     type: String,
    enum: {
      values: ["Active", "Frozen", "Closed"],
     message: "Status can be either Active, Frozen or Closed",
    },
    default: "Active"
    },
    currency :{
        type :"String",
        required : [true,"Currency is required for Creating an Account"],
        default : "INR"
    },
  },
        {
            timestamps:true
  })

  accountSchema.index({user:1,status: 1})

  const AccountModel = mongoose.model("Account",accountSchema);

  module.exports = AccountModel