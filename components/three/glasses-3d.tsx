"use client";

import { Suspense, useMemo, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, Lightformer, ContactShadows, Float, AdaptiveDpr } from "@react-three/drei";
import * as THREE from "three";

const MODEL_URL = "/models/hybride.glb";

/**
 * Scène 3D réelle (React Three Fiber) — monture imprimée en 3D, rotation pilotée
 * au scroll + auto-spin, reflets de marque (Lightformers, sans dépendance réseau).
 * À importer dynamiquement avec ssr:false (R3F v8 incompatible SSR).
 */
function Model({ progress, url }: { progress: MutableRefObject<number>; url: string }) {
  const { scene } = useGLTF(url);
  const ref = useRef<THREE.Group>(null);

  // Normalise n'importe quel GLB : centré à l'origine, taille cible ~3 unités.
  const fit = useMemo(() => {
    const clone = scene;
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    clone.position.sub(center);
    clone.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
    return { scale: 3.4 / maxDim };
  }, [scene]);

  useFrame((state) => {
    if (!ref.current) return;
    const p = progress.current;
    // Rotation : pilotée au scroll (~1,5 tour) + lente rotation continue.
    ref.current.rotation.y = p * Math.PI * 3 + state.clock.elapsedTime * 0.12;
    ref.current.rotation.x = -0.12 + Math.sin(p * Math.PI) * 0.22;
    const s = fit.scale * (1 + p * 0.18);
    ref.current.scale.setScalar(s);
  });

  return (
    <group ref={ref}>
      <primitive object={scene} />
    </group>
  );
}

export function Glasses3D({
  progressRef,
  modelUrl = MODEL_URL,
}: {
  progressRef: MutableRefObject<number>;
  modelUrl?: string;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0.2, 6.2], fov: 32 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ width: "100%", height: "100%" }}
    >
      <AdaptiveDpr pixelated />
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 5]} intensity={1.3} castShadow />
      <directionalLight position={[-6, 2, -2]} intensity={0.6} color="#1557ff" />
      <pointLight position={[5, -2, 4]} intensity={0.5} color="#ff5a36" />

      <Suspense fallback={null}>
        <Float speed={1.1} rotationIntensity={0.15} floatIntensity={0.4}>
          <Model progress={progressRef} url={modelUrl} />
        </Float>
        {/* Reflets studio générés par lightformers — aucune ressource réseau */}
        <Environment resolution={256}>
          <Lightformer intensity={2.2} position={[0, 4, -6]} scale={[12, 12, 1]} />
          <Lightformer intensity={1.1} color="#4d8cff" position={[-6, 1, -1]} scale={[4, 6, 1]} />
          <Lightformer intensity={1} color="#ff7a3d" position={[6, 1, 1]} scale={[4, 6, 1]} />
          <Lightformer intensity={1.4} position={[0, -3, 2]} scale={[8, 4, 1]} />
        </Environment>
        <ContactShadows position={[0, -1.7, 0]} opacity={0.55} scale={12} blur={2.6} far={4.5} />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);
