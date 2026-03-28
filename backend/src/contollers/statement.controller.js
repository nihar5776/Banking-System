const ledgerModel = require("../models/ledger.Model")
const ExcelJS = require("exceljs")

async function getAccountStatement(req, res) {
    try {
        const { accountId } = req.params

        const transactions = await ledgerModel
            .find({ account: accountId })
            .populate("transaction")
            .sort({ createdAt: -1 })

        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet("Statement")

        // Columns like real bank statement
        worksheet.columns = [
            { header: "Date", key: "date", width: 25 },
            { header: "Transaction ID", key: "txnId", width: 30 },
            { header: "From", key: "from", width: 30 },
            { header: "To", key: "to", width: 30 },
            { header: "Debit", key: "debit", width: 15 },
            { header: "Credit", key: "credit", width: 15 },
            { header: "Status", key: "status", width: 15 }
        ]

        transactions.forEach(txn => {
            const t = txn.transaction

            let debit = ""
            let credit = ""

            if (t?.fromAccount.toString() === accountId) {
                debit = t.amount
            } else if (t?.toAccount.toString() === accountId) {
                credit = t.amount
            }

            worksheet.addRow({
                date: new Date(t.createdAt).toLocaleString(),
                txnId: t._id.toString(),
                from: t.fromAccount,
                to: t.toAccount,
                debit,
                credit,
                status: t.status
            })
        })

        // Style header
        worksheet.getRow(1).font = { bold: true }

        // Response headers
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=account_statement.xlsx"
        )

        await workbook.xlsx.write(res)
        res.end()

    } catch (error) {
        res.status(500).json({
            message: "Error generating Excel",
            error: error.message
        })
    }
}

module.exports = { getAccountStatement }