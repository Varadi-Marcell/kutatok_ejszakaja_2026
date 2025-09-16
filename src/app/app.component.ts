import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { convertPathToAreaCoords, Transform } from "./sizer";
import { parseSVG, makeAbsolute } from 'svg-path-parser';
import { svgPathToPolygonPoints } from "./polygon";

interface PathData {
  d: string;
  transform: string;
}

interface AreaData {
  coords: string;
  shape: 'rect';
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild('svgElement', { static: true }) svgElement!: ElementRef;
   originalWidth = 4997;
   originalHeight = 7087;

   targetWidth = 4997; // Például: a cél méret szélessége
   targetHeight = 7087; // Például: a cél méret magassága


   scaleX = 1.250094;  // Az x irányú skálázás a transzformációs mátrix alapján
   scaleY = 1.250038;  // Az y irányú skálázás a transzformációs mátrix alapján
   d = `
   M 377.902344 318.339844 L 343.902344 375.714844 C 331.648438 396.214844 329.523438 401.339844 329.398438 401.339844 L 329.148438 401.339844 C 328.898438 401.339844 326.773438 396.214844 314.398438 375.714844 L 280.394531 318.339844 L 258.144531 318.339844 L 258.144531 468.09375 L 281.519531 468.09375 L 281.519531 410.964844 C 281.519531 383.839844 280.394531 358.089844 280.644531 358.089844 L 280.894531 358.089844 C 281.144531 358.089844 290.148438 373.964844 293.898438 380.714844 L 323.023438 430.964844 L 335.398438 430.964844 L 364.527344 380.714844 C 368.402344 373.839844 377.527344 358.089844 377.777344 358.089844 L 378.027344 358.089844 C 378.277344 358.089844 376.902344 383.714844 376.902344 410.964844 L 376.902344 430.089844 L 400.28125 430.089844 L 400.28125 318.339844 Z M 377.902344 318.339844
   `;

  svgPath: string = 'm 377.90234,318.33984 -34,57.375 c -12.2539,20.5 -14.3789,25.625 -14.5039,25.625 h -0.25 c -0.25,0 -2.375,-5.125 -14.75,-25.625 l -34.00391,-57.375 h -22.25 v 149.75391 h 23.375 v -57.12891 c 0,-27.125 -1.125,-52.875 -0.875,-52.875 h 0.25 c 0.25,0 9.25391,15.875 13.00391,22.625 l 29.125,50.25 h 12.375 l 29.1289,-50.25 c 3.875,-6.875 13,-22.625 13.25,-22.625 h 0.25 c 0.25,0 -1.125,25.625 -1.125,52.875 v 19.125 h 23.37891 v -111.75 z m 0,0';
  parsedCoords: string = '';


  areas: string = '';
  paths = [
    {
      id: 'group1',
      class: 'class1',
      d: 'M 1989.300702 972.301073 L 2097.998794 972.301073 L 2097.998794 1043.098894 L 1989.300702 1043.098894 Z'
    },
    {
      id: 'group2',
      class: 'class2',
      d: 'M 1775.301137 731.799101 L 1883.99923 731.799101 L 1883.99923 802.600047 L 1775.301137 802.600047 Z'
    }
  ];


