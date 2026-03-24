import {
    View,
    ActivityIndicator,
} from "react-native";
import { useThemeStyles } from "../../hooks/useThemeStyles";
import { BodyText } from "../ThemeProvider/components";

export default function PageLoader({message}) {
    const {globalStyles} = useThemeStyles()
    return (
        <View
        style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            ...globalStyles.container
        }}
        >
        <ActivityIndicator size="large" color="#FF6B6B" />
        <BodyText >{message || "Loading..."}</BodyText>
        </View>
    );
}
