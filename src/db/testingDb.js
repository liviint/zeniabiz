import { getActiveContextSync } from "./utils";
export const testSetUp = async(db) => {
    try {
      console.log("🚀 Checking app initialization...");

      const session = await db.getFirstAsync(
        `SELECT * FROM app_session LIMIT 1`
      );

      const user = await db.getFirstAsync(
        `SELECT * FROM local_user LIMIT 1`
      );

      const company = await db.getFirstAsync(
        `SELECT * FROM companies LIMIT 1`
      );

      

      console.log("📦 SESSION:", session);
      console.log("👤 USER:", user);
      console.log("🏢 COMPANY:", company);

      if (!session) {
        console.warn("⚠️ No active session found");
      }

      if (!user) {
        console.warn("⚠️ No local user found");
      }

      if (!company) {
        console.warn("⚠️ No company found");
      }

      console.log("✅ App initialization check complete");
    } catch (err) {
      console.error("❌ App init check failed:", err);
    }
}

export async function debugActiveSession(db) {
  try {
    // 1. Full session table
    const sessions = await db.getAllAsync(
      `SELECT * FROM app_session`
    );

    // 2. Current active context (cached)
    let cached = null;
    try {
      cached = getActiveContextSync();
    } catch (e) {
      cached = { error: e.message };
    }

    // 3. Distinct company ids used in DB (optional safety check)
    const companyIds = await db.getAllAsync(
      `SELECT DISTINCT company_uuid FROM app_session`
    );

    // 4. Print summary
    console.log("🧠 ACTIVE CONTEXT (CACHE):", cached);
    console.log("📦 ALL SESSIONS:", sessions);
    console.log("🏢 DISTINCT COMPANY IDS:", companyIds);

    // 5. Quick validation flags
    const issues = [];

    if (!sessions || sessions.length === 0) {
      issues.push("No session found in app_session table");
    }

    if (companyIds.length > 1) {
      issues.push("Multiple companies detected (this is BAD)");
    }

    if (!cached?.company) {
      issues.push("Cached context missing company");
    }

    if (!cached?.user_id) {
      issues.push("Cached context missing user_id");
    }

    console.log("⚠️ SESSION ISSUES:", issues.length ? issues : "None");

    return {
      cached,
      sessions,
      companyIds,
      issues,
    };
  } catch (err) {
    console.error("❌ debugActiveSession failed:", err);
    return { error: err.message };
  }
}

export async function debugSessionIntegrity(db) {
  const session = await db.getFirstAsync(
    `SELECT * FROM app_session LIMIT 5`
  );

  const products = await db.getAllAsync(
    `SELECT id, company FROM products LIMIT 20`
  );

  const movements = await db.getAllAsync(
    `SELECT id, company FROM inventory_movements LIMIT 20`
  );

   const batches = await db.getAllAsync(
    `SELECT id, company FROM inventory_batches LIMIT 20`
  );

  const companiesInProducts = [...new Set(products.map(p => p.company))];
  const companiesInMovements = [...new Set(movements.map(m => m.company))];
  const companiesInBatches = [...new Set(batches.map(m => m.company))];

  const issues = [];

  if (companiesInProducts.length > 1) {
    issues.push("Products contain multiple company IDs");
  }

  if (companiesInMovements.length > 1) {
    issues.push("Inventory movements contain multiple company IDs");
  }

  if (
    session?.company_uuid &&
    (companiesInProducts.includes(session.company_uuid) === false ||
      companiesInMovements.includes(session.company_uuid) === false)
  ) {
    issues.push("Session company does not match local data");
  }

  console.log("🧠 SESSION:", session);
  console.log("🏢 PRODUCT COMPANIES:", companiesInProducts);
  console.log("🏢 MOVEMENT COMPANIES:", companiesInMovements);
  console.log("🏢 BATCHES COMPANIES:", companiesInBatches);
  console.log("⚠️ ISSUES:", issues);

  return {
    session,
    companiesInProducts,
    companiesInMovements,
    companiesInBatches,
    issues,
  };
}