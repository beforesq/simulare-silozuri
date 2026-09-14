import { useMemo } from "react";
import * as THREE from "three";
import {
  CUT_THETA_LENGTH,
  CUT_THETA_START,
  SILO_H,
  SILO_R,
  SILOS,
} from "@/lib/sim/layout";
import { envAt } from "@/lib/sim/timeline";
import { useSimStore } from "@/lib/sim/store";

/** Textură beton 256px — o singură dată, foarte lite */
function makeConcreteTexture() {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;

  // fond
  ctx.fillStyle = "#b8b3a8";
  ctx.fillRect(0, 0, size, size);

  // zgomot fin
  for (let i = 0; i < 1800; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const g = 140 + Math.random() * 60;
    ctx.fillStyle = `rgba(${g},${g - 4},${g - 12},${0.15 + Math.random() * 0.25})`;
    ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }

  // linii subțiri (aspect beton / cofraj)
  for (let i = 0; i < 14; i++) {
    ctx.strokeStyle = `rgba(90,86,80,${0.06 + Math.random() * 0.08})`;
    ctx.beginPath();
    const y = Math.random() * size;
    ctx.moveTo(0, y);
    ctx.lineTo(size, y + (Math.random() - 0.5) * 20);
    ctx.stroke();
  }

  // câteva pete mai închise
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 4 + Math.random() * 12;
    ctx.fillStyle = `rgba(70,66,60,${0.04 + Math.random() * 0.06})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 5);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 1;
  tex.needsUpdate = true;
  return tex;
}

function SiloBody({
  silo,
  cut,
  concrete,
}: {
  silo: (typeof SILOS)[0];
  cut: boolean;
  concrete: THREE.Texture;
}) {
  const isWork = silo.working;
  const opacity = isWork ? 1 : 0.25;
  const segments = isWork ? 18 : 10;
  const open = isWork && cut;
  const thetaStart = open ? CUT_THETA_START : 0;
  const thetaLength = open ? CUT_THETA_LENGTH : Math.PI * 2;

  return (
    <group position={[silo.x, 0, silo.z]}>
      {/* Corp */}
      <mesh position={[0, SILO_H / 2, 0]}>
        <cylinderGeometry
          args={[SILO_R, SILO_R, SILO_H, segments, 1, true, thetaStart, thetaLength]}
        />
        <meshStandardMaterial
          map={isWork ? concrete : undefined}
          color={isWork ? "#c9c4b8" : "#9a968f"}
          roughness={0.93}
          metalness={0.02}
          transparent={opacity < 0.95}
          opacity={opacity}
          side={THREE.DoubleSide}
          depthWrite={opacity > 0.5}
        />
      </mesh>

      {/* Capac */}
      <mesh position={[0, SILO_H + 0.22, 0]}>
        <cylinderGeometry args={[SILO_R + 0.1, SILO_R - 0.28, 0.45, 12]} />
        <meshStandardMaterial
          color="#5a6068"
          roughness={0.7}
          metalness={0.12}
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* Bază */}
      <mesh position={[0, 1.25, 0]}>
        <cylinderGeometry
          args={[SILO_R + 0.2, SILO_R + 0.26, 2.5, 12, 1, true, thetaStart, thetaLength]}
        />
        <meshStandardMaterial
          color="#d8d4cc"
          roughness={0.9}
          transparent
          opacity={isWork ? 0.9 : 0.2}
          depthWrite={isWork}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Bolțuri — doar working */}
      {isWork &&
        Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2 + 0.2;
          if (open) {
            const rel = ((a - CUT_THETA_START) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
            if (rel > CUT_THETA_LENGTH) return null;
          }
          return (
            <mesh
              key={i}
              position={[
                Math.cos(a) * (SILO_R + 0.23),
                1.1,
                Math.sin(a) * (SILO_R + 0.23),
              ]}
            >
              <boxGeometry args={[0.12, 0.12, 0.12]} />
              <meshStandardMaterial color="#2a2622" roughness={1} />
            </mesh>
          );
        })}

      {/* Interior cutaway */}
      {open && (
        <mesh position={[0, 8, 0]}>
          <cylinderGeometry
            args={[SILO_R - 0.45, SILO_R - 0.45, 14, 14, 1, true, thetaStart, thetaLength]}
          />
          <meshStandardMaterial color="#d2c4aa" roughness={1} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

export function Silos() {
  const time = useSimStore((s) => s.time);
  const cut = envAt(time).cutaway > 0.4;

  // o singură textură pentru tot scene-ul
  const concrete = useMemo(() => makeConcreteTexture(), []);

  return (
    <group>
      {SILOS.map((silo) => (
        <SiloBody key={silo.id} silo={silo} cut={cut} concrete={concrete} />
      ))}
    </group>
  );
}
