import { useEffect } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { ensureLocalCompany, ensureLocalUser } from "../../db/companiesDb";

export default function AppDataProvider({ children }) {
  const db = useSQLiteContext();

  useEffect(() => {
    (async () => {
      const userId = await ensureLocalUser(db);

      await ensureLocalCompany(db, userId);
    })();
  }, []);

  return children;
}