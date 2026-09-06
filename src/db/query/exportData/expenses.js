import {
    formatMoney,
    escapeHtml,
    formatTimeState
} from "./helpers";

export function generateExpensesReport(
    expenses,
    options = {}
) {
    const {
        timeState = {},
        categoriesMap = {},
    } = options;

    const totalExpenses = expenses.reduce(
        (sum, expense) =>
            sum + Number(expense.amount || 0),
        0
    );

    const rows = expenses
        .map((expense) => {
            const category =
                categoriesMap[expense.category_id] ||
                expense.category_name ||
                "Other";

            return `
                <tr>
                    <td>
                        ${escapeHtml(
                            expense.date ||
                            expense.created_at ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(category)}
                    </td>

                    <td>
                        ${escapeHtml(
                            expense.description ||
                            expense.name ||
                            "-"
                        )}
                    </td>

                    <td class="number">
                        ${formatMoney(expense.amount)}
                    </td>
                </tr>
            `;
        })
        .join("");

    return `
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8" />

<title>Expense Report</title>

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
        repeat(2, 1fr);

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
            Expense Report
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
            Expenses:
            ${expenses.length.toLocaleString()}
        </div>

    </div>

</div>

<div class="summary">

    <div class="summary-card">

        <div class="summary-label">
            TOTAL SPENT
        </div>

        <div class="summary-value">
            ${formatMoney(totalExpenses)}
        </div>

    </div>

    <div class="summary-card">

        <div class="summary-label">
            EXPENSES
        </div>

        <div class="summary-value">
            ${expenses.length.toLocaleString()}
        </div>

    </div>

</div>

<table>

    <thead>

        <tr>

            <th>
                Date
            </th>

            <th>
                Category
            </th>

            <th>
                Description
            </th>

            <th class="number">
                Amount
            </th>

        </tr>

    </thead>

    <tbody>

        ${
            rows ||
            `
                <tr>
                    <td
                        colspan="4"
                        style="text-align:center"
                    >
                        No expenses found.
                    </td>
                </tr>
            `
        }

    </tbody>

    <tfoot>

        <tr>

            <td colspan="3">
                Total
            </td>

            <td class="number">
                ${formatMoney(totalExpenses)}
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