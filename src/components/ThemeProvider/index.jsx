import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { ThemeProvider } from "styled-components/native";
import { lightTheme, darkTheme } from "../../styles/theme";
import { StatusBar, Appearance, View } from "react-native";
import { setTheme } from "../../store/features/settingsSlice";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ThemedApp({children}) {
    const dispatch = useDispatch()
    const theme = useSelector((state) => state.settings.theme);
    const currentTheme = theme === "dark" ? darkTheme : lightTheme;
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if(!theme){
            const systemTheme = Appearance.getColorScheme();
            dispatch(setTheme(systemTheme || "light"));
        }
    }, []);

    return (
        <ThemeProvider theme={currentTheme}>
            <View style={{ flex: 1, backgroundColor: currentTheme.colors.background,paddingBottom: 4}}>
                <StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} /> 
                {children}
            </View>
        </ThemeProvider>
    );
    }
