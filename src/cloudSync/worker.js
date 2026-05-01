import {pullServerChanges} from "./pullSync"
import {pushLocalChanges} from "./pushSync"



export async function runSync(db) {
  const pushed = await pushLocalChanges(db);

  if (!pushed) return;

  await Promise.all([
    pullServerChanges(db, "sales", "/core/sales/pull/"),
    pullServerChanges(db, "expenses", "/core/expenses/pull/"),
    pullServerChanges(db, "products", "/core/products/pull/"),
  ]);
}

