# SVG Interaktív Térkép Konfiguráció

Ez a mappa tartalmazza az SVG interaktív térképek konfigurációs fájljait.

## Konfiguráció struktúra

Minden SVG térképhez tartozik egy JSON konfiguráció, amely a következő struktúrát követi:

```json
{
  "id": "egyedi_azonosito",
  "name": "Megjelenítendő név",
  "svgPath": "assets/svg_fajl.svg",
  "viewBox": {
    "x": 0,
    "y": 0,
    "width": 4997,
    "height": 7087
  },
  "interactiveAreas": [
    {
      "id": "terulet_id",
      "name": "Terület neve",
      "type": "polygon|rectangle|circle",
      "coordinates": {
        // típustól függő koordináták
      },
      "style": {
        "fillStyle": "rgba(255, 0, 0, 0.3)",
        "strokeStyle": "#ff0000",
        "strokeWidth": 2,
        "cssClass": "custom-class"
      },
      "metadata": {
        // további adatok
      }
    }
  ]
}
```

## Koordináta típusok

### Polygon
```json
"coordinates": {
  "d": "SVG path data string"
}
```

### Rectangle
```json
"coordinates": {
  "x": 100,
  "y": 200,
  "width": 300,
  "height": 150,
  "transform": "matrix(...)" // opcionális
}
```

### Circle
```json
"coordinates": {
  "cx": 150,
  "cy": 200,
  "r": 50
}
```

## Új SVG térkép hozzáadása

1. Helyezd el az SVG fájlt az `assets/` mappába
2. Hozz létre egy új JSON konfigurációt ebben a mappában
3. Add hozzá a betöltő metódust a `SvgConfigService`-ben
4. Opcionálisan add hozzá a váltó gombot a canvas komponenshez

## Meglévő konfigurációk

- `nagyterkep-config.json` - Nagy térkép (nagyterkep_jo.svg)
- `diszaula-config.json` - Díszaula (KutatokEjszakaja-Standalaprajz-Diszaula-01-1.svg)

## Használat a komponensben

```typescript
// Service injektálása
constructor(private svgConfigService: SvgConfigService) {}

// Konfiguráció betöltése
this.svgConfigService.loadConfig('assets/svg-configs/my-config.json')
  .subscribe(config => {
    this.currentSvgConfig = config;
  });

// Komponens használata
<app-svg-element 
  [config]="currentSvgConfig"
  (areaClick)="onAreaClick($event)">
</app-svg-element>
