import * as THREE from 'three';
import { Point } from "./point";

export interface InfoPoint extends Point{
  content: string;
  isOpen?: boolean;
  mesh?: THREE.Mesh;

}
