/**
 * Converts an SVG path data string into an array of polygon points.
 * @param d - The SVG path data string.
 * @param numSegments - Number of segments to approximate curves (default is 10).
 * @returns An array of points with x and y coordinates.
 */
export function svgPathToPolygonPoints(d: string, numSegments: number = 10): Array<{ x: number, y: number }> {
  const tokens = tokenizePathData(d);
  let i = 0; // Token index
  let currentPoint = { x: 0, y: 0 };
  let startPoint = { x: 0, y: 0 };
  const points: Array<{ x: number, y: number }> = [];

  while (i < tokens.length) {
    const token = tokens[i];
    if (token === 'M' || token === 'L') {
      let command = token;
      i++;
      while (i + 1 < tokens.length && !isCommand(tokens[i])) {
        const x = parseFloat(tokens[i++]);
        const y = parseFloat(tokens[i++]);
        currentPoint = { x, y };
        if (command === 'M') {
          startPoint = { ...currentPoint };
          points.push({ ...currentPoint });
          command = 'L'; // Subsequent coordinates are treated as 'L'
        } else {
          points.push({ ...currentPoint });
        }
      }
    } else if (token === 'C') {
      i++;
      while (i + 5 < tokens.length && !isCommand(tokens[i])) {
        const x1 = parseFloat(tokens[i++]);
        const y1 = parseFloat(tokens[i++]);
        const x2 = parseFloat(tokens[i++]);
        const y2 = parseFloat(tokens[i++]);
        const x = parseFloat(tokens[i++]);
        const y = parseFloat(tokens[i++]);

        const bezierPoints = approximateCubicBezier(
          currentPoint.x, currentPoint.y,
          x1, y1, x2, y2, x, y,
          numSegments
        );
        // Exclude the first point as it is the current point
        bezierPoints.shift();
        points.push(...bezierPoints);
        currentPoint = { x, y };
      }
    } else if (token === 'Z') {
      // Close path
      points.push({ ...startPoint });
      i++;
    } else {
      console.warn('Unrecognized command:', token);
      i++;
    }
  }

  return points;
}

/**
 * Tokenizes the SVG path data string into commands and parameters.
 * @param d - The SVG path data string.
 * @returns An array of tokens.
 */
export function tokenizePathData(d: string): string[] {
  const tokens = [];
  const regex = /([a-zA-Z])|(-?\d*\.?\d+(?:[eE][+-]?\d+)?)/g;
  let match;
  while ((match = regex.exec(d)) !== null) {
    tokens.push(match[0]);
  }
  return tokens;
}

/**
 * Checks if a token is a command.
 * @param token - The token to check.
 * @returns True if the token is a command letter.
 */
export function isCommand(token: string): boolean {
  return /^[a-zA-Z]$/.test(token);
}

/**
 * Approximates a cubic Bézier curve with line segments.
 * @param x0 - Start point x.
 * @param y0 - Start point y.
 * @param x1 - Control point 1 x.
 * @param y1 - Control point 1 y.
 * @param x2 - Control point 2 x.
 * @param y2 - Control point 2 y.
 * @param x3 - End point x.
 * @param y3 - End point y.
 * @param numSegments - Number of segments to approximate the curve.
 * @returns An array of points along the curve.
 */
export function approximateCubicBezier(
  x0: number, y0: number,
  x1: number, y1: number,
  x2: number, y2: number,
  x3: number, y3: number,
  numSegments: number
): Array<{ x: number, y: number }> {
  const points = [];
  for (let i = 0; i <= numSegments; i++) {
    const t = i / numSegments;
    const x = cubicBezier(t, x0, x1, x2, x3);
    const y = cubicBezier(t, y0, y1, y2, y3);
    points.push({ x, y });
  }
  return points;
}

/**
 * Evaluates a cubic Bézier curve at parameter t.
 * @param t - Parameter between 0 and 1.
 * @param p0 - Start point coordinate.
 * @param p1 - Control point 1 coordinate.
 * @param p2 - Control point 2 coordinate.
 * @param p3 - End point coordinate.
 * @returns The coordinate at parameter t.
 */
export function cubicBezier(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const oneMinusT = 1 - t;
  return oneMinusT * oneMinusT * oneMinusT * p0 +
    3 * oneMinusT * oneMinusT * t * p1 +
    3 * oneMinusT * t * t * p2 +
    t * t * t * p3;
}
