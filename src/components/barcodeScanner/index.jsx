import { useEffect, useState } from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";
import {
  CameraView,
  useCameraPermissions,
} from "expo-camera";

export default function BarcodeScanner({
  visible,
  onClose,
  onScan,
}) {
  const [permission, requestPermission] =
    useCameraPermissions();

  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (visible) {
      setScanned(false);
    }
  }, [visible]);

  if (!permission) {
    return null;
  }

  const handleBarcodeScanned = ({ data }) => {
    if (scanned) return;

    setScanned(true);
    onScan?.(data);
    onClose?.();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
    >
      <View style={styles.container}>
        {!permission.granted ? (
          <View style={styles.center}>
            <Text>
              Camera permission is required
            </Text>

            <TouchableOpacity
              style={styles.button}
              onPress={requestPermission}
            >
              <Text style={styles.buttonText}>
                Grant Permission
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              barcodeScannerSettings={{
                barcodeTypes: [
                  "ean13",
                  "ean8",
                  "upc_a",
                  "upc_e",
                  "code128",
                  "code39",
                  "qr",
                ],
              }}
              onBarcodeScanned={handleBarcodeScanned}
            />

            <View style={styles.overlay}>
              <View style={styles.scanBox} />

              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
              >
                <Text style={styles.closeText}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  scanBox: {
    width: 260,
    height: 180,
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: 12,
  },

  closeButton: {
    position: "absolute",
    bottom: 50,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
  },

  closeText: {
    fontWeight: "600",
  },

  button: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#000",
  },

  buttonText: {
    color: "#fff",
  },
});