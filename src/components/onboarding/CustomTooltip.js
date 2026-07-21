import Tooltip from "react-native-walkthrough-tooltip";
import { BodyText, SecondaryText } from "../ThemeProvider/components";
import { TouchableOpacity , View, StyleSheet} from "react-native";
import { useThemeStyles } from "@/src/hooks/useThemeStyles";

export default function CustomTooltip({
    visible,
    children,
    title,
    description,
    onClose,
    btnAction=null
}) {
    const { globalStyles } = useThemeStyles()
    return (
        <Tooltip
            isVisible={visible}
            placement="top"
            showChildInTooltip={false}
            displayInsets={{
                left: 0,
                right: 10,
                top: 0,
                bottom: 0,
            }}
            contentStyle={styles.tooltiPContent}
            content={
                <View>
                    <BodyText>
                        {title}
                    </BodyText>

                    <SecondaryText
                        style={{ marginTop: 8 }}
                    >
                        {description}
                    </SecondaryText>

                    {btnAction && 
                        <TouchableOpacity
                            style={{...globalStyles.primaryBtn,marginTop: 16}}
                            onPress={() => {}}
                        >
                            <BodyText style={globalStyles.primaryBtnText}>Add Product</BodyText>
                        </TouchableOpacity>
                    }

                </View>
            }
            onClose={onClose}
            useReactNativeModal={true}
            backgroundColor="rgba(0,0,0,0.6)"
        >
            {children}
        </Tooltip>
    );
}

const styles = StyleSheet.create({
    tooltiPContent:{
        maxWidth: 300,
        paddingHorizontal: 10,
        paddingVertical: 18,
        borderRadius: 18,
    }
})