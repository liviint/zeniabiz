import { useEffect, useRef } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { useSelector, useDispatch } from "react-redux";
import { processPendingMovements} from "../../db/inventoryDb"
import { processingStarted, processingSuccess, processingFailed } from "@/src/store/features/batchesSlice";

export default function InventoryProvider({ children }) {
  const db = useSQLiteContext();
  const timerRef = useRef(null);
  const runningRef = useRef(false);
  const pendingCount = useSelector((s) => s.batches.pendingCount);
  const dispatch = useDispatch();

  useEffect(() => {
    if (pendingCount === 0) return;

    // 🧠 debounce: reset timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(async () => {
      // 🔒 prevent parallel runs
      if (runningRef.current) return;

      runningRef.current = true;
      dispatch(processingStarted());

      try {
        await processPendingMovements(db);
        dispatch(processingSuccess());
      } catch (err) {
        console.error("Batch processing failed:", err);
        dispatch(processingFailed(err.message));
      } finally {
        runningRef.current = false;

        // 🔁 if new events came during processing → rerun
        if (pendingCount > 0) {
          dispatch({ type: "batches/triggerBatchProcessing" });
        }
      }
    }, 300); // ⏱ debounce delay

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pendingCount]);

  return "";
}