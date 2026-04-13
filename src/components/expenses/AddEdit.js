import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, TouchableOpacity, Alert, ScrollView , Modal} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Card, BodyText,Input,TextArea , FormLabel, SecondaryText} from "../ThemeProvider/components";
import { useSQLiteContext } from "expo-sqlite";
import { getTransactionById, upsertTransaction } from "../../db/transactionsDb";
import { getTransactionTemplates } from "../../db/transactionsTempsDb";
import { useThemeStyles } from "../../hooks/useThemeStyles";
import CategoriesPicker from "../common/CategoriesPicker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useIsFocused } from "@react-navigation/native";

export default function AddEdit() {
  const isFocused = useIsFocused()
  const {id} = useLocalSearchParams()
  const {globalStyles} = useThemeStyles()
  const db = useSQLiteContext()
  const router = useRouter()
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "",
    category_id:"",
    type: "expense", 
    note: "",
    id:"",
    payee:"",
    date:new Date(),
    template:false,
    created_at:new Date(),
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [transactionDate, setTransactionDate] = useState(
    form.date ? new Date(form.date) : new Date()
  );
  const [templates, setTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const updated = new Date(transactionDate);
      updated.setFullYear(selectedDate.getFullYear());
      updated.setMonth(selectedDate.getMonth());
      updated.setDate(selectedDate.getDate());
      setTransactionDate(updated);
      setForm(prev => ({...prev,date:updated}))
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const updated = new Date(form.date);
      updated.setHours(selectedTime.getHours());
      updated.setMinutes(selectedTime.getMinutes());
      updated.setSeconds(selectedTime.getSeconds());
      setForm(prev => ({...prev,date:updated}))
    }
  };

  const handleCategoryChange = (selected) => {
    setForm((prev) => ({ ...prev, category_id: selected.id, category:selected.name, type:selected.type }))
  } 

const isFormValid = () => {
  console.log(form,"hello form")
  if (!form.title.trim()) {
    Alert.alert("Missing title", "Please enter a title for the transaction.");
    return false;
  }

  const amount = Number(form.amount);
  if (!form.amount || isNaN(amount) || amount <= 0) {
    Alert.alert(
      "Invalid amount",
      "Please enter a valid amount greater than 0."
    );
    return false;
  }

  if (!form.category_id) {
    Alert.alert(
      "Category required",
      "Please select a category for this transaction."
    );
    return false;
  }


  if (!["income", "expense"].includes(form.type)) {
    Alert.alert("Invalid type", "Transaction type is invalid.");
    return false;
  }

  return true;
};

  const handleUseTemplate = (template) => {
    console.log(template,"hello template")
    setForm((prev) => ({
      ...prev,
      title: template.title || "",
      amount: template.amount ? String(template.amount) : "",
      category: template.category || "",
      category_id: template.category_id || "",
      type: template.type,
      note: template.note || "",
      payee: template.payee || "",
      template:template.id,
    }));
    setShowTemplates(false);
  };



  const handleSave = async () => {
    if(!isFormValid()) return
    try {
      await upsertTransaction(db,form)
      router.push("/expenses")
    } catch (error) {
      console.log(error,"hello error creating a transaction")
    }
  }

  useEffect(() => {
    if(!id) return
    let getTransaction = async() => {
      let transaction = await getTransactionById(db,id)
      console.log(transaction,"hello trans")
      let date = transaction.date ? new Date(transaction.date) : new Date()
      setForm({...transaction,date})
    }
    getTransaction()
  },[id])

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const result = await getTransactionTemplates(db);
        setTemplates(result);
      } catch (error) {
        console.log(error,"hello error")
      }
    };

    loadTemplates();
  }, [isFocused]);


  return (
    <ScrollView style={globalStyles.container}>
      <BodyText style={globalStyles.title}>
        {id ? "Edit Transaction" : "Add Transaction"}
      </BodyText>

      <Card >

      <UseTemplateComponent 
        id={id}
        templates={templates}
        showTemplates={showTemplates}
        setShowTemplates={setShowTemplates}
        handleUseTemplate={handleUseTemplate}
        globalStyles={globalStyles}
      />
        <View style={globalStyles.formGroup}>
          <FormLabel style={styles.label}>Title</FormLabel>
          <Input
            placeholder="e.g. Groceries, Salary"
            value={form.title}
            onChangeText={(v) => handleChange("title", v)}
            style={styles.input}
          />
        </View>

        <CategoriesPicker
          form={form}
          handleCategoryChange={handleCategoryChange}
        />

        <View style={globalStyles.formGroup}>
          <FormLabel >Amount</FormLabel>
          <Input
            placeholder="0"
            keyboardType="numeric"
            value={String(form.amount)}
            onChangeText={(v) => handleChange("amount", v)}
            id={id}
          />
        </View>

        <View style={globalStyles.formGroup}>
          <FormLabel >Payee</FormLabel>
          <Input
            placeholder="Payee (e.g Landlord)"
            value={form.payee || ""}
            onChangeText={(v) => handleChange("payee", v)}
          />
        </View>

        <View style={styles.typeRow}>
          <Pressable
            onPress={() => handleChange("type", "expense")}
            style={[styles.typeButton, form.type === "expense" && styles.expenseActive]}
          >
            <Text style={[styles.typeText, form.type === "expense" && styles.activeText]}>Expense</Text>
          </Pressable>

          <Pressable
            onPress={() => handleChange("type", "income")}
            style={[styles.typeButton, form.type === "income" && styles.incomeActive]}
          >
            <Text style={[styles.typeText, form.type === "income" && styles.activeText]}>Income</Text>
          </Pressable>
        </View>

        <View style={globalStyles.formGroup}>
          <FormLabel>Date & Time</FormLabel>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={{
                flex: 1,
                paddingVertical: 8,
                paddingHorizontal: 4,
                alignItems: "center",
                ...globalStyles.formBorder
              }}
            >
              <BodyText>{form?.date?.toDateString()}</BodyText>
            </TouchableOpacity>

            {/* Time Button */}
            <TouchableOpacity
              onPress={() => setShowTimePicker(true)}
              style={{
                flex: 1,
                paddingVertical: 8,
                paddingHorizontal: 4,
                borderRadius: 14,
                alignItems: "center",
                justifyContent:"center",
                ...globalStyles.formBorder
              }}
            >
              <BodyText>
                {form?.date?.getHours().toString().padStart(2, "0")}:
                {form?.date?.getMinutes().toString().padStart(2, "0")}
              </BodyText>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={form.date}
              mode="date"
              display="calendar"
              onChange={handleDateChange}
              maximumDate={new Date()} 
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={form.date}
              mode="time"
              display="spinner"
              onChange={handleTimeChange}
            />
          )}
        </View>


        <View style={globalStyles.formGroup}>
          <FormLabel >Note (optional)</FormLabel>
          <TextArea
            placeholder="Any extra details"
            value={form.note}
            onChangeText={(v) => handleChange("note", v)}
            multiline
          />
        </View>

        <TouchableOpacity style={globalStyles.primaryBtn} onPress={handleSave}>
          <Text style={globalStyles.primaryBtnText}>
            {id ? "Update Transaction" : "Save Transaction"}
          </Text>
        </TouchableOpacity>

      </Card>
    </ScrollView>
  );
}

