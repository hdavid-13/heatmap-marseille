import { useState, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, ActivityIndicator, Animated, PanResponder, GestureResponderEvent } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import RouteMap from "@/components/routes/RouteMap";
import { colors } from "@/theme";
import { useRoute } from "@/hooks/useRoute";
import { DEMO_ROUTES } from "@/data/demoRoutes";
import type { DemoRoute } from "@/types";

export default function HeroScreen() {
  const router = useRouter();
  const { loading, calculateFromDemo } = useRoute();
  const [currentRouteIndex, setCurrentRouteIndex] = useState(0);
  const panX = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, { dx }) => Math.abs(dx) > 10,
      onPanResponderMove: (_, { dx }) => panX.setValue(dx),
      onPanResponderRelease: (_, { dx }) => {
        if (dx > 50 && currentRouteIndex > 0) {
          // Swipe right → previous route
          setCurrentRouteIndex(currentRouteIndex - 1);
          Animated.spring(panX, { toValue: 0, useNativeDriver: false }).start();
        } else if (dx < -50 && currentRouteIndex < DEMO_ROUTES.length - 1) {
          // Swipe left → next route
          setCurrentRouteIndex(currentRouteIndex + 1);
          Animated.spring(panX, { toValue: 0, useNativeDriver: false }).start();
        } else {
          // Return to original position
          Animated.spring(panX, { toValue: 0, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  const currentRoute = DEMO_ROUTES[currentRouteIndex];

  const handleGoRoute = async () => {
    const route = await calculateFromDemo(currentRoute);
    router.push({ pathname: "/route-detail", params: { data: JSON.stringify(route), name: currentRoute.name } });
  };

  const badgeColor =
    currentRoute.badge === "cool" ? colors.primary :
    currentRoute.badge === "warm" ? colors.warm :
    colors.hot;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Map Background */}
      <RouteMap
        routes={DEMO_ROUTES}
        currentRouteIndex={currentRouteIndex}
        onRouteSelect={() => {}}
      />

      {/* Overlay gradient */}
      <View style={styles.overlay} pointerEvents="none" />

      <SafeAreaView style={styles.safe} pointerEvents="box-none">
        {/* Top bar */}
        <View style={styles.topBar}>
          <Text style={styles.location}>📍 MARSEILLE</Text>
          <View style={styles.routeCounter}>
            <Text style={styles.counterText}>{currentRouteIndex + 1} / {DEMO_ROUTES.length}</Text>
          </View>
        </View>

        {/* Info panel */}
        <View style={styles.infoPanel}>
          {/* Badge */}
          <View style={[styles.badge, { borderColor: badgeColor }]}>
            <Text style={[styles.badgeText, { color: badgeColor }]}>
              {currentRoute.badge === "cool" ? "🌿 Cool"
                : currentRoute.badge === "warm" ? "☀️ Warm" : "🔥 Hot"}
            </Text>
          </View>

          {/* Route name */}
          <Text style={styles.routeName}>{currentRoute.name}</Text>
          <Text style={styles.routeDesc}>{currentRoute.description}</Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentRoute.distance}</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Math.round(currentRoute.freshScore * 100)}%</Text>
              <Text style={styles.statLabel}>Fresh Score</Text>
            </View>
          </View>

          {/* Highlights */}
          <View style={styles.tagsRow}>
            {currentRoute.highlights.map((h) => (
              <View key={h} style={styles.tag}>
                <Text style={styles.tagText}>{h}</Text>
              </View>
            ))}
          </View>

          {/* CTA Button */}
          <TouchableOpacity
            style={[styles.routeBtn, { backgroundColor: badgeColor }]}
            onPress={handleGoRoute}
            disabled={loading}
            activeOpacity={0.88}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.routeBtnText}>Navigate  →</Text>}
          </TouchableOpacity>

          {/* Swipe hint */}
          <Text style={styles.swipeHint}>← Swipe to explore other routes →</Text>
        </View>

        {/* Bottom nav */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push("/routes")} activeOpacity={0.88}>
            <Text style={styles.secondaryBtnText}>All routes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push("/heatmap")} activeOpacity={0.88}>
            <Text style={styles.secondaryBtnText}>Heat map</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a1628" },
  overlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    background: "linear-gradient(180deg, transparent 0%, rgba(10, 22, 40, 0.3) 50%, rgba(10, 22, 40, 0.9) 100%)",
  },
  safe: { flex: 1 },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "web" ? 16 : 8,
  },
  location: { color: colors.turquoise, fontWeight: "700", fontSize: 12, letterSpacing: 2 },
  routeCounter: { flexDirection: "row", alignItems: "center", gap: 6 },
  counterText: { color: colors.textSub, fontSize: 12 },

  // ── Info panel ──────────────────────────────────────────────────────────────
  infoPanel: {
    marginTop: "auto",
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 20,
    gap: 12,
  },
  badge: {
    alignSelf: "flex-start",
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  badgeText:  { fontSize: 12, fontWeight: "700" },
  routeName:   { fontSize: 24, fontWeight: "800", color: colors.text },
  routeDesc:   { fontSize: 13, color: colors.textSub, lineHeight: 18 },

  statsRow:    { flexDirection: "row", alignItems: "center", gap: 16 },
  statItem:    { alignItems: "center" },
  statValue:   { fontSize: 18, fontWeight: "800", color: colors.text },
  statLabel:   { fontSize: 11, color: colors.textDim, marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: colors.cardBorder },

  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag:     { backgroundColor: colors.surface, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: colors.border },
  tagText: { fontSize: 11, color: colors.textDim },

  routeBtn: {
    borderRadius: 14, padding: 15, alignItems: "center",
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  routeBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  swipeHint: {
    textAlign: "center",
    color: colors.textDim,
    fontSize: 12,
    marginTop: 8,
  },

  // ── Bottom nav ──────────────────────────────────────────────────────────────
  bottomNav: {
    marginTop: "auto",
    padding: 16,
    paddingBottom: 24,
    gap: 10,
    flexDirection: "row",
  },
  secondaryBtn:     { flex: 1, borderWidth: 1.5, borderColor: colors.cardBorder, borderRadius: 16, padding: 15, alignItems: "center" },
  secondaryBtnText: { color: colors.textSub, fontWeight: "500", fontSize: 15 },
});
