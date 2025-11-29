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
  private group!: THREE.Group;
  private animationFrameId: number | null = null;

  ngAfterViewInit(): void {
    this.initScene();
    this.addDoubleCone();
    this.startAnimation();
  }

  ngOnDestroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
    window.removeEventListener('resize', this.onWindowResize);
  }

  private initScene(): void {
    const container = this.canvasContainer.nativeElement;
    const width = container.clientWidth || 420;
    const height = container.clientHeight || 320;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020617);

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 4);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    container.appendChild(this.renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(4, 6, 5);
    this.scene.add(dir);

    this.group = new THREE.Group();
    this.scene.add(this.group);

    window.addEventListener('resize', this.onWindowResize);
  }

  private addDoubleCone(): void {
    const radius = 1;
    const height = 1.5;
    const radialSegments = 64;
    const heightSegments = 1;

    // Cono superior (gris medio → blanco)
    const topGeom = new THREE.CylinderGeometry(0, radius, height, radialSegments, heightSegments, true);
    this.colorOstwaldCone(topGeom, true);

    const topMat = new THREE.MeshPhongMaterial({
      vertexColors: true,
      side: THREE.DoubleSide
    });

    const topCone = new THREE.Mesh(topGeom, topMat);
    topCone.position.y = height / 2;

    // Cono inferior (gris medio → negro)
    const bottomGeom = new THREE.CylinderGeometry(radius, 0, height, radialSegments, heightSegments, true);
    this.colorOstwaldCone(bottomGeom, false);

    const bottomMat = new THREE.MeshPhongMaterial({
      vertexColors: true,
      side: THREE.DoubleSide
    });

    const bottomCone = new THREE.Mesh(bottomGeom, bottomMat);
    bottomCone.position.y = -height / 2;

    this.group.add(topCone);
    this.group.add(bottomCone);
  }

  private colorOstwaldCone(
    geometry: THREE.CylinderGeometry,
    isTop: boolean
  ): void {
    const position = geometry.attributes['position'] as THREE.BufferAttribute;
    const vertexCount = position.count;
    const colors = new Float32Array(vertexCount * 3);

    for (let i = 0; i < vertexCount; i++) {
      const x = position.getX(i);
      const y = position.getY(i);
      const z = position.getZ(i);

      // Distancia radial (pureza del color)
      const r = Math.sqrt(x * x + z * z); // eje del cono es y
      const p = Math.min(r, 1); // pureza en [0,1]

      let t: number;
      if (isTop) {
        // Gris medio (0.5) → blanco (1) a medida que sube en y
        t = (y + 0.75) / 1.5; // y ∈ [0,1.5]
      } else {
        // Gris medio (0.5) → negro (0) a medida que baja en y
        t = (y + 0.75) / 1.5; // y ∈ [-1.5, 0]
      }

      let lightness: number;
      if (isTop) {
        lightness = 0.5 + 0.5 * t; // 0.5 → 1
      } else {
        lightness = 0.5 * (1 + t); // 0.5 → 0 aproximadamente
      }

      // Hue por ángulo alrededor del eje
      let phi = Math.atan2(z, x);
      if (phi < 0) phi += 2 * Math.PI;
      const h = phi / (2 * Math.PI);

      const { r: rr, g: gg, b: bb } = this.hslToRgb(h, p, lightness);

      colors[i * 3] = rr;
      colors[i * 3 + 1] = gg;
      colors[i * 3 + 2] = bb;
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  }

  private startAnimation(): void {
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);

      this.group.rotation.y += 0.01;
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  private onWindowResize = () => {
    if (!this.canvasContainer || !this.camera || !this.renderer) return;

    const container = this.canvasContainer.nativeElement;
    const width = container.clientWidth || 420;
    const height = container.clientHeight || 320;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    if (s === 0) return { r: l, g: l, b: l };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const r = hue2rgb(p, q, h + 1 / 3);
    const g = hue2rgb(p, q, h);
    const b = hue2rgb(p, q, h - 1 / 3);

    return { r, g, b };
  }
}
