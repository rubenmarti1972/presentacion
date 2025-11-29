import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild
} from '@angular/core';

import * as THREE from 'three';

@Component({
  selector: 'app-ostwald-cone',
  standalone: true,
  templateUrl: './ostwald-cone.html',
  styleUrls: ['./ostwald-cone.scss']
})
export class OstwaldCone implements AfterViewInit, OnDestroy {
  @ViewChild('canvasContainer', { static: true })
  canvasContainer!: ElementRef<HTMLDivElement>;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private doubleCone!: THREE.Group;
  private animationFrameId: number | null = null;

  ngAfterViewInit(): void {
    this.initScene();
    this.addOstwaldDoubleCone();
    this.startAnimation();
  }

  ngOnDestroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }

  private initScene(): void {
    const container = this.canvasContainer.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight || 400;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0a);

    this.camera = new THREE.PerspectiveCamera(
      45,
      width / height,
      0.1,
      100
    );
    this.camera.position.set(2, 1.5, 3);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    container.appendChild(this.renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(3, 5, 5);
    this.scene.add(directionalLight);

    window.addEventListener('resize', this.onWindowResize);
  }

  // Doble cono de Ostwald (1916)
  private addOstwaldDoubleCone(): void {
    this.doubleCone = new THREE.Group();

    const radius = 1;
    const height = 1.5;
    const radialSegments = 32;
    const heightSegments = 20;

    // Cono superior (blanco en el vértice)
    const upperCone = this.createColoredCone(radius, height, radialSegments, heightSegments, true);
    upperCone.position.y = 0;
    this.doubleCone.add(upperCone);

    // Cono inferior (negro en el vértice)
    const lowerCone = this.createColoredCone(radius, height, radialSegments, heightSegments, false);
    lowerCone.rotation.x = Math.PI;
    lowerCone.position.y = 0;
    this.doubleCone.add(lowerCone);

    this.scene.add(this.doubleCone);
  }

  private createColoredCone(
    radius: number,
    height: number,
    radialSegments: number,
    heightSegments: number,
    isUpper: boolean
  ): THREE.Mesh {
    const geometry = new THREE.ConeGeometry(radius, height, radialSegments, heightSegments);

    const positionAttr = geometry.attributes['position'] as THREE.BufferAttribute;
    const vertexCount = positionAttr.count;
    const colors = new Float32Array(vertexCount * 3);

    for (let i = 0; i < vertexCount; i++) {
      const x = positionAttr.getX(i);
      const y = positionAttr.getY(i);
      const z = positionAttr.getZ(i);

      // Ángulo para el matiz (hue)
      let angle = Math.atan2(z, x);
      if (angle < 0) angle += 2 * Math.PI;
      const hue = angle / (2 * Math.PI);

      // Distancia vertical normalizada (0 en la punta, 1 en la base)
      const verticalPos = (y + height / 2) / height;

      let r, g, b;
      if (isUpper) {
        // Cono superior: blanco en la punta, colores puros en la base
        const { r: hr, g: hg, b: hb } = this.hueToRgb(hue);
        const whiteness = 1 - verticalPos;
        r = hr * verticalPos + whiteness;
        g = hg * verticalPos + whiteness;
        b = hb * verticalPos + whiteness;
      } else {
        // Cono inferior: colores puros en la base, negro en la punta
        const { r: hr, g: hg, b: hb } = this.hueToRgb(hue);
        r = hr * verticalPos;
        g = hg * verticalPos;
        b = hb * verticalPos;
      }

      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.MeshPhongMaterial({
      vertexColors: true,
      shininess: 20,
      side: THREE.DoubleSide
    });

    return new THREE.Mesh(geometry, material);
  }

  private hueToRgb(hue: number): { r: number; g: number; b: number } {
    const h = hue * 6;
    const x = 1 - Math.abs((h % 2) - 1);

    if (h < 1) return { r: 1, g: x, b: 0 };
    if (h < 2) return { r: x, g: 1, b: 0 };
    if (h < 3) return { r: 0, g: 1, b: x };
    if (h < 4) return { r: 0, g: x, b: 1 };
    if (h < 5) return { r: x, g: 0, b: 1 };
    return { r: 1, g: 0, b: x };
  }

  private startAnimation(): void {
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);

      if (this.doubleCone) {
        this.doubleCone.rotation.y += 0.008;
      }

      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  private onWindowResize = () => {
    if (!this.canvasContainer || !this.camera || !this.renderer) return;

    const container = this.canvasContainer.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight || 400;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  };
}
