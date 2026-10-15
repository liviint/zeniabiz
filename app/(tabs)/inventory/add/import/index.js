
import React, { useMemo, useState } from "react";
import {
    Alert,
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as XLSX from "xlsx";
import { getActiveContextSync } from "../../../../../src/db/utils";
import { upsertProductAndRestocking } from "../../../../../src/db/query/inventory";

const C = {
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

const HEADERS = [
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

const TEMPLATE_ROW = [
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

function normalizeHeader(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function cellString(value) {
  return value == null ? "" : String(value).trim();
}

function parseNumber(value) {
  if (value == null || String(value).trim() === "") return null;

  const number =
    typeof value === "number"
      ? value
      : Number(String(value).replace(/,/g, "").trim());

  return Number.isFinite(number) ? number : null;
}

function parseExpiry(value) {
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

function parseRows(worksheet, existingBarcodes) {
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

export default function InventoryImportScreen() {
  const db = useSQLiteContext();

  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("start");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  const validRows = useMemo(
    () => rows.filter((row) => row.errors.length === 0),
    [rows],
  );

  const invalidRows = useMemo(
    () => rows.filter((row) => row.errors.length > 0),
    [rows],
  );

  async function downloadTemplate() {
    try {
      const worksheet = XLSX.utils.aoa_to_sheet([
        HEADERS,
        TEMPLATE_ROW,
      ]);

      worksheet["!cols"] = [
        { wch: 24 },
        { wch: 16 },
        { wch: 20 },
        { wch: 12 },
        { wch: 16 },
        { wch: 16 },
        { wch: 18 },
        { wch: 18 },
        { wch: 14 },
        { wch: 18 },
        { wch: 16 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

      const base64 = XLSX.write(workbook, {
        type: "base64",
        bookType: "xlsx",
      });

      const uri =
        `${FileSystem.cacheDirectory}zeniaBiz-inventory-template.xlsx`;

      await FileSystem.writeAsStringAsync(uri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Template created", `Saved at ${uri}`);
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dialogTitle: "Save ZeniaBiz inventory template",
        UTI: "org.openxmlformats.spreadsheetml.sheet",
      });
    } catch (error) {
      Alert.alert(
        "Could not create template",
        error.message || "Please try again.",
      );
    }
  }

  async function selectExcelFile() {
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (picked.canceled || !picked.assets?.length) return;

      const file = picked.assets[0];

      if (!file.name.toLowerCase().endsWith(".xlsx")) {
        Alert.alert("Excel file required", "Select an .xlsx file.");
        return;
      }

      setLoading(true);

      const context = getActiveContextSync(db);

      if (!context?.company) {
        throw new Error("Select or create a business before importing.");
      }

      const existing = await db.getAllAsync(
        `SELECT barcode FROM products
         WHERE company = ?
           AND deleted_at IS NULL
           AND barcode IS NOT NULL
           AND barcode != ''`,
        [context.company],
      );

      const existingBarcodes = new Set(
        existing.map((item) => item.barcode).filter(Boolean),
      );

      const base64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const workbook = XLSX.read(base64, {
        type: "base64",
        cellDates: true,
      });

      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      if (!worksheet) {
        throw new Error("No worksheet found in the Excel file.");
      }

      const parsedRows = parseRows(worksheet, existingBarcodes);

      if (parsedRows.length > 10000) {
        throw new Error("Import no more than 10,000 rows at once.");
      }

      setRows(parsedRows);
      setFileName(file.name);
      setStage("preview");
      setProgress(0);
      setResult(null);
    } catch (error) {
      Alert.alert(
        "Unable to read Excel file",
        error.message || "Please check your file.",
      );
    } finally {
      setLoading(false);
    }
  }

  function confirmImport() {
    if (!validRows.length) {
      Alert.alert("Nothing to import", "No valid rows are available.");
      return;
    }

    Alert.alert(
      "Import products?",
      `Import ${validRows.length} valid rows? Invalid rows will be skipped.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Import", onPress: () => void runImport() },
      ],
    );
  }

  async function runImport() {
    setLoading(true);
    setProgress(0);

    let imported = 0;
    let failed = 0;

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];

      try {
        await upsertProductAndRestocking(db, {
          name: row.name,
          barcode: row.barcode,
          cost_price: row.cost_price,
          selling_price: row.selling_price,
          stock_quantity:
            row.item_type === "product" ? row.stock_quantity : 0,
          minimum_quantity: row.minimum_quantity,
          batch_number: row.batch_number || undefined,
          expiry_date: row.expiry_date,
          item_type: row.item_type,
          unit: row.unit || undefined,
        });

        imported++;
      } catch (error) {
        failed++;

        setRows((current) =>
          current.map((item) =>
            item.rowNumber === row.rowNumber
              ? {
                  ...item,
                  errors: [
                    ...item.errors,
                    `Import failed: ${error.message || "Unknown error"}`,
                  ],
                }
              : item,
          ),
        );
      }

      setProgress(Math.round(((i + 1) / validRows.length) * 100));
    }

    setResult({ imported, failed });
    setStage("done");
    setLoading(false);
  }

  function resetImport() {
    setRows([]);
    setFileName("");
    setStage("start");
    setProgress(0);
    setResult(null);
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>ZENIABIZ INVENTORY</Text>

        <Text style={styles.title}>
          {stage === "start"
            ? "Add products in bulk"
            : stage === "preview"
              ? "Review your products"
              : "Import results"}
        </Text>

        <Text style={styles.subtitle}>
          {stage === "start"
            ? "Bring your existing inventory into ZeniaBiz using Excel."
            : stage === "preview"
              ? fileName
              : "Your import summary"}
        </Text>
      </View>

      {stage === "start" && (
        <>
          <View style={styles.hero}>
            <Text style={styles.heroEmoji}>📊</Text>
            <Text style={styles.heroTitle}>Hundreds of products?</Text>
            <Text style={styles.heroText}>
              Import your product list instead of entering every item
              manually. Your file is processed on this device.
            </Text>
            <View style={styles.chip}>
              <Text style={styles.chipText}>Excel .xlsx only</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>1. Get the Excel template</Text>
            <Text style={styles.body}>
              Organize product names, prices, units and opening quantities.
            </Text>
            <PrimaryButton
              label="Download Excel template"
              icon="↓"
              onPress={downloadTemplate}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>2. Choose your Excel file</Text>
            <Text style={styles.body}>
              Select an existing inventory spreadsheet arranged using the
              template columns.
            </Text>
            <PrimaryButton
              label="Select Excel file"
              icon="↑"
              onPress={selectExcelFile}
              disabled={loading}
            />
          </View>

          <View style={styles.note}>
            <Text style={styles.noteTitle}>Before you import</Text>
            <Text style={styles.noteText}>
              • Product name and selling price are required.
              {"\n"}• Opening quantity must be a whole number.
              {"\n"}• Existing barcodes are flagged.
              {"\n"}• Keep a copy of your original spreadsheet.
            </Text>
          </View>
        </>
      )}

      {stage === "preview" && (
        <>
          <View style={styles.statsRow}>
            <StatCard value={String(rows.length)} label="Total rows" />
            <StatCard
              value={String(validRows.length)}
              label="Valid"
              color={C.green}
            />
            <StatCard
              value={String(invalidRows.length)}
              label="Needs review"
              color={C.red}
            />
          </View>

          {invalidRows.length > 0 && (
            <View style={styles.warning}>
              <Text style={styles.warningTitle}>
                {invalidRows.length} row(s) need attention
              </Text>
              <Text style={styles.warningText}>
                Invalid rows will be skipped. Correct them in Excel and
                select the file again.
              </Text>
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Product preview</Text>
            <Text style={styles.body}>
              Showing the first 20 rows.
            </Text>

            {rows.slice(0, 20).map((row) => (
              <View key={row.rowNumber} style={styles.productRow}>
                <View style={styles.productNumber}>
                  <Text style={styles.productNumberText}>
                    {row.rowNumber}
                  </Text>
                </View>

                <View style={styles.productInfo}>
                  <Text style={styles.productName}>
                    {row.name || "Unnamed product"}
                  </Text>

                  <Text style={styles.productMeta}>
                    KES {row.selling_price.toLocaleString("en-KE")} · Stock{" "}
                    {row.stock_quantity}
                  </Text>

                  {row.errors.length > 0 && (
                    <Text style={styles.errorText}>
                      {row.errors.join(" · ")}
                    </Text>
                  )}
                </View>

                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        row.errors.length > 0 ? C.coral : C.teal,
                    },
                  ]}
                />
              </View>
            ))}
          </View>

          <PrimaryButton
            label={`Import ${validRows.length} valid products`}
            onPress={confirmImport}
            disabled={loading || validRows.length === 0}
          />

          <SecondaryButton
            label="Choose another file"
            onPress={resetImport}
          />
        </>
      )}

      {stage === "done" && result && (
        <>
          <View style={styles.successHero}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.heroTitle}>Import finished</Text>
            <Text style={styles.heroText}>
              Review the results below.
            </Text>
          </View>

          <View style={styles.statsRow}>
            <StatCard
              value={String(result.imported)}
              label="Imported"
              color={C.green}
            />
            <StatCard
              value={String(result.failed)}
              label="Failed"
              color={result.failed ? C.red : C.teal}
            />
            <StatCard
              value={`${progress}%`}
              label="Progress"
              color={C.teal}
            />
          </View>

          {rows.some((row) =>
            row.errors.some((error) => error.startsWith("Import failed:")),
          ) && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Failed rows</Text>

              {rows
                .filter((row) =>
                  row.errors.some((error) =>
                    error.startsWith("Import failed:"),
                  ),
                )
                .map((row) => (
                  <Text key={row.rowNumber} style={styles.errorText}>
                    Row {row.rowNumber}: {row.name} —{" "}
                    {row.errors
                      .filter((error) =>
                        error.startsWith("Import failed:"),
                      )
                      .join(", ")}
                  </Text>
                ))}
            </View>
          )}

          <PrimaryButton
            label="Import another file"
            onPress={resetImport}
          />
        </>
      )}

      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator color={C.teal} size="large" />
          <Text style={styles.loadingText}>
            {stage === "start"
              ? "Reading Excel file..."
              : `Importing products... ${progress}%`}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function PrimaryButton({ label, onPress, disabled = false, icon }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.primaryButton,
        disabled && styles.disabledButton,
      ]}
    >
      {icon ? <Text style={styles.buttonIcon}>{icon}</Text> : null}
      <Text style={styles.primaryButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

function SecondaryButton({ label, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.secondaryButton}
    >
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

function StatCard({ value, label, color = C.text }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.background,
  },
  content: {
    padding: 20,
    paddingBottom: 44,
    gap: 16,
  },
  header: {
    gap: 8,
    marginBottom: 4,
  },
  eyebrow: {
    color: C.teal,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  title: {
    color: C.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
  },
  subtitle: {
    color: C.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  hero: {
    backgroundColor: C.beige,
    borderRadius: 22,
    padding: 22,
    gap: 12,
  },
  heroEmoji: {
    fontSize: 36,
  },
  heroTitle: {
    color: C.text,
    fontSize: 21,
    fontWeight: "800",
  },
  heroText: {
    color: C.text,
    fontSize: 14,
    lineHeight: 22,
  },
  chip: {
    alignSelf: "flex-start",
    backgroundColor: C.white,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  chipText: {
    color: C.teal,
    fontSize: 12,
    fontWeight: "700",
  },
  card: {
    backgroundColor: C.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 18,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    color: C.text,
    fontWeight: "800",
  },
  body: {
    fontSize: 13,
    color: C.muted,
    lineHeight: 20,
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 13,
    backgroundColor: C.teal,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  primaryButtonText: {
    color: C.white,
    fontWeight: "800",
    fontSize: 14,
  },
  buttonIcon: {
    color: C.white,
    fontSize: 20,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.5,
  },
  secondaryButton: {
    borderRadius: 13,
    borderWidth: 1,
    borderColor: C.teal,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  secondaryButtonText: {
    color: C.teal,
    fontWeight: "800",
  },
  note: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#F1EFEB",
    gap: 8,
  },
  noteTitle: {
    fontWeight: "800",
    color: C.text,
  },
  noteText: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 21,
  },
  statsRow: {
    flexDirection: "row",
    gap: 9,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 15,
    padding: 12,
    gap: 5,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 11,
    color: C.muted,
  },
  warning: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#FFF0E9",
    gap: 6,
  },
  warningTitle: {
    color: C.red,
    fontWeight: "800",
  },
  warningText: {
    color: C.text,
    fontSize: 13,
    lineHeight: 19,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  productNumber: {
    backgroundColor: C.beige,
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  productNumberText: {
    fontSize: 11,
    color: C.text,
    fontWeight: "800",
  },
  productInfo: {
    flex: 1,
    gap: 4,
  },
  productName: {
    fontSize: 13,
    fontWeight: "700",
    color: C.text,
  },
  productMeta: {
    fontSize: 12,
    color: C.muted,
  },
  errorText: {
    color: C.red,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginTop: 5,
  },
  successHero: {
    backgroundColor: "#E7F3ED",
    padding: 22,
    borderRadius: 20,
    alignItems: "flex-start",
    gap: 10,
  },
  successIcon: {
    width: 42,
    height: 42,
    overflow: "hidden",
    borderRadius: 21,
    textAlign: "center",
    textAlignVertical: "center",
    backgroundColor: C.green,
    color: C.white,
    fontSize: 24,
    fontWeight: "800",
  },
  loading: {
    padding: 20,
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    color: C.teal,
    fontSize: 13,
    fontWeight: "700",
  },
});
