"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Float, Lightformer, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { DesignTokens } from "@/lib/templates/tokens";

function cardTexture(t: DesignTokens, title: string, kind: number): THREE.CanvasTexture {
  const w = 512;
  const h = 640;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = kind === 1 ? t.primary : t.bg;
  ctx.fillRect(0, 0, w, h);
  const ink = kind === 1 ? t.bg : t.fg;
  ctx.strokeStyle = t.accent;
  ctx.lineWidth = 3;
  ctx.strokeRect(22, 22, w - 44, h - 44);
  ctx.lineWidth = 1.5;
  for (let r = 40; r <= 110; r += 22) {
    ctx.beginPath();
    ctx.arc(w / 2, 170, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = t.accent;
  ctx.fillRect(w / 2 - 60, 330, 120, 4);
  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.font = `600 54px "${t.headingFont}", serif`;
  const words = title.split(" ");
  const lines = [words.slice(0, Math.ceil(words.length / 2)).join(" "), words.slice(Math.ceil(words.length / 2)).join(" ")];
  lines.forEach((line, i) => ctx.fillText(line, w / 2, 410 + i * 62));
  ctx.font = `700 24px "${t.bodyFont}", sans-serif`;
  ctx.fillStyle = t.accent;
  ctx.fillText(t.shortName.toUpperCase(), w / 2, 570);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function logoTexture(t: DesignTokens): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = t.primary;
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = t.accent;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(128, 128, 112, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = t.accent;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `600 96px "${t.headingFont}", serif`;
  ctx.fillText(t.monogram, 128, 134);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function Rig({ children, still }: { children: React.ReactNode; still: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    const g = ref.current;
    if (!g || still) return;
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, state.pointer.x * 0.35, 0.06);
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, -state.pointer.y * 0.2, 0.06);
  });
  return <group ref={ref}>{children}</group>;
}

export default function HeroScene({ tokens, still }: { tokens: DesignTokens; still: boolean }) {
  const textures = useMemo(
    () => [cardTexture(tokens, "Festive greeting", 0), cardTexture(tokens, "Planning tips", 1), cardTexture(tokens, "Portfolio showcase", 0)],
    [tokens],
  );
  const logo = useMemo(() => logoTexture(tokens), [tokens]);
  const swatches = [tokens.primary, tokens.secondary, tokens.bg];

  return (
    <Canvas camera={{ position: [0, 0.2, 6.6], fov: 38 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 5]} intensity={1.4} />
      <Environment resolution={64}>
        <Lightformer form="rect" intensity={2.2} position={[0, 3, 4]} scale={[9, 4, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[-5, 0, 2]} scale={[2, 6, 1]} />
      </Environment>
      <Rig still={still}>
        <Float speed={still ? 0 : 1.4} rotationIntensity={still ? 0 : 0.35} floatIntensity={still ? 0 : 0.8}>
          {textures.map((tex, i) => (
            <group key={i} position={[(i - 1) * 0.85, i * 0.12 - 0.1, -i * 0.5]} rotation={[0, (1 - i) * 0.22, (i - 1) * -0.05]}>
              <RoundedBox args={[2.1, 2.62, 0.07]} radius={0.07} smoothness={4}>
                <meshStandardMaterial color={tokens.bg} roughness={0.5} metalness={0.05} />
              </RoundedBox>
              <mesh position={[0, 0, 0.041]}>
                <planeGeometry args={[2.04, 2.55]} />
                <meshBasicMaterial map={tex} toneMapped={false} />
              </mesh>
            </group>
          ))}
        </Float>
        {swatches.map((c, i) => (
          <Float key={c + i} speed={still ? 0 : 1.8 + i * 0.3} floatIntensity={still ? 0 : 1.2}>
            <mesh position={[-2.5 + i * 0.5, -1.1 + i * 0.55, 0.6 + i * 0.2]}>
              <sphereGeometry args={[0.26, 48, 48]} />
              <meshStandardMaterial color={c} roughness={0.25} metalness={0.3} />
            </mesh>
          </Float>
        ))}
        <Float speed={still ? 0 : 1.2} floatIntensity={still ? 0 : 0.9}>
          <mesh position={[2.6, 0.9, 0.9]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.5, 0.5, 0.1, 64]} />
            <meshStandardMaterial map={logo} roughness={0.35} metalness={0.2} />
          </mesh>
        </Float>
      </Rig>
      <ContactShadows position={[0, -1.9, 0]} opacity={0.45} scale={9} blur={2.6} far={4} />
    </Canvas>
  );
}
