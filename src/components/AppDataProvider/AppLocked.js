import { View, TouchableOpacity } from "react-native";
import { useThemeStyles } from "@/src/hooks/useThemeStyles";
import {BodyText} from "../ThemeProvider/components"

export default function LockedScreen({ authenticate }) {
    const {globalStyles} = useThemeStyles()
    return (
        <View style={{...globalStyles.container,
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
        }}>
        <BodyText style={{ fontSize: 16, fontWeight: "500", marginBottom: 16, textAlign: "center" }}>
            Looks like you’ve been away! 
            {"\n"}Please unlock to keep your data safe.
        </BodyText>


        <TouchableOpacity onPress={authenticate}>
            <BodyText style={{ color: "#2E8B8B", fontWeight: "800" }}>
                Unlock
            </BodyText>
        </TouchableOpacity>
        </View>
    );
}
