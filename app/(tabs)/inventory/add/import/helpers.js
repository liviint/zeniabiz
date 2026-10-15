import * as XLSX from "xlsx";

export const C = {
    teal: "#2E8B8B",
    coral: "#FF6B6B",
    beige: "#F4E1D2",
    background: "#FAF9F7",
    text: "#333333",
    muted: "#777777",
    border: "#E8E2DC",
    white: "#FFFFFF",
    red: "#B42318",
    green: "#237A57",
};

export const HEADERS = [
    "Product Name",
    "SKU",
    "Barcode",
    "Unit",
    "Cost Price",
    "Selling Price",
    "Opening Quantity",
    "Minimum Quantity",
    "Item Type",
    "Batch Number",
    "Expiry Date",
];

export const TEMPLATE_ROW = [
    "Sugar 1 kg",
    "SUG-001",
    "616000000001",
    "pcs",
    150,
    180,
    50,
    5,
    "product",
    "OPENING-001",
    "",
];

export function normalizeHeader(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

export function cellString(value) {
  return value == null ? "" : String(value).trim();
}

export function parseNumber(value) {
  if (value == null || String(value).trim() === "") return null;

  const number =
    typeof value === "number"
      ? value
      : Number(String(value).replace(/,/g, "").trim());

  return Number.isFinite(number) ? number : null;
}

export function parseExpiry(value) {
  if (value == null || value === "") return null;

  let date;

  if (value instanceof Date) {
    date = value;
  } else if (typeof value === "number") {
    const parts = XLSX.SSF.parse_date_code(value);

    if (!parts) throw new Error("Invalid expiry date");

    date = new Date(parts.y, parts.m - 1, parts.d);
  } else {
    const raw = String(value).trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      throw new Error("Use YYYY-MM-DD for expiry dates");
    }

    date = new Date(`${raw}T12:00:00`);

    if (
      date.getFullYear() !== Number(raw.slice(0, 4)) ||
      date.getMonth() + 1 !== Number(raw.slice(5, 7)) ||
      date.getDate() !== Number(raw.slice(8, 10))
    ) {
      throw new Error("Invalid expiry date");
    }
  }

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid expiry date");
  }

  return date;
}

export function parseRows(worksheet, existingBarcodes) {
  const matrix = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
    raw: true,
  });

  if (matrix.length < 2) {
    throw new Error("The Excel file has no product rows.");
  }

  const headers = (matrix[0] || []).map(normalizeHeader);
  const column = (name) => headers.indexOf(normalizeHeader(name));

  const nameCol = column("Product Name");
  const sellingCol = column("Selling Price");
  const costCol = column("Cost Price");
  const barcodeCol = column("Barcode");
  const skuCol = column("SKU");
  const unitCol = column("Unit");
  const quantityCol = column("Opening Quantity");
  const minimumCol = column("Minimum Quantity");
  const typeCol = column("Item Type");
  const batchCol = column("Batch Number");
  const expiryCol = column("Expiry Date");

  if (nameCol < 0 || sellingCol < 0) {
    throw new Error(
      "Missing required columns: Product Name and Selling Price.",
    );
  }

  const seenBarcodes = new Set();

  return matrix.slice(1).map((cells, index) => {
    const get = (col) => (col < 0 ? "" : cells[col]);

    const name = cellString(get(nameCol));
    const sku = cellString(get(skuCol)) || null;
    const barcode = cellString(get(barcodeCol)) || null;
    const unit = cellString(get(unitCol)) || null;

    const cost = parseNumber(get(costCol));
    const selling = parseNumber(get(sellingCol));
    const quantity = parseNumber(get(quantityCol));
    const minimum = parseNumber(get(minimumCol));

    const rawType = cellString(get(typeCol)).toLowerCase();
    const itemType = rawType === "service" ? "service" : "product";

    const errors = [];
    const hasData = cells.some((value) => cellString(value) !== "");

    if (!hasData) {
      return {
        rowNumber: index + 2,
        name: "",
        sku: null,
        barcode: null,
        unit: null,
        cost_price: 0,
        selling_price: 0,
        stock_quantity: 0,
        minimum_quantity: 5,
        item_type: "product",
        batch_number: "",
        expiry_date: null,
        errors: ["Empty row"],
      };
    }

    if (!name) errors.push("Product name is required");

    if (selling == null || selling < 0) {
      errors.push("Selling price must be zero or greater");
    }

    if (cost == null && cellString(get(costCol))) {
      errors.push("Invalid cost price");
    }

    if (cost != null && cost < 0) {
      errors.push("Cost price cannot be negative");
    }

    if (quantity == null && cellString(get(quantityCol))) {
      errors.push("Invalid opening quantity");
    }

    if (
      quantity != null &&
      (!Number.isInteger(quantity) || quantity < 0)
    ) {
      errors.push("Opening quantity must be a non-negative integer");
    }

    if (
      minimum != null &&
      (!Number.isInteger(minimum) || minimum < 0)
    ) {
      errors.push("Minimum quantity must be a non-negative integer");
    }

    if (rawType && !["product", "service"].includes(rawType)) {
      errors.push("Item Type must be product or service");
    }

    if (barcode && seenBarcodes.has(barcode)) {
      errors.push("Duplicate barcode in this Excel file");
    }

    if (barcode && existingBarcodes.has(barcode)) {
      errors.push("Barcode already exists in ZeniaBiz");
    }

    if (barcode) seenBarcodes.add(barcode);

    let expiryDate = null;

    try {
      expiryDate = parseExpiry(get(expiryCol));
    } catch (error) {
      errors.push(error.message || "Invalid expiry date");
    }

    if (itemType === "service" && (quantity ?? 0) > 0) {
      errors.push("Services cannot have opening stock");
    }

    return {
      rowNumber: index + 2,
      name,
      sku,
      barcode,
      unit,
      cost_price: cost ?? 0,
      selling_price: selling ?? 0,
      stock_quantity: quantity ?? 0,
      minimum_quantity: minimum ?? 5,
      item_type: itemType,
      batch_number: cellString(get(batchCol)),
      expiry_date: expiryDate,
      errors,
    };
  });
}