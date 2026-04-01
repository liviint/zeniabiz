import { Card, BodyText, SecondaryText } from "../ThemeProvider/components";

export const StatCard = ({
    label,
    value,
    subText,
    color = "#2E8B8B",
    style = {},
}) => {
    return (
        <Card style={[styles.card, style]}>
        <SecondaryText style={styles.label}>
            {label}
        </SecondaryText>

        <BodyText style={[styles.value, { color }]}>
            {value}
        </BodyText>

        {subText && (
            <SecondaryText style={styles.subText}>
            {subText}
            </SecondaryText>
        )}
        </Card>
    );
};

const styles = {
  card: {
    flex: 1,
    padding: 20,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    margin: 8,
    alignItems: "center",

    // iOS shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,

    // Android
    elevation: 4,
  },

  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
  },

  value: {
    fontSize: 26,
    fontWeight: "700",
  },

  subText: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
};