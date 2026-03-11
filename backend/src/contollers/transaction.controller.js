const transactionModel = require("../models/transaction.model")
const ledgerModel = require("../models/ledger.Model")
const accountModel = require("../models/accountModel")
const emailService = require("../services/email.service")
const userModel =require("../models/userModel")
const uuidService = require("../services/uuid.service");
const mongoose = require("mongoose")


/**
 * - Create a new transaction
 * THE 10-STEP TRANSFER FLOW:
     * 1. Validate request
     * 2. Validate idempotency key
     * 3. Check account status
     * 4. Derive sender balance from ledger
     * 5. Create transaction (Pending)
     * 6. Create Debit ledger entry
     * 7. Create Credit ledger entry
     * 8. Mark transaction Completed
     * 9. Commit MongoDB session
     * 10. Send email notification
 */

async function createTransaction(req, res) {

    /**
     * 1. Validate request
     */
    const { fromAccount, toAccount, amount} = req.body
    const idempotencyKey  = uuidService.uniqueIdGeneration()

    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "FromAccount, toAccount, amount and idempotencyKey are required"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        _id: fromAccount,
    })

    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    })

    if (!fromUserAccount || !toUserAccount) {
        return res.status(400).json({
            message: "Invalid fromAccount or toAccount"
        })
    }

    /**
     * 2. Validate idempotency key
     */

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
            message: "Both fromAccount and toAccount must be Active to process transaction"
        })
    }

    /**
     * 4. Derive sender balance from ledger
     */
    const balance = await fromUserAccount.getBalance()

    if (balance < amount) {

        await emailService.sendTransactionFailureEmail(req.user.email, req.user.name, amount, toAccount)

        return res.status(400).json({
            message: `Insufficient balance. Current balance is ${balance}. Requested amount is ${amount}`
        })
    }

    let transaction;
    try {


        /**
         * 5. Create transaction (Pending)
         */
        const session = await mongoose.startSession()
        session.startTransaction()

        transaction = (await transactionModel.create([ {
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status: "Pending"
        } ], { session }))[ 0 ]

        const debitLedgerEntry = await ledgerModel.create([ {
            account: fromAccount,
            amount: amount,
            transaction: transaction._id,
            type: "Debit"
        } ], { session })

        await (() => {
            return new Promise((resolve) => setTimeout(resolve, 15 * 1000));
        })()

        const creditLedgerEntry = await ledgerModel.create([ {
            account: toAccount,
            amount: amount,
            transaction: transaction._id,
            type: "Credit"
        } ], { session })

        await transactionModel.findOneAndUpdate(
            { _id: transaction._id },
            { status: "Completed" },
            { session }
        )


        await session.commitTransaction()
        session.endSession()
    } catch (error) {
        
           await emailService.sendTransactionFailureEmail(req.user.email, req.user.name, amount, toAccount)
           
        return res.status(400).json({
            message: "Transaction is Pending due to some issue, please retry after sometime",
        })

    }
    /**
     * 10. Send email notification
     */
    await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount)

    
        const receiverAccount = await accountModel.findById(toAccount)
        const receiver = await userModel.findById(receiverAccount.user)

    await emailService. receiverTransactionEmail(receiver.email, receiver.name, amount, req.user._id)

    //console.log(receiver.email + " " + receiver.name + " " + amount + " " + req.user._id)

    return res.status(201).json({
        message: "Transaction completed successfully",
        transaction: transaction
    })

}

async function createInitialFundsTransaction(req, res) {
    const { toAccount, amount} = req.body

    const idempotencyKey  = uuidService.uniqueIdGeneration()

    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "toAccount, amount and idempotencyKey are required"
        })
    }

    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    })

    if (!toUserAccount) {
        return res.status(400).json({
            message: "Invalid toAccount"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        user: req.user._id
    })

    if (!fromUserAccount) {
        return res.status(400).json({
            message: "System user account not found"
        })
    }


    const session = await mongoose.startSession()
    session.startTransaction()

    const transaction = new transactionModel({
        fromAccount: fromUserAccount._id,
        toAccount,
        amount,
        idempotencyKey,
        status: "Pending"
    })

    const debitLedgerEntry = await ledgerModel.create([ {
        account: fromUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "Debit"
    } ], { session })

    const creditLedgerEntry = await ledgerModel.create([ {
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "Credit"
    } ], { session })

    transaction.status = "Completed"
    await transaction.save({ session })


       await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount)

const receiverAccount = await accountModel.findById(toAccount)
const receiver = await userModel.findById(receiverAccount.user)
   //console.log(receiver._id + " " + receiverAccount._id + " "+ req.body.toAccount)
     await emailService. receiverTransactionEmail(receiver.email, receiver.name, amount, req.user._id)

//console.log(receiver.email + " " + receiver.name + " " + amount + " " + req.user._id)

    await session.commitTransaction()
    session.endSession()

    return res.status(201).json({
        message: "Initial funds transaction completed successfully",
        transaction: transaction,
        data:{
          fromAccount : fromUserAccount
        }

    })
}

module.exports = {
    createTransaction,
    createInitialFundsTransaction
}
