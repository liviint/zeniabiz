import {
    formatMoney,
    escapeHtml,
    formatTimeState,
    formatDate
} from "./helpers";

export function generateInventoryReport(
    products,
    options = {}
) {
    const {
        timeState = {},
    } = options;

    const totalProducts = products.length;

    const totalStock = products.reduce(
        (sum, product) =>
            sum + Number(product.stock_quantity || 0),
        0
    );

    const totalStockValue = products.reduce(
        (sum, product) =>
            sum +
            (
                Number(product.stock_quantity || 0) *
                Number(
                    product.cost_price ||
                    product.buying_price ||
                    0
                )
            ),
        0
    );

    const totalRetailValue = products.reduce(
        (sum, product) =>
            sum +
            (
                Number(product.stock_quantity || 0) *
                Number(product.selling_price || 0)
            ),
        0
    );

    const lowStock = products.filter(
        product =>
            Number(product.stock_quantity || 0) > 0 &&
            Number(product.stock_quantity || 0) <=
                Number(product.low_stock_threshold || 5)
    );

    const outOfStock = products.filter(
        product =>
            Number(product.stock_quantity || 0) <= 0
    );

    const rows = products
        .map(product => {
            const stock = Number(
                product.stock_quantity || 0
            );

            const sellingPrice = Number(
                product.selling_price || 0
            );

            const costPrice = Number(
                product.cost_price ||
                product.buying_price ||
                0
            );

            const stockValue = stock * costPrice;

            const retailValue = stock * sellingPrice;

            let status = "In Stock";

            if (stock <= 0) {
                status = "Out of Stock";
            } else if (
                stock <=
                Number(
                    product.low_stock_threshold || 5
                )
            ) {
                status = "Low Stock";
            }

            return `
                <tr>

                    <td>
                        ${escapeHtml(
                            product.name || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            product.sku || "-"
                        )}
                    </td>

                    <td class="number">
                        ${stock.toLocaleString()}
                    </td>

                    <td class="number">
                        ${formatMoney(
                            costPrice
                        )}
                    </td>

                    <td class="number">
                        ${formatMoney(
                            sellingPrice
                        )}
                    </td>

                    <td class="number">
                        ${formatMoney(
                            stockValue
                        )}
                    </td>

                    <td class="number">
                        ${formatMoney(
                            retailValue
                        )}
                    </td>

                    <td>
                        ${status}
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

<title>Inventory Report</title>

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
            Inventory Report
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
                formatTimeState(timeState)
            )}
        </div>

        <div>
            Products:
            ${totalProducts.toLocaleString()}
        </div>

    </div>

</div>

<div class="summary">

    <div class="summary-card">

        <div class="summary-label">
            PRODUCTS
        </div>

        <div class="summary-value">
            ${totalProducts.toLocaleString()}
        </div>

    </div>

    <div class="summary-card">

        <div class="summary-label">
            TOTAL STOCK
        </div>

        <div class="summary-value">
            ${totalStock.toLocaleString()}
        </div>

    </div>

    <div class="summary-card">

        <div class="summary-label">
            STOCK VALUE
        </div>

        <div class="summary-value">
            ${formatMoney(totalStockValue)}
        </div>

    </div>

    <div class="summary-card">

        <div class="summary-label">
            RETAIL VALUE
        </div>

        <div class="summary-value">
            ${formatMoney(totalRetailValue)}
        </div>

    </div>

</div>

<table>

    <thead>

        <tr>

            <th>
                Product
            </th>

            <th>
                SKU
            </th>

            <th class="number">
                Stock
            </th>

            <th class="number">
                Cost Price
            </th>

            <th class="number">
                Selling Price
            </th>

            <th class="number">
                Stock Value
            </th>

            <th class="number">
                Retail Value
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
                        colspan="8"
                        style="text-align:center"
                    >
                        No products found.
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
                ${totalStock.toLocaleString()}
            </td>

            <td colspan="2">
            </td>

            <td class="number">
                ${formatMoney(totalStockValue)}
            </td>

            <td class="number">
                ${formatMoney(totalRetailValue)}
            </td>

            <td>
                ${outOfStock.length} out of stock
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