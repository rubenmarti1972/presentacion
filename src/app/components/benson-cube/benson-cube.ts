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
  private edges!: THREE.LineSegments;
  private animationFrameId: number | null = null;

  ngAfterViewInit(): void {
    this.initScene();
    this.addBensonCube();
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
    this.camera.position.set(2, 2, 3);
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

  // Cubo de Benson (1868) - Inclinado sobre vértice negro
  private addBensonCube(): void {
    const geometry = new THREE.BoxGeometry(1, 1, 1);

    // Colores en cada vértice del cubo
    // Orden de vértices en BoxGeometry:
    // 0: (-1,-1, 1) = Negro
    // 1: ( 1,-1, 1) = Azul
    // 2: (-1, 1, 1) = Verde
    // 3: ( 1, 1, 1) = Cyan
    // 4: (-1,-1,-1) = Rojo
    // 5: ( 1,-1,-1) = Magenta
    // 6: (-1, 1,-1) = Amarillo
    // 7: ( 1, 1,-1) = Blanco

    const colors = new Float32Array([
      // Front face
      0, 0, 0,  // 0: Negro
      0, 0, 1,  // 1: Azul
      0, 1, 0,  // 2: Verde
      0, 1, 1,  // 3: Cyan
      // Back face
      1, 0, 0,  // 4: Rojo
      1, 0, 1,  // 5: Magenta
      1, 1, 0,  // 6: Amarillo
      1, 1, 1   // 7: Blanco
    ]);

    // Asignar colores por vértice a cada cara
    const faceColors = new Float32Array(24 * 3);
    const faceIndices = [
      [0, 1, 2, 3], // front
      [4, 5, 6, 7], // back
      [0, 4, 2, 6], // left
      [1, 5, 3, 7], // right
      [0, 1, 4, 5], // bottom
      [2, 3, 6, 7]  // top
    ];

    let idx = 0;
    for (const face of faceIndices) {
      for (const vertexIdx of face) {
        faceColors[idx++] = colors[vertexIdx * 3];
        faceColors[idx++] = colors[vertexIdx * 3 + 1];
        faceColors[idx++] = colors[vertexIdx * 3 + 2];
      }
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(faceColors, 3));

    const material = new THREE.MeshPhongMaterial({
      vertexColors: true,
      shininess: 20
    });

    this.cube = new THREE.Mesh(geometry, material);

    // Inclinarlo sobre el vértice negro (esquina inferior frontal izquierda)
    this.cube.rotation.set(Math.PI / 4, Math.PI / 4, 0);

    this.scene.add(this.cube);

    // Agregar bordes
    const edgesGeometry = new THREE.EdgesGeometry(geometry);
    const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x555555, linewidth: 2 });
    this.edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    this.edges.rotation.set(Math.PI / 4, Math.PI / 4, 0);
    this.scene.add(this.edges);
  }

  private startAnimation(): void {
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);

      if (this.cube && this.edges) {
        this.cube.rotation.y += 0.008;
        this.edges.rotation.y += 0.008;
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
