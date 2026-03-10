const transcationModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.Model");
const accountModel = require("../models/accountModel");
const mongoose = require("mongoose")
const emailService = require("../services/email.service")

//Validate Request
async function createTransaction(req,res) {
    
const {fromAccount,toAccount,amount,idempotencyKey} = req.body

    if(!fromAccount || !toAccount || !amount || !idempotencyKey)
        return res.status(400).json({
           message : " from Account,To Account, Amount,idempotency Key are Missing "
    })

    const fromUserAccount = await accountModel.findOne({
        _id:fromAccount,
    })

    const toUserAccount = await accountModel.findOne({
        _id:toAccount,
    })
  

    if(!fromUserAccount || !toUserAccount){
        res.status(400).json({
            message : "From Account or To Account Is Invalid"
        })
    }


    // Validate idempotency Key

    const isTransactionAlreadyExists = await transactionModel.findOne({
        idempotencyKey: idempotencyKey
    })

    if (isTransactionAlreadyExists) {
        if (isTransactionAlreadyExists.status === "Completed") {
            return res.status(200).json({
                message: "Transaction already processed",
                transaction: isTransactionAlreadyExists
            })

        }
        if (isTransactionAlreadyExists.status === "Pending") {
            return res.status(200).json({
                message: "Transaction is still processing",
            })
        }

        if (isTransactionAlreadyExists.status === "Failed") {
            return res.status(500).json({
                message: "Transaction processing failed, please retry"
            })
        }

        if (isTransactionAlreadyExists.status === "Reversed") {
            return res.status(500).json({
                message: "Transaction was reversed, please retry"
            })
        }
    }

    /**
     * 3. Check account status
     */

    if (fromUserAccount.status !== "Active" || toUserAccount.status !== "Active") {
        return res.status(400).json({
            message: "Both fromAccount and toAccount must be ACTIVE to process transaction"
        })
    }


    // Get Balance
      const balance = fromUserAccount.getBalance()

        if (balance < amount) {
            return res.status(400).json({
                message: `Insufficient balance. Current balance is ${balance}. Requested amount is ${amount}`
            })
        }
    
   let transaction;
    // Create transaction
 try {

    const session = await mongoose.startSession()

    session.startSession()

    const transaction = await transactionModel.create({
        fromAccount,
        toAccount,
        amount,
        idempotencyKey,
        status: "Pending"
    },{session})
    
   const debitLedgerEntry = await ledgerModel.create({
        account : fromAccount,
        amount : amount,
        transaction : transaction._id,
        type: "Debit"
    },{session})

    const creditLedgerEntry = await ledgerModel.create({
        account : toAccount,
        amount : amount,
        transaction : transaction._id,
        type: "Credit"
    },{session})

    transaction.status = "Completed"
    await transaction.save({session})

    session.endSession()

     await emailService.sendTransactionEmail(req.user.email,req.user.name,amount,toAccount);

   return res.status(201).json({
    message : "Transaction has been completed Successfully",
    transaction :transaction
   })

}

  catch(err){
 
  }

}

module.exports = {
     createTransaction,
}







