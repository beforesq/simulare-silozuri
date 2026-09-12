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

function SiloBody({
  silo,
  cut,
}: {
  silo: (typeof SILOS)[0];
  cut: boolean;
}) {
  const isWork = silo.working;
  const opacity = isWork ? 1 : 0.25;
  const segments = isWork ? 20 : 10;
  const open = isWork && cut;
  const thetaStart = open ? CUT_THETA_START : 0;
  const thetaLength = open ? CUT_THETA_LENGTH : Math.PI * 2;

  return (
    <group position={[silo.x, 0, silo.z]}>
      {/* Corp — openEnded = fără fund solid */}
      <mesh position={[0, SILO_H / 2, 0]}>
        <cylinderGeometry
          args={[SILO_R, SILO_R, SILO_H, segments, 1, true, thetaStart, thetaLength]}
        />
        <meshStandardMaterial
          color={isWork ? "#b8b2a5" : "#9a968f"}
          roughness={0.94}
          metalness={0.02}
          transparent={opacity < 0.95}
          opacity={opacity}
          side={THREE.DoubleSide}
          depthWrite={opacity > 0.5}
        />
      </mesh>

      {/* Capac închis */}
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

      {/* Bază deschisă */}
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

      {/* Bolțuri — doar working, 8 buc */}
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
  const cut = true;   // forțat

  return (
    <group>
      {SILOS.map((silo) => (
        <SiloBody key={silo.id} silo={silo} cut={cut} />
      ))}
    </group>
  );
}