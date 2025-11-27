import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ColorCircle {
  cx: number;
  cy: number;
  hue: number;
  saturation: number;
  currentSaturation: number;
}

@Component({
  selector: 'app-color-triangle',
  imports: [CommonModule],
  templateUrl: './color-triangle.html',
  styleUrl: './color-triangle.css'
})
export class ColorTriangle implements OnInit, OnDestroy {
  circles: ColorCircle[] = [];
  animationId: number | null = null;
  startTime: number = 0;
  animationDuration: number = 3000; // 3 segundos

  // Configuración del triángulo
  rows = [7, 6, 5, 4];
  circleRadius = 25;
  spacing = 60;
  svgWidth = 800;
  svgHeight = 600;

  ngOnInit() {
    this.generateCircles();
    this.startAnimation();
  }

  ngOnDestroy() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
  }

  generateCircles() {
    this.circles = [];
    const maxCircles = this.rows[0];
    const centerX = this.svgWidth / 2;
    const startY = 450;

    this.rows.forEach((circleCount, rowIndex) => {
      const y = startY - (rowIndex * this.spacing);
      // Saturación decrece hacia arriba (100% abajo, menos arriba)
      const saturation = 100 - (rowIndex * 25);

      for (let i = 0; i < circleCount; i++) {
        const totalWidth = (circleCount - 1) * this.spacing;
        const x = centerX - totalWidth / 2 + (i * this.spacing);
        const hue = (i / (circleCount - 1 || 1)) * 360;

        this.circles.push({
          cx: x,
          cy: y,
          hue: hue,
          saturation: saturation,
          currentSaturation: 0
        });
      }
    });
  }

  startAnimation() {
    this.startTime = performance.now();
    this.animate();
  }

  animate = () => {
    const currentTime = performance.now();
    const elapsed = currentTime - this.startTime;
    let t = Math.min(elapsed / this.animationDuration, 1);

    // Función de easing suave
    t = t * (2 - t); // easeOutQuad

    // Actualizar saturación actual de cada círculo
    this.circles.forEach(circle => {
      circle.currentSaturation = circle.saturation * t;
    });

    if (elapsed < this.animationDuration) {
      this.animationId = requestAnimationFrame(this.animate);
    } else {
      // Reiniciar animación en bucle
      setTimeout(() => {
        this.startTime = performance.now();
        this.animate();
      }, 1000);
    }
  }

  getColor(circle: ColorCircle): string {
    return `hsl(${circle.hue}, ${circle.currentSaturation}%, 50%)`;
  }

  // Posiciones para las flechas y textos
  get arrowHueY(): number {
    return 450 + 80;
  }

  get arrowSaturationStartX(): number {
    return this.svgWidth / 2 + 200;
  }

  get arrowSaturationStartY(): number {
    return 450;
  }

  get arrowSaturationEndX(): number {
    return this.svgWidth / 2 - 50;
  }

  get arrowSaturationEndY(): number {
    return 450 - (this.rows.length - 1) * this.spacing - 40;
  }

  get whiteCx(): number {
    return this.svgWidth / 2;
  }

  get whiteCy(): number {
    return 450 - (this.rows.length * this.spacing);
  }
}
