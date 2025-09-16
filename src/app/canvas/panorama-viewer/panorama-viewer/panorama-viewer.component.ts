import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { InfoPoint } from "../../../model/info-point";
import { NavigationPoint } from "../../../model/navigation-point";
import { NgxSpinnerService } from "ngx-spinner";


@Component({
  selector: 'app-panorama-viewer',
  templateUrl: './panorama-viewer.component.html',
  styleUrls: ['./panorama-viewer.component.scss']
})
export class PanoramaViewerComponent implements AfterViewInit, OnDestroy, OnInit {

  @ViewChild('canvas', { static: true }) private canvasRef!: ElementRef<HTMLCanvasElement>;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private panoramaMesh!: THREE.Mesh;

  isInfoBoxVisible: boolean = false;
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // Animation ID
  private animationId: any;



  private meshMaterial!: THREE.MeshBasicMaterial;

  infoPoints: InfoPoint[] = [
    {
      id: 1,
      name: 'Infópont 1',
      position: {
        theta: 3 * Math.PI / 2, // Előre néz
        phi: Math.PI / 2,       // Horizontális síkban
      },
      header: 'Információs pont 1',
      content: 'Ez egy információs pont.\nEz egy információs pont.Ez egy információs pontEz egy információs pont.Ez egy információs pontEz egy információs pont.Ez egy információs pontEz egy információs pont.Ez egy információs pont.\nEz egy információs pont.',
      isOpen: false,
    },
    {
      id: 2,
      name: 'Infópont 2',
      position: {
        theta: 4 * Math.PI / 2, // Előre néz
        phi: Math.PI / 2,       // Horizontális síkban
        z: -1000,
      },
      isOpen: false,
      header: 'Információs pont 2',
      content: 'Ez egy másik információs pont.',
    },
  ];

  navigationPoints: NavigationPoint[] = [
    {
      id: 1,
      name: 'Panoráma 2',
      position: {
        theta: 3.8 * Math.PI / 2, // Előre néz
        phi: Math.PI / 2,       // Horizontális síkban
      },
      header: 'Panoráma 2',
    },
  ];


  // Aktuális panoráma textúra
  private texture!: THREE.Texture;

  constructor(private spinner: NgxSpinnerService) {

  }
  ngAfterViewInit(): void {

    window.addEventListener('resize', () => this.onWindowResize());

    this.createScene();
    this.createCamera();
    this.createRenderer();
    this.createControls();
    this.startRenderingLoop();

    // this.loadPanorama(this.panoramas[0]);
    this.controls.enableZoom = true;
    document.addEventListener('click', this.onDocumentClick.bind(this));

  }


