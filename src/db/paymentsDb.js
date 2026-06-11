import { getActiveContextSync } from "./utils";
import { normalizeRange } from "../utils/timeNavigatorHelpers";

export const getCahsCollcted = async (db,timeState) => {
    const { company } = getActiveContextSync();
    const { startDate, endDate } = normalizeRange(timeState);
    
    const paymentsResult = await db.getFirstAsync(
        `
        SELECT
            COALESCE(SUM(amount), 0) AS cashCollected
        FROM payments
        WHERE company = ?
            AND deleted_at IS NULL
            AND date >= ?
            AND date < ?
        `,
        [company, startDate, endDate]
    );
    
    return paymentsResult
}