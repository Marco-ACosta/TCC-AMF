import { Stack, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";

export default function EnterCodeScreen() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const inputRef = useRef<TextInput>(null);

  function handleContinue() {
    const value = code.trim();
    if (!value) return;
    Keyboard.dismiss();
    router.push(`/code/${encodeURIComponent(value)}`);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.select({ ios: "padding", android: undefined })}>
      <Stack.Screen options={{ title: "Entrar com código" }} />

      <div style={styles.container}>
        <div style={styles.title}>Digite o código</div>

        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Ex.: AB12CD"
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="go"
          value={code}
          onChangeText={setCode}
          onSubmitEditing={handleContinue}
          accessibilityLabel="Campo para digitar o código da sala"
        />

        <TouchableOpacity
          style={[styles.button, !code.trim() && styles.buttonDisabled]}
          onPress={handleContinue}
          activeOpacity={0.85}
          disabled={!code.trim()}>
          <div style={styles.buttonText}>Continuar</div>
        </TouchableOpacity>
      </div>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { marginBottom: 4 },
  input: {
    width: "100%",
    fontSize: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
  },
  button: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0a7ea4",
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { textAlign: "center" },
});
