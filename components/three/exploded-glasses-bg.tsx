"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, Lightformer, AdaptiveDpr } from "@react-three/drei";
import * as THREE from "three";

const MODEL_URL = "/models/hybride.glb";

/**
 * Monture 3D en « vue éclatée » respirante, utilisée en ARRIÈRE-PLAN (faible
 * opacité) pour habiller les sections vides. Chaque maille s'écarte du centre
 * puis revient, en rotation lente. R3F — à importer en ssr:false.
 */
function ExplodedModel({ modelUrl }: { modelUrl: string }) {
  const { scene } = useGLTF(modelUrl);
  const group = useRef<THREE.Group>(null);

  // Clone : useGLTF partage la scène en cache. Comme on mute les positions des
  // mailles à chaque frame (éclatement), il FAUT notre propre copie, sinon on
  // casse les autres rendus de ce modèle (ex. le fil rouge 3D).
  const clone = useMemo(() => scene.clone(true), [scene]);

  const data = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    clone.position.sub(center);
    clone.updateMatrixWorld(true);

    const parts: { mesh: THREE.Mesh; base: THREE.Vector3; dir: THREE.Vector3 }[] = [];
    clone.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const wc = new THREE.Vector3();
      m.getWorldPosition(wc);
      const dir = wc.lengthSq() > 1e-6 ? wc.clone().normalize() : new THREE.Vector3(0, 0, 1);
      parts.push({ mesh: m, base: m.position.clone(), dir });
    });
    return { parts, scale: 3.2 / maxDim };
  }, [clone]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const amount = (Math.sin(t * 0.35) * 0.5 + 0.5) * 0.9; // respiration 0 → 0.9
    for (const p of data.parts) {
      p.mesh.position.copy(p.base).addScaledVector(p.dir, amount);
    }
    if (group.current) {
      group.current.rotation.y = t * 0.14;
      group.current.rotation.x = -0.15 + Math.sin(t * 0.2) * 0.1;
    }
  });

  return (
    <group ref={group} scale={data.scale}>
      <primitive object={clone} />
    </group>
  );
}

export function ExplodedScene({ modelUrl = MODEL_URL }: { modelUrl?: string }) {
  return (
    <Canvas
      camera={{ position: [0, 0.3, 7], fov: 34 }}
      dpr={[1, 1.6]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ width: "100%", height: "100%" }}
    >
      <AdaptiveDpr pixelated />
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 6, 5]} intensity={1.1} />
      <directionalLight position={[-6, 2, -2]} intensity={0.5} color="#276cff" />
      <Suspense fallback={null}>
        <ExplodedModel modelUrl={modelUrl} />
        <Environment resolution={128}>
          <Lightformer intensity={2} position={[0, 4, -6]} scale={[12, 12, 1]} />
          <Lightformer intensity={1} color="#4d8cff" position={[-6, 1, -1]} scale={[4, 6, 1]} />
          <Lightformer intensity={0.9} color="#ff7a3d" position={[6, 1, 1]} scale={[4, 6, 1]} />
        </Environment>
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);
