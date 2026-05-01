import { useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { ensureLocalCompany } from "../../db/companiesDb";
import { ensureLocalUser } from "../../db/usersDb";
import { loadActiveContext } from "../../db/utils";


export default function SessionProvider({ children }) {
  const db = useSQLiteContext();
  const [ready, setReady] = useState(false);

 useEffect(() => {
  (async () => {
    const session = await db.getFirstAsync(
      `SELECT * FROM app_session LIMIT 1`
    );

    if (session) {
      await loadActiveContext(db);
      setReady(true)
    } else {
      const userUuid = await ensureLocalUser(db);
      await ensureLocalCompany(db, userUuid);
      await loadActiveContext(db);
    }
  })();
}, []);
  if (!ready) return null;
  return children;
}