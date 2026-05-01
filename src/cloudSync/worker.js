import {pullServerChanges} from "./pullSync"
import {pushLocalChanges} from "./pushSync"

const PULL_ORDER = [
  "companies",
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
    const pushed = await pushLocalChanges(db);
    if (!pushed) return;

    for (const model of PULL_ORDER) {
      await pullServerChanges(db, model, `/core/${model}/pull/`);
    }
  } finally {
    SYNC_LOCK = false;
  }
}

