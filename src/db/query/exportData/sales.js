import {formatTimeState, formatDate, formatMoney, escapeHtml} from "./helpers"

export function generateSalesReport(
    sales,
    options = {}
) {
    const {
        search = "",
        filter = "all",
        sort = "newest",
        timeState = {},
    } = options;


    /*
     * =========================================================
     * SUMMARY
     * =========================================================
     */

    const totalRevenue =
        sales.reduce(
            (sum, sale) =>
                sum +
                Number(
                    sale.total_amount ??
                    sale.total_after_discount ??
                    sale.amount ??
                    0
                ),
            0
        );


    const totalPaid =
        sales.reduce(
            (sum, sale) =>
                sum +
                Number(
                    sale.amount_paid || 0
                ),
            0
        );


    const totalBalance =
        sales.reduce(
            (sum, sale) =>
                sum +
                Number(
                    sale.balance_due || 0
                ),
            0
        );


    const totalDiscount =
        sales.reduce(
            (sum, sale) =>
                sum +
                Number(
                    sale.discount || 0
                ),
            0
        );


    const totalMarkedPrice =
        sales.reduce(
            (sum, sale) =>
                sum +
                Number(
                    sale.marked_price ??
                    sale.amount ??
                    0
                ),
            0
        );


    const creditSales =
        sales.filter(
            sale =>
                sale.is_credit_sale ||
                Number(
                    sale.balance_due || 0
                ) > 0
        ).length;


    /*
     * =========================================================
     * PERIOD
     * =========================================================
     */

    const periodLabel =
        formatTimeState(timeState);


    /*
     * =========================================================
     * SALES ROWS
     * =========================================================
     */

    const rows =
        sales
            .map((sale) => {

                const revenue =
                    Number(
                        sale.total_amount ??
                        sale.total_after_discount ??
                        sale.amount ??
                        0
                    );


                const paid =
                    Number(
                        sale.amount_paid || 0
                    );


                const balance =
                    Number(
                        sale.balance_due || 0
                    );


                const discount =
                    Number(
                        sale.discount || 0
                    );


                const date =
                    sale.created_at ??
                    sale.date ??
                    sale.sale_date;


                return `
                    <tr>

                        <td>
                            ${escapeHtml(
                                formatDate(date)
                            )}
                        </td>


                        <td>
                            ${escapeHtml(
                                sale.customer_name ??
                                sale.customer?.name ??
                                "Walk-in Customer"
                            )}
                        </td>


                        <td class="number">
                            ${formatMoney(
                                sale.marked_price ??
                                sale.amount ??
                                0
                            )}
                        </td>


                        <td class="number">
                            ${formatMoney(
                                discount
                            )}
                        </td>


                        <td class="number">
                            ${formatMoney(
                                revenue
                            )}
                        </td>


                        <td class="number">
                            ${formatMoney(
                                paid
                            )}
                        </td>


                        <td class="number">
                            ${formatMoney(
                                balance
                            )}
                        </td>


                        <td>
                            ${escapeHtml(
                                formatPaymentStatus(
                                    sale
                                )
                            )}
                        </td>

                    </tr>
                `;
            })
            .join("");


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

<title>Sales Report</title>


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

    font-size: 11px;

}

