
import {api} from "../api"
import * as Application from "expo-application";

export const isVersionLower = (current, latest) => {
    const c = current.split(".").map(Number);
    const l = latest.split(".").map(Number);

    for (let i = 0; i < l.length; i++) {
        if ((c[i] || 0) < l[i]) return true;
        if ((c[i] || 0) > l[i]) return false;
    }
    return false;
};

export const checkForUpdate = async () => {
    const res = await api.get("/finances/app-config/");
    const data = res.data

    const current = Application.nativeApplicationVersion;
    if (isVersionLower(current, data.latest_version)) {
        return {...data }
    }

    return null;
};