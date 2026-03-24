import { useState } from "react";
import { Modal, View, Text, Pressable, StyleSheet } from "react-native";
import { useThemeStyles } from "../../hooks/useThemeStyles";

const DeleteButton = ({ handleOk, item}) => {
    const {globalStyles} = useThemeStyles()
    const [visible, setVisible] = useState(false)

    const confirmDelete = async () => {
        setVisible(false);
        if (handleOk) await handleOk();
    };

    return (
        <>
        {/* Delete Button */}
        <Pressable style={globalStyles.deleteButton} onPress={() => setVisible(true)}>
            <Text style={globalStyles.deleteText}>Delete</Text>
        </Pressable>

        {/* Modal */}
        <Modal
            animationType="fade"
            transparent
            visible={visible}
            onRequestClose={() => setVisible(false)}
        >
            <View style={styles.overlay}>
            <View style={styles.modalBox}>
                <Text style={styles.title}>Confirm Delete</Text>

                <Text style={styles.subtitle}>
                Are you sure you want to delete this {item || "item"}?
                </Text>

                <View style={styles.row}>
                <Pressable
                    style={[styles.btn, styles.cancel]}
                    onPress={() => setVisible(false)}
                >
                    <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>

                <Pressable
                    style={[styles.btn, styles.ok]}
                    onPress={confirmDelete}
                >
                    <Text style={styles.okText}>Delete</Text>
                </Pressable>
                </View>
            </View>
            </View>
        </Modal>
        </>
    );
};

export default DeleteButton;
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalBox: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    textAlign: "center",
    fontSize: 14,
    color: "#444",
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: "center",
  },
  cancel: {
    backgroundColor: "#e5e5e5",
  },
  cancelText: {
    color: "#333",
    fontWeight: "600",
  },
  ok: {
    backgroundColor: "#ff4d4d",
  },
  okText: {
    color: "#fff",
    fontWeight: "600",
  },
});
