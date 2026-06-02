import { Modal, Pressable, View } from "react-native";
import { BodyText } from "../ThemeProvider/components";
import { useState } from "react";

const FilterComponent = ({ filterOptions, activeFilter }) => {
  const [open, setOpen] = useState(false);

  const activeLabel =
    filterOptions.find((o) => o.key === activeFilter)?.label || "Filter";

  const handleSelect = (option) => {
    option.action();
    setOpen(false);
  };

  return (
    <View style={styles.container}>
      {/* Trigger */}
      <Pressable
        onPress={() => setOpen(true)}
        style={styles.trigger}
      >
        <BodyText style={styles.triggerText}>
          Filter: {activeLabel} ▾
        </BodyText>
      </Pressable>

      {/* MODAL */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
      >
        {/* Backdrop */}
        <Pressable
          style={styles.backdrop}
          onPress={() => setOpen(false)}
        >
          {/* Dropdown */}
          <View style={styles.dropdown}>
            {filterOptions.map((option) => (
              <Pressable
                key={option.key}
                onPress={() => handleSelect(option)}
                style={[
                  styles.option,
                  activeFilter === option.key && styles.activeOption,
                ]}
              >
                <BodyText
                  style={{
                    color:
                      activeFilter === option.key ? "#fff" : "#333",
                  }}
                >
                  {option.label}
                </BodyText>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export default FilterComponent;

const styles = {
  container: {},

  trigger: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#F4E1D2",
    alignSelf: "flex-start",
  },

  triggerText: {
    color: "#333",
  },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.15)",
    justifyContent: "flex-start",
    paddingTop: 120, // adjust to align under trigger
    paddingLeft: 20,
  },

  dropdown: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
    minWidth: 160,
    elevation: 10,
  },

  option: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  activeOption: {
    backgroundColor: "#2E8B8B",
  },
};