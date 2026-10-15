
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
import { useThemeStyles } from "../../../../../src/hooks/useThemeStyles";
import { BodyText, SecondaryText, Card } from "../../../../../src/components/ThemeProvider/components";
import { 
  C , 
  HEADERS, 
  TEMPLATE_ROW, 
  normalizeHeader,
  cellString,
  parseNumber,
  parseExpiry,
  parseRows
} from "./helpers";
import { getStyles } from "./styles";

const styles = StyleSheet.create(getStyles(C))


export default function InventoryImportScreen() {
  const db = useSQLiteContext();
  const { globalStyles } = useThemeStyles();

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
      contentContainerStyle={globalStyles.container}
    >

      <View style={{...globalStyles.titleContainer, flexDirection:"column"}}>
          <BodyText style={{...globalStyles.title, marginBottom:"0"}}>
              {stage === "start"
                ? "Add products in bulk"
                : stage === "preview"
                  ? "Review your products"
                  : "Import results"
              }
          </BodyText>

          <SecondaryText style={globalStyles.subTitle}>
            {stage === "start"
              ? "Bring your existing inventory into ZeniaBiz using Excel."
              : stage === "preview"
                ? fileName
                : "Your import summary"}
        </SecondaryText>
      </View>

      {stage === "start" && (
        <>

          <Card >
            <BodyText style={styles.sectionTitle}>1. Get the Excel template</BodyText>
            <SecondaryText style={styles.body}>
              Organize product names, prices, units and opening quantities.
            </SecondaryText>
            <PrimaryButton
              label="Download Excel template"
              icon="↓"
              onPress={downloadTemplate}
            />
          </Card>

          <Card>
            <BodyText style={styles.sectionTitle}>2. Choose your Excel file</BodyText>
            <SecondaryText style={styles.body}>
              Select an existing inventory spreadsheet arranged using the
              template columns.
            </SecondaryText>
            <PrimaryButton
              label="Select Excel file"
              icon="↑"
              onPress={selectExcelFile}
              disabled={loading}
            />
          </Card>

          <Card >
            <BodyText style={styles.noteTitle}>Before you import</BodyText>
            <SecondaryText style={styles.noteText}>
              • Product name and selling price are required.
              {"\n"}• Opening quantity must be a whole number.
              {"\n"}• Existing barcodes are flagged.
              {"\n"}• Keep a copy of your original spreadsheet.
            </SecondaryText>
          </Card>
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

          <Card >
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
          </Card>

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
            <Card>
              <BodyText style={styles.sectionTitle}>Failed rows</BodyText>

              {rows
                .filter((row) =>
                  row.errors.some((error) =>
                    error.startsWith("Import failed:"),
                  ),
                )
                .map((row) => (
                  <SecondaryText key={row.rowNumber} style={styles.errorText}>
                    Row {row.rowNumber}: {row.name} —{" "}
                    {row.errors
                      .filter((error) =>
                        error.startsWith("Import failed:"),
                      )
                      .join(", ")}
                  </SecondaryText>
                ))}
            </Card>
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


