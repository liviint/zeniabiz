import { View, TouchableOpacity } from "react-native";
import { BodyText, SecondaryText } from "../ThemeProvider/components";

export default function CustomTooltip({
  handleNext,
  handleStop,
  isLastStep,
  currentStep,
}) {
  return (
    <View
      style={{
        backgroundColor: "white",
        padding: 16,
        borderRadius: 16,
      }}
    >
      <BodyText>{currentStep?.text}</BodyText>

      <TouchableOpacity
        onPress={isLastStep ? handleStop : handleNext}
        style={{ marginTop: 16 }}
      >
        <SecondaryText>
          {isLastStep ? "Got it" : "Next"}
        </SecondaryText>
      </TouchableOpacity>
    </View>
  );
}