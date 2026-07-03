"use client";

import { Suspense, useMemo, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  useGLTF,
  Environment,
  Lightformer,
  ContactShadows,
  Float,
  AdaptiveDpr,
} from "@react-three/drei";
import * as THREE from "three";

const MODEL_URL = "/models/hybride.glb";

/**
 * IMPORTANT — décodeur Draco auto-hébergé.
 * Le GLB (hybride.glb) exige KHR_draco_mesh_compression. Par défaut, drei va
 * chercher le décodeur sur www.gstatic.com, que la CSP du site bloque
 * (script-src / connect-src) → le chargement échouait silencieusement et la
 * scène restait NOIRE. Les fichiers vivent désormais dans /public/draco
 * (même origine : aucun changement de CSP nécessaire).
 */
export const DRACO_DECODER_PATH = "/draco/";

/**
 * Matière « atelier » appliquée au modèle : le GLB d'origine est un plastique
 * quasi noir (baseColor ≈ 0.007) — invisible sur fond encre. On re-matérialise
 * la monture en nylon PA12 fritté (poudre off-white, mat), les charnières en
 * laiton et les verres en glace fumée légère. Matériaux partagés (3 instances).
 */
export function applyNylonStudioMaterials(root: THREE.Object3D) {
  const nylon = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#e8e5db"), // poudre PA12 brute
    roughness: 0.82,
    metalness: 0.04,
    envMapIntensity: 0.7,
  });
  const brass = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#c9a558"),
    roughness: 0.3,
    metalness: 1,
    envMapIntensity: 1.1,
  });
  const lens = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#233043"),
    roughness: 0.06,
    metalness: 0,
    transparent: true,
    opacity: 0.32,
    envMapIntensity: 1.6,
  });

  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const name = (Array.isArray(mesh.material) ? mesh.material[0]?.name : mesh.material?.name) ?? "";
    if (/glass|verre|lens/i.test(name)) mesh.material = lens;
    else if (/brass|gold|metal|laiton/i.test(name)) mesh.material = brass;
    else mesh.material = nylon;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  });
}

function Model({ progress, url }: { progress: MutableRefObject<number>; url: string }) {
  // 2e argument = chemin du décodeur Draco auto-hébergé (voir note ci-dessus).
  const { scene } = useGLTF(url, DRACO_DECODER_PATH);
  const ref = useRef<THREE.Group>(null);

  // useGLTF met la scène en cache et la PARTAGE entre consommateurs : on clone
  // pour posséder nos transforms et nos matériaux (géométries partagées).
  const clone = useMemo(() => {
    const c = scene.clone(true);
    applyNylonStudioMaterials(c);
    return c;
  }, [scene]);

  // Normalise n'importe quel GLB : centré à l'origine, taille cible ~4 unités.
  const fit = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    clone.position.sub(center);
    return { scale: 3.7 / maxDim };
  }, [clone]);

  useFrame((state) => {
    if (!ref.current) return;
    const p = progress.current;
    // Rotation pilotée au scroll (~1 tour ¼) + très lente rotation continue.
    ref.current.rotation.y = p * Math.PI * 2.5 + state.clock.elapsedTime * 0.1;
    ref.current.rotation.x = -0.1 + Math.sin(p * Math.PI) * 0.2;
    const s = fit.scale * (1 + p * 0.16);
    ref.current.scale.setScalar(s);
  });

  return (
    <group ref={ref}>
      <primitive object={clone} />
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

      {/* Éclairage studio : key chaude en douche, rim bleutée arrière (contour),
          fill discret — la monture nylon se détache du fond encre. */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 6, 5]} intensity={1.7} castShadow />
      <spotLight
        position={[-6, 3.5, -6]}
        intensity={40}
        angle={0.7}
        penumbra={1}
        color="#4d8cff"
      />
      <directionalLight position={[-4, -1, 3]} intensity={0.35} color="#9db8ff" />

      <Suspense fallback={null}>
        <Float speed={1.1} rotationIntensity={0.15} floatIntensity={0.4}>
          <Model progress={progressRef} url={modelUrl} />
        </Float>
        {/* Reflets studio générés par lightformers — aucune ressource réseau */}
        <Environment resolution={256}>
          <Lightformer intensity={2.4} position={[0, 4, -6]} scale={[12, 12, 1]} />
          <Lightformer intensity={1.4} color="#4d8cff" position={[-6, 1, -1]} scale={[4, 6, 1]} />
          <Lightformer intensity={0.9} color="#ffe8d0" position={[6, 1, 1]} scale={[4, 6, 1]} />
          <Lightformer intensity={1.4} position={[0, -3, 2]} scale={[8, 4, 1]} />
        </Environment>
        <ContactShadows position={[0, -1.7, 0]} opacity={0.5} scale={12} blur={2.6} far={4.5} />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL, DRACO_DECODER_PATH);
