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
                contentContainerStyle={styles.modalContainer}
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
        justifyContent: 'center',
        alignItems: 'center', 
        padding: 16,
        paddingBottom:50,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalCard: {
        width: '100%',
        maxWidth: 500,
        padding: 16,
    },
});