  ngOnInit() {
    const x1 = 1989.300702;
    const y1 = 972.301073;
    const x2 = 2097.998794;
    const y2 = 1043.098894;

    const transformX = 1.250094;
    const transformY = 1.250038;

    const coords = this.origiona(x1, y1, x2, y2, transformX, transformY);
    console.log(coords);

    this.parseSvgPath()
    console.log(this.parsedCoords)
    // const pathString = "M 1457.799966 727.399237 L 1566.501183 727.399237 L 1566.501183 798.200182 L 1457.799966 798.200182 Z M 1457.799966 727.399237";
    // const pathString2 = "M 1775.301137 731.799101 L 1883.99923 731.799101 L 1883.99923 802.600047 L 1775.301137 802.600047 Z M 1775.301137 731.799101 "
    // const originalWidth = 4997;
    // const originalHeight = 7087;
    // const targetWidth = 4997;
    // const targetHeight = 7087;
    //
    // const transform: Transform = {
    //   scaleX: 1.250094,
    //   scaleY: 1.250038,
    //   translateX: 0,
    //   translateY: 0.0784362
    // };
    //
    // const areaCoords = convertPathToAreaCoords(pathString, transform, originalWidth, originalHeight, targetWidth, targetHeight);
    // const areaCoords2 = convertPathToAreaCoords(pathString2, transform, originalWidth, originalHeight, targetWidth, targetHeight);
    //
    // console.log(areaCoords); // Várt eredmény: 1968,1268,2104,1184
    // // 1822,909,1958,998
    // //146,377,146, 186
    // console.log(areaCoords2); // Várt eredmény: 1968,1268,2104,1184
    //
    // //2362,1268,2503,1190 -helyes
    // // 2219,915,2355,1003 - rossz
    // //143,353,148,187,

    const pathString = "M 1457.799966 727.399237 L 1566.501183 727.399237 L 1566.501183 798.200182 L 1457.799966 798.200182 Z M 1457.799966 727.399237";
    const pathString2 = "M 1775.301137 731.799101 L 1883.99923 731.799101 L 1883.99923 802.600047 L 1775.301137 802.600047 Z M 1775.301137 731.799101 "
    const pathString3 = "M 1362.500868 949.19866 L 1471.198961 949.19866 L 1471.198961 1019.999605 L 1362.500868 1019.999605 Z M 1362.500868 949.19866 ";
    const pathString4 = "M 2367.500443 1050.198676 L 2476.198535 1050.198676 L 2476.198535 1120.999621 L 2367.500443 1120.999621 Z M 2367.500443 1050.198676 ";
    const originalWidth = 4997;
    const originalHeight = 7087;
    const targetWidth = 4997;
    const targetHeight = 7087;

    const transform: Transform = {
      scaleX: 1.250094,
      scaleY: 1.250038,
      translateX: 0,
      translateY: 0.0784362
    };

    const areaCoords = convertPathToAreaCoords(pathString, transform, originalWidth, originalHeight, targetWidth, targetHeight);
    const areaCoords2 = convertPathToAreaCoords(pathString2, transform, originalWidth, originalHeight, targetWidth, targetHeight);
    const areaCoords3 = convertPathToAreaCoords(pathString3, transform, originalWidth, originalHeight, targetWidth, targetHeight);
    const areaCoords4 = convertPathToAreaCoords(pathString4, transform, originalWidth, originalHeight, targetWidth, targetHeight);

    console.log(areaCoords); // A korrekciókkal módosított eredmény
    console.log(areaCoords2); // A korrekciókkal módosított eredmény
    console.log(areaCoords3); // A korrekciókkal módosított eredmény
    console.log(areaCoords4); // A korrekciókkal módosított eredmény

    this.polygon();


    const d = `M 377.902344 318.339844 L 343.902344 375.714844 C 331.648438 396.214844 329.523438 401.339844 329.398438 401.339844 L 329.148438 401.339844 C 328.898438 401.339844 326.773438 396.214844 314.398438 375.714844 L 280.394531 318.339844 L 258.144531 318.339844 L 258.144531 468.09375 L 281.519531 468.09375 L 281.519531 410.964844 C 281.519531 383.839844 280.394531 358.089844 280.644531 358.089844 L 280.894531 358.089844 C 281.144531 358.089844 290.148438 373.964844 293.898438 380.714844 L 323.023438 430.964844 L 335.398438 430.964844 L 364.527344 380.714844 C 368.402344 373.839844 377.527344 358.089844 377.777344 358.089844 L 378.027344 358.089844 C 378.277344 358.089844 376.902344 383.714844 376.902344 410.964844 L 376.902344 430.089844 L 400.28125 430.089844 L 400.28125 318.339844 Z M 377.902344 318.339844`;

    const polygonPoints = svgPathToPolygonPoints(d, 10);

    const coords2 = this.pointsToCoords(polygonPoints);

    const areaElement = `<area shape="poly" coords="${coords2}" href="#" alt="Clickable Area">`;

// Output the <area> tag
    console.log(areaElement);

    console.log(polygonPoints);
  }

