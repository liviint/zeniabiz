import { StyleSheet } from "react-native";

export const createGlobalStyles = (colors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      flex: 1,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },

    content: {
      paddingHorizontal: 16,
    },

    title: {
      textAlign: "center",
      fontFamily: "Poppins-Bold",
      fontWeight: "700",
      fontSize: 24,
      color: colors.primary,
      marginBottom: 16,
    },
    subTitle: {
      fontFamily: 'Inter-Regular',
      fontSize: 18,
      marginBottom: 20,
      textAlign: 'center',
    },
    body: {
      fontSize: 16,
      color: colors.text,
    },

    addButton: {
      flex: 1,
      backgroundColor: colors.primary,
      paddingVertical: 12,
      borderRadius: 12,
      marginRight: 8,
      alignItems: "center",
    },

    addButtonText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 16,
    },

    primaryBtn: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      marginRight: 8,
      alignItems: "center",
    },

    primaryBtnText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 16,
    },

    secondaryBtn: {
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderColor: colors.secondary,
      borderWidth: 2,
      alignItems: "center",
    },

    secondaryBtnText: {
      color: colors.secondary,
      fontWeight: "bold",
      fontSize: 16,
    },
    editBtn: {
      backgroundColor: colors.secondary + "20", 
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderColor: "#ccc",
      borderWidth: 1,
    },
    editBtnText: {
      fontSize: 12,
    },


    deleteButton: {
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 20,
      backgroundColor: colors.primary + "20", 
    },

    deleteText: {
      color: colors.primary,
      fontWeight: "600",
    },

    trackButton: {
      flex: 1,
      borderColor: colors.secondary,
      borderWidth: 2,
      paddingVertical: 12,
      borderRadius: 12,
      marginLeft: 8,
      alignItems: "center",
    },

    trackButtonText: {
      color: colors.secondary,
      fontWeight: "bold",
      fontSize: 16,
    },

    passwordWrapper: {
      position: "relative",
      width: "100%",
      marginBottom: 12,
    },

    togglePassword: {
      position: "absolute",
      right: 12,
      top: "33%",
      transform: [{ translateY: -10 }],
      padding: 6,
    },

    togglePasswordText: {
      fontSize: 20,
      color: colors.text,
    },
    formGroup: {
      marginBottom: 14,
    },
    formBorder:{
      borderWidth: 1,
      borderColor:colors.border,
      borderRadius: 10,
    },
    switchRow: {
      flexDirection: "row",
      justifyContent: "left",
      alignItems: "center",
      gap:10,
    },

  });
