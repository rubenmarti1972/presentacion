import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild
} from '@angular/core';

import * as THREE from 'three';

@Component({
  selector: 'app-maxwell-triangle',
  standalone: true,
  templateUrl: './maxwell-triangle.html',
  styleUrls: ['./maxwell-triangle.scss']
})
export class MaxwellTriangle implements AfterViewInit, OnDestroy {
  @ViewChild('canvasContainer', { static: true })
  canvasContainer!: ElementRef<HTMLDivElement>;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private triangle!: THREE.Mesh;
  private animationFrameId: number | null = null;

  ngAfterViewInit(): void {
    this.initScene();
    this.addMaxwellTriangle();
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

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    window.addEventListener('resize', this.onWindowResize);
  }

  // Triángulo de color de Maxwell (1855)
  private addMaxwellTriangle(): void {
    const size = 1.2;
    const geometry = new THREE.BufferGeometry();

    // Vértices del triángulo equilátero
    const height = (Math.sqrt(3) / 2) * size;
    const vertices = new Float32Array([
      0, height * 0.666, 0,           // Top (Red)
      -size / 2, -height * 0.333, 0,  // Bottom left (Green)
      size / 2, -height * 0.333, 0    // Bottom right (Blue)
    ]);

    // Colores en los vértices (RGB)
    const colors = new Float32Array([
      1, 0, 0,  // Red
      0, 1, 0,  // Green
      0, 0, 1   // Blue
    ]);

    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.MeshBasicMaterial({
      vertexColors: true,
      side: THREE.DoubleSide
    });

    this.triangle = new THREE.Mesh(geometry, material);
    this.scene.add(this.triangle);

    // Agregar puntos en los vértices
    this.addVertexLabels();
  }

  private addVertexLabels(): void {
    const size = 1.2;
    const height = (Math.sqrt(3) / 2) * size;

    const pointGeometry = new THREE.SphereGeometry(0.03, 16, 16);

    // Red point
    const redMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const redPoint = new THREE.Mesh(pointGeometry, redMaterial);
    redPoint.position.set(0, height * 0.666, 0.01);
    this.scene.add(redPoint);

    // Green point
    const greenMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const greenPoint = new THREE.Mesh(pointGeometry, greenMaterial);
    greenPoint.position.set(-size / 2, -height * 0.333, 0.01);
    this.scene.add(greenPoint);

    // Blue point
    const blueMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const bluePoint = new THREE.Mesh(pointGeometry, blueMaterial);
    bluePoint.position.set(size / 2, -height * 0.333, 0.01);
    this.scene.add(bluePoint);
  }

  private startAnimation(): void {
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);

      if (this.triangle) {
        this.triangle.rotation.z += 0.005;
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