  pointsToCoords(points: Array<{ x: number, y: number }>): string {
    return points.map(point => {
      // Round the coordinates to integers
      const x = Math.round(point.x);
      const y = Math.round(point.y);
      return `${x},${y}`;
    }).join(',');
  }

  ngAfterViewInit() {
    // this.convertSvgToAreas();
  }

  polygon() {

    // const pathString = "" +
    //   "M 2422.308594 859.855469 L 2260.292969 1091.488281 L 2251.167969 1084.613281 L 2219.417969 1130.238281 L 2164.914062 1092.238281 L 2158.410156 1087.738281 L 2190.289062 1042.109375 L 2182.164062 1036.734375 L 2343.800781 804.976562 L 2351.925781 810.726562 L 2412.804688 853.230469 Z M 2422.308594 859.855469" +
    //   "";
    // 2300,1358,2362,1402,2397,1358,2406,1366,2565,1128,2485,1084,2327,1310,2327,1322,2303,1359
    //2422,859,2260,1091,2251,1084,2219,1130,2164,1092,2158,1087,2190,1042,2182,1036,2343,804,2351,810,2412,853,2422,859

    const pathString = "M 2422.308594 859.855469 L 2260.292969 1091.488281 L 2251.167969 1084.613281 L 2219.417969 1130.238281 L 2164.914062 1092.238281 L 2158.410156 1087.738281 L 2190.289062 1042.109375 L 2182.164062 1036.734375 L 2343.800781 804.976562 L 2351.925781 810.726562 L 2412.804688 853.230469 Z M 2422.308594 859.855469";

    const originalWidth = 4997;
    const originalHeight = 7087;
    const targetWidth = 4997;
    const targetHeight = 7087;

    const transform: Transform = {
      scaleX: 1.250094,
      scaleY: 1.250038,
      translateX: 0,
      translateY: 0.0784362
    };



  }
  convertSvgToAreas() {
    const svg = this.svgElement.nativeElement;
    let buff = '';

    svg.querySelectorAll('path').forEach((path: SVGPathElement) => {
      const len = path.getTotalLength();
      let stp = '';
      for (let i = 0; i < len; i += 10) { // 10-es léptékkel
        const p = path.getPointAtLength(i);
        stp += `${p.x.toFixed(2)},${p.y.toFixed(2)}, `;
      }

      stp = stp.slice(0, -2); // Remove the last comma and space
      buff += `<area href="#" shape="poly" coords="${stp}"></area>\n`;
    });

    this.areas = buff;
    console.log(this.areas); // Debugging
  }

  origiona(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    transformX: number,
    transformY: number,
    scaleX: number = 1.0766,
    scaleY: number = 1.3065
  ): string {
    // Alkalmazzuk a transzformációs mátrixot
    const transformedX1 = x1 * transformX;
    const transformedY1 = y1 * transformY;
    const transformedX2 = x2 * transformX;
    const transformedY2 = y2 * transformY;

    // Alkalmazzuk az arányokat a végső kép méretéhez
    const correctedX1 = Math.round(transformedX1 * scaleX);
    const correctedY1 = Math.round(transformedY1 * scaleY);
    const correctedX2 = Math.round(transformedX2 * scaleX);
    const correctedY2 = Math.round(transformedY2 * scaleY);

    // Végső koordináták visszaadása
    return `${correctedX1},${correctedY1},${correctedX2},${correctedY2}`;
  }


  parseSvgPath() {
    // Parse the SVG path and make the commands absolute
    const parsedPath = makeAbsolute(parseSVG(this.svgPath));

    // Convert the parsed path to a string of coordinates
    this.parsedCoords = this.convertToCoordinates(parsedPath);
  }

  convertToCoordinates(parsedPath: any[]) {
    // Convert the parsed commands into a list of coordinates
    return parsedPath
      .filter(cmd => cmd.code === 'M' || cmd.code === 'L') // We care about MoveTo and LineTo commands
      .map(cmd => `${cmd.x},${cmd.y}`) // Map them to a simple x, y format
      .join(', '); // Join the coordinates with a comma
  }


}

