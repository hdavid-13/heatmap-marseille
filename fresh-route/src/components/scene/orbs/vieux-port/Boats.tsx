/**
 * Boats — barche ormeggiate come nuvole di punti densi.
 * Orientate parallele ai moli (lungo Z). Alcune con vela.
 */
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BufferGeometry, BufferAttribute, Points, PointsMaterial, Group } from "three";

const C = {
  hull:  [0.18, 0.32, 0.52] as [n,n,n],
  hull2: [0.28, 0.18, 0.12] as [n,n,n],
  hull3: [0.15, 0.38, 0.28] as [n,n,n],
  deck:  [0.88, 0.82, 0.68] as [n,n,n],
  cabin: [0.92, 0.90, 0.85] as [n,n,n],
  mast:  [0.72, 0.62, 0.44] as [n,n,n],
  rope:  [0.60, 0.56, 0.48] as [n,n,n],
  sail:  [0.96, 0.94, 0.88] as [n,n,n], // vela bianca/crema
  sail2: [0.85, 0.72, 0.55] as [n,n,n], // vela beige/ocra
};
type n = number;

interface BoatDef {
  x: number; z: number;
  angle: number;
  length: number;
  hullColor: [n,n,n];
  hasCabin: boolean;
  hasSail: boolean;
}

function buildBoat(b: BoatDef, pts: number[], cls: number[]) {
  const { x, z, angle, length: L, hullColor, hasCabin, hasSail } = b;
  const W = L * 0.28;
  const H = L * 0.18;
  const cos = Math.cos(angle), sin = Math.sin(angle);

  function add(lx: number, ly: number, lz: number, c: [n,n,n]) {
    pts.push(x + cos*lz + sin*lx, ly, z - sin*lz + cos*lx);
    cls.push(...c);
  }

  // 1. Scafo curvo
  const sL = 12, sW = 8, sH = 5;
  for (let il = 0; il <= sL; il++) {
    const t  = il / sL;
    const lz = (t - 0.5) * L;
    const wFactor = Math.sin(t * Math.PI) * (t < 0.15 ? t / 0.15 : 1);
    const hw = W * 0.5 * wFactor;
    for (let iw = 0; iw <= sW; iw++) {
      const lx = (iw / sW - 0.5) * hw * 2;
      add(lx, H * 0.5, lz, hullColor);
      for (let ih = 1; ih <= sH; ih++) {
        add(lx * (1 - (ih/sH)*0.35), H*0.5 - (ih/sH)*H, lz, hullColor);
      }
    }
  }

  // 2. Coperta
  for (let il = 0; il <= 10; il++) {
    const t = il / 10;
    const lz = (t - 0.5) * L * 0.88;
    const hw = W * 0.42 * Math.sin(t * Math.PI);
    for (let iw = 0; iw <= 6; iw++)
      add((iw/6 - 0.5)*hw*2, H*0.52, lz, C.deck);
  }

  // 3. Cabina
  if (hasCabin) {
    const cL = L*0.30, cW = W*0.50, cH = H*0.65, cZ = L*0.05;
    for (let il = 0; il <= 5; il++)
    for (let iw = 0; iw <= 5; iw++) {
      const lx = (iw/5 - 0.5)*cW, lz2 = cZ + (il/5 - 0.5)*cL;
      add(lx, H*0.52 + cH, lz2, C.cabin);
      add(lx, H*0.52,       lz2, C.cabin);
    }
    for (let ih = 0; ih <= 4; ih++) {
      const ly = H*0.52 + (ih/4)*cH;
      add(-cW/2, ly, cZ-cL/2, C.cabin); add(cW/2, ly, cZ-cL/2, C.cabin);
      add(-cW/2, ly, cZ+cL/2, C.cabin); add(cW/2, ly, cZ+cL/2, C.cabin);
    }
  }

  // 4. Albero
  const mastH = L * (hasCabin ? 1.6 : 1.4);
  const mZ = hasCabin ? L * 0.12 : 0;
  for (let im = 0; im <= 16; im++)
    add(0, H*0.52 + (im/16)*mastH, mZ, C.mast);
  // pennone
  for (let ib = 0; ib <= 6; ib++)
    add((ib/6 - 0.5)*L*0.28*2, H*0.52 + mastH*0.85, mZ, C.mast);

  // 5. Vela — triangolo principale (randa) riempito di punti
  if (hasSail) {
    const sailColor = Math.random() < 0.6 ? C.sail : C.sail2;
    const mastTop  = H*0.52 + mastH * 0.92;
    const mastBase = H*0.52 + mastH * 0.08;
    const boomEnd  = mZ - L * 0.42; // estremità boma verso poppa

    // triangolo: apice=mastTop, base-albero=mastBase, base-boma=boomEnd
    const sailSteps = 14;
    for (let sy = 0; sy <= sailSteps; sy++) {
      const ty = sy / sailSteps;
      const lyS = mastBase + ty * (mastTop - mastBase);
      // larghezza diminuisce verso la cima
      const zFrom = mZ;
      const zTo   = mZ + (1 - ty) * (boomEnd - mZ);
      const zSteps = Math.max(2, Math.round((1-ty) * 8));
      for (let sz = 0; sz <= zSteps; sz++) {
        const lz2 = zFrom + (sz/zSteps)*(zTo - zFrom);
        // lieve curvatura della vela gonfiata dal vento
        const belly = Math.sin((sz/zSteps)*Math.PI) * W * 0.12;
        add(belly, lyS, lz2, sailColor);
      }
    }

    // vela di prua (fiocco) — piccolo triangolo davanti all'albero
    const fSteps = 8;
    for (let fy = 0; fy <= fSteps; fy++) {
      const ty  = fy / fSteps;
      const lyF = mastBase + ty * mastH * 0.6;
      const zTo2 = mZ + L * 0.35 * (1 - ty);
      const fz = Math.max(1, Math.round((1-ty)*5));
      for (let fz2 = 0; fz2 <= fz; fz2++) {
        add(0, lyF, mZ + (fz2/fz)*(zTo2 - mZ), sailColor);
      }
    }
  }

  // 6. Cime di ormeggio
  for (let ir = 0; ir <= 4; ir++) {
    const t = ir / 4;
    add(-W*0.3, H*0.4 - t*H*0.3, -L*0.45 + t*L*0.1, C.rope);
    add( W*0.3, H*0.4 - t*H*0.3, -L*0.45 + t*L*0.1, C.rope);
  }
}

