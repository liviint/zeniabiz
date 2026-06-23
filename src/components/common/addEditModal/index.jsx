import {
    Modal,
    StyleSheet
} from "react-native";
import {
    Card,
} from "../../ThemeProvider/components";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

const AddEditModal = ({
    children,
    visible,
    onClose
}) => {

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <KeyboardAwareScrollView
                contentContainerStyle={{...styles.modalContainer, paddingBottom: 150}}
                enableOnAndroid
                extraScrollHeight={20}
                keyboardShouldPersistTaps="handled"
            >
                <Card style={styles.modalCard}>
                    {children}
                </Card>
            </KeyboardAwareScrollView>
        </Modal>
    );
};

export default AddEditModal;

const styles = StyleSheet.create({
    modalContainer: {
        flexGrow: 1,
        justifyContent: "center",
        padding: 16,
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalCard: {
        padding: 16,
    },
});