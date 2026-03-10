const mongoose = require("mongoose")

const transcationSchema = new mongoose.Schema({


    fromAccount:{
        type : mongoose.Schema.Types.ObjectId,
        required :[true,"from Account is Mandatory for Performing the Transcation"],
        ref : "user",
        index:true
    },

    toAccount:{
        type : mongoose.Schema.Types.ObjectId,
        required :[true,"To Account is Mandatory for Performing the Transcation"],
        ref : "user",
        index:true
    },

    status :{
        type : String,
        enum :{
            values : ["Pending","Completed","Failed","Reversed"],
            message : " Status can be either Pending ,Completed,Failed,Reversed",
        },
        default : "Pending"
    },

    amount: {
        type : Number,
        required : [true,"Amount is required for Making a transaction"],
        min : [0,"tranaction Amount Can't Be Negative"]
    },

    idempotencyKey : {
        type : "String",
        required :[true,"Idempotency Key is required for creating a transaction"],
        index : true,
        unique : true
    }
}, {
    timestamps :true
})

const transactionModel = mongoose.model("transaction",transcationSchema);


module.exports = transactionModel;