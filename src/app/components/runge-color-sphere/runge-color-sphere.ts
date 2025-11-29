import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild
} from '@angular/core';

import * as THREE from 'three';

@Component({
  selector: 'app-runge-color-sphere',
  standalone: true,
  templateUrl: './runge-color-sphere.html',
  styleUrls: ['./runge-color-sphere.scss']
})
export class RungeColorSphere implements AfterViewInit, OnDestroy {
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
  }

  // Inicializa escena, cámara y renderer
  private initScene(): void {
    const container = this.canvasContainer.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight || 400;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111111);

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

    // Luces suaves para que se vea más bonito
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(3, 5, 5);
    this.scene.add(directionalLight);

    // Ajustar al hacer resize
    window.addEventListener('resize', this.onWindowResize);
  }

  // Crear la esfera de color inspirada en Runge (1810)
  private addColorSphere(): void {
    const radius = 1;
    const widthSegments = 96;
    const heightSegments = 96;

    const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);

    // Creamos un arreglo para los colores por vértice
    const positionAttr = geometry.attributes['position'] as THREE.BufferAttribute;
    const vertexCount = positionAttr.count;
    const colors = new Float32Array(vertexCount * 3);

    for (let i = 0; i < vertexCount; i++) {
      const x = positionAttr.getX(i);
      const y = positionAttr.getY(i);
      const z = positionAttr.getZ(i);

      // Cálculo geométrico similar al Python:
      // Hue: ángulo alrededor del eje z
      let phi = Math.atan2(y, x); // [-π, π]
      if (phi < 0) {
        phi += 2 * Math.PI;      // [0, 2π]
      }
      const h = phi / (2 * Math.PI); // [0,1]

      // Lightness: depende de z ([-1,1] → [0,1])
      const l = (z + 1) / 2;

      // Saturación: máxima en el ecuador, mínima en polos
      const r = Math.sqrt(x * x + y * y); // [0,1] en esfera unitaria
      const s = r;

      const { r: rr, g: gg, b: bb } = this.hslToRgb(h, s, l);

      colors[i * 3] = rr;
      colors[i * 3 + 1] = gg;
      colors[i * 3 + 2] = bb;
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.MeshPhongMaterial({
      vertexColors: true,
      shininess: 20
    });

    this.sphere = new THREE.Mesh(geometry, material);
    this.scene.add(this.sphere);
  }

  // Animación: girar la esfera lentamente
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

  // Manejar resize de ventana
  private onWindowResize = () => {
    if (!this.canvasContainer || !this.camera || !this.renderer) return;

    const container = this.canvasContainer.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight || 400;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  };

  /**
   * Conversión HSL → RGB
   * h, s, l en [0,1]
   * retorna r,g,b en [0,1]
   */
  private hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    if (s === 0) {
      // Gris
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
