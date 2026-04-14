import { Card, BodyText, SecondaryText } from "../ThemeProvider/components";

export const StatCard = ({
  label,
  value,
  subText,
  color = "#2E8B8B",
  style = {},
  labelStyle = {},
  valueStyle = {},
  subTextStyle = {},
}) => {
  return (
    <Card style={[styles.card, style]}>
      <BodyText style={[styles.label, labelStyle]}>
        {label}
      </BodyText>

      <BodyText style={[styles.value, { color }, valueStyle]}>
        {value}
      </BodyText>

      {subText && (
        <SecondaryText style={[styles.subText, subTextStyle]}>
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
    margin: 8,
    alignItems: "center",
    elevation: 4,
  },

  label: {
    fontSize: 14,
    marginBottom: 6,
  },

  value: {
    fontSize: 26,
    fontWeight: "700",
  },

  subText: {
    fontSize: 12,
    marginTop: 4,
  },
};