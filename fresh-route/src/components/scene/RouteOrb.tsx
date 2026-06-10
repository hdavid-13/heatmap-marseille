/**
 * RouteOrb — dispatcher modulare.
 *
 * Ogni route ha la propria cartella in orbs/:
 *   orbs/vieux-port/   → route id "1" (Vieux-Port → Parc Borély)
 *   orbs/corniche/     → route id "2" (futuro)
 *   orbs/longchamp/    → route id "3" (futuro)
 *   orbs/castellane/   → route id "4" (futuro)
 *
 * Per aggiungere un nuovo orb: crea la cartella, esporta il componente,
 * e aggiungi la voce in ORB_MAP qui sotto.
 */

import { VieuxPortOrb } from "./orbs/vieux-port";
import { GenericOrb }   from "./orbs/GenericOrb";
import type { DemoRoute } from "../../types";

interface RouteOrbProps {
  position: [number, number, number];
  isActive: boolean;
  route: DemoRoute;
  onTap?: () => void;
}

// ─── Mappa route → componente orb ────────────────────────────────────────────
// Aggiungere qui i nuovi orb man mano che vengono modellati

type OrbComponent = React.ComponentType<{ isActive: boolean; onTap?: () => void; color?: string }>;

const ORB_MAP: Record<string, OrbComponent> = {
  "1": VieuxPortOrb,
  // "2": CornichemOrb,
  // "3": LongchampOrb,
  // "4": CastellaneOrb,
};

// ─── Wrapper con posizione nel carousel ──────────────────────────────────────

export function RouteOrb({ position, isActive, route, onTap }: RouteOrbProps) {
  const OrbComponent = ORB_MAP[route.id] ?? GenericOrb;

  const badgeColor =
    route.badge === "cool" ? "#22c55e" :
    route.badge === "warm" ? "#f59e0b" : "#ef4444";

  return (
    <group position={position}>
      <pointLight color={badgeColor} intensity={isActive ? 1.5 : 0.3} distance={5} />
      <OrbComponent isActive={isActive} onTap={onTap} color={badgeColor} />
    </group>
  );
}
