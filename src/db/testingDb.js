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