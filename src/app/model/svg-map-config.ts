export interface SvgMapConfig {
  id: string;
  name: string;
  svgPath: string;
  viewBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  interactiveAreas: InteractiveArea[];
}

export interface InteractiveArea {
  id: string;
  name: string;
  type: 'polygon' | 'rectangle' | 'circle';
  coordinates: PolygonCoordinates | RectangleCoordinates | CircleCoordinates;
  style?: AreaStyle;
  metadata?: any;
}

export interface PolygonCoordinates {
  d: string | string[]; // SVG path data - single string or array of strings
}

export interface RectangleCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
  transform?: string;
}

export interface CircleCoordinates {
  cx: number;
  cy: number;
  r: number;
}

export interface AreaStyle {
  fillStyle?: string;
  strokeStyle?: string;
  strokeWidth?: number;
  cssClass?: string;
}

export interface AreaClickEvent {
  area: InteractiveArea;
  originalEvent: Event;
}
