import { Stack, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function EnterCodeScreen() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const inputRef = useRef<TextInput>(null);

  const canContinue = code.trim().length > 0;

  function handleContinue() {
    const value = code.trim();
    if (!value) return;
    Keyboard.dismiss();
    router.push(`/code/${encodeURIComponent(value)}`);
  }

  function clearCode() {
    setCode("");
    inputRef.current?.focus();
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#F3F4F6" }}
      behavior={Platform.select({ ios: "padding", android: undefined })}
      keyboardVerticalOffset={0}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <Image
          source={require("@/assets/images/logo-amf.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.welcome}>Seja bem-vindo ao</Text>
        <Text style={styles.title}>TRADUTOR AMF</Text>

        <Text style={styles.subtitle}>
          Digite o código da sessão ou faça a leitura do{"\n"}
          Código QR se ele estiver disponível
        </Text>

        <Text style={styles.inputLabel}>Código da sessão</Text>

        <View style={styles.inputWrapper}>
          <View style={styles.leftIcon}>
            <Text style={styles.leftIconText}>A</Text>
          </View>

          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Código da sessão"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="go"
            value={code}
            onChangeText={(t) => setCode(t.toUpperCase())}
            onSubmitEditing={handleContinue}
            accessibilityLabel="Campo para digitar o código da sessão"
          />

          {!!code && (
            <Pressable
              onPress={clearCode}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Limpar código"
              style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>×</Text>
            </Pressable>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.enterBtn,
            !canContinue ? styles.btnDisabled : styles.btnEnabled,
          ]}
          onPress={handleContinue}
          disabled={!canContinue}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canContinue }}
          accessibilityLabel="Entrar na sessão">
          <Text style={styles.enterText}>Entrar</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const BLUE = "#0B66C3";

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  logo: { width: 140, height: 140, marginBottom: 4 },
  welcome: { fontSize: 14, color: "#6B7280", marginTop: 4 },
  title: { fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 8 },
  subtitle: {
    textAlign: "center",
    color: "#4B5563",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 6,
  },

  inputLabel: {
    width: "100%",
    color: "#4B5563",
    fontSize: 13,
    marginTop: 4,
    marginBottom: -4,
  },

  inputWrapper: {
    width: "100%",
    position: "relative",
    borderWidth: 1,
    borderColor: "#3B82F6",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 44,
    paddingRight: 44,
    height: 48,
  },
  leftIcon: {
    position: "absolute",
    left: 12,
    height: 44,
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  leftIconText: { fontSize: 18, color: "#6B7280", fontWeight: "600" },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: "#111827",
  },
  clearBtn: {
    position: "absolute",
    right: 8,
    height: 32,
    width: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  clearBtnText: {
    fontSize: 22,
    lineHeight: 22,
    color: "#9CA3AF",
    marginTop: -2,
  },

  enterBtn: {
    width: "100%",
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  btnEnabled: { backgroundColor: BLUE },
  btnDisabled: { backgroundColor: "#E5E7EB" },
  enterText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },

  or: { marginVertical: 6, color: "#6B7280", fontSize: 14 },

  qrBtn: {
    width: "100%",
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BLUE,
  },
  qrBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
