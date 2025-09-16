import { NavigationPoint } from "./navigation-point";
import { InfoPoint } from "./info-point";

export interface Panorama {
  id: number;
  name: string;
  file: string;
  category: string;
  infoPoint: InfoPoint;
  navigationPoint: NavigationPoint;
}
