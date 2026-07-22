import React, { useState } from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  View,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { Card, BodyText } from "../ThemeProvider/components";
import CustomTooltip from "../onboarding/CustomTooltip";

export const AddButton = ({
  primaryAction,
  secondaryActions = [],
  showTip,
  setShowTip,
}) => {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);

  const hasSecondary = secondaryActions.length > 0;

  const toggleMenu = () => {
    if (!hasSecondary) {
      router.push(primaryAction.route);
      return;
    }

    setMenuVisible((prev) => !prev);
  };

  const handleSelectAction = (route) => {
    setMenuVisible(false);
    router.push(route);
  };

  let tootTipTitle = "Add your first product or service"
  let tootTipDescription = "Tap + to create your first product or service."
  
  if(primaryAction.label.includes("Sale")){
    tootTipTitle = "Add your first sale"
    tootTipDescription = "Tap + to create your first sale."
  }
  if(primaryAction.label.includes("Expense")){
    tootTipTitle = "Add your first expense"
    tootTipDescription = "Tap + to create your first expense."
  }

  return (
    <View style={styles.buttonContainer}>
      <CustomTooltip
        visible={showTip}
        title={tootTipTitle}
        description={tootTipDescription}
        onClose={() => setShowTip(false)}
        horizontalAdjustment={-50}
      >
        <Pressable style={styles.button} onPress={toggleMenu}>
          <Text style={styles.text}>
            {menuVisible ? "×" : "＋"}
          </Text>
      </Pressable>
      </CustomTooltip>

      {/* Popup Menu */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        {/* Background Overlay */}
        <Pressable
          style={styles.overlay}
          onPress={() => setMenuVisible(false)}
        >
          <Card style={styles.popup}>
            <Pressable
              style={styles.menuItem}
              onPress={() => handleSelectAction(primaryAction.route)}
            >
              <BodyText style={styles.menuText}>
                {primaryAction.label}
              </BodyText>
            </Pressable>

            {/* Secondary Actions */}
            {secondaryActions.map((action) => (
              <Pressable
                key={action.route}
                style={styles.menuItem}
                onPress={() => handleSelectAction(action.route)}
              >
                <BodyText style={styles.menuText}>{action.label}</BodyText>
              </Pressable>
            ))}
          </Card>
        </Pressable>
      </Modal>
    </View>
  );
};


const styles = StyleSheet.create({
  buttonContainer: {
    position: "absolute",
    right: 20,
    bottom: 24,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#333333",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    zIndex: 20,
  },

  text: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "600",
    lineHeight: 30,
  },

  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "flex-end", 
    padding: 20,
    top:0,
  },

  popup: {
    width: 220, 
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 120, 
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },

  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
  },

  menuText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
