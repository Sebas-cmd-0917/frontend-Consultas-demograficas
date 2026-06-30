"use client";

import { OrbitControls } from "@react-three/drei";

export default function ControlesCamara() {
  return (
    <OrbitControls 
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      maxPolarAngle={Math.PI / 2.5}
      minDistance={10}
      maxDistance={200}
    />
  );
}
