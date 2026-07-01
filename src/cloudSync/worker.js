import {pullServerChanges} from "./pullSync"
import {pushLocalChanges} from "./pushSync"
import { syncStarted, syncFinished } from "../store/features/syncSlice";

const PULL_ORDER = [
  "expense_categories", 
  "products",
  "inventory_batches",
  "inventory_movements",
  "expenses",
  "expense_templates",
  "customers",
  "suppliers",
  "sales",
  "sale_items", 
  "payments"
];

let SYNC_LOCK = false;

export async function runSync(db,dispatch) {
  if (SYNC_LOCK) return;

  SYNC_LOCK = true;

  dispatch(syncStarted());

  try {
    await pushLocalChanges(db);

    for (const model of PULL_ORDER) {
      await pullServerChanges(db, model, `/core/${model}/pull/`);
    }
  } finally {
    SYNC_LOCK = false;
    dispatch(syncFinished());
  }
}

let syncing = false;

async function safeSync(db,dispatch) {
  if (syncing) return;
  syncing = true;

  try {
    await runSync(db,dispatch);
  } catch (err) {
    console.error("Sync error:", err);
  } finally {
    syncing = false;
  }
}

let scheduled = false;

export function scheduleSync(db,dispatch) {
  if (scheduled) return;

  scheduled = true;

  setTimeout(() => {
    scheduled = false;
    safeSync(db,dispatch);
  }, 1000);
}

