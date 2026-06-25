import { useIsFocused } from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { api } from "../../../../api";
import { getActiveContextSync } from "../../../db/utils";
import { BodyText, Card } from "../../ThemeProvider/components";
import { getCompanyMembers, upsertCompanyMembers } from "../../../db/query/companies";

const CompanyMembers = ({ setInviteModal }) => {
    const db = useSQLiteContext();
    const isFocused = useIsFocused();
    const [members, setMembers] = useState([]);
    const [isOwner, setIsOwner] = useState(false);


    const loadBusinessData = async () => {
        const { company, user_id } = await getActiveContextSync(db);

        // Load cached members first
        const localMembers =  await getCompanyMembers(db, company);
        if (localMembers.length) {
            setMembers(localMembers);

            const owner = localMembers.find(
            (member) =>
                member.role === "owner" &&
                member.user_id === user_id
            );
            setIsOwner(!!owner);
        }

        try {
            const membersRes = await api.get("/core/company-members");

            const apiMembers = membersRes.data.results;
        
            setMembers(apiMembers);
        
            const owner = apiMembers.find(
            (member) =>
                member.role === "owner" &&
                member.user.uuid === user_id
            );

            setIsOwner(!!owner);
            await upsertCompanyMembers(db,company,apiMembers);

        } catch (err) {
            console.log(
            "Failed to load company members:",
            err?.response?.data ||
            err.message
            );
        }
    };

    useEffect(() => {
        loadBusinessData();
    }, [isFocused]);

    return (
        <Card>
            <BodyText style={styles.sectionTitle}>Company Members</BodyText>

            {members.map((item) => (
                <View key={item.id || item.uuid} style={styles.memberRow}>
                    <BodyText style={styles.memberText}>
                        {item?.user?.username || item?.username}
                    </BodyText>

                    <BodyText style={styles.role}>
                        {item.role}
                    </BodyText>
                </View>
                ))}

            {isOwner ? (
                <TouchableOpacity
                style={styles.inviteBtn}
                onPress={() => setInviteModal(true)}
                >
                <Text style={styles.inviteText}>+ Invite Member</Text>
                </TouchableOpacity>
            ) : (
                ""
            )}
        </Card>
    );
};

export default CompanyMembers;

const styles = StyleSheet.create({
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 12,
    },

    memberRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderColor: "#eee",
    },

    memberText: {
        fontSize: 14,
    },

    role: {
        fontSize: 12,
        opacity: 0.6,
    },

    inviteBtn: {
        marginTop: 12,
        padding: 10,
        backgroundColor: "#2E8B8B",
        borderRadius: 8,
        alignItems: "center",
    },

    inviteText: {
        color: "#fff",
        fontWeight: "600",
    },
});
