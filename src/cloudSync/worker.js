import {pullServerChanges} from "./pullSync"
import {pushLocalChanges} from "./pushSync"

const PULL_ORDER = [
  
  "expense_categories", 
  "products",
  "inventory_batches",
  "inventory_movements",
  "expenses",
  "expense_templates",
  "sales",
  "sale_items", 
];

let SYNC_LOCK = false;

export async function runSync(db) {
  if (SYNC_LOCK) return;

  SYNC_LOCK = true;

  try {
    await pushLocalChanges(db);

    for (const model of PULL_ORDER) {
      await pullServerChanges(db, model, `/core/${model}/pull/`);
    }
  } finally {
    SYNC_LOCK = false;
  }
}

let syncing = false;

async function safeSync(db) {
  if (syncing) return;
  syncing = true;

  try {
    await runSync(db);
  } catch (err) {
    console.error("Sync error:", err);
  } finally {
    syncing = false;
  }
}

let scheduled = false;

export function scheduleSync(db) {
  if (scheduled) return;

  scheduled = true;

  setTimeout(() => {
    scheduled = false;
    safeSync(db);
  }, 1000);
}

