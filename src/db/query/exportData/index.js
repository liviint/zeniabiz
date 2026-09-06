import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import { generateCustomersReport } from "./customers";
import { generateDashboardReport } from "./dashboard";
import { generateSalesReport } from "./sales";
import { generateExpensesReport } from "./expenses";
import { generateInventoryReport } from "./inventory";
import { generateCreditsReport } from "./credits";
import { generateSuppliersReport } from "./suppliers";


export async function exportPdf({
    data,
    type,
    fileName = "export",
    options = {},
}) {
    if (!data) {
        throw new Error(
            "No data provided for export."
        );
    }

    if (!type) {
        throw new Error(
            "Export type is required."
        );
    }

    console.log("Generating PDF:", {
        type,
        fileName,
        data,
        options,
    });

    try {
        /**
         * -----------------------------------------
         * GENERATE REPORT HTML
         * -----------------------------------------
         */

        const html = generateReportHtml({
            data,
            type,
            options,
        });

        if (!html) {
            throw new Error(
                `Unsupported export type: ${type}`
            );
        }

        /**
         * -----------------------------------------
         * GENERATE PDF
         * -----------------------------------------
         */

        const { uri } =
            await Print.printToFileAsync({
                html,
                base64: false,
            });

        console.log(
            "PDF generated:",
            uri
        );

        /**
         * -----------------------------------------
         * SHARE / EXPORT PDF
         * -----------------------------------------
         */

        const sharingAvailable =
            await Sharing.isAvailableAsync();

        if (!sharingAvailable) {
            return {
                success: true,
                filePath: uri,
                message:
                    "PDF generated successfully.",
            };
        }

        await Sharing.shareAsync(uri, {
            mimeType: "application/pdf",
            dialogTitle: `Export ${fileName}`,
            UTI: "com.adobe.pdf",
        });

        return {
            success: true,
            filePath: uri,
            message:
                "PDF exported successfully.",
        };

    } catch (error) {

        console.error(
            "PDF generation failed:",
            error
        );

        throw error;
    }
}


/**
 * =================================================
 * REPORT HTML
 * =================================================
 */

function generateReportHtml({
    data,
    type,
    options,
}) {
    switch (type) {

        case "customers":
            return generateCustomersReport(
                data,
                options
            );

        case "dashboard":
            return generateDashboardReport(
                data,
                options
            );

        case "sales":
            return generateSalesReport(
                data,
                options
            );

        case "expenses":
            return generateExpensesReport(
                data,
                options
            );

        case "inventory":
            return generateInventoryReport(
                data,
                options
            );

        case "credits":
            return generateCreditsReport(
                data,
                options
            );

        case "suppliers":
            return generateSuppliersReport(
                data,
                options
            );

        default:
            return null;
    }
}