import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild
} from '@angular/core';

import * as THREE from 'three';

@Component({
  selector: 'app-benson-cube',
  standalone: true,
  templateUrl: './benson-cube.html',
  styleUrls: ['./benson-cube.scss']
})
export class BensonCube implements AfterViewInit, OnDestroy {
  @ViewChild('canvasContainer', { static: true })
  canvasContainer!: ElementRef<HTMLDivElement>;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private sphere!: THREE.Mesh;
  private animationFrameId: number | null = null;

  ngAfterViewInit(): void {
    this.initScene();
    this.addColorSphere();
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
    this.scene.background = new THREE.Color(0x050816);

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 3);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    container.appendChild(this.renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambient);

    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(3, 5, 5);
    this.scene.add(dir);

    window.addEventListener('resize', this.onWindowResize);
  }

  private addColorSphere(): void {
    const radius = 1;
    const widthSegments = 96;
    const heightSegments = 96;

    const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
    const position = geometry.attributes['position'] as THREE.BufferAttribute;
    const vertexCount = position.count;

    const colors = new Float32Array(vertexCount * 3);

    for (let i = 0; i < vertexCount; i++) {
      const x = position.getX(i);
      const y = position.getY(i);
      const z = position.getZ(i);

      // Hue: ángulo alrededor del eje z
      let phi = Math.atan2(y, x);
      if (phi < 0) phi += 2 * Math.PI;
      const h = phi / (2 * Math.PI);

      // Luminosidad: mapeamos z ∈ [-1,1] a [0,1]
      const l = (z + 1) / 2;

      // Saturación (Benson): máxima cerca del ecuador, pero con caída suave
      const r = Math.sqrt(x * x + y * y);
      const s = Math.pow(r, 0.8); // curva un poco más uniforme

      const { r: rr, g: gg, b: bb } = this.hslToRgb(h, s, l);

      colors[i * 3] = rr;
      colors[i * 3 + 1] = gg;
      colors[i * 3 + 2] = bb;
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.MeshPhongMaterial({
      vertexColors: true,
      shininess: 25
    });

    this.sphere = new THREE.Mesh(geometry, material);
    this.scene.add(this.sphere);
  }

  private startAnimation(): void {
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);

      if (this.sphere) {
        this.sphere.rotation.y += 0.01;
      }

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
    if (s === 0) {
      return { r: l, g: l, b: l };
    }
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
