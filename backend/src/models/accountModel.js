const mongoose = require("mongoose")
const ledgerModel = require("../models/ledger.Model");

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

accountSchema.methods.getBalance = async function (){

    const balanceData = await ledgerModel.aggregate([
        { 
            $match : { account : this._id } 
        },
        {
            $group:{
                _id: null,
                totalDebit:{
                    $sum:{
                        $cond:[
                            { $eq: ["$type","Debit"] },
                            "$amount",
                            0
                        ]
                    }
                },
                totalCredit:{
                    $sum:{
                        $cond:[
                            { $eq: ["$type","Credit"] },
                            "$amount",
                            0
                        ]
                    }
                }
            }
        },
        {
            $project:{
                _id:0,
                balance: { $subtract: ["$totalCredit","$totalDebit"] }
            }
        }
    ])
      
    if(balanceData.length === 0){
         return 0
    }

    return balanceData[0].balance

}

  const AccountModel = mongoose.model("Account",accountSchema);

  module.exports = AccountModel