  ngOnInit(): void {

  }
  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
    // window.removeEventListener('click', this.onMouseClick.bind(this), false);
    document.removeEventListener('click', this.onDocumentClick.bind(this));


  }
  private createCamera(): void {
    const aspectRatio = this.getAspectRatio();
    this.camera = new THREE.PerspectiveCamera(75, aspectRatio, 1, 1100);
    this.camera.position.set(0, 0, 10); // Kamera kicsit hátrébb
    this.camera.lookAt(new THREE.Vector3(0, 0, -1)); // Előre néz
  }


  private createScene(): void {
    this.scene = new THREE.Scene();

    // Tengelysegéd hozzáadása (opcionális)
    const axesHelper = new THREE.AxesHelper(200);
    this.scene.add(axesHelper);

    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);

    const material = new THREE.MeshBasicMaterial({});

    const mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);

    this.meshMaterial = material;

    // Tároljuk a panoráma gömb mesh-t
    this.panoramaMesh = mesh;
  }
  private getAspectRatio(): number {
    return this.canvasRef.nativeElement.clientWidth / this.canvasRef.nativeElement.clientHeight;
  }

  private createRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvasRef.nativeElement });
    this.renderer.setPixelRatio(devicePixelRatio);
    this.renderer.setSize(this.canvasRef.nativeElement.clientWidth, this.canvasRef.nativeElement.clientHeight);
  }

  private createControls(): void {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableZoom = true;
    this.controls.enablePan = true;
    this.controls.minPolarAngle = 0;
    this.controls.maxPolarAngle = Math.PI;
    this.controls.rotateSpeed = -0.3;

    // Enable damping (inertia)
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05; // Adjust this value as needed
  }

  private updateNavigationPoints() {
    this.navigationPoints.forEach((point) => {
      const radius = 450;

      const phi = point.position.phi;
      const theta = point.position.theta;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);

      point.position3D = new THREE.Vector3(x, y, z);

      const vector = point.position3D.clone().project(this.camera);

      const screenX = ((vector.x + 1) / 2) * this.renderer.domElement.clientWidth;
      const screenY = ((-vector.y + 1) / 2) * this.renderer.domElement.clientHeight;

      const element = document.getElementById('navigationpoint-' + point.id);
      if (element) {
        element.style.left = `${screenX}px`;
        element.style.top = `${screenY}px`;

        const isBehindCamera = vector.z > 1;
        element.style.display = isBehindCamera ? 'none' : 'block';
      }
    });
  }
  updateInfoPointsPositions() {
    this.infoPoints.forEach((point) => {
      const radius = 450;

      const phi = point.position.phi;
      const theta = point.position.theta;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);

      point.position3D = new THREE.Vector3(x, y, z);

      const vector = point.position3D.clone().project(this.camera);

      const screenX = ((vector.x + 1) / 2) * this.renderer.domElement.clientWidth;
      const screenY = ((-vector.y + 1) / 2) * this.renderer.domElement.clientHeight;

      const element = document.getElementById('infopoint-' + point.id);
      if (element) {
        element.style.left = `${screenX}px`;
        element.style.top = `${screenY}px`;

        const isBehindCamera = vector.z > 1;
        element.style.display = isBehindCamera ? 'none' : 'block';
      }
    });
  }

  onInfoPointClick(point: InfoPoint, event: MouseEvent) {
    event.stopPropagation();

    // Az infópont állapotának kapcsolása
    point.isOpen = !point.isOpen;

    // Ha csak egy infópontot szeretnél egyszerre megnyitni, zárd be a többit
    this.infoPoints.forEach((p) => {
      if (p.id !== point.id) {
        p.isOpen = false;
      }
    });
  }


  onDocumentClick(event: MouseEvent) {
    const clickedInside = (event.target as HTMLElement).closest('.info-point, .info-box');
    if (!clickedInside) {
      this.isInfoBoxVisible = false;
    }
  }



  private startRenderingLoop(): void {
    const component: PanoramaViewerComponent = this;

    (function animate() {
      component.animationId = requestAnimationFrame(animate);

      // Update controls for damping effect
      component.controls.update();

      // Frissítjük az infópontok pozícióját
      component.updateInfoPointsPositions();
      component.updateNavigationPoints();

      component.renderer.render(component.scene, component.camera);
    })();
  }



  loadPanorama(panorama: { name: string; file: string }): void {
    this.spinner.show(); // Show the spinner immediately

    const loader = new THREE.TextureLoader();
    loader.load(
      panorama.file,
      (texture) => {
        if (this.texture) {
          this.texture.dispose();
        }
        this.texture = texture;
        this.meshMaterial.map = this.texture;
        this.meshMaterial.needsUpdate = true;

        setTimeout(() => {
          this.spinner.hide();
        }, 500);
      },
      undefined,
      (error) => {
        this.spinner.hide();
        console.error("Error loading texture:", error);
      }
    );
  }


  private onWindowResize(): void {
    this.camera.aspect = this.getAspectRatio();
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.canvasRef.nativeElement.clientWidth, this.canvasRef.nativeElement.clientHeight);
  }


  f

  onNavigationPointClick(point: NavigationPoint, $event: MouseEvent) {

  }
}
