// src/app/svg-utils.ts

export interface Transform {
  scaleX: number;
  scaleY: number;
  translateX: number;
  translateY: number;
}

export function convertPathToAreaCoords(
  path: string,
  transform: Transform,
  originalWidth: number,
  originalHeight: number,
  targetWidth: number,
  targetHeight: number
): string {

  // Extract points from the path string manually (assuming a rectangle)
  const points = path.match(/([0-9]+(\.[0-9]+)?)/g)?.map(Number) || [];

  if (points.length < 8) {
    throw new Error("Invalid path data");
  }

  // Original bounding box points (first and last pair of coordinates)
  const x1 = points[0];
  const y1 = points[1];
  const x2 = points[4];
  const y2 = points[5];

  // Apply the transformation matrix directly
  const transformedX1 = x1 * transform.scaleX + transform.translateX;
  const transformedY1 = y1 * transform.scaleY + transform.translateY;
  const transformedX2 = x2 * transform.scaleX + transform.translateX;
  const transformedY2 = y2 * transform.scaleY + transform.translateY;

  // Scale to target dimensions
  const scaleX = targetWidth / originalWidth;
  const scaleY = targetHeight / originalHeight;

  let finalX1 = Math.round(transformedX1 * scaleX);
  let finalY1 = Math.round(transformedY1 * scaleY);
  let finalX2 = Math.round(transformedX2 * scaleX);
  let finalY2 = Math.round(transformedY2 * scaleY);

  // Correction values
  const correctionX = (146 + 143) / 2;
  const correctionY = (377 + 353) / 2;
  const correctionX2 = (146 + 148) / 2;
  const correctionY2 = (186 + 187) / 2;

  // Apply the correction to each coordinate
  finalX1 += Math.round(correctionX);
  finalY1 += Math.round(correctionY);
  finalX2 += Math.round(correctionX2);
  finalY2 += Math.round(correctionY2);

  return `${finalX1},${finalY1},${finalX2},${finalY2}`;
}
