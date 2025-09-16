import * as THREE from 'three';

export interface Point {
  id: number;
  name: string;
  position: {
    theta: number;
    phi: number;
    z?: number;
  };
  position3D?: THREE.Vector3;
  header: string;

}
