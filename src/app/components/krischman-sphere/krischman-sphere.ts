import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild
} from '@angular/core';

import * as THREE from 'three';

@Component({
  selector: 'app-krischman-sphere',
  standalone: true,
  templateUrl: './krischman-sphere.html',
  styleUrls: ['./krischman-sphere.scss']
})
export class KrischmanSphere implements AfterViewInit, OnDestroy {
  @ViewChild('canvasContainer', { static: true })
  canvasContainer!: ElementRef<HTMLDivElement>;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private sphere!: THREE.Mesh;
  private animationFrameId: number | null = null;

  ngAfterViewInit(): void {
    this.initScene();
    this.addKrischmanSphere();
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
    this.camera.position.set(0, 0, 3);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    container.appendChild(this.renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(3, 5, 5);
    this.scene.add(directionalLight);

    window.addEventListener('resize', this.onWindowResize);
  }

  // Esfera de Ostwald - Sistema de color armónico
  private addKrischmanSphere(): void {
    const radius = 1;
    const widthSegments = 96;
    const heightSegments = 96;

    const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);

    const positionAttr = geometry.attributes['position'] as THREE.BufferAttribute;
    const vertexCount = positionAttr.count;
    const colors = new Float32Array(vertexCount * 3);

    for (let i = 0; i < vertexCount; i++) {
      const x = positionAttr.getX(i);
      const y = positionAttr.getY(i);
      const z = positionAttr.getZ(i);

      // Sistema Ostwald: Color puro, blanco y negro
      let phi = Math.atan2(y, x);
      if (phi < 0) phi += 2 * Math.PI;
      const hue = phi / (2 * Math.PI);

      const white = (z + 1) / 2;  // cantidad de blanco
      const radius2d = Math.sqrt(x * x + y * y);
      const pureColor = Math.min(radius2d, 1);  // pureza del color

      const { r: hr, g: hg, b: hb } = this.hueToRgb(hue);

      const r = hr * pureColor + white * (1 - pureColor);
      const g = hg * pureColor + white * (1 - pureColor);
      const b = hb * pureColor + white * (1 - pureColor);

      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
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
        this.sphere.rotation.y += 0.008;
        this.sphere.rotation.x += 0.004;
      }

      this.renderer.render(this.scene, this.camera);
    };

    animate();
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
