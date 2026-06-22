import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "expo-router";
import { ensureLocalCompany } from "../../db/query/companies";
import { ensureLocalUser } from "../../db/query/users";
import { loadActiveContext } from "../../db/utils";
import { logoutUser } from "../../utils/auth/logout"
import { authEvents } from "@/api";


export default function SessionProvider({ children }) {
  const db = useSQLiteContext();
  const dispatch = useDispatch()
  const router = useRouter()
  const [ready, setReady] = useState(false);
  const [activeContext,setActiveContext] = useState(null)

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
      let ctx =  await loadActiveContext(db);
      setActiveContext(ctx)
      setReady(true)
    }
  })();
}, []);

useEffect(() => {
  const handleUnauthorized = async () => {
    await logoutUser({
      db,
      dispatch,
      router,
      refreshToken: activeContext?.refresh_token,
    });
  };

  authEvents.on("unauthorized", handleUnauthorized);

  return () => {
    authEvents.off("unauthorized", handleUnauthorized);
  };
}, []);

  if (!ready) return null;
  return children;
}