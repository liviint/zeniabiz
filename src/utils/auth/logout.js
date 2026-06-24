import { clearUserDetails } from "../../store/features/userSlice"
import { createSession } from "../../db/query/users";
import { api } from "../../../api";
import { loadActiveContext, getActiveContextSync } from "../../db/utils";

let isLoggingOut = false;
export async function logoutUser({
    db,
    dispatch,
    router,
    refreshToken,
}) {
    if (isLoggingOut) return;
    isLoggingOut = true;
    try {
        await api({
        url: "accounts/logout/",
        method: "POST",
        data: {
            refresh: refreshToken,
        },
        });
    } catch (error) {
        console.log(error);
    } finally {
        let ctx = await await getActiveContextSync(db)

        dispatch(clearUserDetails());

        await createSession(db, {company_role:ctx.company_role, is_authenticated:false,company_uuid:ctx.company_uuid});

        await loadActiveContext(db)

        isLoggingOut = false;
        router.push("/auth/profile");
    }
}