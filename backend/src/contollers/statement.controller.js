const ledgerModel = require("../models/ledger.Model")

async function getAccountStatement(req, res) {
    try {
        const { accountId } = req.params

        const transactions = await ledgerModel
            .find({ account: accountId })
            .populate("transaction")
            .sort({ createdAt: -1 })

        res.status(200).json({
            message: "Account statement fetched successfully",
            data: transactions
        })

    } catch (error) {
        res.status(500).json({
            message: "Error fetching account statement",
            error: error.message
        })
    }
}
module.exports = {
    getAccountStatement
}