const UseTemplateComponent = ({id,templates, handleUseTemplate,showTemplates, setShowTemplates, globalStyles}) => {
  const router = useRouter()
  return (
    <>
      {!id &&  (
        <Pressable
          onPress={() => setShowTemplates(true)}
          style={{...globalStyles.secondaryBtn, marginBottom:10}}
        >
          <BodyText style={globalStyles.secondaryBtnTxt}>
            📋 Use Template
          </BodyText>
        </Pressable>
      )}


    <Modal
      visible={showTemplates}
      transparent
      animationType="fade"
      onRequestClose={() => setShowTemplates(false)}
    >
      <View style={styles.modalOverlay}>
        <Card style={styles.modalContent}>
          <BodyText style={styles.modalTitle}>
            Select a Template
          </BodyText>

          <Pressable
            onPress={() => {
              setShowTemplates(false);
              router.push("/expenses-templates/add");
            }}
            style={globalStyles.primaryBtn}
          >
            <BodyText style={globalStyles.primaryBtnText}>
              + Add New Template
            </BodyText>
          </Pressable>

          {templates.length === 0 && (
            <SecondaryText style={{ textAlign: "center", marginVertical: 20 }}>
              No templates yet. Create one to save time.
            </SecondaryText>
          )}

          <ScrollView>
            {templates.map((tpl) => (
              <Pressable
                key={tpl.id}
                onPress={() => handleUseTemplate(tpl)}
                style={styles.templateItem}
              >
                <BodyText style={styles.templateTitle}>
                  {tpl.title}
                </BodyText>
                <SecondaryText style={styles.templateMeta}>
                  {tpl.category || "Uncategorized"} • {tpl.type}
                </SecondaryText>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable
            onPress={() => setShowTemplates(false)}
            style={globalStyles.secondaryBtn}
          >
            <BodyText style={globalStyles.secondaryBtnTxt}>
              Cancel
            </BodyText>
          </Pressable>
        </Card>
      </View>
    </Modal>
    </>
  )
  
}

const styles = StyleSheet.create({
  header: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 4,
  },
  subHeader: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  
  typeRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
  },
  typeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  expenseActive: {
    backgroundColor: "#FF6B6B",
  },
  incomeActive: {
    backgroundColor: "#2E8B8B",
  },
  activeText: {
    color: "#FFFFFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    paddingHorizontal: 20,
},

modalContent: {
  borderRadius: 22,
  paddingVertical: 18,
  paddingHorizontal: 16,
  maxHeight: "75%",
  elevation: 10,
},

modalTitle: {
  fontSize: 17,
  fontWeight: "700",
  textAlign: "center",
  marginBottom: 14,
},

templateItem: {
  paddingVertical: 14,
  paddingHorizontal: 6,
  borderBottomWidth: 0.5,
  borderBottomColor: "#EEE",
},

templateTitle: {
  fontSize: 15,
  fontWeight: "600",
},

templateMeta: {
  fontSize: 12,
  marginTop: 4,
},

cancelBtn: {
  marginTop: 16,
  paddingVertical: 12,
  borderRadius: 14,
  alignItems: "center",
  backgroundColor: "#F4E1D2",
},

cancelText: {
  fontSize: 14,
  fontWeight: "600",
  color: "#333",
},


});