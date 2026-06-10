import { Suspense, useRef, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Platform,
  ActivityIndicator, PanResponder,
} from "react-native";
import { useRouter, useIsFocused } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Canvas } from "@react-three/fiber";
import { RouteCarouselScene } from "@/components/scene/RouteCarouselScene";
import { colors, heat } from "@/theme";
import { useRoute } from "@/hooks/useRoute";
import { DEMO_ROUTES } from "@/data/demoRoutes";
import type { DemoRoute } from "@/types";

// ─── Dot indicators ───────────────────────────────────────────────────────────

function DotRow({ total, active }: { total: number; active: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[styles.dot, i === active && styles.dotActive]} />
      ))}
    </View>
  );
}

// ─── Bottom info card ─────────────────────────────────────────────────────────

function RouteInfoCard({
  route,
  loading,
  onNavigate,
}: {
  route: DemoRoute;
  loading: boolean;
  onNavigate: () => void;
}) {
  const h = heat[route.badge];
  return (
    <View style={styles.card}>
      <View style={[styles.badge, { backgroundColor: h.bg, borderColor: h.color }]}>
        <Text style={[styles.badgeText, { color: h.color }]}>
          {h.emoji}  {h.label.toUpperCase()}
        </Text>
      </View>

      <Text style={styles.routeName}>{route.name}</Text>
      <Text style={styles.routeDesc}>{route.description}</Text>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{route.distance}</Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: h.color }]}>
            {Math.round(route.freshScore * 100)}%
          </Text>
          <Text style={styles.statLabel}>Fresh score</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{route.highlights.length}</Text>
          <Text style={styles.statLabel}>Highlights</Text>
        </View>
      </View>

      <View style={styles.tagsRow}>
        {route.highlights.map((tag) => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.cta, { backgroundColor: h.color }]}
        onPress={onNavigate}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading
          ? <ActivityIndicator color="#fff" size="small" />
          : <Text style={styles.ctaText}>Navigate  →</Text>}
      </TouchableOpacity>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const { loading, calculateFromDemo } = useRoute();
  const [currentIndex, setCurrentIndex] = useState(0);
  // Ref shared with Three.js useFrame — avoids React re-renders on every gesture frame
  const panOffsetRef = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, { dx }) => Math.abs(dx) > 8,
      onPanResponderMove: (_, { dx }) => { panOffsetRef.current = dx; },
      onPanResponderRelease: (_, { dx }) => {
        if (dx < -60) setCurrentIndex((i) => Math.min(i + 1, DEMO_ROUTES.length - 1));
        else if (dx > 60) setCurrentIndex((i) => Math.max(i - 1, 0));
        panOffsetRef.current = 0;
      },
    })
  ).current;

  const currentRoute = DEMO_ROUTES[currentIndex];
  const navigatingRef = useRef(false);

  const handleOrbTap = async (route: DemoRoute) => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    try {
      const result = await calculateFromDemo(route);
      router.push({
        pathname: "/route-detail",
        params: { data: JSON.stringify(result), name: route.name },
      });
    } finally {
      navigatingRef.current = false;
    }
  };

  if (!currentRoute) return null;

  return (
    <View style={styles.root} {...panResponder.panHandlers}>

      {/* ── 3D Canvas (non-interactive, gesture handled by panResponder above) ── */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Canvas
          key={isFocused ? "focused" : "blurred"}
          camera={{ position: [0, 0, 7], fov: 48 }}
          gl={{ antialias: true }}
          style={{ flex: 1 }}
        >
          <Suspense fallback={null}>
            <RouteCarouselScene
              routes={DEMO_ROUTES}
              currentIndex={currentIndex}
              panOffsetRef={panOffsetRef}
              onTap={handleOrbTap}
            />
          </Suspense>
        </Canvas>
      </View>

      {/* ── UI Overlay ── */}
      <SafeAreaView style={styles.safe} pointerEvents="box-none">

        {/* Top bar */}
        <View style={styles.topBar} pointerEvents="box-none">
          <Text style={styles.city}>MARSEILLE</Text>
          <View pointerEvents="auto">
            <TouchableOpacity
              style={styles.heatBtn}
              onPress={() => router.push("/heatmap")}
              activeOpacity={0.8}
            >
              <Text style={styles.heatBtnText}>Heat map</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tap hint */}
        <Text style={styles.tapHint}>Tap the orb to navigate</Text>

        {/* Dots */}
        <DotRow total={DEMO_ROUTES.length} active={currentIndex} />

        {/* Spacer — orb lives in 3D canvas */}
        <View style={{ flex: 1 }} pointerEvents="none" />

        {/* Bottom card */}
        <View pointerEvents="auto">
          <RouteInfoCard
            route={currentRoute}
            loading={loading}
            onNavigate={() => handleOrbTap(currentRoute)}
          />
        </View>

        <Text style={styles.swipeHint}>← swipe to explore →</Text>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#080f08" },
  safe: { flex: 1 },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "web" ? 16 : 6,
  },
  city: { color: colors.primary, fontWeight: "800", fontSize: 13, letterSpacing: 3 },
  heatBtn: {
    borderWidth: 1, borderColor: colors.cardBorder,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
  },
  heatBtnText: { color: colors.textSub, fontSize: 12, fontWeight: "600" },

  tapHint: {
    textAlign: "center", color: colors.textDim,
    fontSize: 12, letterSpacing: 0.5, marginTop: 8,
  },

  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textMuted },
  dotActive: { width: 20, borderRadius: 3, backgroundColor: colors.primary },

  swipeHint: {
    textAlign: "center", color: colors.textDim,
    fontSize: 11, letterSpacing: 0.5,
    paddingVertical: Platform.OS === "web" ? 12 : 6,
  },

  card: {
    marginHorizontal: 16,
    backgroundColor: "rgba(13,31,15,0.92)",
    borderRadius: 28, borderWidth: 1, borderColor: colors.cardBorder,
    padding: 20, gap: 10,
  },
  badge: {
    alignSelf: "flex-start", borderWidth: 1,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  badgeText: { fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  routeName: { fontSize: 22, fontWeight: "800", color: colors.text, lineHeight: 28 },
  routeDesc: { fontSize: 13, color: colors.textSub, lineHeight: 18 },

  statsRow: { flexDirection: "row", alignItems: "center" },
  stat: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 17, fontWeight: "800", color: colors.text },
  statLabel: { fontSize: 10, color: colors.textDim, marginTop: 2, letterSpacing: 0.5 },
  statDivider: { width: 1, height: 30, backgroundColor: colors.cardBorder },

  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: {
    backgroundColor: colors.surface, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: colors.border,
  },
  tagText: { fontSize: 11, color: colors.textDim },

  cta: {
    borderRadius: 16, padding: 16, alignItems: "center",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 14, elevation: 8,
  },
  ctaText: { color: "#fff", fontWeight: "800", fontSize: 15, letterSpacing: 0.5 },
});
