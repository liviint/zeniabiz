import { useMemo } from "react";
import { useSelector } from "react-redux";
import { lightTheme, darkTheme } from "../styles/theme";
import { createGlobalStyles } from "../styles/global";

export const useThemeStyles = () => {
    const theme = useSelector((state) => state.settings.theme);
    const colors = theme === "light" ? lightTheme.colors : darkTheme.colors;

    const styles = useMemo(() => createGlobalStyles(colors), [theme]);

    return { globalStyles:styles, colors };
};
