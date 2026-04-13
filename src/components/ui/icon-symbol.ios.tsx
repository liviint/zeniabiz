import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

// Type alias for Material Icon names, for clarity
type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"];

// 1. Define MAPPING first without a type assertion.
// This allows TypeScript to infer its keys: 'house.fill' | 'paperplane.fill' | ...
const MAPPING = {
  "paperplane.fill": "send" as MaterialIconName,
  "chevron.left.forwardslash.chevron.right": "code" as MaterialIconName,
  "chevron.right": "chevron-right" as MaterialIconName,
  "text.bubble.fill": "forum" as MaterialIconName,
  "book.fill": "book" as MaterialIconName,
  category: "category" as MaterialIconName,
  "arrow-right": "arrow-right" as MaterialIconName,
  stock: "inventory" as MaterialIconName,
  sales: "point-of-sale" as MaterialIconName,
  expenses: "receipt-long" as MaterialIconName,
};

// 2. Define IconSymbolName using the *inferred* keys of MAPPING.
// This is now correct: IconSymbolName = 'house.fill' | 'paperplane.fill' | 'chevron.left.forwardslash.chevron.right' | ... (7 keys)
type IconSymbolName = keyof typeof MAPPING;

// The original IconMapping type is no longer needed but is left for context
// type IconMapping = Record<SymbolViewProps['name'], MaterialIconName>;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return (
    <MaterialIcons
      color={color}
      size={size}
      name={MAPPING[name]}
      style={style}
    />
  );
}
