const mongoose  = require("mongoose");


const ledgerSchema = new mongoose.Schema({
    
    account :{ 
            type : mongoose.Schema.Types.ObjectId,
            ref : "account",
            required : [true,"Ledger Must be assocaited With a Acoount"],
            index : true,
            immutable : true
       },
    

    amount: {
        type :Number,
        required : [true,"Amount is required for Creating a Ledger entry"],
        immutable : true
    },

    transaction : {
        type : mongoose.Schema.Types.ObjectId,
        required : [true,"Ledger must be assocaited with a transaction"],
        immutable : true,
        index : true,
        ref : "transaction"
    },

    type:{
        type : String,
        enum : {
            values :["Credit","Debit"],
            message : "Type Can be either Credit Or Debit",
        },
        required:[true,"Ledger type is required"],
        immutable : true
    }

})


function preventLedgerModification(){
    throw new Error("Ledger entries are immutable and cannot be deleted or modified");
}


ledgerSchema.pre('findOneAndUpdate',preventLedgerModification);
ledgerSchema.pre('updateOne',preventLedgerModification);
ledgerSchema.pre('deleteOne',preventLedgerModification);
ledgerSchema.pre('findOneAndDelete', preventLedgerModification);
ledgerSchema.pre('deleteMany',preventLedgerModification);
ledgerSchema.pre('updateMany',preventLedgerModification);
ledgerSchema.pre('findOneAndReplace', preventLedgerModification);


const ledgerModel = mongoose.model("ledger",ledgerSchema);

module.exports = ledgerModel;