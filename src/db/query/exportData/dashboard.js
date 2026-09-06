import {formatMoney,formatTimeState, escapeHtml } from "./helpers"

export function generateDashboardReport(
    data,
    options = {}
) {
    const {
        timeState = {}
    } = options;

    const {
        summary = {},
        expensesBreakdown = [],
        paymentsBreakdown = [],
        cashFlow = [],
    } = data || {};

    const {
        revenue = 0,
        discounts = 0,
        cashCollected = 0,
        outstandingCredit = 0,
        availableCash = 0,
        cost = 0,
        expenses = 0,
        grossProfit = 0,
        netProfit = 0,
    } = summary;


    /*
     * =========================================================
     * PERIOD
     * =========================================================
     */

    const periodLabel =
        formatTimeState(timeState);


    /*
     * =========================================================
     * EXPENSE BREAKDOWN
     * =========================================================
     */

    const totalExpenses =
        expensesBreakdown.reduce(
            (sum, item) =>
                sum + Number(
                    item.value || 0
                ),
            0
        );

    const expenseRows =
        expensesBreakdown
            .map((item) => {

                const amount =
                    Number(
                        item.value || 0
                    );

                const percentage =
                    totalExpenses > 0
                        ? (
                            amount /
                            totalExpenses
                        ) * 100
                        : 0;

                return `
                    <tr>

                        <td>
                            ${escapeHtml(
                                item.name || "-"
                            )}
                        </td>

                        <td class="number">
                            ${formatMoney(
                                amount
                            )}
                        </td>

                        <td class="number">
                            ${percentage.toFixed(1)}%
                        </td>

                    </tr>
                `;
            })
            .join("");


    /*
     * =========================================================
     * PAYMENT METHODS
     * =========================================================
     */

    const totalPayments =
        paymentsBreakdown.reduce(
            (sum, item) =>
                sum + Number(
                    item.value || 0
                ),
            0
        );

    const paymentRows =
        paymentsBreakdown
            .map((item) => {

                const amount =
                    Number(
                        item.value || 0
                    );

                const percentage =
                    totalPayments > 0
                        ? (
                            amount /
                            totalPayments
                        ) * 100
                        : 0;

                return `
                    <tr>

                        <td>
                            ${escapeHtml(
                                item.name || "-"
                            )}
                        </td>

                        <td class="number">
                            ${formatMoney(
                                amount
                            )}
                        </td>

                        <td class="number">
                            ${percentage.toFixed(1)}%
                        </td>

                    </tr>
                `;
            })
            .join("");


    /*
     * =========================================================
     * CASH FLOW
     * =========================================================
     */

    const cashFlowTotal =
        cashFlow.reduce(
            (sum, item) =>
                sum + Number(
                    item.amount || 0
                ),
            0
        );


    /*
     * =========================================================
     * REPORT
     * =========================================================
     */

    return `
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8" />

<title>Dashboard Report</title>


<style>

* {
    box-sizing: border-box;
}


body {

    font-family:
        Arial,
        Helvetica,
        sans-serif;

    margin: 0;

    padding: 32px;

    color: #222;

    font-size: 12px;

}


/*
 * =========================================================
 * HEADER
 * =========================================================
 */

.header {

    display: flex;

    justify-content: space-between;

    align-items: flex-start;

    margin-bottom: 24px;

    border-bottom: 2px solid #222;

    padding-bottom: 16px;

}


.brand {

    font-size: 24px;

    font-weight: bold;

}


.title {

    font-size: 20px;

    font-weight: 600;

    margin-top: 4px;

}


.meta {

    text-align: right;

    color: #666;

    line-height: 1.6;

}


/*
 * =========================================================
 * SUMMARY
 * =========================================================
 */

.summary {

    display: grid;

    grid-template-columns:
        repeat(4, 1fr);

    gap: 10px;

    margin-bottom: 24px;

}


.summary-card {

    border: 1px solid #ddd;

    border-radius: 6px;

    padding: 12px;

}


.summary-label {

    font-size: 10px;

    color: #666;

    margin-bottom: 6px;

}


.summary-value {

    font-size: 16px;

    font-weight: bold;

}


/*
 * =========================================================
 * SECTIONS
 * =========================================================
 */

.section {

    margin-top: 28px;

    margin-bottom: 20px;

}


.section-title {

    font-size: 15px;

    font-weight: bold;

    margin-bottom: 10px;

    padding-bottom: 7px;

    border-bottom: 1px solid #ddd;

}


/*
 * =========================================================
 * TABLE
 * =========================================================
 */

table {

    width: 100%;

    border-collapse: collapse;

}


thead {

    display: table-header-group;

}


th {

    background: #f3f3f3;

    font-weight: bold;

    text-align: left;

    padding: 9px 7px;

    border-bottom: 1px solid #bbb;

}


td {

    padding: 8px 7px;

    border-bottom: 1px solid #eee;

}


.number {

    text-align: right;

}


tfoot td {

    font-weight: bold;

    border-top: 2px solid #222;

    border-bottom: none;

    padding-top: 12px;

}


/*
 * =========================================================
 * FINANCIAL SUMMARY
 * =========================================================
 */

.financial-summary {

    border: 1px solid #ddd;

    border-radius: 6px;

    padding: 14px;

}


.financial-row {

    display: flex;

    justify-content: space-between;

    padding: 6px 0;

}


.financial-row.total {

    border-top: 1px solid #ddd;

    margin-top: 6px;

    padding-top: 10px;

    font-weight: bold;

    font-size: 14px;

}


/*
 * =========================================================
 * FOOTER
 * =========================================================
 */

.footer {

    margin-top: 32px;

    padding-top: 10px;

    border-top: 1px solid #ddd;

    color: #777;

    font-size: 10px;

    text-align: center;

}


/*
 * =========================================================
 * PRINT
 * =========================================================
 */

@media print {

    body {

        padding: 0;

    }


    .summary-card {

        break-inside: avoid;

    }


    .section {

        break-inside: avoid;

    }


    tr {

        break-inside: avoid;

    }

}

</style>

</head>


<body>


<!-- =====================================================
     HEADER
====================================================== -->

<div class="header">

    <div>

        <div class="brand">
            ZeniaBiz
        </div>

        <div class="title">
            Dashboard Report
        </div>

    </div>


    <div class="meta">

        <div>
            Generated:
            ${new Date().toLocaleString()}
        </div>

        <div>
            Period:
            ${escapeHtml(periodLabel)}
        </div>

    </div>

</div>


<!-- =====================================================
     SUMMARY CARDS
====================================================== -->

<div class="summary">


    <div class="summary-card">

        <div class="summary-label">
            REVENUE
        </div>

        <div class="summary-value">
            ${formatMoney(revenue)}
        </div>

    </div>


    <div class="summary-card">

        <div class="summary-label">
            CASH COLLECTED
        </div>

        <div class="summary-value">
            ${formatMoney(cashCollected)}
        </div>

    </div>


    <div class="summary-card">

        <div class="summary-label">
            EXPENSES
        </div>

        <div class="summary-value">
            ${formatMoney(expenses)}
        </div>

    </div>


    <div class="summary-card">

        <div class="summary-label">
            NET PROFIT
        </div>

        <div class="summary-value">
            ${formatMoney(netProfit)}
        </div>

    </div>


</div>


<!-- =====================================================
     FINANCIAL SUMMARY
====================================================== -->

<div class="section">

    <div class="section-title">
        Financial Summary
    </div>


    <div class="financial-summary">


        <div class="financial-row">

            <span>
                Revenue
            </span>

            <span>
                ${formatMoney(revenue)}
            </span>

        </div>


        <div class="financial-row">

            <span>
                Discounts
            </span>

            <span>
                ${formatMoney(discounts)}
            </span>

        </div>


        <div class="financial-row">

            <span>
                Cost of Goods
            </span>

            <span>
                ${formatMoney(cost)}
            </span>

        </div>


        <div class="financial-row">

            <span>
                Gross Profit
            </span>

            <span>
                ${formatMoney(grossProfit)}
            </span>

        </div>


        <div class="financial-row">

            <span>
                Expenses
            </span>

            <span>
                ${formatMoney(expenses)}
            </span>

        </div>


        <div class="financial-row total">

            <span>
                Net Profit
            </span>

            <span>
                ${formatMoney(netProfit)}
            </span>

        </div>


    </div>

</div>


<!-- =====================================================
     CASH POSITION
====================================================== -->

<div class="section">

    <div class="section-title">
        Cash Position
    </div>


    <table>

        <tbody>

            <tr>

                <td>
                    Cash Collected
                </td>

                <td class="number">
                    ${formatMoney(
                        cashCollected
                    )}
                </td>

            </tr>


            <tr>

                <td>
                    Outstanding Credit
                </td>

                <td class="number">
                    ${formatMoney(
                        outstandingCredit
                    )}
                </td>

            </tr>


            <tr>

                <td>
                    Available Cash
                </td>

                <td class="number">
                    ${formatMoney(
                        availableCash
                    )}
                </td>

            </tr>

        </tbody>

    </table>

</div>


<!-- =====================================================
     EXPENSE BREAKDOWN
====================================================== -->

<div class="section">

    <div class="section-title">
        Expense Breakdown
    </div>


    <table>

        <thead>

            <tr>

                <th>
                    Category
                </th>

                <th class="number">
                    Amount
                </th>

                <th class="number">
                    Percentage
                </th>

            </tr>

        </thead>


        <tbody>

            ${
                expenseRows ||
                `
                    <tr>

                        <td
                            colspan="3"
                            style="text-align:center"
                        >
                            No expenses recorded.
                        </td>

                    </tr>
                `
            }

        </tbody>


        <tfoot>

            <tr>

                <td>
                    Total
                </td>

                <td class="number">
                    ${formatMoney(
                        totalExpenses
                    )}
                </td>

                <td class="number">
                    ${
                        totalExpenses > 0
                            ? "100.0%"
                            : "0.0%"
                    }
                </td>

            </tr>

        </tfoot>

    </table>

</div>


<!-- =====================================================
     PAYMENT METHODS
====================================================== -->

<div class="section">

    <div class="section-title">
        Payment Methods
    </div>


    <table>

        <thead>

            <tr>

                <th>
                    Payment Method
                </th>

                <th class="number">
                    Amount
                </th>

                <th class="number">
                    Percentage
                </th>

            </tr>

        </thead>


        <tbody>

            ${
                paymentRows ||
                `
                    <tr>

                        <td
                            colspan="3"
                            style="text-align:center"
                        >
                            No payments recorded.
                        </td>

                    </tr>
                `
            }

        </tbody>


        <tfoot>

            <tr>

                <td>
                    Total
                </td>

                <td class="number">
                    ${formatMoney(
                        totalPayments
                    )}
                </td>

                <td class="number">
                    ${
                        totalPayments > 0
                            ? "100.0%"
                            : "0.0%"
                    }
                </td>

            </tr>

        </tfoot>

    </table>

</div>


<!-- =====================================================
    FOOTER
====================================================== -->

<div class="footer">

    Generated by ZeniaBiz

</div>


</body>

</html>
`;
}