@page {
    size: A4;
    margin: 32px;
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
 * FINANCIAL SUMMARY
 * =========================================================
 */

.financial-summary {

    display: grid;

    grid-template-columns:
        repeat(4, 1fr);

    gap: 10px;

    margin-bottom: 24px;

}


.financial-card {

    border: 1px solid #ddd;

    border-radius: 6px;

    padding: 10px;

}


.financial-label {

    font-size: 10px;

    color: #666;

    margin-bottom: 5px;

}


.financial-value {

    font-size: 14px;

    font-weight: bold;

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

    padding: 8px 6px;

    border-bottom: 1px solid #bbb;

}


td {

    padding: 7px 6px;

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
 * SECTION
 * =========================================================
 */

.section {

    margin-top: 28px;

    margin-bottom: 16px;

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
 * FOOTER
 * =========================================================
 */

.footer {

    margin-top: 28px;

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


    .summary-card,
    .financial-card {

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
            Sales Report
        </div>

    </div>


    <div class="meta">

        <div>
            Generated:
            ${formatDate(new Date(),true)}
        </div>


        <div>
            Period:
            ${escapeHtml(
                periodLabel
            )}
        </div>


        <div>
            Sales:
            ${sales.length.toLocaleString()}
        </div>


        ${
            search
                ? `
                    <div>
                        Search:
                        "${escapeHtml(
                            search
                        )}"
                    </div>
                `
                : ""
        }


        <div>
            Filter:
            ${escapeHtml(
                formatFilter(filter)
            )}
        </div>


        <div>
            Sort:
            ${escapeHtml(
                formatSort(sort)
            )}
        </div>

    </div>

</div>


<!-- =====================================================
     SUMMARY
====================================================== -->

<div class="summary">


    <div class="summary-card">

        <div class="summary-label">
            SALES
        </div>

        <div class="summary-value">
            ${sales.length.toLocaleString()}
        </div>

    </div>


    <div class="summary-card">

        <div class="summary-label">
            REVENUE
        </div>

        <div class="summary-value">
            ${formatMoney(
                totalRevenue
            )}
        </div>

    </div>


    <div class="summary-card">

        <div class="summary-label">
            CASH COLLECTED
        </div>

        <div class="summary-value">
            ${formatMoney(
                totalPaid
            )}
        </div>

    </div>


    <div class="summary-card">

        <div class="summary-label">
            OUTSTANDING
        </div>

        <div class="summary-value">
            ${formatMoney(
                totalBalance
            )}
        </div>

    </div>

</div>


<!-- =====================================================
     FINANCIAL SUMMARY
====================================================== -->

<div class="financial-summary">


    <div class="financial-card">

        <div class="financial-label">
            MARKED VALUE
        </div>

        <div class="financial-value">
            ${formatMoney(
                totalMarkedPrice
            )}
        </div>

    </div>


    <div class="financial-card">

        <div class="financial-label">
            DISCOUNTS
        </div>

        <div class="financial-value">
            ${formatMoney(
                totalDiscount
            )}
        </div>

    </div>


    <div class="financial-card">

        <div class="financial-label">
            CREDIT SALES
        </div>

        <div class="financial-value">
            ${creditSales.toLocaleString()}
        </div>

    </div>


    <div class="financial-card">

        <div class="financial-label">
            PAYMENT RATE
        </div>

        <div class="financial-value">

            ${
                totalRevenue > 0
                    ? (
                        (
                            totalPaid /
                            totalRevenue
                        ) * 100
                    ).toFixed(1)
                    : "0.0"
            }%

        </div>

    </div>

</div>


<!-- =====================================================
     SALES
====================================================== -->

<div class="section">

    <div class="section-title">
        Sales
    </div>


    <table>

        <thead>

            <tr>

                <th>
                    Date
                </th>

                <th>
                    Customer
                </th>


                <th class="number">
                    Marked
                </th>

                <th class="number">
                    Discount
                </th>

                <th class="number">
                    Revenue
                </th>

                <th class="number">
                    Paid
                </th>

                <th class="number">
                    Balance
                </th>

                <th>
                    Status
                </th>

            </tr>

        </thead>


        <tbody>

            ${
                rows ||
                `
                    <tr>

                        <td
                            colspan="10"
                            style="
                                text-align:center;
                                padding:20px;
                            "
                        >
                            No sales found.
                        </td>

                    </tr>
                `
            }

        </tbody>


        <tfoot>

            <tr>

                <td colspan="2">
                    Total
                </td>


                <td class="number">
                    ${formatMoney(
                        totalMarkedPrice
                    )}
                </td>


                <td class="number">
                    ${formatMoney(
                        totalDiscount
                    )}
                </td>


                <td class="number">
                    ${formatMoney(
                        totalRevenue
                    )}
                </td>


                <td class="number">
                    ${formatMoney(
                        totalPaid
                    )}
                </td>


                <td class="number">
                    ${formatMoney(
                        totalBalance
                    )}
                </td>


                <td>
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


function formatFilter(filter) {

    switch (filter) {

        case "credit":
            return "Credit Sales";

        case "paid":
            return "Paid";

        case "unpaid":
            return "Unpaid";

        case "all":
            return "All";

        default:
            return filter || "All";
    }
}


function formatSort(sort) {

    switch (sort) {

        case "newest":
            return "Newest";

        case "oldest":
            return "Oldest";

        case "high_revenue":
            return "Highest Revenue";

        case "high_paid":
            return "Highest Paid";

        case "high_balance":
            return "Highest Balance";

        default:
            return sort || "Default";
    }
}


function formatPaymentStatus(sale) {

    if (
        sale.payment_status
    ) {

        switch (
            sale.payment_status
        ) {

            case "paid":
                return "Paid";

            case "partial":
                return "Partially Paid";

            case "unpaid":
                return "Unpaid";

            default:
                return sale.payment_status;
        }
    }


    const balance =
        Number(
            sale.balance_due || 0
        );


    const paid =
        Number(
            sale.amount_paid || 0
        );


    if (
        balance <= 0 &&
        paid > 0
    ) {
        return "Paid";
    }


    if (
        paid > 0 &&
        balance > 0
    ) {
        return "Partially Paid";
    }


    if (
        balance > 0
    ) {
        return "Unpaid";
    }


    return "-";
}