// ─── Layout — tutte parallele al molo (angle 0 o PI) ─────────────────────────

const BOATS: BoatDef[] = [
  // Quai du Port (nord, X≈-1.14) — parallele al molo, lungo Z
  { x:-1.14, z:-1.0, angle:0,        length:0.38, hullColor:C.hull,  hasCabin:true,  hasSail:false },
  { x:-1.14, z:-0.5, angle:Math.PI,  length:0.30, hullColor:C.hull2, hasCabin:false, hasSail:true  },
  { x:-1.14, z: 0.0, angle:0,        length:0.34, hullColor:C.hull3, hasCabin:true,  hasSail:false },
  { x:-1.14, z: 0.5, angle:Math.PI,  length:0.26, hullColor:C.hull,  hasCabin:false, hasSail:true  },
  { x:-1.14, z: 1.0, angle:0,        length:0.36, hullColor:C.hull2, hasCabin:true,  hasSail:false },
  { x:-1.14, z: 1.4, angle:Math.PI,  length:0.28, hullColor:C.hull3, hasCabin:false, hasSail:false },
  { x:-1.14, z:-1.5, angle:0,        length:0.32, hullColor:C.hull,  hasCabin:false, hasSail:true  },

  // Quai de Rive Neuve (sud, X≈+1.14) — parallele al molo
  { x: 1.14, z:-0.8, angle:0,        length:0.36, hullColor:C.hull2, hasCabin:true,  hasSail:false },
  { x: 1.14, z:-0.3, angle:Math.PI,  length:0.28, hullColor:C.hull,  hasCabin:false, hasSail:true  },
  { x: 1.14, z: 0.2, angle:0,        length:0.32, hullColor:C.hull3, hasCabin:true,  hasSail:false },
  { x: 1.14, z: 0.7, angle:Math.PI,  length:0.26, hullColor:C.hull2, hasCabin:false, hasSail:true  },
  { x: 1.14, z: 1.2, angle:0,        length:0.34, hullColor:C.hull,  hasCabin:true,  hasSail:false },
  { x: 1.14, z:-1.3, angle:Math.PI,  length:0.30, hullColor:C.hull3, hasCabin:false, hasSail:true  },
];

function generateBoats() {
  const pts: number[] = [], cls: number[] = [];
  for (const boat of BOATS) buildBoat(boat, pts, cls);
  return { positions: new Float32Array(pts), colors: new Float32Array(cls) };
}

export function Boats({ circleTex }: { circleTex: THREE.Texture }) {
  const { positions, colors } = useMemo(generateBoats, []);
  const groupRef  = useRef<Group>(null!);
  const pointsRef = useRef<Points>(null!);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    groupRef.current.rotation.z = Math.sin(t * 0.55) * 0.012;
    groupRef.current.position.y = Math.sin(t * 0.80) * 0.006;
    if (pointsRef.current)
      (pointsRef.current.material as PointsMaterial).opacity =
        0.90 + Math.sin(t * 2.2) * 0.05;
  });

  const geo = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(positions, 3));
    g.setAttribute("color",    new BufferAttribute(colors, 3));
    return g;
  }, [positions, colors]);

  return (
    <group ref={groupRef}>
      <points ref={pointsRef} geometry={geo}>
        <pointsMaterial map={circleTex} alphaTest={0.1} size={0.030} vertexColors sizeAttenuation transparent opacity={0.92} depthWrite={false} />
      </points>
    </group>
  );
}
