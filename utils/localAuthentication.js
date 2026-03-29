import * as LocalAuthentication from "expo-local-authentication";

export const authenticateUser = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
        return true; 
    }

    const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock ZeniaMoney",
        fallbackLabel: "Use phone PIN",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
    });

    return result.success;
};
