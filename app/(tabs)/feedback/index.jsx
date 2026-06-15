import React, { useState } from 'react';
import { View, Text,  TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { blogApi } from '../../../api';
import {useThemeStyles} from "../../../src/hooks/useThemeStyles"
import { Card, BodyText, TextArea } from '../../../src/components/ThemeProvider/components';
import { Linking } from 'react-native';

export default function FeedbackPage() {
  const {globalStyles} = useThemeStyles()
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) return;

    setLoading(true);
    try {
      await blogApi.post('feedback/', { message });
      setSubmitted(true);
      setMessage('');
    } catch (error) {
      console.error(error, 'Feedback error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={globalStyles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card >
          <BodyText style={globalStyles.title}>
            Help Improve ZeniaBiz
          </BodyText>

        <BodyText style={styles.subtitle}>
          Your feedback shapes the future of ZeniaBiz. 
        </BodyText>

          {submitted ? (
            <View style={styles.centered}>
              <Text style={styles.thankYou}>Thank you for your feedback!</Text>
              <TouchableOpacity style={styles.submitAnotherBtn} onPress={() => setSubmitted(false)}>
                <Text style={styles.submitAnotherText}>Submit Another</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TextArea
                value={message}
                onChangeText={setMessage}
                placeholder="Tell us what’s frustrating, missing, or amazing about ZeniaBiz..."
                multiline
                style={styles.textArea}
                placeholderTextColor="#888"
              />
              <BodyText style={{ fontSize: 12, opacity: 0.6, marginBottom: 10 }}>
                Tip: You can mention bugs, missing features, or ideas.
              </BodyText>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                style={[styles.submitBtn, loading && { opacity: 0.6 }]}
              >
                {loading ? (
                  <ActivityIndicator color="#FAF9F7" />
                ) : (
                  <Text style={styles.submitText}>Submit Feedback</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          <View style={{ marginTop: 20, alignItems: "center" }}>
  <BodyText style={{ fontSize: 14, marginBottom: 10 }}>
    Need direct help?
  </BodyText>

            <TouchableOpacity
              onPress={() =>
                Linking.openURL(
                  "https://wa.me/254757518703?text=Hi%20ZeniaBiz%20support"
                )
              }
              style={{ marginBottom: 10 }}
            >
              <BodyText style={{ color: "#2E8B8B", fontWeight: "600" }}>
                Chat on WhatsApp
              </BodyText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => Linking.openURL("mailto:kevinmosigisi40@gmail.com")}
            >
              <BodyText style={{ color: "#2E8B8B", fontWeight: "600" }}>
                Send Email
              </BodyText>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  
  title: {
    fontSize: 24,
    textAlign: 'center',
    fontWeight: '700',
    color: '#FF6B6B',
    marginBottom: 10,
  },
  subtitle: {
    marginBottom: 20,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  submitBtn: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitText: {
    color: '#FAF9F7',
    fontWeight: '700',
    fontSize: 16,
  },
  centered: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  thankYou: {
    fontSize: 18,
    color: '#2E8B8B',
    fontWeight: '500',
    marginBottom: 16,
  },
  submitAnotherBtn: {
    backgroundColor: '#FF6B6B',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  submitAnotherText: {
    color: '#FAF9F7',
    fontWeight: '700',
  },
});
