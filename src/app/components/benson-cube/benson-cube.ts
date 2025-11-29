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
  private cube!: THREE.Mesh;
  private animationFrameId: number | null = null;

  ngAfterViewInit(): void {
    this.initScene();
    this.addColorCube();
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
    this.camera.position.set(2.5, 2.5, 4);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    container.appendChild(this.renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambient);

    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(3, 5, 5);
    this.scene.add(dir);

    window.addEventListener('resize', this.onWindowResize);
  }

  private addColorCube(): void {
    const size = 2;
    const segments = 64;

    const geometry = new THREE.BoxGeometry(size, size, size, segments, segments, segments);
    const position = geometry.attributes['position'] as THREE.BufferAttribute;
    const vertexCount = position.count;

    const colors = new Float32Array(vertexCount * 3);

    for (let i = 0; i < vertexCount; i++) {
      const x = position.getX(i);
      const y = position.getY(i);
      const z = position.getZ(i);

      // Mapear coordenadas del cubo [-1,1] a colores RGB [0,1]
      // X → Rojo, Y → Verde, Z → Azul
      const r = (x + size / 2) / size; // [0, 1]
      const g = (y + size / 2) / size; // [0, 1]
      const b = (z + size / 2) / size; // [0, 1]

      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.MeshPhongMaterial({
      vertexColors: true,
      shininess: 30,
      specular: new THREE.Color(0x333333)
    });

    this.cube = new THREE.Mesh(geometry, material);
    this.scene.add(this.cube);
  }

  private startAnimation(): void {
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);

      if (this.cube) {
        this.cube.rotation.x += 0.005;
        this.cube.rotation.y += 0.01;
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

}
