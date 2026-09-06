
import {
    formatMoney,
    formatFilter,
    formatSort,
    escapeHtml,
    formatTimeState
} from "./helpers";


export function generateCustomersReport(
    customers,
    options = {}
) {
    const {
        search = "",
        filter = "all",
        sort = "name_asc",
        timeState = {},
    } = options;


    const totalRevenue =
        customers.reduce(
            (sum, customer) =>
                sum +
                Number(
                    customer.total_revenue || 0
                ),
            0
        );


    const totalPaid =
        customers.reduce(
            (sum, customer) =>
                sum +
                Number(
                    customer.total_paid || 0
                ),
            0
        );


    const totalBalance =
        customers.reduce(
            (sum, customer) =>
                sum +
                Number(
                    customer.balance_due || 0
                ),
            0
        );


    const totalDiscount =
        customers.reduce(
            (sum, customer) =>
                sum +
                Number(
                    customer.total_discount || 0
                ),
            0
        );


    const rows = customers
        .map(
            (customer) => `
                <tr>
                    <td>
                        ${escapeHtml(
                            customer.name || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            customer.phone || "-"
                        )}
                    </td>

                    <td class="number">
                        ${Number(
                            customer.sales_count || 0
                        ).toLocaleString()}
                    </td>

                    <td class="number">
                        ${formatMoney(
                            customer.total_revenue
                        )}
                    </td>

                    <td class="number">
                        ${formatMoney(
                            customer.total_paid
                        )}
                    </td>

                    <td class="number">
                        ${formatMoney(
                            customer.balance_due
                        )}
                    </td>

                    <td class="number">
                        ${formatMoney(
                            customer.total_discount
                        )}
                    </td>
                </tr>
            `
        )
        .join("");


    return `
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8" />

<title>Customer Report</title>

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
@page {
    size: A4;
    margin: 32px;
}

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

.footer {
    margin-top: 24px;

    padding-top: 10px;

    border-top: 1px solid #ddd;

    color: #777;

    font-size: 10px;

    text-align: center;
}

@media print {

    body {
        padding: 0;
    }

    .summary-card {
        break-inside: avoid;
    }

    tr {
        break-inside: avoid;
    }
}

</style>

</head>

<body>

<div class="header">

    <div>

        <div class="brand">
            ZeniaBiz
        </div>

        <div class="title">
            Customer Report
        </div>

    </div>


    <div class="meta">

        <div>
            Generated:
            ${new Date().toLocaleString()}
        </div>


        <div>
            Period:
            ${escapeHtml(
                formatTimeState(timeState)
            )}
        </div>


        <div>
            Customers:
            ${customers.length.toLocaleString()}
        </div>


        ${
            search
                ? `
                    <div>
                        Search:
                        "${escapeHtml(search)}"
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


<div class="summary">

    <div class="summary-card">

        <div class="summary-label">
            CUSTOMERS
        </div>

        <div class="summary-value">
            ${customers.length.toLocaleString()}
        </div>

    </div>


    <div class="summary-card">

        <div class="summary-label">
            REVENUE
        </div>

        <div class="summary-value">
            ${formatMoney(totalRevenue)}
        </div>

    </div>


    <div class="summary-card">

        <div class="summary-label">
            PAID
        </div>

        <div class="summary-value">
            ${formatMoney(totalPaid)}
        </div>

    </div>


    <div class="summary-card">

        <div class="summary-label">
            OUTSTANDING
        </div>

        <div class="summary-value">
            ${formatMoney(totalBalance)}
        </div>

    </div>

</div>


<table>

    <thead>

        <tr>

            <th>
                Customer
            </th>

            <th>
                Phone
            </th>

            <th class="number">
                Sales
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

            <th class="number">
                Discount
            </th>

        </tr>

    </thead>


    <tbody>

        ${
            rows ||
            `
                <tr>
                    <td
                        colspan="7"
                        style="text-align:center"
                    >
                        No customers found.
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
                ${customers
                    .reduce(
                        (sum, customer) =>
                            sum +
                            Number(
                                customer.sales_count || 0
                            ),
                        0
                    )
                    .toLocaleString()}
            </td>

            <td class="number">
                ${formatMoney(totalRevenue)}
            </td>

            <td class="number">
                ${formatMoney(totalPaid)}
            </td>

            <td class="number">
                ${formatMoney(totalBalance)}
            </td>

            <td class="number">
                ${formatMoney(totalDiscount)}
            </td>

        </tr>

    </tfoot>

</table>


<div class="footer">

    Generated by ZeniaBiz

</div>

</body>

</html>
`;
}
