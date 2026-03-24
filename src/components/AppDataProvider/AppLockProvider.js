import { useEffect, useState } from "react";
import { AppState, View, StyleSheet } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { useSQLiteContext } from "expo-sqlite";
import { getSetting } from "../../db/settingsDb";
import LockedScreen from "./AppLocked";
import PageLoader from "../../components/common/PageLoader"

export default function AppLockProvider({ children }) {
    const db = useSQLiteContext();

    const [locked, setLocked] = useState(true);
    const [checking, setChecking] = useState(true);
    const [enabled, setEnabled] = useState(false);

    const authenticate = async () => {
        if (!enabled) {
        setLocked(false);
        return true;
        }

        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (!isEnrolled) {
        setLocked(false);
        return true;
        }

        const res = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock app",
        fallbackLabel: "Use device PIN",
        });

        if (res.success) setLocked(false);
        return res.success;
    };

    useEffect(() => {
        const handleAppStateChange = async (state) => {
        if (state === "active") {
            setChecking(true);

            const value = await getSetting(db, "app_lock_enabled");
            const isEnabled = value === "true";
            setEnabled(isEnabled);

            if (isEnabled) {
            await authenticate();
            } else {
            setLocked(false);
            }

            setChecking(false);
        } else if (state === "background" || state === "inactive") {
            if (enabled) setLocked(true);
        }
        };

        const sub = AppState.addEventListener("change", handleAppStateChange);

        // Run on mount
        handleAppStateChange("active");

        return () => sub.remove();
    }, [enabled]);

    return (
        <>
        {children}

        {(locked || checking) && (
            <View
            style={{
                ...StyleSheet.absoluteFillObject,
            }}
            pointerEvents="auto" 
            >
            {checking ? <PageLoader /> : <LockedScreen authenticate={authenticate} />}
            </View>
        )}
        </>
    );
}
