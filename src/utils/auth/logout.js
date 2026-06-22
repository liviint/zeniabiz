import { clearUserDetails } from "../../store/features/userSlice"
import { createSession } from "../../db/query/users";
import { api } from "../../../api";
import { loadActiveContext } from "../../db/utils";

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

        dispatch(clearUserDetails());

        await createSession(db, {});

        await loadActiveContext(db)

        isLoggingOut = false;
        console.log("user logged out")
        router.push("/auth/profile");
    }
}