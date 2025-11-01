import RoomService from "@/services/api/RoomService";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Language = { code: string; name: string };
type Speaker = {
  name: string;
  bio?: string | null;
  user_id: number | string;
  languages: Language[];
};
type Pair = { source: Language; target: Language };
type Translator = { name: string; user_id: number | string; pairs: Pair[] };

type RoomDetails = {
  id: number | string;
  code: string;
  name: string;
  description?: string | null;
  speakers: Speaker[];
  translators: Translator[];
};

type LanguageOption = { code: string; name: string; label: string };

export default function CodeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code?: string }>();
  const roomCode = useMemo(() => String(code ?? "").trim(), [code]);

  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState<RoomDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedBio, setExpandedBio] = useState<Record<string, boolean>>({});

  const languageOptions = useMemo<LanguageOption[]>(() => {
    const map = new Map<string, LanguageOption>();

    room?.speakers?.forEach((sp) => {
      sp.languages?.forEach((l) => {
        if (!l?.code) return;
        const label = `${l.name} (Original)`;
        const prev = map.get(l.code);
        if (!prev) map.set(l.code, { code: l.code, name: l.name, label });
        else if (!prev.label.includes("(Original)")) {
          map.set(l.code, { ...prev, label });
        }
      });
    });

    room?.translators?.forEach((tr) => {
      tr.pairs?.forEach((p) => {
        const t = p?.target;
        if (!t?.code) return;
        if (!map.has(t.code))
          map.set(t.code, { code: t.code, name: t.name, label: t.name });
      });
    });

    return Array.from(map.values());
  }, [room]);

  const [selectedLang, setSelectedLang] = useState<LanguageOption | null>(null);
  useEffect(() => {
    if (!selectedLang && languageOptions.length) {
      setSelectedLang(languageOptions[0]);
    }
  }, [languageOptions, selectedLang]);

  const toggleBio = (key: string) =>
    setExpandedBio((s) => ({ ...s, [key]: !s[key] }));

  const fetchRoom = useCallback(async () => {
    if (!roomCode) {
      setRoom(null);
      setError("Código ausente.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await RoomService.GetByCode(roomCode);
      const data = (res?.Data ?? res) as RoomDetails | null;
      if (!data || !data.code) {
        setRoom(null);
        setError("Sessão não encontrada para este código.");
      } else {
        setRoom(data);
      }
    } catch (e: any) {
      setRoom(null);
      setError(e?.message ?? "Falha ao carregar os dados da sessão.");
    } finally {
      setLoading(false);
    }
  }, [roomCode]);

  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  function handleStart() {
    if (!room || !selectedLang) return;
    router.push(
      `/code/${room.code}/listen?lang=${encodeURIComponent(selectedLang.code)}`
    );
  }

  const [sheetVisible, setSheetVisible] = useState(false);
  const [tempLang, setTempLang] = useState<LanguageOption | null>(null);
  const sheetAnim = useRef(new Animated.Value(0)).current;

  function openSheet() {
    setTempLang(selectedLang);
    setSheetVisible(true);
    Animated.timing(sheetAnim, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }

  function closeSheet(apply = false) {
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        if (apply && tempLang) setSelectedLang(tempLang);
        setSheetVisible(false);
      }
    });
  }

  const overlayOpacity = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.4],
  });

  const translateY = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });

  const safePadBottom = Math.max(16, insets.bottom + 16);

  return (
    <View style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
      <Stack.Screen options={{ title: "Detalhes da sessão" }} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 10, color: "#6B7280" }}>Carregando…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary]}
            onPress={fetchRoom}>
            <Text style={styles.btnPrimaryText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : !room ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Nenhum dado para mostrar.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <View style={styles.headerCard}>
            <Text style={styles.roomName}>{room.name}</Text>
            {!!room.description && (
              <Text style={styles.description}>{room.description}</Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Palestrantes</Text>

            {room.speakers?.length ? (
              room.speakers.map((sp, idx) => {
                const key = String(sp.user_id ?? idx);
                const isExpanded = !!expandedBio[key];
                const hasBio = !!(sp.bio && sp.bio.trim());

                return (
                  <View key={key} style={styles.speakerBlock}>
                    <View style={styles.row}>
                      <Text style={styles.rowLeft}>{sp.name}</Text>
                      <Text style={styles.rowRight}>
                        {sp.languages?.map((l) => l.name).join(", ")}
                      </Text>
                    </View>

                    <View style={styles.bioBox}>
                      <Text style={styles.bioLabel}>Bio</Text>
                      {hasBio ? (
                        <>
                          <Text
                            style={styles.bioText}
                            numberOfLines={isExpanded ? undefined : 2}
                            ellipsizeMode="tail">
                            {sp.bio}
                          </Text>
                          {sp.bio && sp.bio?.length > 100 && (
                            <Pressable
                              onPress={() => toggleBio(key)}
                              hitSlop={8}
                              style={styles.bioToggle}>
                              <Text style={styles.bioToggleText}>
                                {isExpanded ? "Ver menos" : "Ver mais"}
                              </Text>
                            </Pressable>
                          )}
                        </>
                      ) : (
                        <Text style={styles.bioEmpty}>Sem bio informada.</Text>
                      )}
                    </View>
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptyText}>
                Sem palestrantes cadastrados.
              </Text>
            )}
          </View>

          <View style={styles.footerCard}>
            <Text style={styles.footerTitle}>
              Selecione o idioma disponível para esta sessão:
            </Text>

            <Pressable
              onPress={openSheet}
              style={styles.selectBox}
              android_ripple={{ color: "#e5e7eb" }}>
              <Text
                style={[
                  styles.selectText,
                  !selectedLang && { color: "#9CA3AF" },
                ]}>
                {selectedLang?.label ?? "Selecione um idioma"}
              </Text>
              <Text style={styles.selectChevron}>▾</Text>
            </Pressable>

            <TouchableOpacity
              onPress={handleStart}
              disabled={!selectedLang}
              style={[
                styles.btn,
                styles.btnPrimary,
                !selectedLang && { opacity: 0.6 },
              ]}>
              <Text style={styles.btnPrimaryText}>Iniciar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {sheetVisible && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Animated.View
            style={[styles.overlay, { opacity: overlayOpacity }]}
          />
          <Animated.View
            style={[
              styles.sheet,
              {
                transform: [{ translateY }],
                paddingBottom: safePadBottom,
              },
            ]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Áudio</Text>
              <Pressable hitSlop={10} onPress={() => closeSheet(false)}>
                <Text style={styles.sheetClose}>✕</Text>
              </Pressable>
            </View>

            <Text style={styles.sheetSubtitle}>
              Selecione uma linguagem disponível para o áudio da sessão:
            </Text>

            <ScrollView
              style={{ maxHeight: 300 }}
              keyboardShouldPersistTaps="handled">
              {languageOptions.length === 0 ? (
                <Text style={styles.optionRow}>Nenhum idioma disponível.</Text>
              ) : (
                languageOptions.map((opt) => {
                  const checked = tempLang?.code === opt.code;
                  return (
                    <Pressable
                      key={opt.code}
                      onPress={() => setTempLang(opt)}
                      style={({ pressed }) => [
                        styles.optionRow,
                        pressed && { backgroundColor: "#F3F4F6" },
                      ]}>
                      <Text style={styles.optionText}>{opt.label}</Text>
                      <View
                        style={[
                          styles.radioOuter,
                          checked && styles.radioOuterActive,
                        ]}>
                        {checked && <View style={styles.radioInner} />}
                      </View>
                    </Pressable>
                  );
                })
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, { marginTop: 16 }]}
              onPress={() => closeSheet(true)}>
              <Text style={styles.btnPrimaryText}>Salvar</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const BLUE = "#0B66C3";

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 28, gap: 16 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 24,
  },
  errorText: { color: "#B91C1C", textAlign: "center" },

  headerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  roomName: { fontSize: 20, fontWeight: "700", color: "#111827" },
  description: { marginTop: 10, color: "#4B5563", lineHeight: 20 },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    textAlign: "center",
  },

  speakerBlock: { paddingVertical: 6 },

  row: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  rowLeft: { color: "#111827", fontWeight: "600" },
  rowRight: { color: "#374151", fontWeight: "600" },

  bioBox: {
    marginTop: 2,
    marginHorizontal: 14,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  bioLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  bioText: { color: "#374151", lineHeight: 20, fontSize: 14 },
  bioEmpty: { color: "#9CA3AF", fontStyle: "italic" },
  bioToggle: { alignSelf: "flex-start", marginTop: 6 },
  bioToggleText: { color: BLUE, fontWeight: "700" },

  emptyText: { color: "#6B7280", paddingHorizontal: 14, paddingVertical: 8 },

  footerCard: {
    marginTop: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 14,
  },
  footerTitle: { fontSize: 14, color: "#374151" },

  selectBox: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  selectText: { flex: 1, fontSize: 16, color: "#111827" },
  selectChevron: { fontSize: 16, color: "#6B7280" },

  actions: { gap: 12, marginTop: 4 },
  btn: {
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: { backgroundColor: BLUE },
  btnPrimaryText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  btnOutline: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: BLUE },
  btnOutlineText: { color: BLUE, fontWeight: "700", fontSize: 16 },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 14,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 4,
  },
  sheetTitle: { flex: 1, fontSize: 16, fontWeight: "700", color: "#111827" },
  sheetClose: { fontSize: 18, color: "#6B7280" },
  sheetSubtitle: { color: "#6B7280", marginBottom: 10 },

  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  optionText: { fontSize: 16, color: "#111827" },

  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#9CA3AF",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterActive: { borderColor: BLUE },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BLUE,
  },
});
